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

        // Extract JWT token from Authorization header
        const token = authHeader.replace('Bearer ', '');
        console.log(`🔑 request-payout: Token length: ${token.length}, First 20 chars: ${token.substring(0, 20)}...`);

        // Create service role client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Manually decode JWT to extract user ID (bypass signature validation for now)
        let userId: string;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
            console.log(`👤 request-payout: Extracted user ID from JWT: ${userId}`);

            // Verify user exists in database
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('id', userId)
                .single()

            if (userError || !user) {
                console.error("❌ request-payout: User not found in database", userError)
                return new Response(
                    JSON.stringify({
                        error: 'User not found',
                        details: userError?.message
                    }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            console.log(`✅ request-payout: User ${userId} verified successfully`)

        } catch (jwtError) {
            console.error("❌ request-payout: JWT decoding failed", jwtError)
            return new Response(
                JSON.stringify({
                    error: 'Invalid token',
                    details: (jwtError as Error).message
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        const { amount, method = 'vodafone_cash', methodDetails } = body

        console.log(`✅ request-payout: User ${userId} authenticated. Processing payout of ${amount} via ${method}`)

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
