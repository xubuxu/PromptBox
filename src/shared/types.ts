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
    /** The actual prompt text (English/default), may contain {{variables}} */
    content: string;
    /** Optional Chinese version of the prompt content */
    content_zh?: string;
    /** Array of tag strings */
    tags: string[];
    /** Whether the prompt is marked as favorite */
    isFavorite: boolean;
    /** Number of times this prompt has been copied */
    copyCount?: number;
    /** Unix timestamp of creation */
    createdAt: number;
    /** Unix timestamp of last update */
    /** Unix timestamp of last update */
    updatedAt: number;
    /** ID of the folder this prompt belongs to (null for root) */
    folderId?: string | null;
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
    minimizeWindow: () => void;
    maximizeWindow: () => void;

    // Auto Launch
    getAutoLaunch: () => Promise<boolean>;
    setAutoLaunch: (enabled: boolean) => Promise<boolean>;

    // Usage Statistics
    incrementCopyCount: (id: string) => Promise<boolean>;

    // Folder Operations
    getFolders: () => Promise<Folder[]>;
    createFolder: (folder: Folder) => Promise<boolean>;
    updateFolder: (folder: Folder) => Promise<boolean>;
    deleteFolder: (id: string) => Promise<boolean>;

    // Database Location
    getDbPath: () => Promise<string>;
    moveDb: () => Promise<{ success: boolean; message: string }>;
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
    HIDE_WINDOW: 'window:hide',
    GET_AUTO_LAUNCH: 'app:getAutoLaunch',
    SET_AUTO_LAUNCH: 'app:setAutoLaunch',
    INCREMENT_COPY_COUNT: 'prompts:incrementCopyCount',
    TOGGLE_FAVORITE: 'prompts:toggleFavorite',
    MINIMIZE_WINDOW: 'window:minimize',
    MAXIMIZE_WINDOW: 'window:maximize',
    CLOSE_WINDOW: 'window:close',

    // Folder Operations
    GET_FOLDERS: 'folders:get',
    CREATE_FOLDER: 'folders:create',
    UPDATE_FOLDER: 'folders:update',
    DELETE_FOLDER: 'folders:delete',

    // Database Location
    GET_DB_PATH: 'db:getPath',
    MOVE_DB: 'db:move'
} as const;

/**
 * Folder data model
 */
export interface Folder {
    /** UUID identifier */
    id: string;
    /** Folder name */
    name: string;
    /** Parent folder ID (null for root folders) */
    parentId: string | null;
    /** Unix timestamp of creation */
    createdAt: number;
    /** Unix timestamp of last update */
    updatedAt: number;
}
