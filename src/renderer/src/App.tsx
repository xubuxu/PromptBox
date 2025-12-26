import { useState, useMemo, useCallback, useDeferredValue, forwardRef } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { TitleBar, Sidebar, PromptCard, SearchBar, PromptEditor, Modal, SettingsModalContent, BatchActionBar, Toast } from './components'
import { ViewType, SourceFilter } from './components/Sidebar'
import { usePrompts } from './hooks/usePrompts'
import { useFolders } from './hooks/useFolders'
import { useTheme } from './contexts/ThemeContext'
import { Loader2, Sparkles, Tag, ArrowLeft, CheckSquare, X, FolderOpen } from 'lucide-react'

// Define VirtuosoGrid components outside App to prevent re-renders
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

/**
 * Main Application Component
 */
export default function App() {
    const { prompts, isLoading, fetchPrompts, createPrompt, updatePrompt, deletePrompt, toggleFavorite, incrementCopyCount } =
        usePrompts()
    const { folders, createFolder, updateFolder, deleteFolder } = useFolders()
    const [searchQuery, setSearchQuery] = useState('')
    // Defer the search query to avoid blocking UI during typing
    const deferredSearchQuery = useDeferredValue(searchQuery)
    const [activeView, setActiveView] = useState<ViewType>('favorites')
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const { uiStyle } = useTheme()

    // Selection mode state
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Dynamic style classes based on UI style
    const cardStyleClass = uiStyle === 'gradient' ? 'card-gradient' : 'card-elevated'

    // Get all unique tags with their prompt counts
    const tagCollections = useMemo(() => {
        const tagMap = new Map<string, number>()
        prompts.forEach((prompt) => {
            prompt.tags.forEach((tag) => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
            })
        })
        return Array.from(tagMap.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
    }, [prompts])

    // Handle view change - reset selectedTag when leaving collections
    const handleViewChange = (view: ViewType) => {
        setActiveView(view)
        if (view !== 'collections') {
            setSelectedTag(null)
        }
        if (view !== 'folders') {
            setActiveFolderId(null)
        }
    }

    // Filter prompts based on search query and active view
    const filteredPrompts = useMemo(() => {
        let result = prompts

        // Filter by view type
        if (activeView === 'favorites') {
            result = result.filter((p) => p.isFavorite)
        }
        // Most Used view - filter to only prompts with copies and sort by copyCount
        if (activeView === 'mostUsed') {
            result = result
                .filter((p) => (p.copyCount || 0) > 0)
                .sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0))
        }
        // Filter by selected tag in collections view
        if (activeView === 'collections' && selectedTag) {
            result = result.filter((p) => p.tags.includes(selectedTag))
        }
        // Filter by source
        if (activeView === 'all' && sourceFilter !== 'all') {
            if (sourceFilter === 'user') {
                result = result.filter((p) => !p.id.startsWith('default-'))
            } else if (sourceFilter === 'system') {
                result = result.filter((p) => p.id.startsWith('default-'))
            }
        }

        // Filter by folder
        if (activeView === 'folders' && activeFolderId) {
            result = result.filter((p) => p.folderId === activeFolderId)
        } else if (activeView === 'folders' && !activeFolderId) {
            // Show nothing or root prompts when just clicking "Folders" without selection
            result = result.filter((p) => p.folderId === activeFolderId)
        }

        // Filter by search query (using deferred value)
        if (deferredSearchQuery.trim()) {
            const query = deferredSearchQuery.toLowerCase()
            result = result.filter(
                (prompt) =>
                    prompt.title.toLowerCase().includes(query) ||
                    prompt.content.toLowerCase().includes(query) ||
                    prompt.description?.toLowerCase().includes(query) ||
                    prompt.tags.some((tag) => tag.toLowerCase().includes(query))
            )
        }

        return result
    }, [prompts, deferredSearchQuery, activeView, selectedTag, sourceFilter, activeFolderId])

    // Selection handlers
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

    // Batch action handlers
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

    const handleNewPrompt = () => {
        setIsModalOpen(true)
    }

    const handleCreatePrompt = async (title: string, content: string, tags: string[], description?: string, folderId?: string | null) => {
        await createPrompt(title, content, tags, description, folderId)
        setIsModalOpen(false)
    }

    // Memoized update handler for PromptCard
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

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
    }, [])

    /**
     * Handle import from sidebar - calls IPC import and refreshes list
     */
    const handleImport = async () => {
        try {
            const result = await window.api.importData()
            if (result.includes('successfully')) {
                fetchPrompts()
                showToast(result, 'success')
            } else if (result !== 'Import cancelled') {
                showToast(result, 'error')
            }
        } catch (error) {
            console.error('Import failed:', error)
            showToast('Import failed', 'error')
        }
    }

    // Render item for Virtuoso
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
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            {/* Custom Title Bar */}
            <TitleBar />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    onNewPrompt={handleNewPrompt}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onImportClick={handleImport}
                    activeView={activeView}
                    onViewChange={handleViewChange}
                    sourceFilter={sourceFilter}
                    onSourceFilterChange={setSourceFilter}
                    folders={folders}
                    activeFolderId={activeFolderId}
                    onFolderSelect={(id) => {
                        setActiveView('folders')
                        setActiveFolderId(id)
                    }}
                    onCreateFolder={createFolder}
                    onUpdateFolder={updateFolder}
                    onDeleteFolder={deleteFolder}
                    tags={tagCollections.map(t => t.tag)}
                    selectedTag={selectedTag}
                    onTagSelect={(tag) => {
                        setActiveView('collections')
                        setSelectedTag(tag)
                    }}
                />

                {/* Main Content */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="border-b border-border p-4">
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {activeView === 'collections' && selectedTag && (
                                        <button
                                            onClick={() => setSelectedTag(null)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </button>
                                    )}
                                    <h1 className="text-xl font-semibold text-foreground">
                                        {activeView === 'all' && 'All Prompts'}
                                        {activeView === 'favorites' && 'Favorites'}
                                        {activeView === 'mostUsed' && 'Most Used'}
                                        {activeView === 'collections' && !selectedTag && 'Collections'}
                                        {activeView === 'collections' && selectedTag && `#${selectedTag}`}
                                        {activeView === 'folders' && (
                                            <span className="flex items-center gap-2">
                                                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                                                {folders.find(f => f.id === activeFolderId)?.name || 'Folders'}
                                            </span>
                                        )}
                                    </h1>
                                </div>
                                {/* Selection Mode Toggle */}
                                <button
                                    onClick={handleToggleSelectionMode}
                                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer ${selectionMode
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        }`}
                                >
                                    {selectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                                    {selectionMode ? 'Cancel' : 'Select'}
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {activeView === 'collections' && !selectedTag
                                    ? `${tagCollections.length} tag${tagCollections.length !== 1 ? 's' : ''}`
                                    : `${filteredPrompts.length} prompt${filteredPrompts.length !== 1 ? 's' : ''}`}
                                {activeView === 'favorites' && ' marked as favorite'}
                                {activeView === 'all' && ' in your collection'}
                                {activeView === 'mostUsed' && ' sorted by usage'}
                                {activeView === 'collections' && selectedTag && ` with #${selectedTag}`}
                            </p>
                        </div>
                        {(activeView !== 'collections' || selectedTag) && (
                            <SearchBar value={searchQuery} onChange={setSearchQuery} />
                        )}
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden p-4">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : activeView === 'collections' && !selectedTag ? (
                            // Tag Collections Grid
                            tagCollections.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <div className="mb-4 rounded-full bg-secondary p-4">
                                        <Tag className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-medium text-foreground">No tags yet</h3>
                                    <p className="text-sm text-muted-foreground">Add tags to your prompts to organize them into collections</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {tagCollections.map(({ tag, count }) => (
                                        <button
                                            key={tag}
                                            onClick={() => setSelectedTag(tag)}
                                            className={`group flex items-center gap-3 border border-border bg-card p-4 text-left hover:border-primary/50 ${cardStyleClass}`}
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                                                <Tag className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground truncate">#{tag}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {count} prompt{count !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : filteredPrompts.length === 0 ? (
                            <EmptyState onNewPrompt={handleNewPrompt} hasSearch={!!deferredSearchQuery.trim()} />
                        ) : (
                            <VirtuosoGrid
                                style={{ height: '100%' }}
                                totalCount={filteredPrompts.length}
                                components={{
                                    List: GridList,
                                    Item: GridItem
                                }}
                                itemContent={renderPromptCard}
                            />
                        )}
                    </div>
                </main>
            </div>

            {/* Batch Action Bar */}
            <BatchActionBar
                selectedCount={selectedIds.size}
                onDelete={handleBatchDelete}
                onAddTag={handleBatchAddTag}
                onExport={handleBatchExport}
                onClearSelection={handleClearSelection}
                onMoveToFolder={handleBatchMoveToFolder}
                folders={folders}
            />

            {/* New Prompt Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Prompt">
                <PromptEditor folders={folders} onSave={handleCreatePrompt} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {/* Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
                <SettingsModalContent onImportSuccess={() => window.location.reload()} />
            </Modal>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}

interface EmptyStateProps {
    onNewPrompt: () => void
    hasSearch: boolean
}

function EmptyState({ onNewPrompt, hasSearch }: EmptyStateProps) {
    if (hasSearch) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-secondary p-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">No results found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-6">
                <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">No prompts yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Start building your prompt collection. Create reusable prompts with variables for AI
                tools.
            </p>
            <button
                onClick={onNewPrompt}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
                Create your first prompt
            </button>
        </div>
    )
}
