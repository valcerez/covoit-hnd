'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { updateRequestStatusAction } from "@/app/actions/requests"
import { toast } from "sonner"

interface RequestActionButtonsProps {
    requestId: string
    accessToken: string
}

export function RequestActionButtons({ requestId, accessToken }: RequestActionButtonsProps) {
    const [loading, setLoading] = useState<'ACCEPT' | 'DECLINE' | null>(null)

    const handleAction = async (status: 'ACCEPTED' | 'DECLINED') => {
        setLoading(status === 'ACCEPTED' ? 'ACCEPT' : 'DECLINE')
        const result = await updateRequestStatusAction(requestId, status, accessToken)

        if (result.error) {
            toast.error(result.error)
            setLoading(null)
        } else {
            toast.success(status === 'ACCEPTED' ? "Demande acceptée !" : "Demande refusée.")
            // No need to set loading null as the page will revalidate and remove this item
        }
    }

    return (
        <div className="flex gap-3">
            <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAction('ACCEPTED')}
                disabled={!!loading}
            >
                {loading === 'ACCEPT' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Accepter
            </Button>
            <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleAction('DECLINED')}
                disabled={!!loading}
            >
                {loading === 'DECLINE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                Refuser
            </Button>
        </div>
    )
}
