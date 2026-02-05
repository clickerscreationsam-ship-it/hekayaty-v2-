import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Earnings overview function starting...")

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Unauthorized: Missing token')
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            throw new Error('Unauthorized: Invalid session');
        }

        const userId = authUser.id;

        // Fetch everything
        const [
            { data: earningsRecords },
            { data: orderItems },
            { data: payouts },
            { data: products },
            { data: user }
        ] = await Promise.all([
            supabaseAdmin.from('earnings').select('*').eq('creator_id', userId),
            supabaseAdmin.from('order_items').select('id, price, order_id').eq('creator_id', userId),
            supabaseAdmin.from('payouts').select('*').eq('user_id', userId).order('requested_at', { ascending: false }),
            supabaseAdmin.from('products').select('id, price, sales_count').eq('writer_id', userId),
            supabaseAdmin.from('users').select('id, commission_rate').eq('id', userId).single()
        ])

        const commissionRate = user?.commission_rate || 20; // Default 20% fee
        const creatorShare = (100 - commissionRate) / 100; // e.g. 0.8

        // 1. Calculate Gross from Orders
        const orderIds = orderItems?.map(i => i.order_id).filter(Boolean) || [];
        const { data: orders } = orderIds.length > 0
            ? await supabaseAdmin.from('orders').select('id, status').in('id', orderIds)
            : { data: [] };

        const paidOrderIds = new Set(orders?.filter(o => o.status === 'paid').map(o => o.id) || []);
        const transGross = orderItems?.filter(i => paidOrderIds.has(i.order_id)).reduce((sum, i) => sum + (i.price || 0), 0) || 0;
        const transUnits = orderItems?.filter(i => paidOrderIds.has(i.order_id)).length || 0;

        // 2. Calculate Gross from Legacy Products
        const legacyUnits = products?.reduce((sum, p) => sum + (p.sales_count || 0), 0) || 0;
        const legacyGross = products?.reduce((sum, p) => sum + (p.price * (p.sales_count || 0)), 0) || 0;

        // 3. FINAL AGGREGATION
        const finalGross = Math.max(transGross, legacyGross);
        const finalUnits = Math.max(transUnits, legacyUnits);

        // Calculate Expected Net (80% of Gross)
        const expectedNet = Math.round(finalGross * creatorShare);

        // Use the higher value between actual records and predicted share
        // This fixes the issue where some sales might not have earning records yet
        const actualRecordsNet = earningsRecords?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const finalNet = Math.max(actualRecordsNet, expectedNet);

        const totalCommission = finalGross - finalNet;

        // Payouts
        const totalPaidOut = payouts?.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0) || 0;
        const pendingPayouts = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
        const availableBalance = finalNet - totalPaidOut - pendingPayouts;

        return new Response(JSON.stringify({
            totalEarnings: finalNet, // Keep this as totalNet
            totalGross: finalGross,
            totalUnitsSold: finalUnits,
            totalCommission,
            totalPaidOut,
            pendingPayouts,
            availableBalance: Math.max(0, availableBalance),
            recentEarnings: [],
            payoutHistory: payouts || []
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
