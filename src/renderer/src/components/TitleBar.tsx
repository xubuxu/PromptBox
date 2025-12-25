import { Minus, X, Pin, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Custom title bar for frameless window
 */
export function TitleBar() {
    const [isPinned, setIsPinned] = useState(false)
    const { theme, toggleTheme } = useTheme()

    const handleClose = () => {
        window.api.hideWindow()
    }

    const handleMinimize = () => {
        window.api.hideWindow()
    }

    const handleTogglePin = async () => {
        const newState = await window.api.toggleAlwaysOnTop()
        setIsPinned(newState)
    }

    return (
        <div className="titlebar-drag flex h-10 items-center justify-between border-b border-border bg-card px-3">
            {/* App Title */}
            <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-gradient-to-br from-primary to-accent" />
                <span className="text-sm font-semibold text-foreground">PromptBox</span>
            </div>

            {/* Window Controls */}
            <div className="titlebar-no-drag flex items-center gap-1">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Pin Toggle */}
                <button
                    onClick={handleTogglePin}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary ${isPinned ? 'text-accent' : 'text-muted-foreground'
                        }`}
                    title={isPinned ? 'Unpin from top' : 'Pin on top'}
                >
                    <Pin className="h-4 w-4" />
                </button>

                {/* Minimize */}
                <button
                    onClick={handleMinimize}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
                    title="Minimize"
                >
                    <Minus className="h-4 w-4" />
                </button>

                {/* Close */}
                <button
                    onClick={handleClose}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                    title="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
