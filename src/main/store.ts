// Remove static import
// import Store from 'electron-store'
import { app } from 'electron'
import { join } from 'path'

export interface StoreSchema {
    dbPath: string
    isFirstRun: boolean
}

let store: any = null

/**
 * Initialize electron-store asynchronously (ESM workaround)
 */
export async function initStore(): Promise<void> {
    const { default: Store } = await import('electron-store')

    store = new Store<StoreSchema>({
        defaults: {
            dbPath: join(app.getPath('userData'), 'prompts.db'),
            isFirstRun: true
        }
    })
}

/**
 * Get the current database path
 */
export function getDbPath(): string {
    if (!store) {
        // Fallback or throw? Ideally initStore is called before this.
        // If called too early (should not happen with correct flow), fallback to default
        console.warn('Store not initialized when calling getDbPath')
        return join(app.getPath('userData'), 'prompts.db')
    }
    return store.get('dbPath')
}

/**
 * Set the database path
 */
export function setDbPath(path: string): void {
    if (!store) {
        console.error('Store not initialized when calling setDbPath')
        return
    }
    store.set('dbPath', path)
}
