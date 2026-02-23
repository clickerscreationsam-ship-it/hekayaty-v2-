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

        console.log(`🔒 request-payout: Auth check. Header present: ${!!authHeader}`)

        if (!authHeader) {
            console.error("❌ request-payout: Missing Authorization header")
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!supabaseUrl || !serviceKey) {
            console.error("❌ request-payout: Configuration error", { url: !!supabaseUrl, key: !!serviceKey })
            return new Response(
                JSON.stringify({ error: 'Server configuration error. Contact admin.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create service role client
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        })

        // Clean token extraction
        const token = authHeader.replace(/Bearer /i, '').trim();
        if (!token) {
            return new Response(
                JSON.stringify({ error: 'Empty token provided' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // CRYPTOGRAPHICALLY VERIFY TOKEN
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            console.error("❌ request-payout: JWT Verification failed", authError?.message);
            return new Response(
                JSON.stringify({
                    error: 'Unauthorized: Invalid session',
                    details: authError?.message || 'Token verification failed',
                    hint: 'Your session may have expired. Please try logging out and back in.'
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const userId = authUser.id;
        console.log(`✅ request-payout: User ${userId} verified`);

        // Check if user is a reader
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single()

        if (userProfile?.role === 'reader') {
            return new Response(
                JSON.stringify({ error: 'Readers cannot request payouts. Only creators are eligible.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        const { amount, method = 'vodafone_cash', methodDetails } = body

        if (!amount || amount <= 0) {
            return new Response(
                JSON.stringify({ error: 'Invalid amount' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Calculate REAL balance from database
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

        console.log(`💰 Balance Check for ${userId}: Available=${availableBalance}`);

        if (amount > availableBalance) {
            return new Response(
                JSON.stringify({
                    error: 'Insufficient balance',
                    details: `You requested ${amount} EGP but only have ${availableBalance} EGP available.`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const MIN_PAYOUT = 200
        if (amount < MIN_PAYOUT) {
            return new Response(
                JSON.stringify({ error: `Minimum payout is ${MIN_PAYOUT} EGP` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create payout request
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

        if (payoutError) {
            console.error('❌ request-payout: Database error:', payoutError)
            return new Response(
                JSON.stringify({ error: `Database error: ${payoutError.message}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('Payout request created:', payout.id)

        return new Response(
            JSON.stringify({ payout, success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201,
            }
        )

    } catch (error: any) {
        console.error('Request payout error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
