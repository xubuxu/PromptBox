import Database from 'better-sqlite3'
import { app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, mkdirSync, copyFileSync, renameSync, readFileSync } from 'fs'
import { logger } from '../logger'
import { getDbPath, setDbPath } from '../store'
import { Prompt } from '@shared/types'
import { DEFAULT_PROMPTS } from '../defaultPrompts'

export class DatabaseConnection {
    private static instance: DatabaseConnection
    private db: Database.Database | null = null

    private constructor() {
        // Private constructor for Singleton
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection()
        }
        return DatabaseConnection.instance
    }

    public getDB(): Database.Database {
        if (!this.db) {
            this.init()
        }
        if (!this.db) {
            throw new Error('Database failed to initialize')
        }
        return this.db
    }

    public init(): void {
        if (this.db) return

        const dbPath = this.getDatabasePath()

        // Ensure directory exists
        const dbDir = dirname(dbPath)
        if (!existsSync(dbDir)) {
            try {
                mkdirSync(dbDir, { recursive: true })
            } catch (error) {
                logger.error('Failed to create database directory:', error)
                // Fallback
                const fallbackPath = join(app.getPath('userData'), 'prompts.db')
                setDbPath(fallbackPath)
                this.connect(fallbackPath)
                return
            }
        }

        this.connect(dbPath)
    }

    private connect(path: string): void {
        try {
            this.db = new Database(path)
            this.initTables()
        } catch (err) {
            logger.error('Failed to open database at', path, err)
            // Fallback
            const fallbackPath = join(app.getPath('userData'), 'prompts.db')
            setDbPath(fallbackPath)
            this.db = new Database(fallbackPath)
            this.initTables()
        }
    }

    private getDatabasePath(): string {
        return getDbPath()
    }

    private initTables(): void {
        if (!this.db) return

        // Enable WAL mode
        this.db.pragma('journal_mode = WAL')

        // Create prompts table
        this.db.exec(`
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

        // Create folders table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parentId TEXT,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL
            )
        `)

        this.applyMigrations()
        this.importDefaultPrompts()
        this.ensurePromptEngineerExists()
    }

    private applyMigrations(): void {
        if (!this.db) return

        // copyCount
        try {
            this.db.exec('ALTER TABLE prompts ADD COLUMN copyCount INTEGER NOT NULL DEFAULT 0')
        } catch { /* ignore */ }

        // content_zh
        try {
            this.db.exec('ALTER TABLE prompts ADD COLUMN content_zh TEXT')
        } catch { /* ignore */ }

        // folderId
        try {
            this.db.exec('ALTER TABLE prompts ADD COLUMN folderId TEXT')
        } catch { /* ignore */ }

        // Legacy JSON migration
        this.migrateFromJson()
    }

    private migrateFromJson(): void {
        const jsonPath = join(app.getPath('userData'), 'prompts.json')
        if (!existsSync(jsonPath)) return
        if (!this.db) return

        const count = this.db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number }
        if (count.count > 0) return

        try {
            const data = readFileSync(jsonPath, 'utf-8')
            const prompts = JSON.parse(data) as Prompt[]

            if (!Array.isArray(prompts)) return

            const insert = this.db.prepare(`
                INSERT OR REPLACE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, createdAt, updatedAt)
                VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @createdAt, @updatedAt)
            `)

            const insertMany = this.db.transaction((items: Prompt[]) => {
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
            renameSync(jsonPath, jsonPath + '.migrated')
            logger.info(`Migrated ${prompts.length} prompts from JSON to SQLite`)
        } catch (error) {
            logger.error('Failed to migrate from JSON:', error)
        }
    }

    private importDefaultPrompts(): void {
        if (!this.db) return

        const count = this.db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number }
        if (count.count > 0) return

        try {
            const insert = this.db.prepare(`
                INSERT OR IGNORE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, createdAt, updatedAt)
                VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @createdAt, @updatedAt)
            `)

            const insertMany = this.db.transaction((items: Prompt[]) => {
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

    private ensurePromptEngineerExists(): void {
        if (!this.db) return

        const PROMPT_ENGINEER_ID = 'default-prompt-engineer'
        const existing = this.db.prepare('SELECT id FROM prompts WHERE id = ?').get(PROMPT_ENGINEER_ID)
        if (existing) return

        const promptEngineer = DEFAULT_PROMPTS.find(p => p.id === PROMPT_ENGINEER_ID)
        if (!promptEngineer) return

        try {
            const stmt = this.db.prepare(`
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

    public close(): void {
        if (this.db) {
            this.db.close()
            this.db = null
        }
    }

    public moveDatabase(newPath: string): { success: boolean, message: string } {
        try {
            if (!this.db) this.init()
            const currentPath = this.getDatabasePath()

            if (currentPath === newPath) {
                return { success: false, message: 'Source and destination are the same.' }
            }

            this.close()

            const newDir = dirname(newPath)
            if (!existsSync(newDir)) {
                mkdirSync(newDir, { recursive: true })
            }

            copyFileSync(currentPath, newPath)

            const currentShm = currentPath + '-shm'
            const currentWal = currentPath + '-wal'
            if (existsSync(currentShm)) copyFileSync(currentShm, newPath + '-shm')
            if (existsSync(currentWal)) copyFileSync(currentWal, newPath + '-wal')

            setDbPath(newPath)
            this.connect(newPath)

            return { success: true, message: 'Database successfully moved.' }
        } catch (error) {
            logger.error('Failed to move database:', error)
            this.init() // Reopen original
            return { success: false, message: `Failed to move database: ${(error as Error).message}` }
        }
    }
}
