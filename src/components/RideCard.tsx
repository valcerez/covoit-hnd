'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageCircle, Clock, MapPin, Check, ArrowRight } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { createRideRequestAction } from "@/app/actions/requests"
import { startOrGetConversationAction } from "@/app/actions/chat"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface RideCardProps {
    ride: {
        ride_id: string
        driver_id: string
        driver_first_name: string
        driver_service: string
        driver_avatar_url: string | null
        start_time: string
        return_time: string
        origin_address?: string
        distance_meters: number
        time_delta_minutes: number
    }
    searchDate: string // YYYY-MM-DD format
}

export function RideCard({ ride, searchDate }: RideCardProps) {
    const [isRequesting, setIsRequesting] = useState(false)
    const [isContacting, setIsContacting] = useState(false)
    const router = useRouter()

    const detourKm = (ride.distance_meters / 1000).toFixed(1)

    // Format time (remove seconds if present)
    const formatTime = (t: string) => t.split(':').slice(0, 2).join('h')

    const handleRequestRide = async () => {
        setIsRequesting(true)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            toast.error("Vous devez être connecté.")
            setIsRequesting(false)
            return
        }

        const result = await createRideRequestAction(ride.ride_id, searchDate, session.access_token)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("✅ Demande envoyée au conducteur !")
        }
        setIsRequesting(false)
    }

    const handleContact = async () => {
        setIsContacting(true)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            toast.error("Vous devez être connecté.")
            setIsContacting(false)
            return
        }

        const result = await startOrGetConversationAction(ride.driver_id, session.user.id)

        if (result.error) {
            toast.error("Erreur lors de l'ouverture du chat")
            setIsContacting(false)
        } else {
            router.push(`/messages/${result.conversationId}`)
        }
    }

    return (
        <Card className="w-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={ride.driver_avatar_url || ''} alt={ride.driver_first_name} />
                    <AvatarFallback>{ride.driver_first_name ? ride.driver_first_name[0] : '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{ride.driver_first_name}</h3>
                    <p className="text-sm text-muted-foreground">{ride.driver_service}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{formatTime(ride.start_time)}</div>
                    <div className="text-xs text-muted-foreground">Retour {formatTime(ride.return_time)}</div>
                </div>
            </CardHeader>
            <CardContent className="pb-2 space-y-2">
                {/* Route information */}
                {ride.origin_address && (
                    <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="flex-1 truncate">{ride.origin_address}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">Hôpital Marin de Hendaye</span>
                    </div>
                )}

                {/* Stats */}
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-amber-600">
                        <MapPin className="h-4 w-4" />
                        <span>Détour: {detourKm} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(ride.time_delta_minutes)} min diff.</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2 flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleContact}
                    disabled={isContacting}
                >
                    {isContacting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                    Contacter
                </Button>

                <Button
                    className="flex-1 gap-2"
                    onClick={handleRequestRide}
                    disabled={isRequesting}
                >
                    {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Demander le trajet
                </Button>
            </CardFooter>
        </Card>
    )
}
