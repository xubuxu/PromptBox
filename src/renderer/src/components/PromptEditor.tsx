import { useState } from 'react'
import { X, Save, FolderOpen } from 'lucide-react'
import { Prompt, Folder } from '@shared/types'
import { useTranslation } from 'react-i18next'

interface PromptEditorProps {
    prompt?: Prompt
    folders?: Folder[]
    onSave: (title: string, content: string, tags: string[], description?: string, folderId?: string | null) => void
    onCancel: () => void
}

/**
 * Editor form for creating/editing prompts
 */
export function PromptEditor({ prompt, folders = [], onSave, onCancel }: PromptEditorProps) {
    const { t } = useTranslation()
    const [title, setTitle] = useState(prompt?.title || '')
    const [description, setDescription] = useState(prompt?.description || '')
    const [content, setContent] = useState(prompt?.content || '')
    const [tagInput, setTagInput] = useState(prompt?.tags.join(', ') || '')
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(prompt?.folderId || null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        const tags = tagInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)

        onSave(title.trim(), content.trim(), tags, description.trim() || undefined, selectedFolderId)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Input */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t('prompt.titleLabel')}
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('prompt.titlePlaceholder')}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                />
            </div>

            {/* Description Input */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t('prompt.descLabel')}
                    <span className="ml-2 text-xs text-muted-foreground">
                        {t('prompt.descPlaceholder')}
                    </span>
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('prompt.descPlaceholder')}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Content Textarea */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t('prompt.contentLabel')}
                    <span className="ml-2 text-xs text-muted-foreground">
                        {t('prompt.contentPlaceholder')}
                    </span>
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('prompt.contentPlaceholder')}
                    rows={6}
                    className="w-full resize-none rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Tags Input */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t('prompt.tagsLabel')}
                    <span className="ml-2 text-xs text-muted-foreground">
                        {t('prompt.tagsPlaceholder')}
                    </span>
                </label>
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder={t('prompt.tagsPlaceholder')}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Folder Selection */}
            {folders.length > 0 && (
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            {t('prompt.folderLabel')}
                        </span>
                        <span className="ml-5.5 text-xs text-muted-foreground">
                            {t('prompt.selectFolder')}
                        </span>
                    </label>
                    <select
                        value={selectedFolderId || ''}
                        onChange={(e) => setSelectedFolderId(e.target.value || null)}
                        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">{t('prompt.noFolder')}</option>
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                    {t('actions.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={!title.trim() || !content.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {t('actions.save')}
                </button>
            </div>
        </form>
    )
}
