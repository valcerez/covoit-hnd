'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Note: In a real server action with Supabase Auth, we should use createServerComponentClient from @supabase/auth-helpers-nextjs
// But for simplicity and since we are using the JS client in this MVP, we will use a standard client with the service role key 
// OR better, pass the user session. 
// Actually, for Server Actions, it's best to use the cookie-based auth helper.
// However, since we haven't set up the cookie-based auth helper yet (middleware, etc.), 
// we will assume the client sends the necessary data or we use the anon key and rely on RLS with the user's session if we were using the standard flow.
// BUT, Server Actions run on the server. We need the user's ID.
// Let's use the standard supabase-js client but we need to know WHO is making the request.
// The proper Next.js way is using @supabase/ssr.
// For now, to keep it simple as requested ("MVP"), we will trust the RLS policies. 
// Wait, Server Actions don't automatically have the user context unless we use the cookie methods.
// Let's try to use the standard client and assume we pass the user ID for now, OR better, 
// we just use the client-side Supabase to insert. The user asked for a "Server Action".
// If I use a Server Action, I need to handle auth on the server.
// Let's implement a simple Server Action that takes the data and inserts it using the Service Role Key (admin) 
// BUT this bypasses RLS if we are not careful.
// Actually, the user asked for "Action : Création d'une fonction d'action côté serveur".
// I will use the `createServerClient` from `@supabase/ssr` pattern if possible, but I don't want to install more packages if not needed.
// Let's stick to the simplest: The Server Action will receive the `driver_id` from the form (hidden field) 
// and we will use the `supabase` client initialized with `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
// Wait, if I use the ANON key in a Server Action, I am not authenticated as the user. I am just "anon".
// So RLS `auth.uid() = driver_id` will FAIL because `auth.uid()` will be null.
//
// SOLUTION: For this MVP, it is actually EASIER and MORE SECURE to do the insertion Client-Side directly 
// because the Client has the Session.
// HOWEVER, the user EXPLICITLY asked for a "Server Action".
// To make a Server Action work with RLS, we need to forward the Auth Cookie.
// Let's try to do it Client-Side first as it's standard with Supabase + Next.js App Router for simple apps, 
// UNLESS I set up the whole cookie machinery.
//
// RE-READING USER REQUEST: "Action : Création d'une fonction d'action côté serveur (server action ou route handler) pour insérer le trajet dans la table rides de Supabase."
// OK, I MUST do it server-side.
// I will use a simple trick: Pass the `access_token` from the client to the server action.
// Then create a Supabase client with that token.

// import { Database } from '@/lib/database.types' // Types not generated yet

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function createRideAction(formData: FormData, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    })

    const driver_id = formData.get('driver_id') as string
    const origin_lat = formData.get('origin_lat')
    const origin_lon = formData.get('origin_lon')
    const origin_address = formData.get('origin_address') as string
    const dates = formData.get('dates') as string // Comma separated dates
    const start_time = formData.get('start_time') as string
    const return_time = formData.get('return_time') as string

    if (!dates) {
        return { error: "Aucune date sélectionnée" }
    }

    const dateList = dates.split(',')
    const origin_coords = `POINT(${origin_lon} ${origin_lat})`

    const inserts = dateList.map(date => ({
        driver_id,
        origin_coords,
        origin_address,
        ride_date: date,
        start_time,
        return_time,
        days_active: []
    }))

    const { data, error } = await supabase
        .from('rides')
        .insert(inserts)
        .select()

    if (error) {
        console.error('Error creating ride:', error)
        return { error: error.message }
    }

    return { success: true, data }
}
