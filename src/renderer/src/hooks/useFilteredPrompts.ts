import { useMemo } from 'react'
import { Prompt } from '@shared/types'
import { ViewType, SourceFilter } from '../components/Sidebar'

interface UseFilteredPromptsProps {
    prompts: Prompt[]
    deferredSearchQuery: string
    activeView: ViewType
    selectedTag: string | null
    sourceFilter: SourceFilter
    activeFolderId: string | null
}

export function useFilteredPrompts({
    prompts,
    deferredSearchQuery,
    activeView,
    selectedTag,
    sourceFilter,
    activeFolderId
}: UseFilteredPromptsProps) {
    return useMemo(() => {
        let result = prompts

        if (activeView === 'favorites') {
            result = result.filter((p) => p.isFavorite)
        }
        if (activeView === 'mostUsed') {
            result = result
                .filter((p) => (p.copyCount || 0) > 0)
                .sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0))
        }
        if (activeView === 'collections' && selectedTag) {
            result = result.filter((p) => p.tags.includes(selectedTag))
        }
        if (activeView === 'all' && sourceFilter !== 'all') {
            if (sourceFilter === 'user') {
                result = result.filter((p) => !p.id.startsWith('default-'))
            } else if (sourceFilter === 'system') {
                result = result.filter((p) => p.id.startsWith('default-'))
            }
        }
        if (activeView === 'folders' && activeFolderId) {
            result = result.filter((p) => p.folderId === activeFolderId)
        } else if (activeView === 'folders' && !activeFolderId) {
            result = result.filter((p) => p.folderId === activeFolderId)
        }

        if (deferredSearchQuery.trim()) {
            const query = deferredSearchQuery.toLowerCase()
            result = result.filter(
                (prompt) =>
                    (prompt.title && prompt.title.toLowerCase().includes(query)) ||
                    (prompt.content && prompt.content.toLowerCase().includes(query)) ||
                    (prompt.description && prompt.description.toLowerCase().includes(query)) ||
                    (prompt.tags && prompt.tags.some((tag) => tag.toLowerCase().includes(query)))
            )
        }

        return result
    }, [prompts, deferredSearchQuery, activeView, selectedTag, sourceFilter, activeFolderId])
}
