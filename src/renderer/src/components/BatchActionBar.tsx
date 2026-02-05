import { useState } from 'react'
import { Trash2, Tag, X, Download, CheckSquare, FolderInput } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import { Folder } from '@shared/types'

interface BatchActionBarProps {
    selectedCount: number
    onDelete: () => void
    onAddTag: (tag: string) => void
    onExport: () => void
    onClearSelection: () => void
    onMoveToFolder?: (folderId: string | null) => void
    folders?: Folder[]
}
import { useTranslation } from 'react-i18next'

/**
 * Floating action bar for batch operations on selected prompts
 */
export function BatchActionBar({
    selectedCount,
    onDelete,
    onAddTag,
    onExport,
    onClearSelection,
    onMoveToFolder,
    folders = []
}: BatchActionBarProps) {
    const { t } = useTranslation()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showTagInput, setShowTagInput] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [showFolderSelect, setShowFolderSelect] = useState(false)

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
                        {t('actions.selectedCount', { count: selectedCount })}
                    </span>
                </div>

                {/* Move to Folder */}
                {onMoveToFolder && (
                    <div className="relative">
                        <button
                            onClick={() => setShowFolderSelect(!showFolderSelect)}
                            className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                        >
                            <FolderInput className="h-4 w-4" />
                            {t('actions.moveTo')}
                        </button>

                        {showFolderSelect && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                                <div className="max-h-60 overflow-y-auto p-1">
                                    <button
                                        onClick={() => {
                                            onMoveToFolder(null)
                                            setShowFolderSelect(false)
                                        }}
                                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                        {t('actions.rootFolder')}
                                    </button>
                                    {folders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => {
                                                onMoveToFolder(folder.id)
                                                setShowFolderSelect(false)
                                            }}
                                            className="w-full truncate rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                        >
                                            {folder.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tag Input / Button */}
                {showTagInput ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder={t('actions.tagNamePlaceholder')}
                            className="w-32 rounded-md border border-border bg-secondary px-2 py-1 text-sm outline-none focus:border-primary"
                            autoFocus
                        />
                        <button
                            onClick={handleAddTag}
                            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                        >
                            {t('actions.add')}
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
                        {t('actions.addTag')}
                    </button>
                )}

                {/* Export */}
                <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                >
                    <Download className="h-4 w-4" />
                    {t('actions.export')}
                </button>

                {/* Delete */}
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                    <Trash2 className="h-4 w-4" />
                    {t('actions.delete')}
                </button>

                {/* Clear Selection */}
                <button
                    onClick={onClearSelection}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title={t('actions.clearSelection')}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title={t('actions.deleteSelectedTitle')}
                message={t('actions.deleteSelectedConfirm', { count: selectedCount })}
                confirmLabel={t('actions.deleteAll')}
                cancelLabel={t('actions.cancel')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    )
}
