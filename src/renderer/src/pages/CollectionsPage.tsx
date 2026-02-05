import { Tag } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

interface CollectionsPageProps {
    tagCollections: { tag: string; count: number }[]
    onTagSelect: (tag: string) => void
    onBack?: () => void
    isSubView?: boolean
}

export function CollectionsPage({
    tagCollections,
    onTagSelect
}: CollectionsPageProps) {
    const { t } = useTranslation()
    const { uiStyle } = useTheme()
    const cardStyleClass = uiStyle === 'gradient' ? 'card-gradient' : 'card-elevated'

    if (tagCollections.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <div className="mb-4 rounded-full bg-secondary p-4">
                    <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">{t('views.noTags')}</h3>
                <p className="text-sm text-muted-foreground">{t('views.addTagsDesc')}</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tagCollections.map(({ tag, count }) => (
                    <button
                        key={tag}
                        onClick={() => onTagSelect(tag)}
                        className={`group flex items-center gap-3 border border-border bg-card p-4 text-left hover:border-primary/50 ${cardStyleClass}`}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                            <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">#{tag}</h3>
                            <p className="text-xs text-muted-foreground">
                                {count} {t('views.inCollection')}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
