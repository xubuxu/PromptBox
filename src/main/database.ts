import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, renameSync } from 'fs'
import type { Prompt } from '@shared/types'
import { DEFAULT_PROMPTS } from './defaultPrompts'

let db: Database.Database | null = null

/**
 * Get the database file path
 */
function getDatabasePath(): string {
    return join(app.getPath('userData'), 'prompts.db')
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
    db = new Database(dbPath)

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
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
        )
    `)

    // Add copyCount column if not exists (for existing databases)
    try {
        db.exec('ALTER TABLE prompts ADD COLUMN copyCount INTEGER NOT NULL DEFAULT 0')
    } catch {
        // Column already exists, ignore error
    }

    // Add content_zh column if not exists (for bilingual support)
    try {
        db.exec('ALTER TABLE prompts ADD COLUMN content_zh TEXT')
    } catch {
        // Column already exists, ignore error
    }

    // Migrate from old JSON file if exists
    migrateFromJson()

    // Import default prompts if database is empty
    importDefaultPrompts()

    // Ensure Prompt Engineer template exists (even in existing databases)
    ensurePromptEngineerExists()
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
        console.log(`Migrated ${prompts.length} prompts from JSON to SQLite`)
    } catch (error) {
        console.error('Failed to migrate from JSON:', error)
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
        console.log(`Imported ${DEFAULT_PROMPTS.length} default prompts`)
    } catch (error) {
        console.error('Failed to import default prompts:', error)
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

        console.log('Added Prompt Engineer template to existing database')
    } catch (error) {
        console.error('Failed to add Prompt Engineer:', error)
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
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    }))
}

/**
 * Save a prompt (insert or update)
 */
export function savePrompt(prompt: Prompt): boolean {
    if (!db) initDatabase()

    try {
        const stmt = db!.prepare(`
            INSERT OR REPLACE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, createdAt, updatedAt)
            VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @createdAt, @updatedAt)
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
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt
        })

        return true
    } catch (error) {
        console.error('Failed to save prompt:', error)
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
        console.error('Failed to increment copy count:', error)
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
        console.error('Failed to delete prompt:', error)
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
