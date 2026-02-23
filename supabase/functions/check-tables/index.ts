import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: tables, error } = await supabaseAdmin.rpc('get_tables_info').catch(() => ({ data: null, error: 'RPC not found' }));

        // Manual check by fetching 1 row
        const checkDesign = await supabaseAdmin.from('design_requests').select('id').limit(1);
        const checkNotifications = await supabaseAdmin.from('notifications').select('id').limit(1);

        return new Response(JSON.stringify({
            design_requests_exists: !checkDesign.error,
            design_requests_error: checkDesign.error,
            notifications_exists: !checkNotifications.error,
            notifications_error: checkNotifications.error
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
})
