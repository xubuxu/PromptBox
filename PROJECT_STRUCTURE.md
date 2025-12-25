# Recommended Project Directory (Electron-Vite)

root/
├── electron.vite.config.ts  # Config for both Main and Renderer
├── package.json
├── src/
│   ├── main/                # [Backend] Node.js Environment
│   │   ├── index.ts         # App entry, window creation, Global Hotkeys
│   │   ├── ipcHandlers.ts   # Listeners for CRUD operations
│   │   └── store.ts         # File system logic (fs/promises)
│   ├── preload/             # [Bridge] Security Layer
│   │   ├── index.ts         # contextBridge exposure
│   │   └── index.d.ts       # TypeScript types for window.api
│   ├── renderer/            # [Frontend] React Environment
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── components/  # PromptCard, SearchBar, Sidebar
│   │   │   ├── hooks/       # usePrompts (calls window.api)
│   │   │   └── pages/       # Dashboard, Settings
│   │   └── assets/
└── resources/               # Icons, static files