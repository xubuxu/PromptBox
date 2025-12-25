import { useState } from 'react'
import { Trash2, Tag, X, Download, CheckSquare } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'

interface BatchActionBarProps {
    selectedCount: number
    onDelete: () => void
    onAddTag: (tag: string) => void
    onExport: () => void
    onClearSelection: () => void
}

/**
 * Floating action bar for batch operations on selected prompts
 */
export function BatchActionBar({
    selectedCount,
    onDelete,
    onAddTag,
    onExport,
    onClearSelection
}: BatchActionBarProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showTagInput, setShowTagInput] = useState(false)
    const [tagInput, setTagInput] = useState('')

    if (selectedCount === 0) return null

    const handleAddTag = () => {
        if (tagInput.trim()) {
            onAddTag(tagInput.trim())
            setTagInput('')
            setShowTagInput(false)
        }
    }

    const handleDeleteConfirm = () => {
        onDelete()
        setShowDeleteConfirm(false)
    }

    return (
        <>
            {/* Floating Bar */}
            <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-2xl">
                {/* Selection Count */}
                <div className="flex items-center gap-2 border-r border-border pr-4">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                        {selectedCount} selected
                    </span>
                </div>

                {/* Tag Input / Button */}
                {showTagInput ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="Tag name..."
                            className="w-32 rounded-md border border-border bg-secondary px-2 py-1 text-sm outline-none focus:border-primary"
                            autoFocus
                        />
                        <button
                            onClick={handleAddTag}
                            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowTagInput(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowTagInput(true)}
                        className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                    >
                        <Tag className="h-4 w-4" />
                        Add Tag
                    </button>
                )}

                {/* Export */}
                <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                >
                    <Download className="h-4 w-4" />
                    Export
                </button>

                {/* Delete */}
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </button>

                {/* Clear Selection */}
                <button
                    onClick={onClearSelection}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Clear selection"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Selected Prompts"
                message={`Are you sure you want to delete ${selectedCount} prompt${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
                confirmLabel="Delete All"
                cancelLabel="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    )
}
