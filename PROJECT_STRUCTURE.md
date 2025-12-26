# Project Directory Structure (Electron-Vite)

```
root/
├── electron.vite.config.ts    # Config for both Main and Renderer
├── package.json
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── src/
│   ├── main/                  # [Backend] Node.js Environment
│   │   ├── index.ts           # App entry, window, tray, global hotkeys
│   │   ├── ipcHandlers.ts     # IPC handlers for CRUD operations
│   │   ├── database.ts        # SQLite database operations (better-sqlite3)
│   │   ├── store.ts           # Configuration storage (electron-store)
│   │   └── defaultPrompts.ts  # Default prompt data
│   ├── preload/               # [Bridge] Security Layer
│   │   ├── index.ts           # contextBridge exposure
│   │   └── index.d.ts         # TypeScript types for window.api
│   ├── renderer/              # [Frontend] React Environment
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx        # Main application component
│   │       ├── main.tsx       # React entry point
│   │       ├── index.css      # Global styles
│   │       ├── components/    # UI components (PromptCard, Sidebar, etc.)
│   │       ├── contexts/      # React contexts (ThemeContext)
│   │       ├── hooks/         # Custom hooks (usePrompts)
│   │       └── utils/         # Utility functions (tagColors)
│   └── shared/
│       └── types.ts           # Shared type definitions
├── scripts/
└── resources/
    └── icon.png               # Application icon
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/main` | Electron main process (Node.js) |
| `src/preload` | Security bridge between main and renderer |
| `src/renderer` | React frontend application |
| `src/shared` | Shared types across all processes |
| `scripts` | Development utility scripts |
| `resources` | Static assets (icons, etc.) |