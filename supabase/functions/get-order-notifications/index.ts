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

        console.log(`Incoming request Headers:`, Object.fromEntries(req.headers.entries()))

        // Get user ID from JWT
        let userId: string | null = null
        const authHeader = req.headers.get('Authorization')

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

            if (authError) {
                console.error('Auth error verifying token:', authError)
            } else {
                userId = user?.id ?? null
            }
        }

        // Fallback to headers or body for backward compatibility (careful with security here)
        if (!userId) userId = req.headers.get('x-user-id')

        const body = await req.json().catch(() => ({}))
        if (!userId && body.userId) userId = body.userId

        if (!userId) {
            console.error('Unauthorized: No userId found in token, headers, or body')
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        const onlyUnread = body.onlyUnread ?? false

        // Fetch notifications
        let query = supabaseAdmin
            .from('order_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (onlyUnread) {
            query = query.eq('is_read', false)
        }

        const { data: notifications, error } = await query

        if (error) throw error

        const formattedNotifications = (notifications || []).map((n: any) => ({
            id: n.id,
            orderId: n.order_id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            createdAt: n.created_at
        }))

        return new Response(JSON.stringify({ notifications: formattedNotifications }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        console.error('get-order-notifications error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
