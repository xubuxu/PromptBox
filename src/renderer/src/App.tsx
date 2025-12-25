import { useState, useMemo } from 'react'
import { TitleBar, Sidebar, PromptCard, SearchBar, PromptEditor, Modal, SettingsModalContent } from './components'
import { ViewType } from './components/Sidebar'
import { usePrompts } from './hooks/usePrompts'
import { Loader2, Sparkles, Tag, ArrowLeft } from 'lucide-react'

/**
 * Main Application Component
 */
export default function App() {
    const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt, toggleFavorite } =
        usePrompts()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeView, setActiveView] = useState<ViewType>('all')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
    }

    // Filter prompts based on search query and active view
    const filteredPrompts = useMemo(() => {
        let result = prompts

        // Filter by view type
        if (activeView === 'favorites') {
            result = result.filter((p) => p.isFavorite)
        }
        // Filter by selected tag in collections view
        if (activeView === 'collections' && selectedTag) {
            result = result.filter((p) => p.tags.includes(selectedTag))
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (prompt) =>
                    prompt.title.toLowerCase().includes(query) ||
                    prompt.content.toLowerCase().includes(query) ||
                    prompt.description?.toLowerCase().includes(query) ||
                    prompt.tags.some((tag) => tag.toLowerCase().includes(query))
            )
        }

        return result
    }, [prompts, searchQuery, activeView, selectedTag])

    const handleNewPrompt = () => {
        setIsModalOpen(true)
    }

    const handleCreatePrompt = async (title: string, content: string, tags: string[], description?: string) => {
        await createPrompt(title, content, tags, description)
        setIsModalOpen(false)
    }

    const handleUpdatePrompt = async (
        id: string,
        title: string,
        content: string,
        tags: string[],
        description?: string
    ) => {
        const prompt = prompts.find((p) => p.id === id)
        if (prompt) {
            await updatePrompt({
                ...prompt,
                title,
                description,
                content,
                tags
            })
        }
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            {/* Custom Title Bar */}
            <TitleBar />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    onNewPrompt={handleNewPrompt}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    activeView={activeView}
                    onViewChange={handleViewChange}
                />

                {/* Main Content */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="border-b border-border p-4">
                        <div className="mb-4">
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
                                    {activeView === 'collections' && !selectedTag && 'Collections'}
                                    {activeView === 'collections' && selectedTag && `#${selectedTag}`}
                                </h1>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {activeView === 'collections' && !selectedTag
                                    ? `${tagCollections.length} tag${tagCollections.length !== 1 ? 's' : ''}`
                                    : `${filteredPrompts.length} prompt${filteredPrompts.length !== 1 ? 's' : ''}`}
                                {activeView === 'favorites' && ' marked as favorite'}
                                {activeView === 'all' && ' in your collection'}
                                {activeView === 'collections' && selectedTag && ` with #${selectedTag}`}
                            </p>
                        </div>
                        {(activeView !== 'collections' || selectedTag) && (
                            <SearchBar value={searchQuery} onChange={setSearchQuery} />
                        )}
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4">
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
                                            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
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
                            <EmptyState onNewPrompt={handleNewPrompt} hasSearch={!!searchQuery.trim()} />
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {filteredPrompts.map((prompt) => (
                                    <PromptCard
                                        key={prompt.id}
                                        prompt={prompt}
                                        onToggleFavorite={() => toggleFavorite(prompt.id)}
                                        onDelete={() => deletePrompt(prompt.id)}
                                        onUpdate={(title, content, tags, description) =>
                                            handleUpdatePrompt(prompt.id, title, content, tags, description)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* New Prompt Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Prompt">
                <PromptEditor onSave={handleCreatePrompt} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {/* Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
                <SettingsModalContent onImportSuccess={() => window.location.reload()} />
            </Modal>
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
                className="rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
                Create your first prompt
            </button>
        </div>
    )
}
