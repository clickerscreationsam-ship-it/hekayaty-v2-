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

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            throw new Error('Unauthorized: Invalid or expired token');
        }

        const userId = authUser.id;
        const { orderId } = await req.json();

        // Check if user is admin
        const { data: userData } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
        if (userData?.role !== 'admin') throw new Error('Forbidden: Admin only')

        // 1. Fetch Order
        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
        if (!order) throw new Error("Order not found")
        if (order.status === 'paid') throw new Error("Order already paid")

        // 2. Fetch Items (Include product and collection details)
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select(`
                *,
                product:products(writer_id, type),
                collection:collections(writer_id)
            `)
            .eq('order_id', orderId)

        if (itemsError || !items || items.length === 0) throw new Error("No items found or failed to fetch")

        // 3. Update Order Status
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'paid', is_verified: true })
            .eq('id', orderId)

        if (updateError) throw updateError

        // 4. Calculate Earnings
        const earningsByCreator = new Map<string, number>()
        const writerIds = new Set<string>()

        // First pass: Identify all writers to fetch their rates
        items.forEach((item: any) => {
            const writerId = item.product?.writer_id || item.collection?.writer_id
            if (writerId) writerIds.add(writerId)
        })

        const { data: writers } = await supabaseAdmin
            .from('users')
            .select('id, commission_rate')
            .in('id', Array.from(writerIds))

        const ratesMap = new Map<string, number>()
        writers?.forEach((w: any) => ratesMap.set(w.id, w.commission_rate))

        // Process each item
        for (const item of items) {
            const writerId = (item as any).product?.writer_id || (item as any).collection?.writer_id
            if (!writerId) continue

            // Use the writer's specific commission rate or default to 20%
            const platformRate = ratesMap.get(writerId) ?? 20

            const fee = Math.round(item.price * (platformRate / 100))
            const earning = item.price - fee

            earningsByCreator.set(writerId, (earningsByCreator.get(writerId) || 0) + earning)

            // Increment sales count for products
            if (item.product_id) {
                await supabaseAdmin.rpc('increment_sales_count', { product_id: item.product_id })
            }
        }

        // 4b. Shipping Logic
        if (order.shipping_cost > 0 && order.shipping_address) {
            const city = (order.shipping_address as any).city?.toLowerCase().trim();
            const creatorIds = Array.from(earningsByCreator.keys());

            for (const creatorId of creatorIds) {
                const { data: rates } = await supabaseAdmin.from('shipping_rates').select('*').eq('creator_id', creatorId);
                if (rates && rates.length > 0) {
                    const matchedRate = rates.find((r: any) => r.region_name.toLowerCase() === city) ||
                        rates.find((r: any) => ['all', 'default', 'nationwide'].includes(r.region_name.toLowerCase()));
                    if (matchedRate) {
                        earningsByCreator.set(creatorId, (earningsByCreator.get(creatorId) || 0) + matchedRate.amount);
                    }
                }
            }
        }

        // 5. Insert Earnings Records
        for (const [creatorId, amount] of Array.from(earningsByCreator.entries())) {
            await supabaseAdmin.from('earnings').insert({
                creator_id: creatorId,
                order_id: orderId,
                amount: Math.round(amount),
                status: 'pending'
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        console.error('Verify payment error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
