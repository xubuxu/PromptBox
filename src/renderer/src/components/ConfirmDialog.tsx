import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Confirmation dialog for destructive actions
 */
export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const { t } = useTranslation()
    const finalConfirmLabel = confirmLabel || t('actions.delete')
    const finalCancelLabel = cancelLabel || t('actions.cancel')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center">
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                        {finalCancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                    >
                        {finalConfirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
