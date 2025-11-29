'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

interface PageHeaderProps {
    title?: string
    showBackButton?: boolean
}

export function PageHeader({ title, showBackButton = true }: PageHeaderProps) {
    if (!showBackButton) {
        return null
    }

    return (
        <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
            <Link href="/dashboard">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Retour à l'accueil"
                >
                    <Home className="h-5 w-5" />
                </Button>
            </Link>
            {title && (
                <h1 className="text-lg font-semibold">{title}</h1>
            )}
        </header>
    )
}
