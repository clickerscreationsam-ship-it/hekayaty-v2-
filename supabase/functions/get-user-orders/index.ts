import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Unauthorized: Missing token')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            throw new Error('Unauthorized: Invalid session')
        }

        const userId = user.id

        // Fetch user's orders with items
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // Fetch order items for each order
        const enrichedOrders = await Promise.all(
            (orders || []).map(async (order: any) => {
                const { data: items } = await supabaseAdmin
                    .from('order_items')
                    .select(`
                        *,
                        product:products(id, title, cover_url, type),
                        collection:collections(id, title, cover_image_url),
                        status_history:order_status_history(status, note, created_at)
                    `)
                    .eq('order_id', order.id)

                // Get creator names
                const creatorIds = Array.from(new Set(items?.map((i: any) => i.creator_id).filter(Boolean)))
                const { data: creators } = await supabaseAdmin
                    .from('users')
                    .select('id, display_name')
                    .in('id', creatorIds)

                const creatorsMap = new Map(creators?.map((c: any) => [c.id, c.display_name]))

                const enrichedItems = items?.map((item: any) => {
                    const isCollection = !!item.collection_id;
                    return {
                        orderItemId: item.id,
                        productTitle: isCollection ? (item.collection?.title || 'Collection') : (item.product?.title || 'Unknown Product'),
                        productCoverUrl: isCollection ? (item.collection?.cover_image_url || '') : (item.product?.cover_url || ''),
                        productType: isCollection ? 'collection' : (item.product?.type || 'unknown'),
                        price: item.price,
                        fulfillmentStatus: item.fulfillment_status,
                        trackingNumber: item.tracking_number,
                        customizationData: item.customization_data,
                        estimatedDeliveryDays: item.estimated_delivery_days,
                        makerName: creatorsMap.get(item.creator_id) || 'Unknown Maker',
                        makerId: item.creator_id,
                        shippedAt: item.shipped_at,
                        deliveredAt: item.delivered_at,
                        acceptedAt: item.accepted_at,
                        preparingAt: item.preparing_at,
                        rejectedAt: item.rejected_at,
                        rejectionReason: item.rejection_reason,
                        statusHistory: (item.status_history || [])
                            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((h: any) => ({
                                status: h.status,
                                note: h.note,
                                timestamp: h.created_at
                            }))
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
                    items: enrichedItems || []
                }
            })
        )

        return new Response(JSON.stringify({
            orders: enrichedOrders,
            count: enrichedOrders.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        console.error('get-user-orders error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
