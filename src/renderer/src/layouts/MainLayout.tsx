import { ReactNode } from 'react'
import { TitleBar, Sidebar } from '../components'
import { ViewType, SourceFilter } from '../components/Sidebar'
import { Folder } from '@shared/types'

interface MainLayoutProps {
    children: ReactNode

    // Sidebar Props
    onNewPrompt: () => void
    onOpenSettings: () => void
    onImportClick: () => void
    activeView: ViewType
    onViewChange: (view: ViewType) => void
    sourceFilter: SourceFilter
    onSourceFilterChange: (filter: SourceFilter) => void
    folders: Folder[]
    activeFolderId: string | null
    onFolderSelect: (id: string | null) => void
    onCreateFolder: (name: string, parentId: string | null) => void
    onUpdateFolder: (folder: Folder) => void
    onDeleteFolder: (id: string) => void
    tags: string[]
    selectedTag: string | null
    onTagSelect: (tag: string) => void
}

export function MainLayout({
    children,
    ...sidebarProps
}: MainLayoutProps) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            {/* Custom Title Bar */}
            <TitleBar />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar {...sidebarProps} />

                {/* Main Content */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
