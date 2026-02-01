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
            // Fallback for custom dev header if any
            userId = req.headers.get('x-user-id') || "";
            if (!userId) throw new Error('Unauthorized: Invalid token')
        }

        if (!userId) throw new Error('Unauthorized')

        const { data: userData, error: userFetchError } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()

        console.log(`👤 get-all-payouts: User Role Check for ${userId}:`, userData?.role, userFetchError?.message)

        if (userFetchError || userData?.role !== 'admin') {
            throw new Error(`Forbidden: Admin only. (Detected role: ${userData?.role || 'none'})`)
        }

        // Get status filter from query/body (optional)
        let statusFilter = 'pending'
        try {
            const body = await req.json()
            if (body.status) statusFilter = body.status
        } catch (e) { }

        // Fetch payouts based on status
        let query = supabaseAdmin
            .from('payouts')
            .select('*, user:users!left(display_name, email)')
            .order('requested_at', { ascending: false })

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) {
            console.error('❌ get-all-payouts: SQL error:', error)
            throw error
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error('❌ get-all-payouts error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
