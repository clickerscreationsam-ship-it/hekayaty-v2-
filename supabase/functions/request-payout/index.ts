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

        console.log(`🔒 request-payout: Auth check. Header present: ${!!authHeader}, Length: ${authHeader?.length}`)
        console.log("🛠️ request-payout: Env check - URL:", !!Deno.env.get('SUPABASE_URL'), "Anon:", !!Deno.env.get('SUPABASE_ANON_KEY'))

        if (!authHeader) {
            console.error("❌ request-payout: Missing Authorization header")
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create service role client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Extract JWT token from Authorization header
        const token = authHeader.replace('Bearer ', '');

        // CRYPTOGRAPHICALLY VERIFY TOKEN
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            console.error("❌ request-payout: JWT Verification failed", authError);
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid session' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const userId = authUser.id;
        console.log(`✅ request-payout: User ${userId} verified cryptographically`);

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

        // 1. Calculate REAL balance from database (Source of truth)
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

        console.log(`💰 Balance Check for ${userId}: Net=${totalNetEarnings}, Paid=${totalPaidOut}, Pending=${pendingPayouts}, Available=${availableBalance}`);

        if (amount > availableBalance) {
            return new Response(
                JSON.stringify({
                    error: 'Insufficient balance',
                    details: `You requested ${amount} EGP but only have ${availableBalance} EGP available.`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const MIN_PAYOUT = 200 // 200 EGP
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
            throw new Error(`Failed to create payout request: ${payoutError.message}`)
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
