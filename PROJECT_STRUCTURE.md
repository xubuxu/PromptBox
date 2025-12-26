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
│   │   ├── logger.ts          # Logging utility (electron-log)
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
│   │       ├── components/    # UI components
│   │       │   ├── BatchActionBar.tsx
│   │       │   ├── ConfirmDialog.tsx
│   │       │   ├── ErrorBoundary.tsx
│   │       │   ├── FolderModal.tsx
│   │       │   ├── Modal.tsx
│   │       │   ├── PromptCard.tsx
│   │       │   ├── PromptEditor.tsx
│   │       │   ├── SearchBar.tsx
│   │       │   ├── SettingsModalContent.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   ├── TitleBar.tsx
│   │       │   ├── Toast.tsx
│   │       │   ├── VariableInputModal.tsx
│   │       │   └── index.ts
│   │       ├── contexts/      # React contexts (ThemeContext)
│   │       ├── hooks/         # Custom hooks (usePrompts)
│   │       └── utils/         # Utility functions (tagColors)
│   └── shared/                # Shared modules across processes
│       ├── types.ts           # Shared type definitions
│       ├── errors.ts          # Custom error classes
│       ├── validators.ts      # Input validation (Zod schemas)
│       └── __tests__/         # Shared module tests
├── resources/
│   ├── icon.png               # Application icon (PNG)
│   └── icon.svg               # Application icon (SVG)
└── .github/
    └── workflows/
        └── ci.yml             # GitHub Actions CI pipeline
```

## Key Directories

| Directory | Purpose |
|-----------|------------|
| `src/main` | Electron main process (Node.js) |
| `src/preload` | Security bridge between main and renderer |
| `src/renderer` | React frontend application |
| `src/shared` | Shared types, validators, and error handling |
| `resources` | Static assets (icons) |
| `.github/workflows` | CI/CD pipeline configuration |