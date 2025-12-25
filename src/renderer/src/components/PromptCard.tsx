import { useState } from 'react'
import { Star, Copy, Trash2, Pencil } from 'lucide-react'
import { Prompt } from '@shared/types'
import { PromptEditor } from './PromptEditor'

interface PromptCardProps {
    prompt: Prompt
    onToggleFavorite: () => void
    onDelete: () => void
    onUpdate: (title: string, content: string, tags: string[], description?: string) => void
}

/**
 * Individual prompt card with view/edit modes
 */
export function PromptCard({
    prompt,
    onToggleFavorite,
    onDelete,
    onUpdate
}: PromptCardProps) {
    const [isEditing, setIsEditing] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.content)
    }

    const handleSave = (title: string, content: string, tags: string[], description?: string) => {
        onUpdate(title, content, tags, description)
        setIsEditing(false)
    }

    // Extract variables from content
    const variableMatches = prompt.content.match(/\{\{(.*?)\}\}/g) || []
    const variables = variableMatches.map((v) => v.replace(/\{\{|\}\}/g, ''))

    // Edit mode - show editor form
    if (isEditing) {
        return (
            <div className="rounded-xl border border-primary bg-card p-4">
                <PromptEditor
                    prompt={prompt}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        )
    }

    // View mode - read-only display
    return (
        <div className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
            {/* Header */}
            <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-foreground">{prompt.title}</h3>
                <button
                    onClick={onToggleFavorite}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${prompt.isFavorite
                        ? 'text-yellow-400'
                        : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-400'
                        }`}
                >
                    <Star className={`h-4 w-4 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Description */}
            {prompt.description && (
                <p className="mb-2 text-sm text-muted-foreground">{prompt.description}</p>
            )}

            {/* Content Preview */}
            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground/70">{prompt.content}</p>

            {/* Variables */}
            {variables.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                    {variables.map((variable, index) => (
                        <span
                            key={index}
                            className="rounded-md bg-accent/20 px-2 py-0.5 text-xs text-accent"
                        >
                            {variable}
                        </span>
                    ))}
                </div>
            )}

            {/* Tags */}
            {prompt.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                </button>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                </button>
            </div>
        </div>
    )
}
