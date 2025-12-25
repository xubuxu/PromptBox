import { useState, useCallback, useEffect } from 'react'
import { Prompt } from '@shared/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Custom hook for managing prompts via IPC
 */
export function usePrompts() {
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /**
     * Fetch all prompts from the main process
     */
    const fetchPrompts = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await window.api.getPrompts()
            setPrompts(data)
        } catch (err) {
            setError('Failed to load prompts')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Create a new prompt
     */
    const createPrompt = useCallback(
        async (title: string, content: string, tags: string[] = [], description?: string) => {
            const newPrompt: Prompt = {
                id: uuidv4(),
                title,
                description,
                content,
                tags,
                isFavorite: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }

            const success = await window.api.savePrompt(newPrompt)
            if (success) {
                setPrompts((prev) => [...prev, newPrompt])
                return newPrompt
            }
            return null
        },
        []
    )

    /**
     * Update an existing prompt
     */
    const updatePrompt = useCallback(async (prompt: Prompt) => {
        const updatedPrompt = { ...prompt, updatedAt: Date.now() }
        const success = await window.api.savePrompt(updatedPrompt)
        if (success) {
            setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? updatedPrompt : p)))
            return true
        }
        return false
    }, [])

    /**
     * Delete a prompt by ID
     */
    const deletePrompt = useCallback(async (id: string) => {
        const success = await window.api.deletePrompt(id)
        if (success) {
            setPrompts((prev) => prev.filter((p) => p.id !== id))
            return true
        }
        return false
    }, [])

    /**
     * Toggle favorite status
     */
    const toggleFavorite = useCallback(
        async (id: string) => {
            const prompt = prompts.find((p) => p.id === id)
            if (!prompt) return false

            return updatePrompt({ ...prompt, isFavorite: !prompt.isFavorite })
        },
        [prompts, updatePrompt]
    )

    // Fetch prompts on mount
    useEffect(() => {
        fetchPrompts()
    }, [fetchPrompts])

    return {
        prompts,
        isLoading,
        error,
        fetchPrompts,
        createPrompt,
        updatePrompt,
        deletePrompt,
        toggleFavorite
    }
}
