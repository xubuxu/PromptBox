/**
 * Shared type definitions for PromptBox
 * Used across main, preload, and renderer processes
 */

/**
 * The core Prompt data model
 */
export interface Prompt {
    /** UUID identifier */
    id: string;
    /** Short title for display */
    title: string;
    /** Optional one-line description of the prompt's purpose */
    description?: string;
    /** The actual prompt text, may contain {{variables}} */
    content: string;
    /** Array of tag strings */
    tags: string[];
    /** Whether the prompt is marked as favorite */
    isFavorite: boolean;
    /** Unix timestamp of creation */
    createdAt: number;
    /** Unix timestamp of last update */
    updatedAt: number;
}

/**
 * IPC Bridge interface - defines the API exposed to the renderer
 */
export interface IElectronAPI {
    // CRUD Operations
    getPrompts: () => Promise<Prompt[]>;
    savePrompt: (prompt: Prompt) => Promise<boolean>;
    deletePrompt: (id: string) => Promise<boolean>;

    // Import/Export Features
    exportData: () => Promise<string>;
    importData: () => Promise<string>;

    // Window Controls
    toggleAlwaysOnTop: () => Promise<boolean>;
    hideWindow: () => void;
}

/**
 * IPC Channel names - used for type-safe IPC communication
 */
export const IPC_CHANNELS = {
    GET_PROMPTS: 'prompts:get',
    SAVE_PROMPT: 'prompts:save',
    DELETE_PROMPT: 'prompts:delete',
    EXPORT_DATA: 'data:export',
    IMPORT_DATA: 'data:import',
    TOGGLE_ALWAYS_ON_TOP: 'window:toggleAlwaysOnTop',
    HIDE_WINDOW: 'window:hide'
} as const;
