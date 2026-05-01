import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, status, is_verified, created_at')
            .order('created_at', { ascending: false })
            .limit(20)

        const { data: users } = await supabaseAdmin.from('users').select('id, display_name').limit(10)

        return new Response(JSON.stringify({ orders, error, users }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
})
