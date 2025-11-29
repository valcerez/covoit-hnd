import { ProfileForm } from "@/components/ProfileForm"
import { PageHeader } from "@/components/PageHeader"

export default function ProfilePage() {
    return (
        <>
            <PageHeader title="Mon Profil" />
            <div className="container mx-auto py-10 px-4 max-w-md">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
                    <p className="text-muted-foreground">
                        Complétez vos informations pour utiliser l'application.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <ProfileForm />
                </div>
            </div>
        </>
    )
}
