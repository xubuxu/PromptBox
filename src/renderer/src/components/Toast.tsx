import { useEffect, useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

export interface ToastProps {
    message: string
    type?: 'success' | 'error'
    duration?: number
    onClose: () => void
}

/**
 * Lightweight toast notification component
 * Displays at bottom-right corner with auto-dismiss
 */
export function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true)
        }, duration - 300)

        const closeTimer = setTimeout(() => {
            onClose()
        }, duration)

        return () => {
            clearTimeout(exitTimer)
            clearTimeout(closeTimer)
        }
    }, [duration, onClose])

    const Icon = type === 'success' ? Check : AlertCircle
    const bgColor = type === 'success'
        ? 'bg-green-500/20 border-green-500/50'
        : 'bg-red-500/20 border-red-500/50'
    const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400'

    return (
        <div
            className={`glass-panel fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-4 shadow-2xl transition-all duration-500 ${bgColor} ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
            style={{ animation: 'slideInFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span className="text-sm font-medium text-foreground">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
