import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Seller orders function starting...")

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

        console.log('Fetching seller orders for user:', user.id)

        // Get order items for this creator
        const { data: orderItems, error } = await supabaseAdmin
            .from('order_items')
            .select(`
        *,
        order:orders (
          id,
          created_at,
          status,
          shipping_address,
          user:users (display_name, email)
        ),
        product:products (title, cover_url, type)
      `)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error('Failed to fetch seller orders')
        }

        console.log(`Found ${orderItems?.length || 0} order items`)

        return new Response(
            JSON.stringify(orderItems || []),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Seller orders error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
