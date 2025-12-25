import { Home, Star, Settings, FolderOpen, Plus } from 'lucide-react'

export type ViewType = 'all' | 'favorites' | 'collections'

interface SidebarProps {
    onNewPrompt: () => void
    onOpenSettings: () => void
    activeView: ViewType
    onViewChange: (view: ViewType) => void
}

/**
 * Main navigation sidebar
 */
export function Sidebar({ onNewPrompt, onOpenSettings, activeView, onViewChange }: SidebarProps) {
    return (
        <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
            {/* New Prompt Button */}
            <div className="p-3">
                <button
                    onClick={onNewPrompt}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                >
                    <Plus className="h-4 w-4" />
                    New Prompt
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 px-3 py-2">
                <NavItem
                    icon={<Home className="h-4 w-4" />}
                    label="All Prompts"
                    active={activeView === 'all'}
                    onClick={() => onViewChange('all')}
                />
                <NavItem
                    icon={<Star className="h-4 w-4" />}
                    label="Favorites"
                    active={activeView === 'favorites'}
                    onClick={() => onViewChange('favorites')}
                />
                <NavItem
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="Collections"
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
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}
