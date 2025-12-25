import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, IElectronAPI, Prompt } from '@shared/types'

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
    }
}

// Expose 'api' to the renderer process on window.api
contextBridge.exposeInMainWorld('api', api)
