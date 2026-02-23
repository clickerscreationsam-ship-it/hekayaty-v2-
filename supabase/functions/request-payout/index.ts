import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Request payout function starting...")

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401, headers: corsHeaders })
        }

        // Create admin client
        const supabaseAdmin = createClient(supabaseUrl || '', serviceKey || '')

        // Verify user - use strict method first
        const token = authHeader.replace(/Bearer /i, '').trim()
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

        let userId = authUser?.id

        if (authError || !userId) {
            console.error("❌ JWT Verification failed:", authError?.message)

            // EMERGENCY FALLBACK: If getUser fails but token exists, try to trust the token 
            // ONLY if strictly authenticated via project's own auth.
            // In Supabase Edge Functions, auth.getUser is the gold standard.
            return new Response(
                JSON.stringify({
                    error: 'Unauthorized: Invalid session',
                    details: authError?.message || 'Token verification failed',
                    hint: 'Try logging out and back in to refresh your login.'
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`✅ User ${userId} verified. Preparing payout...`);

        // Check if user is a reader
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single()

        if (userProfile?.role === 'reader') {
            return new Response(
                JSON.stringify({ error: 'Readers cannot request payouts.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        const { amount, method = 'vodafone_cash', methodDetails } = body

        // Calculate Balance
        const [
            { data: earningsRecords },
            { data: payouts }
        ] = await Promise.all([
            supabaseAdmin.from('earnings').select('amount').eq('creator_id', userId),
            supabaseAdmin.from('payouts').select('amount, status').eq('user_id', userId)
        ])

        const totalNetEarnings = earningsRecords?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const totalPaidOut = payouts?.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0) || 0;
        const pendingPayouts = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;

        const availableBalance = totalNetEarnings - totalPaidOut - pendingPayouts;

        if (amount > availableBalance) {
            return new Response(
                JSON.stringify({ error: 'Insufficient balance', details: `Only ${availableBalance} EGP available.` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (amount < 200) {
            return new Response(
                JSON.stringify({ error: 'Minimum payout is 200 EGP' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Insert Payout
        const { data: payout, error: payoutError } = await supabaseAdmin
            .from('payouts')
            .insert({
                user_id: userId,
                amount: amount,
                method: method,
                method_details: methodDetails,
                status: 'pending'
            })
            .select()
            .single()

        if (payoutError) throw payoutError

        return new Response(
            JSON.stringify({ payout, success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        )

    } catch (error: any) {
        console.error('Request payout error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
