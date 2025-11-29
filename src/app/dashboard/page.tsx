import { createClient } from "@/utils/supabase/server"
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, Car, Search, User, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/')
    }

    // 1. Check for pending requests (Alerts)
    // We need to find requests for rides where the current user is the driver AND status is PENDING
    const { count } = await supabase
        .from('ride_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING')
        .eq('ride.driver_id', session.user.id) // This requires a join, but Supabase simple filter on foreign key might not work directly without !inner or specific syntax if not set up.
    // Let's try a more robust approach: Get user's rides first, then requests.
    // Or use the !inner syntax if we trust the previous query structure.
    // Actually, let's replicate the query from driver dashboard but just for count.

    // Alternative query:
    const { data: pendingRequests } = await supabase
        .from('ride_requests')
        .select(`
      id,
      ride:rides!inner(driver_id)
    `)
        .eq('status', 'PENDING')
        .eq('ride.driver_id', session.user.id)

    const pendingCount = pendingRequests?.length || 0

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', session.user.id)
        .single()

    return (
        <div className="container mx-auto py-8 px-4 max-w-md">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Bonjour, {profile?.first_name || 'Agent'} 👋</h1>
                <p className="text-muted-foreground">Que souhaitez-vous faire aujourd'hui ?</p>
            </header>

            {/* Alerts Section */}
            {pendingCount > 0 && (
                <section className="mb-8">
                    <Alert className="border-amber-200 bg-amber-50">
                        <Bell className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Nouvelles demandes</AlertTitle>
                        <AlertDescription className="text-amber-700 mt-2">
                            Vous avez <strong>{pendingCount}</strong> demande(s) de covoiturage en attente.
                            <div className="mt-3">
                                <Link href="/driver/dashboard">
                                    <Button size="sm" variant="outline" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100">
                                        Gérer mes demandes
                                    </Button>
                                </Link>
                            </div>
                        </AlertDescription>
                    </Alert>
                </section>
            )}

            {/* Quick Actions */}
            <section className="space-y-4">
                <Link href="/driver/create" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                        <CardContent className="flex items-center p-6">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <Car className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Proposer un trajet</CardTitle>
                                <CardDescription>Je suis conducteur</CardDescription>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/search" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                        <CardContent className="flex items-center p-6">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <Search className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Trouver un covoit'</CardTitle>
                                <CardDescription>Je suis passager</CardDescription>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/profile" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-gray-500">
                        <CardContent className="flex items-center p-6">
                            <div className="bg-gray-100 p-3 rounded-full mr-4">
                                <User className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Mon Profil</CardTitle>
                                <CardDescription>Infos & Historique</CardDescription>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>
            </section>
        </div>
    )
}
