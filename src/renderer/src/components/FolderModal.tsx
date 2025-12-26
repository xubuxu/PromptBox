
import { useState, useEffect } from 'react'
import { Modal } from './Modal'

interface FolderModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (name: string) => void
    initialName?: string
    title: string
    confirmLabel?: string
}

export function FolderModal({
    isOpen,
    onClose,
    onConfirm,
    initialName = '',
    title,
    confirmLabel = 'Save'
}: FolderModalProps) {
    const [name, setName] = useState(initialName)

    useEffect(() => {
        if (isOpen) {
            setName(initialName)
        }
    }, [isOpen, initialName])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onConfirm(name.trim())
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Folder Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter folder name..."
                        className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
