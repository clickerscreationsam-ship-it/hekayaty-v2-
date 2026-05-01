import "jsr:@supabase/functions-js/edge-runtime.d.ts"

export const createSupabaseClient = (authHeader?: string) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = authHeader
        ? Deno.env.get('SUPABASE_ANON_KEY')!
        : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    return import('https://esm.sh/@supabase/supabase-js@2.39.3').then(({ createClient }) =>
        createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: authHeader ? { Authorization: authHeader } : {},
            },
        })
    )
}

export const getUserFromAuth = async (authHeader: string) => {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3')
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        throw new Error('Unauthorized')
    }

    return user
}
