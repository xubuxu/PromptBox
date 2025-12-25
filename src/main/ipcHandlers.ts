import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { IPC_CHANNELS, Prompt } from '@shared/types'
import {
    initDatabase,
    getAllPrompts,
    savePrompt,
    deletePrompt,
    incrementCopyCount
} from './database'
import { exportPromptsToFile, importPromptsFromFile } from './store'

/**
 * Register all IPC handlers for the main process
 */
export function registerIpcHandlers(): void {
    // Initialize database on startup
    initDatabase()

    // Get all prompts
    ipcMain.handle(IPC_CHANNELS.GET_PROMPTS, (): Prompt[] => {
        return getAllPrompts()
    })

    // Save a prompt (create or update)
    ipcMain.handle(
        IPC_CHANNELS.SAVE_PROMPT,
        (_, prompt: Prompt): boolean => {
            return savePrompt(prompt)
        }
    )

    // Delete a prompt by ID
    ipcMain.handle(
        IPC_CHANNELS.DELETE_PROMPT,
        (_, id: string): boolean => {
            return deletePrompt(id)
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

            const prompts = getAllPrompts()
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

            // Save each imported prompt (will insert or update)
            let successCount = 0
            for (const prompt of importedPrompts) {
                if (savePrompt(prompt)) {
                    successCount++
                }
            }

            return `Imported ${successCount} prompts successfully`
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

    // Get auto launch status
    ipcMain.handle(IPC_CHANNELS.GET_AUTO_LAUNCH, (): boolean => {
        const settings = app.getLoginItemSettings()
        return settings.openAtLogin
    })

    // Set auto launch
    ipcMain.handle(IPC_CHANNELS.SET_AUTO_LAUNCH, (_, enabled: boolean): boolean => {
        try {
            app.setLoginItemSettings({
                openAtLogin: enabled,
                openAsHidden: true // Start minimized to tray
            })
            return true
        } catch (error) {
            console.error('Failed to set auto launch:', error)
            return false
        }
    })

    // Increment copy count for a prompt
    ipcMain.handle(IPC_CHANNELS.INCREMENT_COPY_COUNT, (_, id: string): boolean => {
        return incrementCopyCount(id)
    })
}
