import { app, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipcHandlers'

// Fix GPU cache permission issues on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

let mainWindow: BrowserWindow | null = null
let registeredHotkey: string | null = null

/**
 * Create the main application window
 */
function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        minWidth: 600,
        minHeight: 400,
        show: false,
        frame: false, // Frameless window for custom title bar
        transparent: false,
        backgroundColor: '#f8fafc', // Light theme background
        icon: join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    // Show window when ready to prevent visual flash
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
    })

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173')
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

/**
 * Toggle window visibility
 */
function toggleWindow(): void {
    if (!mainWindow) return

    if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide()
    } else {
        mainWindow.show()
        mainWindow.focus()
    }
}

/**
 * Register global hotkey to toggle window visibility
 * Tries multiple hotkey combinations in case some are already in use
 */
function registerGlobalHotkey(): void {
    // List of hotkeys to try (in order of preference)
    const hotkeys = [
        'Alt+Space',           // Primary: unlikely to conflict
        'CommandOrControl+`',  // Fallback 1
        'CommandOrControl+Shift+Space', // Fallback 2
        'CommandOrControl+Shift+P'      // Fallback 3 (often used by VSCode)
    ]

    for (const hotkey of hotkeys) {
        const registered = globalShortcut.register(hotkey, toggleWindow)
        if (registered) {
            registeredHotkey = hotkey
            console.log(`Global hotkey registered: ${hotkey}`)
            return
        }
    }

    console.warn('Failed to register any global hotkey. All combinations are in use.')
}

// App lifecycle
app.whenReady().then(() => {
    registerIpcHandlers()
    createWindow()
    registerGlobalHotkey()

    app.on('activate', () => {
        // macOS: re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    // macOS: keep app running in background
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('will-quit', () => {
    // Unregister all shortcuts when quitting
    globalShortcut.unregisterAll()
})
