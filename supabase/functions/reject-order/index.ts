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

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Unauthorized: Missing token')
        }

        const body = await req.json()
        const token = authHeader.replace('Bearer ', '');
        let userId: string;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
        } catch (e) {
            userId = req.headers.get('x-user-id') || body.userId || "";
            if (!userId) throw new Error('Unauthorized: Invalid token')
        }

        if (!userId) throw new Error('Unauthorized')

        // Check if user is admin
        const { data: userData } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
        if (userData?.role !== 'admin') throw new Error('Forbidden: Admin only')

        const { orderId } = body

        const { error } = await supabaseAdmin
            .from('orders')
            .update({ status: 'rejected' })
            .eq('id', orderId)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
