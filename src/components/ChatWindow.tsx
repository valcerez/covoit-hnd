'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendMessageAction } from '@/app/actions/chat'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Message {
    id: string
    content: string
    created_at: string
    sender_id: string
    sender?: {
        first_name: string
        avatar_url: string | null
    }
}

interface ChatWindowProps {
    conversationId: string
    initialMessages: Message[]
    currentUserId: string
    otherUserName: string
}

export function ChatWindow({ conversationId, initialMessages, currentUserId, otherUserName }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState("")
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || sending) return

        const content = newMessage
        setNewMessage("") // Clear input immediately
        setSending(true)

        // Optimistic Update
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            content: content,
            created_at: new Date().toISOString(),
            sender_id: currentUserId,
            sender: {
                first_name: "Moi", // Or fetch from props if needed, but "Moi" or null is fine for now
                avatar_url: null
            }
        }
        setMessages((prev) => [...prev, optimisticMsg])

        const result = await sendMessageAction(conversationId, content)

        if (result.error) {
            toast.error("Erreur lors de l'envoi")
            // Rollback if error (remove the temp message)
            setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id))
            setNewMessage(content) // Put text back
        } else {
            // Success: The Realtime subscription will likely pick it up, OR we just keep our optimistic one.
            // If we rely on Realtime, we might get a duplicate if we don't filter.
            // Let's filter in the subscription.
        }
        setSending(false)
    }

    useEffect(() => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    // Ignore our own messages to avoid duplicates with optimistic UI
                    if (payload.new.sender_id === currentUserId) {
                        return
                    }

                    const { data: newMsgData } = await supabase
                        .from('messages')
                        .select(`
              id,
              content,
              created_at,
              sender_id,
              sender:profiles(first_name, avatar_url)
            `)
                        .eq('id', payload.new.id)
                        .single()

                    if (newMsgData) {
                        setMessages((prev) => [...prev, newMsgData as any])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, supabase, currentUserId])


    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg mb-4">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        Dites bonjour à {otherUserName} 👋
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="h-6 w-6 mb-1">
                                            <AvatarImage src={msg.sender?.avatar_url || ''} />
                                            <AvatarFallback>{msg.sender?.first_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={`p-3 rounded-2xl text-sm ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-white border shadow-sm rounded-bl-none'
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    )
}
