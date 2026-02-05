import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Verify payment function starting...")

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Unauthorized: Missing token')
        }

        // 1. VERIFY JWT SIGNATURE (Official Way)
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            throw new Error('Unauthorized: Invalid or expired token');
        }

        const userId = authUser.id;
        const body = await req.json();

        // Check if user is admin
        const { data: userData } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
        if (userData?.role !== 'admin') throw new Error('Forbidden: Admin only')

        const { orderId } = body

        // 1. Fetch Order
        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
        if (!order) throw new Error("Order not found")
        if (order.status === 'paid') throw new Error("Order already paid")

        // Fetch Items
        const { data: items } = await supabaseAdmin
            .from('order_items')
            .select('*, product:products(writer_id, type)')
            .eq('order_id', orderId)

        if (!items || items.length === 0) throw new Error("No items found")

        // Fetch writer rates
        const writerIds = Array.from(new Set(items.map((i: any) => i.product?.writer_id).filter(Boolean)))
        const { data: writers } = await supabaseAdmin
            .from('users')
            .select('id, commission_rate')
            .in('id', writerIds as string[])

        const ratesMap = new Map<string, number>()
        writers?.forEach((w: any) => ratesMap.set(w.id, w.commission_rate))

        // 2. Update Order Status
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'paid', is_verified: true })
            .eq('id', orderId)

        if (updateError) throw updateError

        // 3. Create Earnings Logic
        const earningsByCreator = new Map<string, number>()

        // 3a. Product Sales
        for (const item of items) {
            const product = (item as any).product
            if (!product) continue

            const isPhysical = product.type === 'physical'
            const writerRate = ratesMap.get(product.writer_id) ?? 20
            const rate = isPhysical ? 12 : writerRate
            const fee = Math.round(item.price * (rate / 100))
            const earning = item.price - fee

            const current = earningsByCreator.get(product.writer_id) || 0
            earningsByCreator.set(product.writer_id, current + earning)

            // Increment Sales Count
            await supabaseAdmin.rpc('increment_sales_count', { product_id: item.product_id })
        }

        // 3b. Shipping Logic
        if (order.shipping_cost > 0 && order.shipping_address) {
            const city = (order.shipping_address as any).city?.toLowerCase().trim();
            const creatorIds = Array.from(earningsByCreator.keys());

            for (const creatorId of creatorIds) {
                const { data: rates } = await supabaseAdmin.from('shipping_rates').select('*').eq('creator_id', creatorId);
                if (rates && rates.length > 0) {
                    const cityRate = rates.find((r: any) => r.region_name.toLowerCase() === city) ||
                        rates.find((r: any) => r.region_name.toLowerCase() === 'all');
                    if (cityRate) {
                        const current = earningsByCreator.get(creatorId) || 0;
                        earningsByCreator.set(creatorId, current + cityRate.amount);
                    }
                }
            }
        }

        // 4. Insert Earnings Records
        for (const [creatorId, amount] of Array.from(earningsByCreator.entries())) {
            await supabaseAdmin.from('earnings').insert({
                creator_id: creatorId,
                order_id: orderId,
                amount: amount,
                status: 'pending'
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
