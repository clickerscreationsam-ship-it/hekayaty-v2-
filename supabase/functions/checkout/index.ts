import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Checkout function starting...")

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        console.log(`Auth Header: ${authHeader ? 'Present' : 'Missing'}`)
        console.log(`All Headers:`, Object.fromEntries(req.headers.entries()))

        // Create Supabase client with user's JWT
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: authHeader ? { Authorization: authHeader } : {},
                },
            }
        )

        // Create admin client for secure operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify user is authenticated
        let user: any = null;
        const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()

        if (authUser) {
            user = authUser;
        } else {
            console.log('getUser failed, attempting manual token parsing...');
            if (authHeader) {
                try {
                    const token = authHeader.replace('Bearer ', '');
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        if (payload.sub) {
                            user = { id: payload.sub };
                            console.log('Manual token parsing successful for user:', user.id);
                        }
                    }
                } catch (e) {
                    console.error('Manual token parsing failed:', e);
                }
            }
        }

        if (!user) {
            console.error('Auth verification failed:', authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Could not determine user', details: authError }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse request body
        const {
            items,
            totalAmount,
            paymentMethod,
            paymentProofUrl,
            paymentReference,
            shippingAddress,
            shippingCost = 0,
            shippingBreakdown = []
        } = await req.json()

        console.log('Processing checkout for user:', user.id)
        console.log('Items:', items.length)

        // 1. Fetch product details
        const productIds = items.map((i: any) => i.productId)
        const { data: productsData } = await supabaseAdmin
            .from('products')
            .select('id, type, writer_id')
            .in('id', productIds)

        const productMap = new Map(productsData?.map((p: any) => [p.id, p]) || [])

        // 2. Calculate fees per item
        let totalPlatformFee = 0
        let totalCreatorEarnings = 0
        const earningsByCreator = new Map<string, number>()

        for (const item of items) {
            const product = productMap.get(item.productId)
            const type = product?.type || 'ebook'
            const isPhysical = type === 'physical'

            // Commission: 12% Physical, 20% Digital
            const rate = isPhysical ? 12 : 20
            const fee = Math.round(item.price * (rate / 100))
            const earning = item.price - fee

            totalPlatformFee += fee
            totalCreatorEarnings += earning

            const currentEarning = earningsByCreator.get(item.creatorId) || 0
            earningsByCreator.set(item.creatorId, currentEarning + earning)
        }

        // 2.1 Add shipping to creator earnings
        if (shippingBreakdown && Array.isArray(shippingBreakdown)) {
            for (const ship of shippingBreakdown) {
                const current = earningsByCreator.get(ship.creatorId) || 0
                earningsByCreator.set(ship.creatorId, current + (ship.amount || 0))
                totalCreatorEarnings += (ship.amount || 0)
            }
        }

        // 3. Determine initial status
        const isManualPayment = [
            "instapay",
            "vodafone_cash",
            "orange_cash",
            "etisalat_cash",
            "bank_transfer"
        ].includes(paymentMethod)
        const initialStatus = isManualPayment ? "pending" : "paid"

        // 4. Create Order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                total_amount: totalAmount,
                platform_fee: totalPlatformFee,
                creator_earnings: totalCreatorEarnings,
                status: initialStatus,
                payment_method: paymentMethod,
                payment_proof_url: paymentProofUrl,
                payment_reference: paymentReference,
                shipping_address: shippingAddress,
                shipping_cost: shippingCost,
                is_verified: !isManualPayment // Auto-verify non-manual payments
            })
            .select()
            .single()

        if (orderError) {
            console.error('Order creation error:', orderError)
            throw new Error('Failed to create order')
        }

        console.log('Order created:', order.id)

        // 5. Create Order Items
        const orderItemsToInsert = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId,
            variant_id: item.variantId,
            price: item.price,
            creator_id: item.creatorId,
            fulfillment_status: 'pending',
            license_type: 'standard'
        }))

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsToInsert)

        if (itemsError) {
            console.error('Order items error:', itemsError)
            throw new Error('Failed to create order items')
        }

        // 6. Create Earnings ONLY if paid immediately
        if (initialStatus === "paid") {
            for (const [creatorId, amount] of Array.from(earningsByCreator.entries())) {
                await supabaseAdmin.from('earnings').insert({
                    creator_id: creatorId,
                    order_id: order.id,
                    amount: amount,
                    status: 'pending'
                })
            }

            // Increment sales count
            for (const item of items) {
                try {
                    await supabaseAdmin.rpc('increment_sales_count', {
                        product_id: item.productId
                    })
                } catch (e) {
                    console.warn('Could not increment sales count:', e)
                }
            }
        }

        // 7. Clear cart
        await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)

        console.log('Checkout completed successfully')

        return new Response(
            JSON.stringify({ order, success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201,
            }
        )

    } catch (error) {
        console.error('Checkout error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
