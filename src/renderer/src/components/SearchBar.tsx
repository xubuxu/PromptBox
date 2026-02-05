import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

/**
 * Search input component
 */
export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
    const { t } = useTranslation()
    const finalPlaceholder = placeholder || t('app.searchPlaceholder')

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={finalPlaceholder}
                className="search-input w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none"
            />
        </div>
    )
}
