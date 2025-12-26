import Database from 'better-sqlite3'
import { app } from 'electron'
import { join, dirname, basename } from 'path'
import { existsSync, readFileSync, renameSync, copyFileSync, mkdirSync } from 'fs'
import type { Prompt, Folder } from '@shared/types'
import { DEFAULT_PROMPTS } from './defaultPrompts'
import { getDbPath, setDbPath } from './store'
import { logger } from './logger'

let db: Database.Database | null = null

/**
 * Get the current database file path from store
 */
function getDatabasePath(): string {
    return getDbPath()
}

/**
 * Get the old JSON file path for migration
 */
function getOldJsonPath(): string {
    return join(app.getPath('userData'), 'prompts.json')
}

/**
 * Initialize the SQLite database
 */
export function initDatabase(): void {
    if (db) return

    const dbPath = getDatabasePath()

    // Ensure directory exists
    const dbDir = dirname(dbPath)
    if (!existsSync(dbDir)) {
        try {
            mkdirSync(dbDir, { recursive: true })
        } catch (error) {
            logger.error('Failed to create database directory:', error)
            // Fallback to userData if custom path fails
            const fallbackPath = join(app.getPath('userData'), 'prompts.db')
            setDbPath(fallbackPath)
            db = new Database(fallbackPath)
            initTables()
            return
        }
    }

    try {
        db = new Database(dbPath)
        initTables()
    } catch (err) {
        logger.error('Failed to open database at', dbPath, err)
        // Fallback
        const fallbackPath = join(app.getPath('userData'), 'prompts.db')
        setDbPath(fallbackPath)
        db = new Database(fallbackPath)
        initTables()
    }
}

function initTables() {
    if (!db) return

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL')

    // Create prompts table if not exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS prompts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            content_zh TEXT,
            tags TEXT NOT NULL DEFAULT '[]',
            isFavorite INTEGER NOT NULL DEFAULT 0,
            copyCount INTEGER NOT NULL DEFAULT 0,
            folderId TEXT,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
        )
    `)

    // Create folders table if not exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parentId TEXT,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
        )
    `)

    // Add copyCount column if not exists
    try {
        db.exec('ALTER TABLE prompts ADD COLUMN copyCount INTEGER NOT NULL DEFAULT 0')
    } catch { /* ignore */ }

    // Add content_zh column if not exists
    try {
        db.exec('ALTER TABLE prompts ADD COLUMN content_zh TEXT')
    } catch { /* ignore */ }

    // Add folderId column if not exists
    try {
        db.exec('ALTER TABLE prompts ADD COLUMN folderId TEXT')
    } catch { /* ignore */ }

    // Migrate from old JSON file if exists
    migrateFromJson()

    // Import default prompts if database is empty
    importDefaultPrompts()

    // Ensure Prompt Engineer template exists
    ensurePromptEngineerExists()
}

/**
 * Move the database to a new location
 */
export function moveDatabase(newPath: string): { success: boolean, message: string } {
    try {
        if (!db) initDatabase()

        const currentPath = getDatabasePath()

        // Cannot move to same path
        if (currentPath === newPath) {
            return { success: false, message: 'Source and destination are the same.' }
        }

        // Close current connection
        closeDatabase()

        // Create new directory if needed
        const newDir = dirname(newPath)
        if (!existsSync(newDir)) {
            mkdirSync(newDir, { recursive: true })
        }

        // Copy file
        copyFileSync(currentPath, newPath)

        // Copy SHM and WAL files if they exist (WAL mode artifacts)
        const currentShm = currentPath + '-shm'
        const currentWal = currentPath + '-wal'
        if (existsSync(currentShm)) copyFileSync(currentShm, newPath + '-shm')
        if (existsSync(currentWal)) copyFileSync(currentWal, newPath + '-wal')

        // Update store
        setDbPath(newPath)

        // Re-initialize with new path
        initDatabase()

        return { success: true, message: 'Database successfully moved.' }

    } catch (error) {
        logger.error('Failed to move database:', error)
        // Try to re-open old db if copy failed
        initDatabase()
        return { success: false, message: `Failed to move database: ${(error as Error).message}` }
    }
}

/**
 * Migrate data from old prompts.json file
 */
function migrateFromJson(): void {
    const jsonPath = getOldJsonPath()

    if (!existsSync(jsonPath)) return
    if (!db) return

    // Check if database is empty
    const count = db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number }
    if (count.count > 0) return // Already has data, skip migration

    try {
        const data = readFileSync(jsonPath, 'utf-8')
        const prompts = JSON.parse(data) as Prompt[]

        if (!Array.isArray(prompts)) return

        const insert = db.prepare(`
            INSERT OR REPLACE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, createdAt, updatedAt)
            VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @createdAt, @updatedAt)
        `)

        const insertMany = db.transaction((items: Prompt[]) => {
            for (const prompt of items) {
                insert.run({
                    id: prompt.id,
                    title: prompt.title,
                    description: prompt.description || null,
                    content: prompt.content,
                    content_zh: prompt.content_zh || null,
                    tags: JSON.stringify(prompt.tags),
                    isFavorite: prompt.isFavorite ? 1 : 0,
                    copyCount: prompt.copyCount || 0,
                    createdAt: prompt.createdAt,
                    updatedAt: prompt.updatedAt
                })
            }
        })

        insertMany(prompts)

        // Rename old file to mark as migrated
        renameSync(jsonPath, jsonPath + '.migrated')
        logger.info(`Migrated ${prompts.length} prompts from JSON to SQLite`)
    } catch (error) {
        logger.error('Failed to migrate from JSON:', error)
    }
}

/**
 * Import default prompts into database (only if database is empty)
 */
function importDefaultPrompts(): void {
    if (!db) return

    // Check if database already has prompts
    const count = db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number }
    if (count.count > 0) return // Database already has data, skip import

    try {
        const insert = db.prepare(`
            INSERT OR IGNORE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, createdAt, updatedAt)
            VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @createdAt, @updatedAt)
        `)

        const insertMany = db.transaction((items: Prompt[]) => {
            for (const prompt of items) {
                insert.run({
                    id: prompt.id,
                    title: prompt.title,
                    description: prompt.description || null,
                    content: prompt.content,
                    content_zh: prompt.content_zh || null,
                    tags: JSON.stringify(prompt.tags),
                    isFavorite: prompt.isFavorite ? 1 : 0,
                    copyCount: 0,
                    createdAt: prompt.createdAt,
                    updatedAt: prompt.updatedAt
                })
            }
        })

        insertMany(DEFAULT_PROMPTS)
        logger.info(`Imported ${DEFAULT_PROMPTS.length} default prompts`)
    } catch (error) {
        logger.error('Failed to import default prompts:', error)
    }
}

/**
 * Ensure Prompt Engineer template exists in database (for existing databases)
 */
function ensurePromptEngineerExists(): void {
    if (!db) return

    const PROMPT_ENGINEER_ID = 'default-prompt-engineer'

    // Check if already exists
    const existing = db.prepare('SELECT id FROM prompts WHERE id = ?').get(PROMPT_ENGINEER_ID)
    if (existing) return

    // Find in DEFAULT_PROMPTS
    const promptEngineer = DEFAULT_PROMPTS.find(p => p.id === PROMPT_ENGINEER_ID)
    if (!promptEngineer) return

    try {
        const stmt = db.prepare(`
            INSERT INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, createdAt, updatedAt)
            VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @createdAt, @updatedAt)
        `)

        stmt.run({
            id: promptEngineer.id,
            title: promptEngineer.title,
            description: promptEngineer.description || null,
            content: promptEngineer.content,
            content_zh: promptEngineer.content_zh || null,
            tags: JSON.stringify(promptEngineer.tags),
            isFavorite: promptEngineer.isFavorite ? 1 : 0,
            copyCount: 0,
            createdAt: promptEngineer.createdAt,
            updatedAt: promptEngineer.updatedAt
        })

        logger.info('Added Prompt Engineer template to existing database')
    } catch (error) {
        logger.error('Failed to add Prompt Engineer:', error)
    }
}

/**
 * Get all prompts from database
 */
export function getAllPrompts(): Prompt[] {
    if (!db) initDatabase()

    const rows = db!.prepare('SELECT * FROM prompts ORDER BY updatedAt DESC').all() as {
        id: string
        title: string
        description: string | null
        content: string
        content_zh: string | null
        tags: string
        isFavorite: number
        copyCount: number
        folderId: string | null
        createdAt: number
        updatedAt: number
    }[]

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        content: row.content,
        content_zh: row.content_zh || undefined,
        tags: JSON.parse(row.tags),
        isFavorite: row.isFavorite === 1,
        copyCount: row.copyCount,
        folderId: row.folderId || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    }))
}

/**
 * Get all folders
 */
export function getFolders(): Folder[] {
    if (!db) initDatabase()

    const rows = db!.prepare('SELECT * FROM folders ORDER BY name ASC').all() as Folder[]
    return rows
}

/**
 * Create a new folder
 */
export function createFolder(folder: Folder): boolean {
    if (!db) initDatabase()

    try {
        const stmt = db!.prepare(`
            INSERT INTO folders (id, name, parentId, createdAt, updatedAt)
            VALUES (@id, @name, @parentId, @createdAt, @updatedAt)
        `)

        stmt.run(folder)
        return true
    } catch (error) {
        logger.error('Failed to create folder:', error)
        return false
    }
}

/**
 * Update a folder
 */
export function updateFolder(folder: Folder): boolean {
    if (!db) initDatabase()

    try {
        const stmt = db!.prepare(`
            UPDATE folders 
            SET name = @name, parentId = @parentId, updatedAt = @updatedAt
            WHERE id = @id
        `)

        stmt.run(folder)
        return true
    } catch (error) {
        logger.error('Failed to update folder:', error)
        return false
    }
}

/**
 * Delete a folder
 */
export function deleteFolder(id: string): boolean {
    if (!db) initDatabase()

    try {
        // Transaction to delete folder and move contents to root (or delete them? Let's move to root for safety)
        const deleteTx = db!.transaction(() => {
            // Unlink prompts in this folder (set folderId to null)
            db!.prepare('UPDATE prompts SET folderId = NULL WHERE folderId = ?').run(id)

            // Delete the folder
            db!.prepare('DELETE FROM folders WHERE id = ?').run(id)
        })

        deleteTx()
        return true
    } catch (error) {
        logger.error('Failed to delete folder:', error)
        return false
    }
}

/**
 * Save a prompt (insert or update)
 */
export function savePrompt(prompt: Prompt): boolean {
    if (!db) initDatabase()

    try {
        const stmt = db!.prepare(`
            INSERT OR REPLACE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, folderId, createdAt, updatedAt)
            VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @folderId, @createdAt, @updatedAt)
        `)

        stmt.run({
            id: prompt.id,
            title: prompt.title,
            description: prompt.description || null,
            content: prompt.content,
            content_zh: prompt.content_zh || null,
            tags: JSON.stringify(prompt.tags),
            isFavorite: prompt.isFavorite ? 1 : 0,
            copyCount: prompt.copyCount || 0,
            folderId: prompt.folderId || null,
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt
        })

        return true
    } catch (error) {
        logger.error('Failed to save prompt:', error)
        return false
    }
}

/**
 * Increment copy count for a prompt
 */
export function incrementCopyCount(id: string): boolean {
    if (!db) initDatabase()

    try {
        const stmt = db!.prepare('UPDATE prompts SET copyCount = copyCount + 1 WHERE id = ?')
        stmt.run(id)
        return true
    } catch (error) {
        logger.error('Failed to increment copy count:', error)
        return false
    }
}

/**
 * Delete a prompt by ID
 */
export function deletePrompt(id: string): boolean {
    if (!db) initDatabase()

    try {
        const stmt = db!.prepare('DELETE FROM prompts WHERE id = ?')
        stmt.run(id)
        return true
    } catch (error) {
        logger.error('Failed to delete prompt:', error)
        return false
    }
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close()
        db = null
    }
}
