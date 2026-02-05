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
        const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !authUser) {
            console.error('Auth verification failed:', authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid session', details: authError }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const user = authUser;

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

        // 1. Fetch products and variants to get REAL prices (Server-side truth)
        const productIds = items.map((i: any) => i.productId)
        const variantIds = items.map((i: any) => i.variantId).filter(Boolean)

        const [productsRes, variantsRes] = await Promise.all([
            supabaseAdmin.from('products').select('id, type, writer_id, price').in('id', productIds),
            variantIds.length > 0
                ? supabaseAdmin.from('product_variants').select('id, product_id, price').in('id', variantIds)
                : Promise.resolve({ data: [] })
        ])

        const productsData = productsRes.data || []
        const variantsData = variantsRes.data || []

        const productMap = new Map(productsData.map((p: any) => [p.id, p]))
        const variantMap = new Map(variantsData.map((v: any) => [v.id, v]))

        // 2. Fetch Creator Rates
        const creatorIds = Array.from(new Set(productsData.map((p: any) => p.writer_id)))
        const { data: creatorsData } = await supabaseAdmin
            .from('users')
            .select('id, commission_rate')
            .in('id', creatorIds)

        const ratesMap = new Map(creatorsData?.map((c: any) => [c.id, c.commission_rate]) || [])

        // 3. Calculate fees and totals using REAL prices
        let serverCalculatedTotalAmount = 0
        let totalPlatformFee = 0
        let totalCreatorEarnings = 0
        const earningsByCreator = new Map<string, number>()

        const verifiedItems = items.map((item: any) => {
            const product = productMap.get(item.productId)
            if (!product) throw new Error(`Product ${item.productId} no longer exists.`)

            // Priority: Variant Price > Product Price
            let actualPrice = product.price
            if (item.variantId) {
                const variant = variantMap.get(item.variantId)
                if (variant && variant.product_id === item.productId) {
                    actualPrice = variant.price
                }
            }

            const quantity = item.quantity || 1
            const itemTotal = actualPrice * quantity
            serverCalculatedTotalAmount += itemTotal

            const isPhysical = product.type === 'physical'
            const creatorId = product.writer_id
            const writerRate = ratesMap.get(creatorId) ?? 20
            const rate = isPhysical ? 12 : writerRate
            const fee = Math.round(itemTotal * (rate / 100))
            const earning = itemTotal - fee

            totalPlatformFee += fee
            totalCreatorEarnings += earning

            const currentEarning = earningsByCreator.get(creatorId) || 0
            earningsByCreator.set(creatorId, currentEarning + earning)

            return {
                ...item,
                price: actualPrice, // Use the real price for order_items
                creatorId: creatorId
            }
        })

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

        // 4. Create Order (Using Server-Calculated Total)
        const totalWithShipping = serverCalculatedTotalAmount + shippingCost

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                total_amount: totalWithShipping,
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

        // 5. Create Order Items (Using Verified Prices)
        const orderItemsToInsert = verifiedItems.map((item: any) => ({
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

        // 5.1 Atomic Stock Decrementing for physical products
        for (const item of items) {
            const product = productMap.get(item.productId)
            if (product && product.type === 'physical') {
                const { error: stockError } = await supabaseAdmin.rpc('decrement_product_stock', {
                    p_product_id: item.productId,
                    p_quantity: item.quantity || 1
                })

                if (stockError) {
                    console.error('Stock decrement failed:', stockError)
                    // Note: In a perfect world, we'd rollback the order here.
                    // For now, we'll just throw the error so the user knows.
                    throw new Error(`Inventory Error: ${stockError.message}`)
                }
            }
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
