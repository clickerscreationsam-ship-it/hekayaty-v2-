import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log(`[get-user-orders] Request received: ${req.method}`)

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('[get-user-orders] Missing Authorization header')
            return new Response(JSON.stringify({ error: 'Unauthorized: Missing token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[get-user-orders] Missing env variables')
            throw new Error('Server configuration error')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Case-insensitive Bearer check
        const token = authHeader.replace(/^[Bb]earer\s+/, '')
        console.log(`[get-user-orders] Verifying token (length: ${token.length})...`)

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            console.error('[get-user-orders] Auth error:', authError?.message || 'User not found')
            return new Response(JSON.stringify({
                error: 'Unauthorized: Invalid session',
                details: authError?.message
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        const userId = user.id
        console.log(`[get-user-orders] Fetching orders for user: ${userId}`)

        // Fetch user's orders - ALL statuses (pending, paid, etc.)
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, status, is_verified, created_at, total_amount, payment_method, shipping_address, shipping_cost')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (ordersError) {
            console.error('[get-user-orders] Orders fetch error:', ordersError)
            throw ordersError
        }

        console.log(`[get-user-orders] Found ${orders?.length || 0} orders`)

        if (!orders || orders.length === 0) {
            return new Response(JSON.stringify({ orders: [], count: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // Fetch order items for each order
        const enrichedOrders = await Promise.all(
            orders.map(async (order: any) => {
                const { data: items, error: itemsError } = await supabaseAdmin
                    .from('order_items')
                    .select(`
                        id,
                        order_id,
                        product_id,
                        collection_id,
                        creator_id,
                        price,
                        quantity,
                        fulfillment_status,
                        tracking_number,
                        customization_data,
                        estimated_delivery_days,
                        shipped_at,
                        delivered_at,
                        accepted_at,
                        preparing_at,
                        rejected_at,
                        rejection_reason,
                        product:products(id, title, cover_url, type),
                        collection:collections(id, title, cover_image_url)
                    `)
                    .eq('order_id', order.id)

                if (itemsError) {
                    console.error(`[get-user-orders] Items fetch error for order ${order.id}:`, itemsError)
                }

                const itemsList = items || []

                // Get creator names
                const creatorIds = [...new Set(itemsList.map((i: any) => i.creator_id).filter(Boolean))]
                let creatorsMap = new Map<string, string>()

                if (creatorIds.length > 0) {
                    const { data: creators } = await supabaseAdmin
                        .from('users')
                        .select('id, display_name')
                        .in('id', creatorIds)

                    creators?.forEach((c: any) => creatorsMap.set(c.id, c.display_name))
                }

                // Try to get status history
                let statusHistoryMap = new Map<number, any[]>()
                try {
                    const itemIds = itemsList.map((i: any) => i.id)
                    if (itemIds.length > 0) {
                        const { data: history } = await supabaseAdmin
                            .from('order_status_history')
                            .select('order_item_id, status, note, created_at')
                            .in('order_item_id', itemIds)
                            .order('created_at', { ascending: false })

                        history?.forEach((h: any) => {
                            const existing = statusHistoryMap.get(h.order_item_id) || []
                            statusHistoryMap.set(h.order_item_id, [...existing, {
                                status: h.status,
                                note: h.note,
                                timestamp: h.created_at
                            }])
                        })
                    }
                } catch (_e) {
                    // Status history table might not exist
                }

                const enrichedItems = itemsList.map((item: any) => {
                    const isCollection = !!item.collection_id
                    return {
                        orderItemId: item.id,
                        productTitle: isCollection
                            ? (item.collection?.title || 'Collection')
                            : (item.product?.title || 'Unknown Product'),
                        productCoverUrl: isCollection
                            ? (item.collection?.cover_image_url || '')
                            : (item.product?.cover_url || ''),
                        productType: isCollection ? 'collection' : (item.product?.type || 'unknown'),
                        price: item.price,
                        quantity: item.quantity || 1,
                        fulfillmentStatus: item.fulfillment_status || 'pending',
                        trackingNumber: item.tracking_number || null,
                        customizationData: item.customization_data || null,
                        estimatedDeliveryDays: item.estimated_delivery_days || null,
                        makerName: creatorsMap.get(item.creator_id) || 'Unknown Maker',
                        makerId: item.creator_id || null,
                        productId: item.product_id || null,
                        collectionId: item.collection_id || null,
                        shippedAt: item.shipped_at || null,
                        deliveredAt: item.delivered_at || null,
                        acceptedAt: item.accepted_at || null,
                        preparingAt: item.preparing_at || null,
                        rejectedAt: item.rejected_at || null,
                        rejectionReason: item.rejection_reason || null,
                        statusHistory: statusHistoryMap.get(item.id) || []
                    }
                })

                return {
                    orderId: order.id,
                    orderDate: order.created_at,
                    totalAmount: order.total_amount,
                    status: order.status,
                    isVerified: order.is_verified,
                    paymentMethod: order.payment_method,
                    shippingAddress: order.shipping_address,
                    shippingCost: order.shipping_cost,
                    items: enrichedItems
                }
            })
        )

        console.log(`[get-user-orders] Returning ${enrichedOrders.length} enriched orders`)

        return new Response(JSON.stringify({
            orders: enrichedOrders,
            count: enrichedOrders.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        console.error('[get-user-orders] Critical Error:', error)
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
