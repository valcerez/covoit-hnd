'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressAutocomplete } from "./AddressAutocomplete"
import { Calendar } from "@/components/ui/calendar"
import { Search } from "lucide-react"
import { format, addDays, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

export function SearchForm() {
    const router = useRouter()
    const [lat, setLat] = useState<number | null>(null)
    const [lon, setLon] = useState<number | null>(null)
    const [time, setTime] = useState("07:30")
    const [selectedDates, setSelectedDates] = useState<Date[]>([])

    const handleSearch = () => {
        if (!lat || !lon) {
            toast.error("Veuillez sélectionner une adresse.")
            return
        }

        if (selectedDates.length === 0) {
            toast.error("Veuillez sélectionner au moins une date.")
            return
        }

        // Convert dates to YYYY-MM-DD format
        const dates = selectedDates.map(date => format(date, 'yyyy-MM-dd')).join(',')

        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            time: time,
            dates: dates
        })

        router.push(`/search?${params.toString()}`)
    }

    // Calculate date range: Today to J+7
    const today = startOfDay(new Date())
    const maxDate = addDays(today, 7)

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
            <div className="space-y-2">
                <Label>Je pars de...</Label>
                <AddressAutocomplete
                    onSelect={(addr) => {
                        setLat(addr.lat)
                        setLon(addr.lon)
                    }}
                />
            </div>

            <div className="space-y-2">
                <Label>Heure souhaitée</Label>
                <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Jours souhaités (sélection multiple)</Label>
                <div className="border rounded-md p-2">
                    <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => setSelectedDates(dates || [])}
                        disabled={(date) => date < today || date > maxDate}
                        locale={fr}
                        className="rounded-md"
                    />
                </div>
                {selectedDates.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {selectedDates.length} jour(s) sélectionné(s)
                    </p>
                )}
            </div>

            <Button className="w-full gap-2" onClick={handleSearch}>
                <Search className="h-4 w-4" />
                Rechercher un covoit'
            </Button>
        </div>
    )
}
