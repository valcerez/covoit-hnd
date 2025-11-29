'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce' // Need to create this hook or implement inline

interface Address {
    label: string
    score: number
    geometry: {
        coordinates: [number, number] // [lon, lat]
    }
    context: string
}

interface AddressAutocompleteProps {
    onSelect: (address: { label: string; lat: number; lon: number }) => void
}

export function AddressAutocomplete({ onSelect }: AddressAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState('')
    const [query, setQuery] = React.useState('')
    const [results, setResults] = React.useState<Address[]>([])
    const [loading, setLoading] = React.useState(false)

    // Debounce query to avoid spamming the API
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 3) {
                searchAddress(query)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const searchAddress = async (q: string) => {
        setLoading(true)
        try {
            const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`)
            const data = await res.json()
            setResults(data.features.map((f: any) => ({
                label: f.properties.label,
                score: f.properties.score,
                geometry: f.geometry,
                context: f.properties.context
            })))
        } catch (error) {
            console.error('Error fetching address:', error)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value ? value : "Rechercher une adresse..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}> {/* Disable local filtering because we do it server-side */}
                    <CommandInput
                        placeholder="Entrez une adresse..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && <div className="p-2 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Chargement...</div>}
                        {!loading && results.length === 0 && query.length > 3 && (
                            <CommandEmpty>Aucune adresse trouvée.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {results.map((address) => (
                                <CommandItem
                                    key={address.label}
                                    value={address.label}
                                    onSelect={() => {
                                        setValue(address.label)
                                        onSelect({
                                            label: address.label,
                                            lat: address.geometry.coordinates[1],
                                            lon: address.geometry.coordinates[0]
                                        })
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === address.label ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{address.label}</span>
                                        <span className="text-xs text-muted-foreground">{address.context}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
