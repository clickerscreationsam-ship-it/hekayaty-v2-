import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
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

        // Clone request for body reading since we might have read it above for userId
        const reqClone = req.clone()

        // Get status filter from query/body (optional)
        let statusFilter = 'pending'
        try {
            // Check query params first
            const url = new URL(req.url)
            const statusParam = url.searchParams.get('status')
            if (statusParam) {
                statusFilter = statusParam
            } else {
                const body = await reqClone.json()
                if (body && body.status) statusFilter = body.status
            }
        } catch (e) {
            console.log('No body or status in request', e)
        }

        let query = supabaseAdmin
            .from('orders')
            .select('*, user:users!left(display_name, email)')
            .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) throw error

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: (error as Error).message.includes('Forbidden') ? 403 : 401,
        })
    }
})
