import { Home, Star, Settings, FolderOpen, Plus, User, Cpu, ChevronDown, TrendingUp } from 'lucide-react'

export type ViewType = 'all' | 'favorites' | 'collections' | 'mostUsed'
export type SourceFilter = 'all' | 'user' | 'system'

interface SidebarProps {
    onNewPrompt: () => void
    onOpenSettings: () => void
    activeView: ViewType
    onViewChange: (view: ViewType) => void
    sourceFilter: SourceFilter
    onSourceFilterChange: (filter: SourceFilter) => void
}

/**
 * Main navigation sidebar
 */
export function Sidebar({
    onNewPrompt,
    onOpenSettings,
    activeView,
    onViewChange,
    sourceFilter,
    onSourceFilterChange
}: SidebarProps) {
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
