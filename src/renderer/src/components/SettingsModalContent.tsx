import { useState } from 'react'
import { Download, Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react'

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
            {/* Data Management Section */}
            <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Data Management
                </h3>
                <div className="space-y-3">
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
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
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

/**
 * Displays status messages with appropriate icons
 */
function StatusMessage({ status }: { status: StatusState }) {
    const iconClass = status.type === 'success' ? 'text-green-500' : 'text-red-500'
    const Icon = status.type === 'success' ? CheckCircle2 : XCircle

    return (
        <div className={`flex items-center gap-2 text-sm ${iconClass}`}>
            <Icon className="h-4 w-4" />
            <span>{status.message}</span>
        </div>
    )
}
