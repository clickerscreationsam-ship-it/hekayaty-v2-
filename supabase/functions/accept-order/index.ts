import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get maker ID
        let makerId: string | null = null
        const authHeader = req.headers.get('Authorization')

        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.sub) makerId = payload.sub;
                }
            } catch (e) {
                console.error("Manual JWT parse failed", e)
            }

            if (!makerId) {
                const supabaseClient = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
                    { global: { headers: { Authorization: authHeader } } }
                )
                const { data: { user } } = await supabaseClient.auth.getUser()
                makerId = user?.id ?? null
            }
        }

        if (!makerId) {
            makerId = req.headers.get('x-user-id')
        }

        const body = await req.json()
        if (!makerId && body.makerId) {
            makerId = body.makerId
        }

        if (!makerId) throw new Error('Unauthorized')

        const { orderItemId, estimatedDeliveryDays } = body

        if (!orderItemId) throw new Error('Order item ID required')
        if (!estimatedDeliveryDays || estimatedDeliveryDays < 1 || estimatedDeliveryDays > 90) {
            throw new Error('Estimated delivery days must be between 1-90')
        }

        // Verify this order item belongs to the maker
        const { data: item } = await supabaseAdmin
            .from('order_items')
            .select('id, creator_id, order_id, fulfillment_status')
            .eq('id', orderItemId)
            .single()

        if (!item) throw new Error('Order item not found')
        if (item.creator_id !== makerId) throw new Error('Unauthorized: Not your order')
        if (item.fulfillment_status !== 'pending') {
            throw new Error(`Cannot accept order with status: ${item.fulfillment_status}`)
        }

        // Update order item
        const { error: updateError } = await supabaseAdmin
            .from('order_items')
            .update({
                fulfillment_status: 'accepted',
                accepted_at: new Date().toISOString(),
                estimated_delivery_days: estimatedDeliveryDays
            })
            .eq('id', orderItemId)

        if (updateError) throw updateError

        // Log status change
        await supabaseAdmin.rpc('log_status_change', {
            p_order_item_id: orderItemId,
            p_status: 'accepted',
            p_note: `Estimated delivery: ${estimatedDeliveryDays} days`,
            p_created_by: makerId
        })

        // Get order details for notification
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, user_id')
            .eq('id', item.order_id)
            .single()

        if (order) {
            // Create notification for buyer
            await supabaseAdmin.rpc('create_order_notification', {
                p_order_id: order.id,
                p_user_id: order.user_id,
                p_type: 'order_accepted',
                p_title: 'Order Accepted',
                p_message: `Your order has been accepted! Estimated delivery: ${estimatedDeliveryDays} days`
            })
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Order accepted successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        console.error('accept-order error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
