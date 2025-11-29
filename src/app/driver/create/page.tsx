import { CreateRideForm } from "@/components/CreateRideForm"
import { PageHeader } from "@/components/PageHeader"

export default function CreateRidePage() {
    return (
        <>
            <PageHeader title="Proposer un trajet" />
            <div className="container mx-auto py-10 px-4 max-w-2xl">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Proposer un trajet</h1>
                    <p className="text-muted-foreground">
                        Renseignez vos horaires et votre point de départ pour trouver des passagers.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <CreateRideForm />
                </div>
            </div>
        </>
    )
}
