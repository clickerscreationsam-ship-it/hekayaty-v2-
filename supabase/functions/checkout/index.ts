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

        // Create admin client for secure operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify user is authenticated using the JWT directly
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(
            authHeader?.replace('Bearer ', '') ?? ''
        )

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
        console.log('Items to process:', items.length)

        // 1. Separate products and collections
        const productIds = items.filter((i: any) => i.productId).map((i: any) => i.productId)
        const collectionIds = items.filter((i: any) => i.collectionId).map((i: any) => i.collectionId)
        const variantIds = items.map((i: any) => i.variantId).filter(Boolean)

        console.log(`Fetching ${productIds.length} products and ${collectionIds.length} collections`)

        // 2. Fetch all required data
        const [productsRes, collectionsRes, variantsRes] = await Promise.all([
            productIds.length > 0
                ? supabaseAdmin.from('products').select('*').in('id', productIds)
                : Promise.resolve({ data: [] }),
            collectionIds.length > 0
                ? supabaseAdmin.from('collections').select('*').in('id', collectionIds)
                : Promise.resolve({ data: [] }),
            variantIds.length > 0
                ? supabaseAdmin.from('product_variants').select('id, product_id, price').in('id', variantIds)
                : Promise.resolve({ data: [] })
        ])

        const productsData = productsRes.data || []
        const collectionsData = collectionsRes.data || []
        const variantsData = variantsRes.data || []

        const productMap = new Map(productsData.map((p: any) => [p.id, p]))
        const collectionMap = new Map(collectionsData.map((c: any) => [c.id, c]))
        const variantMap = new Map(variantsData.map((v: any) => [v.id, v]))

        // 3. Fetch Creator Rates
        const creatorIds = Array.from(new Set([
            ...productsData.map((p: any) => p.writer_id),
            ...collectionsData.map((c: any) => c.writer_id)
        ]))

        const { data: creatorsData } = await supabaseAdmin
            .from('users')
            .select('id, commission_rate')
            .in('id', creatorIds)

        const ratesMap = new Map(creatorsData?.map((c: any) => [c.id, c.commission_rate]) || [])

        // 4. Calculate fees and totals
        let serverCalculatedTotalAmount = 0
        let totalPlatformFee = 0
        let totalCreatorEarnings = 0
        const earningsByCreator = new Map<string, number>()

        const verifiedItems = items.map((item: any) => {
            let actualPrice = 0
            let creatorId = ''
            let isPhysical = false

            if (item.productId) {
                const product = productMap.get(item.productId) as any
                if (!product) throw new Error(`Product ${item.productId} no longer exists.`)

                actualPrice = product.price
                creatorId = product.writer_id
                isPhysical = (product.type === 'physical' || product.type === 'merchandise')

                if (item.variantId) {
                    const variant = variantMap.get(item.variantId) as any
                    if (variant && variant.product_id === item.productId) {
                        actualPrice = variant.price
                    }
                }
            } else if (item.collectionId) {
                const collection = collectionMap.get(item.collectionId) as any
                if (!collection) throw new Error(`Collection ${item.collectionId} no longer exists.`)

                actualPrice = Number(collection.price) || 0
                creatorId = collection.writer_id
                isPhysical = false
            } else {
                throw new Error('Invalid cart item: No product or collection ID')
            }

            const quantity = Number(item.quantity) || 1
            const itemTotal = Number(actualPrice) * quantity
            serverCalculatedTotalAmount += itemTotal

            const writerRate = Number(ratesMap.get(creatorId)) ?? 20
            const rate = isPhysical ? 12 : writerRate
            const fee = Math.round(itemTotal * (Number(rate) / 100))
            const earning = itemTotal - fee

            totalPlatformFee += fee
            totalCreatorEarnings += earning

            const currentEarning = earningsByCreator.get(creatorId) || 0
            earningsByCreator.set(creatorId, currentEarning + earning)

            return {
                ...item,
                price: actualPrice,
                creatorId: creatorId
            }
        })

        // 5. Add shipping to creator earnings
        if (shippingBreakdown && Array.isArray(shippingBreakdown)) {
            for (const ship of shippingBreakdown) {
                const current = earningsByCreator.get(ship.creatorId) || 0
                earningsByCreator.set(ship.creatorId, current + (ship.amount || 0))
                totalCreatorEarnings += (ship.amount || 0)
            }
        }

        // 6. Determine initial status
        const isManualPayment = [
            "instapay",
            "vodafone_cash",
            "orange_cash",
            "etisalat_cash",
            "bank_transfer"
        ].includes(paymentMethod)
        const initialStatus = isManualPayment ? "pending" : "paid"

        // 7. Create Order
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
                is_verified: !isManualPayment
            })
            .select()
            .single()

        if (orderError) {
            console.error('Order creation error:', orderError)
            throw new Error('Failed to create order')
        }

        // 8. Create Order Items
        const orderItemsToInsert = verifiedItems.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId || null,
            collection_id: item.collectionId || null,
            variant_id: item.variantId || null,
            price: item.price,
            creator_id: item.creatorId,
            fulfillment_status: 'pending',
            license_type: 'standard',
            customization_data: item.customizationData || {}
        }))

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsToInsert)

        if (itemsError) {
            console.error('Order items error:', itemsError)
            throw new Error('Failed to create order items')
        }

        // 9. Atomic Stock Decrementing
        for (const item of verifiedItems) {
            if (item.productId) {
                const product = productMap.get(item.productId) as any
                if (product && (product.type === 'physical' || product.type === 'merchandise')) {
                    const { error: stockError } = await supabaseAdmin.rpc('decrement_product_stock', {
                        p_product_id: item.productId,
                        p_quantity: item.quantity || 1
                    })
                    if (stockError) console.error('Stock decrement failed:', stockError)
                }
            }
        }

        // 10. Clear cart
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

    } catch (error: any) {
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
