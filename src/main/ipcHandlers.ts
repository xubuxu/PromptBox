import { ipcMain, dialog, app, IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import type { Prompt, Folder } from '@shared/types'
import { IPC_CHANNELS } from '../shared/types'
import { writeFile, readFile } from 'fs/promises'
import { getDbPath } from './store'
import { logger } from './logger'
import { PromptRepository } from './repositories/PromptRepository'
import { FolderRepository } from './repositories/FolderRepository'
import { DatabaseConnection } from './database/connection'

// Define the shape of the imported prompt (from JSON)
interface ImportedPrompt {
    id: string
    title: string
    content: string
    content_zh?: string // Add support for Chinese content
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
    const promptRepo = new PromptRepository()
    const folderRepo = new FolderRepository()
    const dbConnection = DatabaseConnection.getInstance()

    // --- Prompt CRUD Handlers ---

    // Get all prompts
    ipcMain.handle(IPC_CHANNELS.GET_PROMPTS, (_event: IpcMainInvokeEvent) => {
        return promptRepo.findAll()
    })

    // Save prompt (Create or Update)
    ipcMain.handle(IPC_CHANNELS.SAVE_PROMPT, (_event: IpcMainInvokeEvent, prompt: Prompt) => {
        return promptRepo.save(prompt)
    })

    // Delete a prompt
    ipcMain.handle(IPC_CHANNELS.DELETE_PROMPT, (_event: IpcMainInvokeEvent, id: string) => {
        return promptRepo.delete(id)
    })

    // Toggle Favorite status
    ipcMain.handle(IPC_CHANNELS.TOGGLE_FAVORITE, (_event: IpcMainInvokeEvent, id: string) => {
        const prompt = promptRepo.findById(id)
        if (prompt) {
            prompt.isFavorite = !prompt.isFavorite
            prompt.updatedAt = Date.now()
            return promptRepo.save(prompt)
        }
        return false
    })

    // Increment Copy Count
    ipcMain.handle(IPC_CHANNELS.INCREMENT_COPY_COUNT, (_event: IpcMainInvokeEvent, id: string) => {
        return promptRepo.incrementCopyCount(id)
    })

    // --- Folder CRUD Handlers ---
    ipcMain.handle(IPC_CHANNELS.GET_FOLDERS, () => {
        return folderRepo.findAll('name ASC')
    })

    ipcMain.handle(IPC_CHANNELS.CREATE_FOLDER, (_event, folder: Folder) => {
        return folderRepo.save(folder)
    })

    ipcMain.handle(IPC_CHANNELS.UPDATE_FOLDER, (_event, folder: Folder) => {
        return folderRepo.update(folder)
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_FOLDER, (_event, id: string) => {
        return folderRepo.delete(id)
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
                const prompts = promptRepo.findAll()
                await writeFile(filePath, JSON.stringify(prompts, null, 2))
                logger.info('Export successful:', filePath)
                return 'Exported successfully'
            }
            return 'Export cancelled'
        } catch (error) {
            logger.error('Export failed:', error)
            return 'Export failed'
        }
    })

    // Import Data (Restore/Add)
    ipcMain.handle(IPC_CHANNELS.IMPORT_DATA, async () => {
        logger.info('Import started')
        try {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Import Prompts Backup',
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
                properties: ['openFile']
            })

            logger.info('File dialog result:', { filePaths })

            if (filePaths && filePaths.length > 0) {
                const filePath = filePaths[0]
                logger.info('Reading file:', filePath)

                const data = await readFile(filePath, 'utf-8')
                logger.info('File read successfully, length:', data.length)

                const parsedData = JSON.parse(data)
                logger.info('JSON parsed successfully')

                let promptsToImport: ImportedPrompt[] = []

                if (Array.isArray(parsedData)) {
                    promptsToImport = parsedData
                    logger.info('Detected array format, prompts count:', promptsToImport.length)
                } else if (typeof parsedData === 'object' && parsedData !== null && Array.isArray(parsedData.prompts)) {
                    promptsToImport = parsedData.prompts
                    logger.info('Detected object format with prompts array, count:', promptsToImport.length)
                } else {
                    logger.error('Invalid file format')
                    return 'Import failed: Invalid file format (must be an array or object with "prompts" array)'
                }

                const prompts: Prompt[] = promptsToImport.map(p => ({
                    id: p.id || uuidv4(),
                    title: p.title || 'Untitled',
                    content: p.content || '',
                    content_zh: p.content_zh,
                    tags: p.tags || [],
                    description: p.description,
                    isFavorite: p.isFavorite || false,
                    copyCount: p.copyCount || 0,
                    folderId: null,
                    createdAt: p.createdAt || Date.now(),
                    updatedAt: Date.now()
                }))

                if (promptRepo.saveBatch(prompts)) {
                    logger.info(`Import completed: ${prompts.length} successfully`)
                    return `Imported ${prompts.length} prompts successfully`
                } else {
                    logger.error('Import failed during batch save')
                    return 'Import failed during batch save'
                }
            }
            logger.info('Import cancelled by user')
            return 'Import cancelled'
        } catch (error) {
            logger.error('Import failed with error:', error)
            return `Import failed: ${error instanceof Error ? error.message : String(error)}`
        }
    })

    // --- Window Control Handlers ---

    ipcMain.on(IPC_CHANNELS.HIDE_WINDOW, () => {
        const win = getMainWindow()
        if (win) win.hide()
    })

    ipcMain.on(IPC_CHANNELS.MINIMIZE_WINDOW, () => {
        const win = getMainWindow()
        if (win) win.minimize()
    })

    ipcMain.on(IPC_CHANNELS.MAXIMIZE_WINDOW, () => {
        const win = getMainWindow()
        if (win) {
            if (win.isMaximized()) {
                win.unmaximize()
            } else {
                win.maximize()
            }
        }
    })

    ipcMain.on(IPC_CHANNELS.CLOSE_WINDOW, () => {
        const win = getMainWindow()
        if (win) win.close()
    })

    ipcMain.handle(IPC_CHANNELS.TOGGLE_ALWAYS_ON_TOP, () => {
        const win = getMainWindow()
        if (win) {
            const newState = !win.isAlwaysOnTop()
            win.setAlwaysOnTop(newState)
            return newState
        }
        return false
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

                const result = dbConnection.moveDatabase(newPath)
                return result
            }
            return { success: false, message: 'Selection cancelled' }
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    })
}

export function getMainWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}
