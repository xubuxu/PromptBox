import { useState, useCallback, useEffect } from 'react'
import { Folder } from '@shared/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Custom hook for managing folders via IPC
 */
export function useFolders() {
    const [folders, setFolders] = useState<Folder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /**
     * Fetch all folders from the main process
     */
    const fetchFolders = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await window.api.getFolders()
            setFolders(data)
        } catch (err) {
            setError('Failed to load folders')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Create a new folder
     */
    const createFolder = useCallback(
        async (name: string, parentId: string | null = null) => {
            const newFolder: Folder = {
                id: uuidv4(),
                name,
                parentId,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }

            const success = await window.api.createFolder(newFolder)
            if (success) {
                setFolders((prev) => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)))
                return newFolder
            }
            return null
        },
        []
    )

    /**
     * Update an existing folder
     */
    const updateFolder = useCallback(async (folder: Folder) => {
        const updatedFolder = { ...folder, updatedAt: Date.now() }
        const success = await window.api.updateFolder(updatedFolder)
        if (success) {
            setFolders((prev) =>
                prev.map((f) => (f.id === folder.id ? updatedFolder : f))
                    .sort((a, b) => a.name.localeCompare(b.name))
            )
            return true
        }
        return false
    }, [])

    /**
     * Delete a folder by ID
     */
    const deleteFolder = useCallback(async (id: string) => {
        const success = await window.api.deleteFolder(id)
        if (success) {
            setFolders((prev) => prev.filter((f) => f.id !== id))
            return true
        }
        return false
    }, [])

    // Fetch folders on mount
    useEffect(() => {
        fetchFolders()
    }, [fetchFolders])

    return {
        folders,
        isLoading,
        error,
        fetchFolders,
        createFolder,
        updateFolder,
        deleteFolder
    }
}
