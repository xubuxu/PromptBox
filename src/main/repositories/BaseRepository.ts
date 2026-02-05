import Database from 'better-sqlite3'
import { DatabaseConnection } from '../database/connection'

export abstract class BaseRepository<T> {
    protected get db(): Database.Database {
        return DatabaseConnection.getInstance().getDB()
    }

    protected abstract tableName: string

    constructor() { }

    /**
     * Get all items, optionally ordered
     */
    public findAll(orderBy: string = 'updatedAt DESC'): T[] {
        const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`)
        return stmt.all() as T[]
    }

    /**
     * Find item by ID
     */
    public findById(id: string): T | undefined {
        const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
        return stmt.get(id) as T | undefined
    }

    /**
     * Delete item by ID
     */
    public delete(id: string): boolean {
        try {
            const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
            const info = stmt.run(id)
            return info.changes > 0
        } catch (error) {
            console.error(`Failed to delete from ${this.tableName}:`, error)
            return false
        }
    }

    /**
     * Generic counts
     */
    public count(): number {
        const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number }
        return result.count
    }
}
