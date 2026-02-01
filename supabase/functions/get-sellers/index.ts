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

        const token = authHeader.replace('Bearer ', '');
        let userId: string;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
        } catch (e) {
            userId = req.headers.get('x-user-id') || "";
            if (!userId) {
                try {
                    const body = await req.json()
                    userId = body.userId
                } catch (be) { }
            }
            if (!userId) throw new Error('Unauthorized: Invalid token')
        }

        if (!userId) throw new Error('Unauthorized')

        // Check if user is admin
        const { data: userData } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()
        if (userData?.role !== 'admin') throw new Error('Forbidden: Admin only')

        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .in('role', ['writer', 'artist'])
            .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message,
            debug: {
                hasAuthHeader: !!req.headers.get('Authorization'),
                hasXUserId: !!req.headers.get('x-user-id'),
                xUserIdValue: req.headers.get('x-user-id') || 'missing',
                url: req.url
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: error.message.includes('Forbidden') ? 403 : 401,
        })
    }
})
