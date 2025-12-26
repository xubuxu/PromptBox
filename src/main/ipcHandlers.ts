import { ipcMain, shell, dialog, app, BrowserWindow, IpcMainInvokeEvent } from 'electron'
import {
    savePrompt,
    getAllPrompts,
    deletePrompt,
    incrementCopyCount,
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveDatabase
} from './database'
import { v4 as uuidv4 } from 'uuid'
import type { Prompt, Folder } from '@shared/types'
import { IPC_CHANNELS } from '../shared/types'
import { writeFileSync, readFileSync } from 'fs'
import { getDbPath } from './store'

// Define the shape of the imported prompt (from JSON)
interface ImportedPrompt {
    id: string
    title: string
    content: string
    tags: string[]
    createdAt?: number
    updatedAt?: number
    isFavorite?: boolean
    copyCount?: number
    description?: string
}

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(): void {
    // --- Prompt CRUD Handlers ---

    // Get all prompts
    ipcMain.handle(IPC_CHANNELS.GET_PROMPTS, (_event: IpcMainInvokeEvent) => {
        return getAllPrompts()
    })

    // Save prompt (Create or Update)
    ipcMain.handle(IPC_CHANNELS.SAVE_PROMPT, (_event: IpcMainInvokeEvent, prompt: Prompt) => {
        const success = savePrompt(prompt)
        return success
    })

    // Delete a prompt
    ipcMain.handle(IPC_CHANNELS.DELETE_PROMPT, (_event: IpcMainInvokeEvent, id: string) => {
        const success = deletePrompt(id)
        return success
    })

    // Toggle Favorite status
    ipcMain.handle(IPC_CHANNELS.TOGGLE_FAVORITE, (_event: IpcMainInvokeEvent, id: string) => {
        const prompts = getAllPrompts()
        const prompt = prompts.find((p) => p.id === id)
        if (prompt) {
            prompt.isFavorite = !prompt.isFavorite
            prompt.updatedAt = Date.now()
            return savePrompt(prompt)
        }
        return false
    })

    // Increment Copy Count
    ipcMain.handle(IPC_CHANNELS.INCREMENT_COPY_COUNT, (_event: IpcMainInvokeEvent, id: string) => {
        return incrementCopyCount(id)
    })

    // --- Folder CRUD Handlers ---
    ipcMain.handle(IPC_CHANNELS.GET_FOLDERS, () => {
        return getFolders()
    })

    ipcMain.handle(IPC_CHANNELS.CREATE_FOLDER, (_event, folder: Folder) => {
        return createFolder(folder)
    })

    ipcMain.handle(IPC_CHANNELS.UPDATE_FOLDER, (_event, folder: Folder) => {
        return updateFolder(folder)
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_FOLDER, (_event, id: string) => {
        return deleteFolder(id)
    })

    // --- Import / Export Handlers ---

    // Export Data (Backup)
    ipcMain.handle(IPC_CHANNELS.EXPORT_DATA, async () => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Export Prompts Backup',
                defaultPath: 'promptbox-backup.json',
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
            })

            if (filePath) {
                const prompts = getAllPrompts()
                writeFileSync(filePath, JSON.stringify(prompts, null, 2))
                return 'Exported successfully'
            }
            return 'Export cancelled'
        } catch (error) {
            console.error('Export failed:', error)
            return 'Export failed'
        }
    })

    // Import Data (Restore/Add)
    ipcMain.handle(IPC_CHANNELS.IMPORT_DATA, async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Import Prompts Backup',
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
                properties: ['openFile']
            })

            if (filePaths && filePaths.length > 0) {
                const data = readFileSync(filePaths[0], 'utf-8')
                const importedPrompts = JSON.parse(data) as ImportedPrompt[]

                let successCount = 0
                for (const p of importedPrompts) {
                    const newPrompt: Prompt = {
                        id: p.id || uuidv4(),
                        title: p.title || 'Untitled',
                        content: p.content || '',
                        tags: p.tags || [],
                        description: p.description, // Correctly mapping description
                        isFavorite: p.isFavorite || false,
                        copyCount: p.copyCount || 0,
                        createdAt: p.createdAt || Date.now(),
                        updatedAt: Date.now()
                    }
                    if (savePrompt(newPrompt)) {
                        successCount++
                    }
                }
                return `Imported ${successCount} prompts successfully`
            }
            return 'Import cancelled'
        } catch (error) {
            console.error('Import failed:', error)
            return 'Import failed'
        }
    })

    // --- Window Control Handlers ---

    // Minimize Window
    ipcMain.on(IPC_CHANNELS.MINIMIZE_WINDOW, () => {
        const win = getMainWindow()
        if (win) win.minimize()
    })

    // Close Window (Hide to Tray/Quit - standard close behavior)
    ipcMain.on(IPC_CHANNELS.CLOSE_WINDOW, () => {
        const win = getMainWindow()
        if (win) win.close()
    })

    // --- Settings / Auto-Launch Handlers ---

    ipcMain.handle(IPC_CHANNELS.GET_AUTO_LAUNCH, () => {
        const settings = app.getLoginItemSettings()
        return settings.openAtLogin
    })

    ipcMain.handle(IPC_CHANNELS.SET_AUTO_LAUNCH, (_event: IpcMainInvokeEvent, enable: boolean) => {
        app.setLoginItemSettings({
            openAtLogin: enable,
            path: app.getPath('exe')
        })
        return enable
    })

    // --- Database Location Handlers ---

    ipcMain.handle(IPC_CHANNELS.GET_DB_PATH, () => {
        return getDbPath()
    })

    ipcMain.handle(IPC_CHANNELS.MOVE_DB, async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Select New Database Location',
                properties: ['openDirectory', 'createDirectory']
            })

            if (filePaths && filePaths.length > 0) {
                const newDir = filePaths[0]
                const newPath = newDir + (process.platform === 'win32' ? '\\' : '/') + 'prompts.db'

                const result = moveDatabase(newPath)
                return result
            }
            return { success: false, message: 'Selection cancelled' }
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    })
}

function getMainWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}
