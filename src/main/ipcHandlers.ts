import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS, Prompt } from '@shared/types'
import {
    getPromptsFromDisk,
    savePromptsToDisk,
    exportPromptsToFile,
    importPromptsFromFile
} from './store'

/**
 * Register all IPC handlers for the main process
 */
export function registerIpcHandlers(): void {
    // Get all prompts
    ipcMain.handle(IPC_CHANNELS.GET_PROMPTS, async (): Promise<Prompt[]> => {
        return await getPromptsFromDisk()
    })

    // Save a prompt (create or update)
    ipcMain.handle(
        IPC_CHANNELS.SAVE_PROMPT,
        async (_, prompt: Prompt): Promise<boolean> => {
            try {
                const prompts = await getPromptsFromDisk()
                const existingIndex = prompts.findIndex((p) => p.id === prompt.id)

                if (existingIndex >= 0) {
                    // Update existing prompt
                    prompts[existingIndex] = prompt
                } else {
                    // Add new prompt
                    prompts.push(prompt)
                }

                await savePromptsToDisk(prompts)
                return true
            } catch (error) {
                console.error('Failed to save prompt:', error)
                return false
            }
        }
    )

    // Delete a prompt by ID
    ipcMain.handle(
        IPC_CHANNELS.DELETE_PROMPT,
        async (_, id: string): Promise<boolean> => {
            try {
                const prompts = await getPromptsFromDisk()
                const filteredPrompts = prompts.filter((p) => p.id !== id)

                if (filteredPrompts.length === prompts.length) {
                    // Prompt not found
                    return false
                }

                await savePromptsToDisk(filteredPrompts)
                return true
            } catch (error) {
                console.error('Failed to delete prompt:', error)
                return false
            }
        }
    )

    // Export data to file
    ipcMain.handle(IPC_CHANNELS.EXPORT_DATA, async (): Promise<string> => {
        try {
            const result = await dialog.showSaveDialog({
                title: 'Export Prompts',
                defaultPath: 'prompts-backup.json',
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
            })

            if (result.canceled || !result.filePath) {
                return 'Export cancelled'
            }

            const prompts = await getPromptsFromDisk()
            await exportPromptsToFile(prompts, result.filePath)
            return `Exported ${prompts.length} prompts successfully`
        } catch (error) {
            console.error('Export failed:', error)
            return `Export failed: ${(error as Error).message}`
        }
    })

    // Import data from file
    ipcMain.handle(IPC_CHANNELS.IMPORT_DATA, async (): Promise<string> => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Import Prompts',
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
                properties: ['openFile']
            })

            if (result.canceled || result.filePaths.length === 0) {
                return 'Import cancelled'
            }

            const importedPrompts = await importPromptsFromFile(result.filePaths[0])
            const existingPrompts = await getPromptsFromDisk()

            // Merge prompts (imported prompts override existing ones with same ID)
            const mergedMap = new Map<string, Prompt>()
            existingPrompts.forEach((p) => mergedMap.set(p.id, p))
            importedPrompts.forEach((p) => mergedMap.set(p.id, p))

            const mergedPrompts = Array.from(mergedMap.values())
            await savePromptsToDisk(mergedPrompts)

            return `Imported ${importedPrompts.length} prompts successfully`
        } catch (error) {
            console.error('Import failed:', error)
            return `Import failed: ${(error as Error).message}`
        }
    })

    // Toggle always on top
    ipcMain.handle(IPC_CHANNELS.TOGGLE_ALWAYS_ON_TOP, async (event): Promise<boolean> => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return false

        const newState = !win.isAlwaysOnTop()
        win.setAlwaysOnTop(newState)
        return newState
    })

    // Hide window
    ipcMain.on(IPC_CHANNELS.HIDE_WINDOW, (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
            win.hide()
        }
    })
}
