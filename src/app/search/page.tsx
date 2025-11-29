import { createClient } from '@supabase/supabase-js'
import { SearchForm } from "@/components/SearchForm"
import { RideCard } from "@/components/RideCard"
import { PageHeader } from "@/components/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

// Server Component
export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const lat = params.lat ? parseFloat(params.lat as string) : null
    const lon = params.lon ? parseFloat(params.lon as string) : null
    const time = params.time as string
    const dates = params.dates as string // Comma-separated dates

    let ridesWithDates: Array<any & { search_date: string }> = []
    let error = null

    if (lat && lon && time && dates) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Split dates and process each one
        const dateList = dates.split(',')

        // Fetch rides for each date in parallel
        const promises = dateList.map(async (dateStr) => {
            const date = parseISO(dateStr)
            const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.

            const { data, error: rpcError } = await supabase.rpc('find_matching_rides', {
                passenger_lat: lat,
                passenger_lon: lon,
                search_time: time,
                search_date: dateStr
            })

            if (rpcError) {
                console.error(`Error for date ${dateStr}:`, rpcError)
                return []
            }

            // Add the search_date to each ride for display
            return (data || []).map((ride: any) => ({
                ...ride,
                search_date: dateStr
            }))
        })

        try {
            const results = await Promise.all(promises)
            // Flatten and sort by date, then by time_delta_minutes
            ridesWithDates = results
                .flat()
                .sort((a, b) => {
                    if (a.search_date !== b.search_date) {
                        return a.search_date.localeCompare(b.search_date)
                    }
                    return a.time_delta_minutes - b.time_delta_minutes
                })
        } catch (err: any) {
            error = err.message
        }
    }

    return (
        <>
            <PageHeader title="Trouver un trajet" />
            <div className="container mx-auto py-6 px-4 max-w-md">
                <h1 className="text-2xl font-bold mb-6">Trouver un trajet</h1>

                <SearchForm />

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Résultats</h2>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {ridesWithDates.length > 0 ? (
                        <div className="space-y-4">
                            {ridesWithDates.map((ride, index) => (
                                <div key={`${ride.ride_id}-${ride.search_date}-${index}`}>
                                    <div className="text-sm font-semibold text-primary mb-2">
                                        {format(parseISO(ride.search_date), 'EEEE d MMMM yyyy', { locale: fr })}
                                    </div>
                                    <RideCard ride={ride} searchDate={ride.search_date} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        lat ? (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Aucun trajet trouvé</AlertTitle>
                                <AlertDescription>
                                    Essayez de modifier l'heure ou les dates. Aucun conducteur ne passe à moins de 3km à ces horaires.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <p className="text-muted-foreground text-center">Lancez une recherche pour voir les covoits disponibles.</p>
                        )
                    )}
                </div>
            </div>
        </>
    )
}
