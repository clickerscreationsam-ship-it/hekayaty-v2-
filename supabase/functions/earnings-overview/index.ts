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
            console.error("❌ Missing Authorization header")
            throw new Error('Unauthorized: Missing token')
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        console.log("📡 Verifying token...")
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            console.error('❌ Auth verification failed:', authError?.message || 'No user found')
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid session', details: authError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        let userId = authUser.id;
        console.log('✅ User verified:', userId)

        // Allow admin to override userId if provided in query (for debugging/support)
        const url = new URL(req.url)
        const overrideId = url.searchParams.get('userId')
        if (overrideId && overrideId !== userId) {
            const { data: adminUser } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
            if (adminUser?.role === 'admin') {
                console.log(`👑 Admin override: Fetching for ${overrideId} instead of ${userId}`)
                userId = overrideId
            }
        }

        console.log(`📊 Fetching data for creator: ${userId}`)

        // Fetch everything
        const [
            { data: earningsRecords, error: eError },
            { data: orderItems, error: oiError },
            { data: payouts, error: pError },
            { data: products, error: prError },
            { data: user, error: uError }
        ] = await Promise.all([
            supabaseAdmin.from('earnings').select('*').eq('creator_id', userId),
            supabaseAdmin.from('order_items').select('id, price, quantity, order_id').eq('creator_id', userId),
            supabaseAdmin.from('payouts').select('*').eq('user_id', userId).order('requested_at', { ascending: false }),
            supabaseAdmin.from('products').select('id, price, sales_count').eq('writer_id', userId),
            supabaseAdmin.from('users').select('id, commission_rate').eq('id', userId).single()
        ])

        if (eError || oiError || pError || prError || uError) {
            console.error("❌ Database fetch error:", { eError, oiError, pError, prError, uError })
        }

        const commissionRate = user?.commission_rate || 20;
        const creatorShare = (100 - commissionRate) / 100;

        console.log(`📈 Commission Rate: ${commissionRate}%, Share: ${creatorShare}`)

        // 1. Calculate Gross from Orders
        const orderIds = orderItems?.map(i => i.order_id).filter(Boolean) || [];
        const { data: orders } = orderIds.length > 0
            ? await supabaseAdmin.from('orders').select('id, status').in('id', orderIds)
            : { data: [] };

        const paidOrderIds = new Set(orders?.filter(o => o.status === 'paid').map(o => o.id) || []);
        const transGross = orderItems?.filter(i => paidOrderIds.has(i.order_id)).reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0) || 0;
        const transUnits = orderItems?.filter(i => paidOrderIds.has(i.order_id)).reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;

        console.log(`📦 Transaction data: Gross=${transGross}, Units=${transUnits}`)

        // 2. Calculate Gross from Legacy Products
        const legacyUnits = products?.reduce((sum, p) => sum + (p.sales_count || 0), 0) || 0;
        const legacyGross = products?.reduce((sum, p) => sum + (p.price * (p.sales_count || 0)), 0) || 0;

        console.log(`📜 Legacy data: Gross=${legacyGross}, Units=${legacyUnits}`)

        // 3. FINAL AGGREGATION
        const finalGross = Math.max(transGross, legacyGross);
        const finalUnits = Math.max(transUnits, legacyUnits);

        // Calculate Expected Net
        const finalNet = Math.round(finalGross * creatorShare);
        const totalCommission = finalGross - finalNet;

        // Payouts
        const totalPaidOut = payouts?.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0) || 0;
        const pendingPayouts = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
        const availableBalance = finalNet - totalPaidOut - pendingPayouts;

        const responseData = {
            totalEarnings: finalNet,
            totalGross: finalGross,
            totalUnitsSold: finalUnits,
            totalCommission,
            totalPaidOut,
            pendingPayouts,
            availableBalance: Math.max(0, availableBalance),
            recentEarnings: earningsRecords?.slice(0, 10) || [],
            payoutHistory: payouts || [],
            debug: {
                userId,
                paidOrdersCount: paidOrderIds.size,
                itemsFound: orderItems?.length || 0,
                earningsRecordsFound: earningsRecords?.length || 0
            }
        };

        console.log("✅ Success returning earnings overview")

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('❌ Earnings overview error:', error)
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
