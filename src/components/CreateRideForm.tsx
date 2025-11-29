'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AddressAutocomplete } from "./AddressAutocomplete"
import { createRideAction } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"

const FormSchema = z.object({
    origin_address: z.string().min(2, {
        message: "L'adresse est requise.",
    }),
    origin_lat: z.number(),
    origin_lon: z.number(),
    dates: z.array(z.date()).refine((value) => value.length > 0, {
        message: "Sélectionnez au moins une date.",
    }),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Format d'heure invalide.",
    }),
    return_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Format d'heure invalide.",
    }),
})

export function CreateRideForm() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id)
        })
    }, [])

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            dates: [],
            start_time: "07:30",
            return_time: "17:00",
        },
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (!userId) {
            toast.error("Vous devez être connecté.")
            return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const formData = new FormData()
        formData.append('driver_id', userId)
        formData.append('origin_lat', data.origin_lat.toString())
        formData.append('origin_lon', data.origin_lon.toString())
        formData.append('origin_address', data.origin_address)

        // Convert dates to string format YYYY-MM-DD
        const dateStrings = data.dates.map(d => format(d, 'yyyy-MM-dd')).join(',')
        formData.append('dates', dateStrings)

        formData.append('start_time', data.start_time)
        formData.append('return_time', data.return_time)

        const result = await createRideAction(formData, session.access_token)

        if (result.error) {
            toast.error("❌ Erreur : Le trajet n'a pas pu être enregistré. Veuillez réessayer.")
        } else {
            toast.success("✅ Trajet proposé avec succès !")
            router.push('/driver/dashboard')
        }
    }

    // Calculate date range: Today to J+30 (allow planning for a month)
    const today = startOfDay(new Date())
    const maxDate = addDays(today, 30)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <FormField
                    control={form.control}
                    name="origin_address"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Adresse de départ</FormLabel>
                            <FormControl>
                                <AddressAutocomplete
                                    onSelect={(address) => {
                                        form.setValue('origin_address', address.label)
                                        form.setValue('origin_lat', address.lat)
                                        form.setValue('origin_lon', address.lon)
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                Votre domicile ou point de départ habituel.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dates"
                    render={({ field }) => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Dates des trajets</FormLabel>
                                <FormDescription>
                                    Sélectionnez les jours où vous proposez ce trajet (sur les 30 prochains jours).
                                </FormDescription>
                            </div>
                            <div className="border rounded-md p-2 flex justify-center">
                                <Calendar
                                    mode="multiple"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < today || date > maxDate}
                                    locale={fr}
                                    className="rounded-md"
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Heure de départ (Aller)</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="return_time"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Heure de retour</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full">Créer les trajets</Button>
            </form>
        </Form>
    )
}
