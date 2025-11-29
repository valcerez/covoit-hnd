'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startOrGetConversationAction(driverId: string, passengerId: string) {
    const supabase = await createClient()

    const { data: conversationId, error } = await supabase.rpc('start_or_get_conversation', {
        p_driver_id: driverId,
        p_passenger_id: passengerId
    })

    if (error) {
        console.error("Error starting conversation:", error)
        return { error: error.message }
    }

    return { conversationId }
}

export async function sendMessageAction(conversationId: string, content: string) {
    const supabase = await createClient()

    const { error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_content: content
    })

    if (error) {
        console.error("Error sending message:", error)
        return { error: error.message }
    }

    return { success: true }
}

export async function getConversationMessages(conversationId: string) {
    const supabase = await createClient()

    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
      id,
      content,
      created_at,
      sender_id,
      sender:profiles(first_name, avatar_url)
    `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error("Error fetching messages:", error)
        return []
    }

    return messages
}
