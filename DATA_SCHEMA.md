// Data Schema & IPC Interface

// 1. The Data Model (Same as before)
export interface Prompt {
  id: string;
  title: string;
  content: string; // Contains {{variables}}
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

// 2. The IPC Bridge (Window API)
// This is how the Frontend talks to the Backend
export interface IElectronAPI {
  // CRUD
  getPrompts: () => Promise<Prompt[]>;
  savePrompt: (prompt: Prompt) => Promise<boolean>;
  deletePrompt: (id: string) => Promise<boolean>;
  
  // Features
  exportData: () => Promise<string>; // Returns status message
  importData: () => Promise<string>; // Returns status message
  
  // Window Controls
  toggleAlwaysOnTop: () => Promise<boolean>;
  hideWindow: () => void; // Minimize to tray or hide
}

// Add to global window object
declare global {
  interface Window {
    api: IElectronAPI
  }
}