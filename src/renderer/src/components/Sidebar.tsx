import { Home, Star, Settings, FolderOpen, Plus, User, Cpu, ChevronDown, TrendingUp, Upload, Folder, Trash, Edit2 } from 'lucide-react'
import { Folder as FolderType } from '@shared/types'
import { useState } from 'react'

export type ViewType = 'all' | 'favorites' | 'collections' | 'mostUsed' | 'folders'
export type SourceFilter = 'all' | 'user' | 'system'

interface SidebarProps {
    onNewPrompt: () => void
    onOpenSettings: () => void
    onImportClick: () => void
    activeView: ViewType
    onViewChange: (view: ViewType) => void
    sourceFilter: SourceFilter
    onSourceFilterChange: (filter: SourceFilter) => void
    folders?: FolderType[]
    activeFolderId?: string | null
    onFolderSelect?: (id: string | null) => void
    onCreateFolder?: (name: string, parentId: string | null) => void
    onUpdateFolder?: (folder: FolderType) => void
    onDeleteFolder?: (id: string) => void
}

/**
 * Main navigation sidebar
 */
export function Sidebar({
    onNewPrompt,
    onOpenSettings,
    onImportClick,
    activeView,
    onViewChange,
    sourceFilter,
    onSourceFilterChange,
    folders = [],
    activeFolderId,
    onFolderSelect,
    onCreateFolder,
    onUpdateFolder,
    onDeleteFolder
}: SidebarProps) {
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    const handleCreateFolder = () => {
        if (onCreateFolder) {
            // Simple prompt for now, could be a modal
            const name = prompt('Enter folder name:')
            if (name) {
                onCreateFolder(name, null)
            }
        }
    }

    const handleRenameFolder = (folder: FolderType, e: React.MouseEvent) => {
        e.stopPropagation()
        const newName = prompt('Enter new folder name:', folder.name)
        if (newName && newName !== folder.name && onUpdateFolder) {
            onUpdateFolder({ ...folder, name: newName })
        }
    }

    const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this folder and its contents?')) {
            onDeleteFolder?.(id)
            if (activeFolderId === id) {
                onFolderSelect?.(null)
            }
        }
    }

    return (
        <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
            {/* New Prompt Button */}
            <div className="p-3 space-y-2">
                <button
                    onClick={onNewPrompt}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                >
                    <Plus className="h-4 w-4" />
                    New Prompt
                </button>
                <button
                    onClick={onImportClick}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-accent"
                >
                    <Upload className="h-4 w-4" />
                    Import Prompts
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
                {/* All Prompts with Source Filter */}
                <div>
                    <NavItem
                        icon={<Home className="h-4 w-4" />}
                        label="All Prompts"
                        active={activeView === 'all'}
                        onClick={() => onViewChange('all')}
                        hasSubmenu={activeView === 'all'}
                    />
                    {activeView === 'all' && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                            <SourceFilterItem
                                icon={<Home className="h-3.5 w-3.5" />}
                                label="All Sources"
                                active={sourceFilter === 'all'}
                                onClick={() => onSourceFilterChange('all')}
                            />
                            <SourceFilterItem
                                icon={<User className="h-3.5 w-3.5" />}
                                label="My Prompts"
                                active={sourceFilter === 'user'}
                                onClick={() => onSourceFilterChange('user')}
                            />
                            <SourceFilterItem
                                icon={<Cpu className="h-3.5 w-3.5" />}
                                label="Built-in"
                                active={sourceFilter === 'system'}
                                onClick={() => onSourceFilterChange('system')}
                            />
                        </div>
                    )}
                </div>
                <NavItem
                    icon={<Star className="h-4 w-4" />}
                    label="Favorites"
                    active={activeView === 'favorites'}
                    onClick={() => onViewChange('favorites')}
                />
                <NavItem
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Most Used"
                    active={activeView === 'mostUsed'}
                    onClick={() => onViewChange('mostUsed')}
                />

                {/* Folders Section */}
                <div className="pt-2">
                    <div className="flex items-center justify-between px-3 py-1 text-xs font-semibold text-muted-foreground">
                        <span>Folders</span>
                        <button
                            onClick={handleCreateFolder}
                            className="hover:text-foreground transition-colors"
                            title="New Folder"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="space-y-0.5">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${activeFolderId === folder.id && activeView === 'folders'
                                        ? 'bg-secondary text-foreground'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }`}
                                onClick={() => onFolderSelect?.(folder.id)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Folder className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{folder.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleRenameFolder(folder, e)}
                                        className="p-0.5 hover:text-primary"
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                                        className="p-0.5 hover:text-destructive"
                                    >
                                        <Trash className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <NavItem
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="Collections (Tags)"
                    active={activeView === 'collections'}
                    onClick={() => onViewChange('collections')}
                />
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-border p-3">
                <NavItem icon={<Settings className="h-4 w-4" />} label="Settings" onClick={onOpenSettings} />
            </div>
        </aside>
    )
}

interface NavItemProps {
    icon: React.ReactNode
    label: string
    active?: boolean
    onClick?: () => void
    hasSubmenu?: boolean
}

function NavItem({ icon, label, active, onClick, hasSubmenu }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
        >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {hasSubmenu && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
    )
}

interface SourceFilterItemProps {
    icon: React.ReactNode
    label: string
    active?: boolean
    onClick?: () => void
}

function SourceFilterItem({ icon, label, active, onClick }: SourceFilterItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}
