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

        const { payoutId, status = 'processed' } = await req.json()

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
            if (!userId) throw new Error('Unauthorized: Invalid token')
        }

        if (!userId) throw new Error('Unauthorized')

        const { data: userData, error: userFetchError } = await supabaseAdmin.from('users').select('role').eq('id', userId).single()

        console.log(`👤 approve-payout: User Role Check for ${userId}:`, userData?.role, userFetchError?.message)

        if (userFetchError || userData?.role !== 'admin') {
            throw new Error(`Forbidden: Admin only. (Detected role: ${userData?.role || 'none'})`)
        }

        // Update payout status
        const { data: payout, error: payoutError } = await supabaseAdmin
            .from('payouts')
            .update({
                status: status,
                processed_at: status === 'processed' ? new Date().toISOString() : null
            })
            .eq('id', payoutId)
            .select()
            .single()

        if (payoutError) throw payoutError

        return new Response(JSON.stringify({ success: true, payout }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
