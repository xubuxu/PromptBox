# Tech Stack & Development Rules (Electron Edition)

## 1. Core Architecture
- **Runtime:** Electron (Latest)
- **Scaffold/Build:** `electron-vite` (for React integration)
- **Language:** TypeScript (Strict mode)
- **Frontend:** React 18+
- **IPC Pattern:** Use `contextBridge` in `preload` scripts for secure Main-to-Renderer communication. NO `remote` module.

## 2. UI/Styling
- **CSS Framework:** Tailwind CSS (v3.x)
- **Icons:** Lucide-React
- **Theming:** Light/Dark mode with CSS variables
- **Window Management:**
  - Frameless window with custom title bar
  - Always on Top toggle
  - System Tray support

## 3. Data Persistence
- **Database:** `better-sqlite3` (SQLite)
  - Data stored in `userData/prompts.db`
  - Automatic migration from legacy JSON format
- **Import/Export:** JSON file format via `dialog.showOpenDialog`

## 4. Key Libraries
- `better-sqlite3`: SQLite database operations
- `clsx` & `tailwind-merge`: Dynamic class names
- `uuid`: Generating Prompt IDs
- `lucide-react`: Icon components