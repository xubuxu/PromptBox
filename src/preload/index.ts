import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, IElectronAPI, Prompt, Folder } from '@shared/types'

/**
 * Expose the API to the renderer process via contextBridge
 * This is the secure way to communicate between renderer and main
 */
const api: IElectronAPI = {
    // CRUD Operations
    getPrompts: (): Promise<Prompt[]> => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_PROMPTS)
    },

    savePrompt: (prompt: Prompt): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.SAVE_PROMPT, prompt)
    },

    deletePrompt: (id: string): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.DELETE_PROMPT, id)
    },

    // Import/Export Features
    exportData: (): Promise<string> => {
        return ipcRenderer.invoke(IPC_CHANNELS.EXPORT_DATA)
    },

    importData: (): Promise<string> => {
        return ipcRenderer.invoke(IPC_CHANNELS.IMPORT_DATA)
    },

    // Window Controls
    toggleAlwaysOnTop: (): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_ALWAYS_ON_TOP)
    },

    hideWindow: (): void => {
        ipcRenderer.send(IPC_CHANNELS.HIDE_WINDOW)
    },

    minimizeWindow: (): void => {
        ipcRenderer.send(IPC_CHANNELS.MINIMIZE_WINDOW)
    },

    maximizeWindow: (): void => {
        ipcRenderer.send(IPC_CHANNELS.MAXIMIZE_WINDOW)
    },

    // Auto Launch
    getAutoLaunch: (): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_AUTO_LAUNCH)
    },

    setAutoLaunch: (enabled: boolean): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.SET_AUTO_LAUNCH, enabled)
    },

    // Usage Statistics
    incrementCopyCount: (id: string): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.INCREMENT_COPY_COUNT, id)
    },

    // Folder Operations
    getFolders: (): Promise<Folder[]> => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_FOLDERS)
    },

    createFolder: (folder: Folder): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.CREATE_FOLDER, folder)
    },

    updateFolder: (folder: Folder): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.UPDATE_FOLDER, folder)
    },

    deleteFolder: (id: string): Promise<boolean> => {
        return ipcRenderer.invoke(IPC_CHANNELS.DELETE_FOLDER, id)
    },

    // Database Location
    getDbPath: (): Promise<string> => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_DB_PATH)
    },

    moveDb: (): Promise<{ success: boolean; message: string }> => {
        return ipcRenderer.invoke(IPC_CHANNELS.MOVE_DB)
    }
}

// Expose 'api' to the renderer process on window.api
contextBridge.exposeInMainWorld('api', api)
