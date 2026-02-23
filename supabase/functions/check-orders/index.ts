import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json().catch(() => ({}))
        const { targetUserId } = body

        if (!targetUserId) throw new Error("targetUserId required")

        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, status, is_verified, created_at')
            .eq('user_id', targetUserId)

        const { data: items, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('id, order_id, creator_id, fulfillment_status')

        return new Response(JSON.stringify({
            userId: targetUserId,
            orders,
            ordersError,
            itemsCount: items?.length,
            allOrdersInTable: (await supabaseAdmin.from('orders').select('id, user_id, status')).data
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
})
