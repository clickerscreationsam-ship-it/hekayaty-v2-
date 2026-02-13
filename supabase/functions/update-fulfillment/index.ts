import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Update fulfillment function starting...")

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

        const { orderItemId, status, trackingNumber } = await req.json()

        if (!orderItemId || !status) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Updating fulfillment: Item ${orderItemId}, Status ${status}`)

        // Verify this order item belongs to the user
        const { data: orderItem } = await supabaseAdmin
            .from('order_items')
            .select('creator_id')
            .eq('id', orderItemId)
            .single()

        if (!orderItem || orderItem.creator_id !== user.id) {
            return new Response(
                JSON.stringify({ error: 'Forbidden: Not your order' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Update the order item
        const updateData: any = {
            fulfillment_status: status
        }

        if (trackingNumber) {
            updateData.tracking_number = trackingNumber
        }

        if (status === 'shipped') {
            updateData.shipped_at = new Date().toISOString()
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('order_items')
            .update(updateData)
            .eq('id', orderItemId)
            .select()
            .single()

        if (updateError) {
            throw new Error('Failed to update fulfillment status')
        }

        console.log('Fulfillment updated successfully')

        return new Response(
            JSON.stringify({ orderItem: updated, success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Update fulfillment error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
