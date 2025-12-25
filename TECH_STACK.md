# Tech Stack & Development Rules (Electron Edition)

## 1. Core Architecture
- **Runtime:** Electron (Latest)
- **Scaffold/Build:** `electron-vite` (Highly recommended for React integration)
- **Language:** TypeScript (Strict mode)
- **Frontend:** React 18+
- **IPC Pattern:** Use `contextBridge` in `preload` scripts for secure Main-to-Renderer communication. NO `remote` module.

## 2. UI/Styling
- **CSS Framework:** Tailwind CSS (v3.x)
- **Components:** Shadcn/ui (Radix UI based) or Headless UI.
- **Icons:** Lucide-React.
- **Window Management:**
  - Support "Frameless Window" (custom title bar).
  - Support "Always on Top" toggle.

## 3. Data Persistence & File System
- **Settings/Meta:** `electron-store` (For user preferences like "Launch on startup").
- **Core Data:** Native `fs` (Node.js File System).
  - Data is stored in `userData/prompts.json`.
  - **Import/Export:** Direct file read/write access to user selected paths via `dialog.showOpenDialog`.

## 4. Key Libraries
- `electron-router-dom`: For handling routing within the app.
- `clsx` & `tailwind-merge`: For dynamic class names.
- `uuid`: For generating Prompt IDs.