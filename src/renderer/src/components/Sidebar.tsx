import { Home, Star, Settings, FolderOpen, Plus, User, Cpu, ChevronDown, TrendingUp, Upload, Folder, Trash, Edit2 } from 'lucide-react'
import { Folder as FolderType } from '@shared/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderModal } from './FolderModal'
import { ConfirmDialog } from './ConfirmDialog'

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
    tags?: string[]
    selectedTag?: string | null
    onTagSelect?: (tag: string) => void
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
    onDeleteFolder,
    tags = [],
    selectedTag,
    onTagSelect
}: SidebarProps) {
    const { t } = useTranslation()
    const [folderModalOpen, setFolderModalOpen] = useState(false)
    const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename'>('create')
    const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const handleCreateFolder = () => {
        setFolderModalMode('create')
        setSelectedFolder(null)
        setFolderModalOpen(true)
    }

    const handleRenameFolder = (folder: FolderType, e: React.MouseEvent) => {
        e.stopPropagation()
        setFolderModalMode('rename')
        setSelectedFolder(folder)
        setFolderModalOpen(true)
    }

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteConfirmId(id)
    }

    const handleFolderConfirm = (name: string) => {
        if (folderModalMode === 'create' && onCreateFolder) {
            onCreateFolder(name, null)
        } else if (folderModalMode === 'rename' && selectedFolder && onUpdateFolder) {
            onUpdateFolder({ ...selectedFolder, name })
        }
    }

    const handleDeleteConfirm = () => {
        if (deleteConfirmId) {
            onDeleteFolder?.(deleteConfirmId)
            if (activeFolderId === deleteConfirmId) {
                onFolderSelect?.(null)
            }
            setDeleteConfirmId(null)
        }
    }

    return (
        <aside className="sidebar-gradient flex h-full w-56 flex-col border-r border-border/50">
            {/* New Prompt Button */}
            <div className="p-3 space-y-2">
                <button
                    onClick={onNewPrompt}
                    className="btn-click-effect flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md hover:ring-2 hover:ring-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    {t('app.newPrompt')}
                </button>
                <button
                    onClick={onImportClick}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-accent"
                >
                    <Upload className="h-4 w-4" />
                    {t('app.importData')}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
                {/* All Prompts with Source Filter */}
                <div>
                    <NavItem
                        icon={<Home className="h-4 w-4" />}
                        label={t('sidebar.allPrompts')}
                        active={activeView === 'all'}
                        onClick={() => onViewChange('all')}
                        hasSubmenu={activeView === 'all'}
                    />
                    {activeView === 'all' && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                            <SourceFilterItem
                                icon={<Home className="h-3.5 w-3.5" />}
                                label={t('sidebar.allSources')}
                                active={sourceFilter === 'all'}
                                onClick={() => onSourceFilterChange('all')}
                            />
                            <SourceFilterItem
                                icon={<User className="h-3.5 w-3.5" />}
                                label={t('sidebar.myPrompts')}
                                active={sourceFilter === 'user'}
                                onClick={() => onSourceFilterChange('user')}
                            />
                            <SourceFilterItem
                                icon={<Cpu className="h-3.5 w-3.5" />}
                                label={t('sidebar.builtIn')}
                                active={sourceFilter === 'system'}
                                onClick={() => onSourceFilterChange('system')}
                            />
                        </div>
                    )}
                </div>
                <NavItem
                    icon={<Star className="h-4 w-4" />}
                    label={t('sidebar.favorites')}
                    active={activeView === 'favorites'}
                    onClick={() => onViewChange('favorites')}
                />
                <NavItem
                    icon={<TrendingUp className="h-4 w-4" />}
                    label={t('sidebar.mostUsed')}
                    active={activeView === 'mostUsed'}
                    onClick={() => onViewChange('mostUsed')}
                />

                {/* Folders Section */}
                <div className="pt-2">
                    <div className="flex items-center justify-between px-3 py-1 text-xs font-semibold text-muted-foreground">
                        <span>{t('sidebar.folders')}</span>
                        <button
                            onClick={handleCreateFolder}
                            className="hover:text-foreground transition-colors"
                            title={t('sidebar.newFolder')}
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
                                        title={t('sidebar.rename')}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(folder.id, e)}
                                        className="p-0.5 hover:text-destructive"
                                        title={t('sidebar.delete')}
                                    >
                                        <Trash className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <NavItem
                        icon={<FolderOpen className="h-4 w-4" />}
                        label={t('sidebar.collections')}
                        active={activeView === 'collections' && !selectedTag}
                        onClick={() => onViewChange('collections')}
                        hasSubmenu={activeView === 'collections'}
                    />
                    {activeView === 'collections' && tags.length > 0 && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                            {tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => onTagSelect?.(tag)}
                                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${selectedTag === tag
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                        }`}
                                >
                                    <span className="truncate">#{tag}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-border p-3">
                <NavItem icon={<Settings className="h-4 w-4" />} label={t('app.settings')} onClick={onOpenSettings} />
            </div>

            {/* Modals */}
            <FolderModal
                isOpen={folderModalOpen}
                onClose={() => setFolderModalOpen(false)}
                onConfirm={handleFolderConfirm}
                title={folderModalMode === 'create' ? t('sidebar.newFolder') : t('sidebar.rename')}
                initialName={folderModalMode === 'rename' ? selectedFolder?.name : ''}
                confirmLabel={folderModalMode === 'create' ? t('actions.create') : t('actions.save')}
            />

            <ConfirmDialog
                isOpen={!!deleteConfirmId}
                title={t('sidebar.delete')}
                message={t('sidebar.confirmDeleteFolder')}
                confirmLabel={t('actions.delete')}
                cancelLabel={t('actions.cancel')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirmId(null)}
            />
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
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors btn-click-effect ${active
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
        >
            {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <span className={`transition-colors ${active ? 'text-primary' : ''}`}>{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {hasSubmenu && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-y-0.5" />}
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
