import { useState, useMemo } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { CollectionsPage } from './pages/CollectionsPage'
import { ViewType, SourceFilter } from './components/Sidebar'
import { usePrompts } from './hooks/usePrompts'
import { useFolders } from './hooks/useFolders'

/**
 * Main Application Component
 * 
 * Refactored to separate concerns:
 * - App.tsx: State container & Router (Manual/State-based routing for now)
 * - MainLayout: UI Shell (Sidebar, TitleBar)
 * - HomePage: Prompts Grid & Actions
 * - CollectionsPage: Tags Grid
 */
export default function App() {
    // Data Hooks
    const {
        prompts,
        isLoading,
        fetchPrompts,
        createPrompt,
        updatePrompt,
        deletePrompt,
        toggleFavorite,
        incrementCopyCount
    } = usePrompts()

    const {
        folders,
        createFolder,
        updateFolder,
        deleteFolder
    } = useFolders()

    // Global UI State
    const [activeView, setActiveView] = useState<ViewType>('favorites')
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    // Derived State: Tag Collections
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

    // Navigation Handlers
    const handleViewChange = (view: ViewType) => {
        setActiveView(view)
        if (view !== 'collections') {
            setSelectedTag(null)
        }
        if (view !== 'folders') {
            setActiveFolderId(null)
        }
    }

    const handleTagSelect = (tag: string) => {
        setActiveView('collections')
        setSelectedTag(tag)
    }

    const handleFolderSelect = (id: string | null) => {
        setActiveView('folders')
        setActiveFolderId(id)
    }

    // Handlers passed to Layout/Pages
    const [isNewPromptModalOpen, setIsNewPromptModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

    // Render View Logic
    const renderContent = () => {
        // If we are in Collections view AND no tag is selected, show Collections Grid
        if (activeView === 'collections' && !selectedTag) {
            return (
                <CollectionsPage
                    tagCollections={tagCollections}
                    onTagSelect={handleTagSelect}
                />
            )
        }

        // Otherwise (All, Favorites, MostUsed, Folders, or Collections+SelectedTag) show Prompt Grid (HomePage)
        return (
            <HomePage
                activeView={activeView}
                sourceFilter={sourceFilter}
                activeFolderId={activeFolderId}
                selectedTag={selectedTag}
                onClearTagSelection={() => setSelectedTag(null)}
                prompts={prompts}
                folders={folders}
                isLoading={isLoading}
                createPrompt={createPrompt}
                updatePrompt={updatePrompt}
                deletePrompt={deletePrompt}
                toggleFavorite={toggleFavorite}
                incrementCopyCount={incrementCopyCount}
                onNewPrompt={() => setIsNewPromptModalOpen(true)}
            />
        )
    }

    return (
        <MainLayout
            onNewPrompt={() => setIsNewPromptModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onImportClick={async () => {
                try {
                    const result = await window.api.importData()
                    if (result.includes('successfully')) {
                        await fetchPrompts()
                    }
                } catch (error) {
                    console.error(error)
                }
            }}
            activeView={activeView}
            onViewChange={handleViewChange}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            folders={folders}
            activeFolderId={activeFolderId}
            onFolderSelect={handleFolderSelect}
            onCreateFolder={createFolder}
            onUpdateFolder={updateFolder}
            onDeleteFolder={deleteFolder}
            tags={tagCollections.map(t => t.tag)}
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
        >
            {renderContent()}

            <GlobalModals
                isNewPromptOpen={isNewPromptModalOpen}
                setNewPromptOpen={setIsNewPromptModalOpen}
                isSettingsOpen={isSettingsModalOpen}
                setSettingsOpen={setIsSettingsModalOpen}
                folders={folders}
                onCreatePrompt={async (title, content, tags, desc, folderId) => {
                    await createPrompt(title, content, tags, desc, folderId)
                    setIsNewPromptModalOpen(false)
                }}
            />
        </MainLayout>
    )
}

import { Modal, PromptEditor, SettingsModalContent } from './components'

interface GlobalModalsProps {
    isNewPromptOpen: boolean
    setNewPromptOpen: (open: boolean) => void
    isSettingsOpen: boolean
    setSettingsOpen: (open: boolean) => void
    folders: import('@shared/types').Folder[]
    onCreatePrompt: (title: string, content: string, tags: string[], description?: string, folderId?: string | null) => Promise<void>
}

function GlobalModals({
    isNewPromptOpen, setNewPromptOpen,
    isSettingsOpen, setSettingsOpen,
    folders, onCreatePrompt
}: GlobalModalsProps) {
    return (
        <>
            <Modal isOpen={isNewPromptOpen} onClose={() => setNewPromptOpen(false)} title="New Prompt">
                <PromptEditor folders={folders} onSave={onCreatePrompt} onCancel={() => setNewPromptOpen(false)} />
            </Modal>

            <Modal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
                <SettingsModalContent onImportSuccess={() => window.location.reload()} />
            </Modal>
        </>
    )
}
