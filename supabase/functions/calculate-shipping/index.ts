import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Calculate shipping function starting...")

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log(`Incoming request Headers:`, Object.fromEntries(req.headers.entries()))
        const { items, city } = await req.json()

        if (!city || !items || items.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: items, city' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`Calculating shipping for ${items.length} items to ${city}`)

        // Group items by creator
        const itemsByCreator = new Map<string, any[]>()
        for (const item of items) {
            const creatorId = item.creatorId
            if (!itemsByCreator.has(creatorId)) {
                itemsByCreator.set(creatorId, [])
            }
            itemsByCreator.get(creatorId)!.push(item)
        }

        let totalShipping = 0
        const breakdown: any[] = []

        // Calculate shipping per creator
        for (const [creatorId, creatorItems] of Array.from(itemsByCreator.entries())) {
            // Fetch creator's shipping rates
            const { data: rates, error: ratesError } = await supabaseAdmin
                .from('shipping_rates')
                .select('*')
                .eq('creator_id', creatorId)

            if (ratesError) {
                console.error('Failed to fetch shipping rates:', ratesError)
                // Default to 0 if no rates found
                breakdown.push({
                    creatorId,
                    amount: 0,
                    regionName: 'Unknown',
                    itemCount: creatorItems.length
                })
                continue
            }

            // Find matching rate for the city
            const normalizedCity = city.toLowerCase().trim()
            let matchedRate = rates?.find((r: any) =>
                r.region_name.toLowerCase() === normalizedCity
            )

            // If exact match not found, try to find a "default" or "all" region
            if (!matchedRate) {
                matchedRate = rates?.find((r: any) =>
                    ['default', 'all', 'nationwide'].includes(r.region_name.toLowerCase())
                )
            }

            const shippingAmount = matchedRate?.amount || 0

            totalShipping += shippingAmount
            breakdown.push({
                creatorId,
                amount: shippingAmount,
                regionName: matchedRate?.region_name || 'Not Available',
                deliveryTimeMin: matchedRate?.delivery_time_min,
                deliveryTimeMax: matchedRate?.delivery_time_max,
                itemCount: creatorItems.length
            })
        }

        console.log(`Total shipping: ${totalShipping}`)

        return new Response(
            JSON.stringify({
                total: totalShipping,
                breakdown
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('Calculate shipping error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
