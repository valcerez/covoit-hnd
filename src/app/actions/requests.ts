'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function createRideRequestAction(rideId: string, requestDate: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    })

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non authentifié" }

    // Check if request already exists for this date
    const { data: existing } = await supabase
        .from('ride_requests')
        .select('id')
        .eq('ride_id', rideId)
        .eq('passenger_id', user.id)
        .eq('request_date', requestDate)
        .single()

    if (existing) {
        return { error: "Vous avez déjà demandé ce trajet pour cette date." }
    }

    const { error } = await supabase
        .from('ride_requests')
        .insert({
            ride_id: rideId,
            passenger_id: user.id,
            request_date: requestDate,
            status: 'PENDING'
        })

    if (error) {
        console.error(error)
        return { error: error.message }
    }

    revalidatePath('/driver/dashboard')
    return { success: true }
}

export async function updateRequestStatusAction(requestId: string, status: 'ACCEPTED' | 'DECLINED', accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    })

    const { error } = await supabase
        .from('ride_requests')
        .update({ status })
        .eq('id', requestId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/driver/dashboard')
    return { success: true }
}
