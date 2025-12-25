import { useState, useMemo } from 'react'
import { TitleBar, Sidebar, PromptCard, SearchBar, PromptEditor, Modal, SettingsModalContent } from './components'
import { usePrompts } from './hooks/usePrompts'
import { Loader2, Sparkles } from 'lucide-react'

/**
 * Main Application Component
 */
export default function App() {
    const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt, toggleFavorite } =
        usePrompts()
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Filter prompts based on search query
    const filteredPrompts = useMemo(() => {
        if (!searchQuery.trim()) return prompts

        const query = searchQuery.toLowerCase()
        return prompts.filter(
            (prompt) =>
                prompt.title.toLowerCase().includes(query) ||
                prompt.content.toLowerCase().includes(query) ||
                prompt.description?.toLowerCase().includes(query) ||
                prompt.tags.some((tag) => tag.toLowerCase().includes(query))
        )
    }, [prompts, searchQuery])

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
                <Sidebar onNewPrompt={handleNewPrompt} onOpenSettings={() => setIsSettingsOpen(true)} />

                {/* Main Content */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="border-b border-border p-4">
                        <div className="mb-4">
                            <h1 className="text-xl font-semibold text-foreground">All Prompts</h1>
                            <p className="text-sm text-muted-foreground">
                                {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} in your collection
                            </p>
                        </div>
                        <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
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
