import { createClient } from "@/utils/supabase/server"
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, MapPin } from "lucide-react"
import { updateRequestStatusAction } from "@/app/actions/requests"
import { toast } from "sonner"
import { RequestActionButtons } from "@/components/RequestActionButtons"
import { PageHeader } from "@/components/PageHeader"

export default async function DriverDashboardPage() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    // Fetch requests for rides where the current user is the driver
    const { data: requests, error } = await supabase
        .from('ride_requests')
        .select(`
      id,
      status,
      created_at,
      request_date,
      ride:rides!inner (
        id,
        start_time,
        return_time,
        driver_id,
        origin_address,
        ride_date
      ),
      passenger:profiles (
        first_name,
        last_name,
        service,
        avatar_url
      )
    `)
        .eq('ride.driver_id', session.user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching requests:", error)
        return <div>Erreur lors du chargement des demandes.</div>
    }

    const pendingRequests = requests.filter(r => r.status === 'PENDING')
    const historyRequests = requests.filter(r => r.status !== 'PENDING')

    // Helper to format time
    const formatTime = (t: string) => t.split(':').slice(0, 2).join('h')

    return (
        <>
            <PageHeader title="Dashboard Conducteur" />
            <div className="container mx-auto py-8 px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Tableau de bord Conducteur</h1>

                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Demandes en attente
                    </h2>

                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground italic">Aucune demande en attente.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map((req: any) => (
                                <Card key={req.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={req.passenger.avatar_url} />
                                                    <AvatarFallback>{req.passenger.first_name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-base">
                                                        {req.passenger.first_name} {req.passenger.last_name}
                                                    </CardTitle>
                                                    <p className="text-sm text-muted-foreground">{req.passenger.service || 'Service non spécifié'}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                En attente
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>Départ souhaité : <strong>{formatTime(req.ride.start_time)}</strong></span>
                                            </div>

                                            {req.ride.origin_address && (
                                                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                                                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <span className="flex-1 truncate">{req.ride.origin_address}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="flex-1 truncate">Hôpital Marin de Hendaye</span>
                                                </div>
                                            )}

                                            {req.request_date && (
                                                <div className="text-sm text-muted-foreground">
                                                    Date demandée : <strong>{new Date(req.request_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                                </div>
                                            )}
                                        </div>

                                        <RequestActionButtons requestId={req.id} accessToken={session.access_token} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Historique</h2>

                    {historyRequests.length === 0 ? (
                        <p className="text-muted-foreground italic">Aucun historique.</p>
                    ) : (
                        <div className="space-y-4 opacity-80">
                            {historyRequests.map((req: any) => (
                                <Card key={req.id} className="bg-gray-50">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={req.passenger.avatar_url} />
                                                    <AvatarFallback>{req.passenger.first_name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {req.passenger.first_name} {req.passenger.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Pour trajet de {formatTime(req.ride.start_time)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={req.status === 'ACCEPTED' ? 'default' : 'destructive'}
                                            >
                                                {req.status === 'ACCEPTED' ? 'Accepté' : 'Refusé'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}
