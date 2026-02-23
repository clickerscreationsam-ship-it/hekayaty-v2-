import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401, headers: corsHeaders })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabaseAdmin = createClient(supabaseUrl, serviceKey)

        // Strict verification
        const token = authHeader.replace(/Bearer /i, '').trim()
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    error: 'Unauthorized',
                    message: authError?.message || 'Verification failed',
                    hint: 'Try relogging'
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        const { amount, method, methodDetails } = body

        // Check reader restriction
        const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
        if (profile?.role === 'reader') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
        }

        // Calculate Balance
        const [
            { data: earnings },
            { data: payouts }
        ] = await Promise.all([
            supabaseAdmin.from('earnings').select('amount').eq('creator_id', user.id),
            supabaseAdmin.from('payouts').select('amount, status').eq('user_id', user.id)
        ])

        const totalNet = earnings?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
        const totalPaid = payouts?.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0) || 0
        const pending = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0
        const available = totalNet - totalPaid - pending

        if (amount > available) {
            return new Response(JSON.stringify({ error: `Only ${available} available` }), { status: 400, headers: corsHeaders })
        }

        // Insert
        const { data: payout, error: payoutError } = await supabaseAdmin
            .from('payouts')
            .insert({
                user_id: user.id,
                amount,
                method,
                method_details: methodDetails,
                status: 'pending'
            })
            .select()
            .single()

        if (payoutError) throw payoutError

        return new Response(JSON.stringify({ payout, success: true }), { status: 201, headers: corsHeaders })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
