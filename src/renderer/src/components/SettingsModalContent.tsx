import { useState, useEffect } from 'react'
import { Download, Upload, Loader2, CheckCircle2, XCircle, Palette, Sparkles, Power, Database } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface SettingsModalContentProps {
    onImportSuccess: () => void
}

type StatusType = 'idle' | 'loading' | 'success' | 'error'

interface StatusState {
    type: StatusType
    message: string
}

/**
 * Settings modal content with import/export functionality
 */
export function SettingsModalContent({ onImportSuccess }: SettingsModalContentProps) {
    const [exportStatus, setExportStatus] = useState<StatusState>({ type: 'idle', message: '' })
    const [importStatus, setImportStatus] = useState<StatusState>({ type: 'idle', message: '' })
    const [autoLaunch, setAutoLaunch] = useState(false)
    const [autoLaunchLoading, setAutoLaunchLoading] = useState(true)
    const { uiStyle, setUiStyle } = useTheme()

    // Load auto-launch setting on mount
    useEffect(() => {
        window.api.getAutoLaunch().then((enabled) => {
            setAutoLaunch(enabled)
            setAutoLaunchLoading(false)
        })
    }, [])

    /**
     * Toggle auto-launch setting
     */
    const handleAutoLaunchToggle = async () => {
        setAutoLaunchLoading(true)
        const newValue = !autoLaunch
        const success = await window.api.setAutoLaunch(newValue)
        if (success) {
            setAutoLaunch(newValue)
        }
        setAutoLaunchLoading(false)
    }

    /**
     * Handles exporting all prompts to a JSON file
     */
    const handleExport = async () => {
        setExportStatus({ type: 'loading', message: 'Exporting...' })
        try {
            const result = await window.api.exportData()
            if (result.includes('successfully')) {
                setExportStatus({ type: 'success', message: result })
            } else {
                setExportStatus({ type: 'error', message: result })
            }
        } catch (error) {
            setExportStatus({ type: 'error', message: `Export failed: ${(error as Error).message}` })
        }

        // Clear status after 3 seconds
        setTimeout(() => setExportStatus({ type: 'idle', message: '' }), 3000)
    }

    /**
     * Handles importing prompts from a JSON file
     */
    const handleImport = async () => {
        setImportStatus({ type: 'loading', message: 'Importing...' })
        try {
            const result = await window.api.importData()
            if (result.includes('successfully')) {
                setImportStatus({ type: 'success', message: result })
                onImportSuccess() // Refresh prompts list
            } else {
                setImportStatus({ type: 'error', message: result })
            }
        } catch (error) {
            setImportStatus({ type: 'error', message: `Import failed: ${(error as Error).message}` })
        }

        // Clear status after 3 seconds
        setTimeout(() => setImportStatus({ type: 'idle', message: '' }), 3000)
    }

    return (
        <div className="space-y-6">
            {/* Startup Section */}
            <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Startup
                </h3>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                            <Power className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Launch at startup</p>
                            <p className="text-sm text-muted-foreground">
                                Start PromptBox when you log in
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAutoLaunchToggle}
                        disabled={autoLaunchLoading}
                        className={`relative h-6 w-11 rounded-full transition-colors ${autoLaunch ? 'bg-primary' : 'bg-secondary'
                            } ${autoLaunchLoading ? 'opacity-50' : ''}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${autoLaunch ? 'translate-x-5' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Appearance Section */}
            <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Appearance
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {/* Elevated Cards Option */}
                    <button
                        onClick={() => setUiStyle('elevated')}
                        className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${uiStyle === 'elevated'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/50'
                            }`}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary shadow-lg">
                            <Palette className="h-6 w-6 text-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-foreground">Elevated Cards</p>
                            <p className="text-xs text-muted-foreground">Clean shadows & lift effects</p>
                        </div>
                        {uiStyle === 'elevated' && (
                            <div className="absolute right-2 top-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                        )}
                    </button>

                    {/* Gradient Accent Option */}
                    <button
                        onClick={() => setUiStyle('gradient')}
                        className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${uiStyle === 'gradient'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/50'
                            }`}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-foreground">Gradient Accent</p>
                            <p className="text-xs text-muted-foreground">Colorful borders & glows</p>
                        </div>
                        {uiStyle === 'gradient' && (
                            <div className="absolute right-2 top-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Data Management Section */}
            <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Data Management
                </h3>
                <div className="space-y-3">
                    {/* Database Location */}
                    <DatabaseLocationSettings />

                    {/* Export Button */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                        <div>
                            <p className="font-medium text-foreground">Export Prompts</p>
                            <p className="text-sm text-muted-foreground">
                                Save all prompts to a JSON backup file
                            </p>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={exportStatus.type === 'loading'}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
                        >
                            {exportStatus.type === 'loading' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Export
                        </button>
                    </div>
                    {exportStatus.message && (
                        <StatusMessage status={exportStatus} />
                    )}

                    {/* Import Button */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                        <div>
                            <p className="font-medium text-foreground">Import Prompts</p>
                            <p className="text-sm text-muted-foreground">
                                Load prompts from a JSON backup file
                            </p>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={importStatus.type === 'loading'}
                            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                        >
                            {importStatus.type === 'loading' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            Import
                        </button>
                    </div>
                    {importStatus.message && (
                        <StatusMessage status={importStatus} />
                    )}
                </div>
            </div>

            {/* Info Note */}
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> When importing, prompts with the same ID will be updated.
                    New prompts will be added to your collection.
                </p>
            </div>
        </div>
    )
}

// ... (imports)
// ... (existing components)

function DatabaseLocationSettings() {
    const [dbPath, setDbPath] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<StatusState>({ type: 'idle', message: '' })

    useEffect(() => {
        window.api.getDbPath().then(setDbPath)
    }, [])

    const handleMoveDb = async () => {
        setLoading(true)
        setStatus({ type: 'loading', message: 'Moving database...' })
        try {
            const result = await window.api.moveDb()
            if (result.success) {
                setStatus({ type: 'success', message: result.message })
                const newPath = await window.api.getDbPath()
                setDbPath(newPath)
            } else {
                if (result.message === 'Selection cancelled') {
                    setStatus({ type: 'idle', message: '' })
                } else {
                    setStatus({ type: 'error', message: result.message })
                }
            }
        } catch (error) {
            setStatus({ type: 'error', message: `Error: ${(error as Error).message}` })
        }
        setLoading(false)

        // Clear success message
        if (status.type === 'success') {
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000)
        }
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Database className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">Storage Location</p>
                        <p className="text-sm text-muted-foreground break-all max-w-[200px] sm:max-w-xs truncate" title={dbPath}>
                            {dbPath || 'Loading...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleMoveDb}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Change'}
                </button>
            </div>
            {status.message && (
                <div className="mt-2 text-xs">
                    <StatusMessage status={status} />
                </div>
            )}
        </div>
    )
}

/**
 * Displays status messages with appropriate icons
 */
function StatusMessage({ status }: { status: StatusState }) {
    const iconClass = status.type === 'success' ? 'text-green-500' : 'text-red-500'
    const Icon = status.type === 'success' ? CheckCircle2 : (status.type === 'loading' ? Loader2 : XCircle)
    const spinClass = status.type === 'loading' ? 'animate-spin' : ''

    return (
        <div className={`flex items-center gap-2 text-sm ${iconClass}`}>
            <Icon className={`h-4 w-4 ${spinClass}`} />
            <span>{status.message}</span>
        </div>
    )
}
