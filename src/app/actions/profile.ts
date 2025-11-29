'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function updateProfileAction(formData: FormData, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    })

    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string
    const phone_number = formData.get('phone_number') as string
    const user_id = formData.get('user_id') as string

    const { error } = await supabase
        .from('profiles')
        .update({
            first_name,
            last_name,
            phone_number,
        })
        .eq('id', user_id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}
