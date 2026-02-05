import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, crashReporter } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipcHandlers'
import { logger } from './logger'
import { initStore } from './store'

// Initialize crash reporter (logs crashes locally)
crashReporter.start({
    productName: 'PromptBox',
    submitURL: '', // Empty URL = local only, no remote submission
    uploadToServer: false
})

// Fix GPU cache permission issues on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception in main process:', error)
})

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason)
})

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

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

    // Intercept close and hide to tray instead
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault()
            mainWindow?.hide()
        }
    })

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173')
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

/**
 * Create the system tray icon and menu
 */
function createTray(): void {
    const iconPath = join(__dirname, '../../resources/icon.png')
    const icon = nativeImage.createFromPath(iconPath)

    // Resize icon for tray (16x16 on Windows)
    const trayIcon = icon.resize({ width: 16, height: 16 })

    tray = new Tray(trayIcon)
    tray.setToolTip('PromptBox')

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show PromptBox',
            click: () => {
                mainWindow?.show()
                mainWindow?.focus()
            }
        },
        {
            label: 'Hide',
            click: () => {
                mainWindow?.hide()
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setContextMenu(contextMenu)

    // Double-click to show window
    tray.on('double-click', () => {
        mainWindow?.show()
        mainWindow?.focus()
    })
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
            logger.info(`Global hotkey registered: ${hotkey}`)
            return
        }
    }

    logger.warn('Failed to register any global hotkey. All combinations are in use.')
}

// App lifecycle
app.whenReady().then(async () => {
    await initStore()

    registerIpcHandlers()
    createWindow()
    createTray()
    registerGlobalHotkey()

    app.on('activate', () => {
        // macOS: re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// Allow quitting via tray menu
app.on('before-quit', () => {
    isQuitting = true
})

app.on('window-all-closed', () => {
    // Don't quit when all windows are closed - stay in tray
    // Only quit on macOS if explicitly requested
    if (process.platform === 'darwin' && isQuitting) {
        app.quit()
    }
})

app.on('will-quit', () => {
    // Unregister all shortcuts when quitting
    globalShortcut.unregisterAll()

    // Destroy tray
    if (tray) {
        tray.destroy()
        tray = null
    }
})
