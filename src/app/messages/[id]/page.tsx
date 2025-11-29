import { createClient } from "@/utils/supabase/server"
import { redirect } from 'next/navigation'
import { ChatWindow } from "@/components/ChatWindow"
import { getConversationMessages } from "@/app/actions/chat"
import { BackButton } from "@/components/BackButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    // Fetch conversation details to verify access and get other participant info
    const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
      *,
      driver:profiles!driver_id(id, first_name, last_name, avatar_url),
      passenger:profiles!passenger_id(id, first_name, last_name, avatar_url)
    `)
        .eq('id', conversationId)
        .single()

    if (error || !conversation) {
        return <div className="p-4">Conversation introuvable ou accès refusé.</div>
    }

    // Determine who is the "other" person
    const isDriver = session.user.id === conversation.driver_id
    const otherUser = isDriver ? conversation.passenger : conversation.driver
    // @ts-ignore - Supabase types might be tricky with joins, assuming structure is correct
    const otherUserName = otherUser?.first_name || 'Utilisateur'
    // @ts-ignore
    const otherUserAvatar = otherUser?.avatar_url

    // Fetch initial messages
    const initialMessages = await getConversationMessages(conversationId)

    return (
        <div className="container mx-auto max-w-md h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 border-b sticky top-0 bg-white z-10">
                <BackButton />
                <Avatar>
                    <AvatarImage src={otherUserAvatar} />
                    <AvatarFallback>{otherUserName[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="font-semibold text-lg">{otherUserName}</h1>
                    <p className="text-xs text-muted-foreground">Covoiturage Hôpital Marin</p>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-hidden">
                <ChatWindow
                    conversationId={conversationId}
                    initialMessages={initialMessages as any}
                    currentUserId={session.user.id}
                    otherUserName={otherUserName}
                />
            </main>
        </div>
    )
}
