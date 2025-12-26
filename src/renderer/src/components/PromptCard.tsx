import { useState, useCallback, useMemo } from 'react'
import { Star, Copy, Trash2, Pencil, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prompt } from '@shared/types'
import { PromptEditor } from './PromptEditor'
import { Toast } from './Toast'
import { ConfirmDialog } from './ConfirmDialog'
import { VariableInputModal } from './VariableInputModal'
import { useTheme } from '../contexts/ThemeContext'
import { getTagColor, sortTags } from '../utils/tagColors'

interface PromptCardProps {
    prompt: Prompt
    onToggleFavorite: () => void
    onDelete: () => void
    onUpdate: (title: string, content: string, tags: string[], description?: string) => void
    onCopied?: () => void
    // Selection mode props
    selectionMode?: boolean
    isSelected?: boolean
    onSelect?: (id: string) => void
}

/**
 * Extracts variable names from content using {{variable}} syntax
 */
function hasVariables(content: string): boolean {
    return /\{\{[^}]+\}\}/.test(content)
}

/**
 * Individual prompt card with view/edit modes
 */
export function PromptCard({
    prompt,
    onToggleFavorite,
    onDelete,
    onUpdate,
    onCopied,
    selectionMode = false,
    isSelected = false,
    onSelect
}: PromptCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [showVariableModal, setShowVariableModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const { theme, uiStyle } = useTheme()

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
    }, [])

    // Content for display and copying
    const displayContent = prompt.content

    // Get content for copying (always English)
    const copyContent = prompt.content

    const handleCopy = useCallback(() => {
        // If content has variables, open the variable input modal
        // Always copy English version
        if (hasVariables(copyContent)) {
            setShowVariableModal(true)
        } else {
            // No variables, copy directly (English version)
            navigator.clipboard.writeText(copyContent)
            showToast('Copied to clipboard!')
            onCopied?.()
        }
    }, [copyContent, showToast, onCopied])

    const handleVariableCopy = useCallback((filledContent: string) => {
        navigator.clipboard.writeText(filledContent)
        showToast('Copied to clipboard!')
        onCopied?.()
    }, [showToast, onCopied])

    const handleSave = (title: string, content: string, tags: string[], description?: string) => {
        onUpdate(title, content, tags, description)
        setIsEditing(false)
    }

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = () => {
        onDelete()
        setShowDeleteConfirm(false)
    }

    // Extract variables from display content for preview
    const variableMatches = displayContent.match(/\{\{(.*?)\}\}/g) || []
    const variables = variableMatches.map((v: string) => v.replace(/\{\{|\}\}/g, ''))



    // Sort tags alphabetically
    const sortedTags = useMemo(() => sortTags(prompt.tags), [prompt.tags])

    // Dynamic card class based on UI style
    const cardStyleClass = uiStyle === 'gradient' ? 'card-gradient' : 'card-elevated'
    const varBadgeClass = uiStyle === 'gradient' ? 'var-badge-gradient' : ''
    const btnHoverClass = uiStyle === 'gradient' ? 'btn-gradient-hover' : ''

    // Edit mode - show editor form
    if (isEditing) {
        return (
            <div className={`border border-primary bg-card p-4 ${cardStyleClass}`}>
                <PromptEditor
                    prompt={prompt}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        )
    }

    // View mode - read-only display
    const handleCardClick = () => {
        if (selectionMode && onSelect) {
            onSelect(prompt.id)
        }
    }

    return (
        <>
            <div
                className={`group relative border bg-card p-4 hover:border-primary/50 ${cardStyleClass} ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    } ${selectionMode ? 'cursor-pointer' : ''}`}
                onClick={handleCardClick}
            >
                {/* Selection Checkbox */}
                {selectionMode && (
                    <div className="absolute -left-2 -top-2 z-10">
                        <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-transparent hover:border-primary/50'
                                }`}
                        >
                            <Check className="h-3.5 w-3.5" />
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium text-foreground">{prompt.title}</h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
                            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${prompt.isFavorite
                                ? 'text-yellow-400'
                                : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-400'
                                }`}
                        >
                            <Star className={`h-4 w-4 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Description or Content Preview */}
                <div className="mb-3 max-h-[4.5rem] overflow-hidden text-sm text-muted-foreground mask-linear-fade">
                    <div className="mb-3 max-h-[4.5rem] overflow-hidden text-sm text-muted-foreground mask-linear-fade">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
                                a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                                    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                        {children}
                                    </a>
                                ),
                                code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
                                    const isInline = !className?.includes('language-') && !String(children).includes('\n')
                                    return (
                                        <code className={`${isInline ? 'rounded bg-muted px-1 py-0.5 font-mono text-xs' : 'block w-full overflow-x-auto rounded bg-muted p-2 font-mono text-xs'}`} {...props}>
                                            {children}
                                        </code>
                                    )
                                },
                                ul: ({ children }: { children?: React.ReactNode }) => <ul className="ml-4 list-disc space-y-0.5">{children}</ul>,
                                ol: ({ children }: { children?: React.ReactNode }) => <ol className="ml-4 list-decimal space-y-0.5">{children}</ol>,
                                blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-2 border-primary/50 pl-2 italic">{children}</blockquote>
                            }}
                        >
                            {prompt.description || displayContent}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Variables */}
                {variables.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                        {variables.map((variable: string, index: number) => (
                            <span
                                key={index}
                                className={`rounded-md px-2 py-0.5 text-xs ${varBadgeClass || 'bg-accent/20 text-accent'}`}
                            >
                                {variable}
                            </span>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {sortedTags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                        {sortedTags.map((tag) => {
                            const colors = getTagColor(tag)
                            return (
                                <span
                                    key={tag}
                                    className="rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
                                    style={{
                                        backgroundColor: colors.bg,
                                        color: theme === 'dark'
                                            ? colors.darkText
                                            : colors.text
                                    }}
                                >
                                    #{tag}
                                </span>
                            )
                        })}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCopy() }}
                        className={`flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground ${btnHoverClass}`}
                    >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
                        className={`flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground ${btnHoverClass}`}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick() }}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Variable Input Modal - uses English content for copying */}
            <VariableInputModal
                isOpen={showVariableModal}
                content={copyContent}
                promptTitle={prompt.title}
                promptId={prompt.id}
                onClose={() => setShowVariableModal(false)}
                onCopy={handleVariableCopy}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Prompt"
                message={`Are you sure you want to delete "${prompt.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    )
}
