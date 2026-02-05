import { useState, useCallback, useDeferredValue, forwardRef } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { PromptCard, SearchBar, BatchActionBar, Toast } from '../components'
import { ViewType, SourceFilter } from '../components/Sidebar'
import { useTranslation } from 'react-i18next'
import { Loader2, Sparkles, FolderOpen, ArrowLeft, X, CheckSquare } from 'lucide-react'
import { Folder, Prompt } from '@shared/types'

// Re-using Grid components
const GridList = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(({ style, children, ...props }, ref) => (
    <div
        ref={ref}
        {...props}
        style={style}
        className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 content-start pb-4"
    >
        {children}
    </div>
))

const GridItem = ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div {...props} style={{ ...props.style, padding: 0, margin: 0 }}>
        {children}
    </div>
)


interface HomePageProps {
    activeView: ViewType
    sourceFilter: SourceFilter
    activeFolderId: string | null
    selectedTag: string | null
    onClearTagSelection: () => void

    // Shared Data
    prompts: Prompt[]
    folders: Folder[]
    isLoading: boolean

    // Actions
    createPrompt: (title: string, content: string, tags: string[], description?: string, folderId?: string | null) => Promise<Prompt | null>
    updatePrompt: (prompt: Prompt) => Promise<boolean>
    deletePrompt: (id: string) => Promise<boolean>
    toggleFavorite: (id: string) => Promise<boolean>
    incrementCopyCount: (id: string) => Promise<boolean>
    onNewPrompt: () => void
}

import { useFilteredPrompts } from '../hooks/useFilteredPrompts'

export function HomePage({
    activeView,
    sourceFilter,
    activeFolderId,
    selectedTag,
    onClearTagSelection,
    prompts,
    folders,
    isLoading,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    incrementCopyCount,
    onNewPrompt
}: HomePageProps) {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState('')
    const deferredSearchQuery = useDeferredValue(searchQuery)
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // Filter Logic using custom hook
    const filteredPrompts = useFilteredPrompts({
        prompts,
        deferredSearchQuery,
        activeView,
        selectedTag,
        sourceFilter,
        activeFolderId
    })

    // Selection Handlers
    const handleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set())
        setSelectionMode(false)
    }, [])

    const handleToggleSelectionMode = useCallback(() => {
        if (selectionMode) {
            handleClearSelection()
        } else {
            setSelectionMode(true)
        }
    }, [selectionMode, handleClearSelection])

    // Batch Actions
    const handleBatchDelete = useCallback(async () => {
        for (const id of selectedIds) {
            await deletePrompt(id)
        }
        handleClearSelection()
    }, [selectedIds, deletePrompt, handleClearSelection])

    const handleBatchAddTag = useCallback(async (tag: string) => {
        for (const id of selectedIds) {
            const prompt = prompts.find((p) => p.id === id)
            if (prompt && !prompt.tags.includes(tag)) {
                await updatePrompt({
                    ...prompt,
                    tags: [...prompt.tags, tag]
                })
            }
        }
    }, [selectedIds, prompts, updatePrompt])

    const handleBatchExport = useCallback(() => {
        const selectedPrompts = prompts.filter((p) => selectedIds.has(p.id))
        const exportData = JSON.stringify(selectedPrompts, null, 2)
        const blob = new Blob([exportData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prompts-export-${selectedIds.size}.json`
        a.click()
        URL.revokeObjectURL(url)
    }, [prompts, selectedIds])

    const handleBatchMoveToFolder = useCallback(async (folderId: string | null) => {
        for (const id of selectedIds) {
            const prompt = prompts.find((p) => p.id === id)
            if (prompt) {
                await updatePrompt({
                    ...prompt,
                    folderId
                })
            }
        }
        handleClearSelection()
    }, [selectedIds, prompts, updatePrompt, handleClearSelection])

    const handleUpdatePrompt = useCallback(async (
        id: string,
        title: string,
        content: string,
        tags: string[],
        description?: string,
        folderId?: string | null
    ) => {
        const prompt = prompts.find((p) => p.id === id)
        if (prompt) {
            await updatePrompt({
                ...prompt,
                title,
                description,
                content,
                tags,
                folderId: folderId !== undefined ? folderId : prompt.folderId
            })
        }
    }, [prompts, updatePrompt])

    const renderPromptCard = useCallback((index: number) => {
        const prompt = filteredPrompts[index]
        if (!prompt) return null
        return (
            <PromptCard
                key={prompt.id}
                prompt={prompt}
                folders={folders}
                onToggleFavorite={() => toggleFavorite(prompt.id)}
                onDelete={() => deletePrompt(prompt.id)}
                onUpdate={(title, content, tags, description, folderId) =>
                    handleUpdatePrompt(prompt.id, title, content, tags, description, folderId)
                }
                onCopied={() => incrementCopyCount(prompt.id)}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(prompt.id)}
                onSelect={handleSelect}
            />
        )
    }, [filteredPrompts, folders, toggleFavorite, deletePrompt, handleUpdatePrompt, incrementCopyCount, selectionMode, selectedIds, handleSelect])

    return (
        <>
            <header className="border-b border-border p-4">
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {activeView === 'collections' && selectedTag && (
                                <button
                                    onClick={onClearTagSelection}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                            )}
                            <h1 className="text-xl font-semibold text-foreground">
                                {activeView === 'all' && t('sidebar.allPrompts')}
                                {activeView === 'favorites' && t('sidebar.favorites')}
                                {activeView === 'mostUsed' && t('sidebar.mostUsed')}
                                {activeView === 'collections' && !selectedTag && t('sidebar.collections')}
                                {activeView === 'collections' && selectedTag && `#${selectedTag}`}
                                {activeView === 'folders' && (
                                    <span className="flex items-center gap-2">
                                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                                        {folders.find(f => f.id === activeFolderId)?.name || t('sidebar.folders')}
                                    </span>
                                )}
                            </h1>
                        </div>
                        <button
                            onClick={handleToggleSelectionMode}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer ${selectionMode
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            {selectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                            {selectionMode ? t('actions.cancel') : t('actions.select')}
                        </button>
                    </div>
                </div>
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </header>

            <div className="flex-1 overflow-hidden p-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <EmptyState onNewPrompt={onNewPrompt} hasSearch={!!deferredSearchQuery.trim()} />
                ) : (
                    <VirtuosoGrid
                        style={{ height: '100%' }}
                        totalCount={filteredPrompts.length}
                        components={{ List: GridList, Item: GridItem }}
                        itemContent={renderPromptCard}
                    />
                )}
            </div>

            <BatchActionBar
                selectedCount={selectedIds.size}
                onDelete={handleBatchDelete}
                onAddTag={handleBatchAddTag}
                onExport={handleBatchExport}
                onClearSelection={handleClearSelection}
                onMoveToFolder={handleBatchMoveToFolder}
                folders={folders}
            />

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

// Helper Components
function EmptyState({ onNewPrompt, hasSearch }: { onNewPrompt: () => void; hasSearch: boolean }) {
    const { t } = useTranslation()

    if (hasSearch) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-secondary p-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">{t('views.noResults')}</h3>
                <p className="text-sm text-muted-foreground">{t('views.tryAdjusting')}</p>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-6">
                <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">{t('views.noPrompts')}</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                {t('views.noPromptsDesc')}
            </p>
            <button
                onClick={onNewPrompt}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
                {t('views.createFirst')}
            </button>
        </div>
    )
}
