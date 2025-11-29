'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { updateProfileAction } from "@/app/actions/profile"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const FormSchema = z.object({
    first_name: z.string().min(2, {
        message: "Le prénom doit contenir au moins 2 caractères.",
    }),
    last_name: z.string().min(2, {
        message: "Le nom doit contenir au moins 2 caractères.",
    }),
    phone_number: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, {
        message: "Numéro de téléphone invalide (format français).",
    }),
})

export function ProfileForm() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            phone_number: "",
        },
    })

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    form.reset({
                        first_name: profile.first_name || "",
                        last_name: profile.last_name || "",
                        phone_number: profile.phone_number || "",
                    })
                }
            }
            setLoading(false)
        }
        loadProfile()
    }, [form])

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (!userId) return

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const formData = new FormData()
        formData.append('user_id', userId)
        formData.append('first_name', data.first_name)
        formData.append('last_name', data.last_name)
        formData.append('phone_number', data.phone_number)

        const result = await updateProfileAction(formData, session.access_token)

        if (result.error) {
            toast.error("Erreur: " + result.error)
        } else {
            toast.success("Profil mis à jour !")
            router.push('/') // Redirect to home after success
        }
    }

    if (loading) return <div>Chargement...</div>

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                                <Input placeholder="Jean" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                                <Input placeholder="Dupont" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                                <Input placeholder="06 12 34 56 78" {...field} />
                            </FormControl>
                            <FormDescription>
                                Nécessaire pour que les passagers puissent vous contacter via WhatsApp.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Enregistrer</Button>
            </form>
        </Form>
    )
}
