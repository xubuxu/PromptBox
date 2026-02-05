import { BaseRepository } from './BaseRepository'
import type { Folder } from '@shared/types'
import { logger } from '../logger'

export class FolderRepository extends BaseRepository<Folder> {
    protected tableName = 'folders'

    public save(folder: Folder): boolean {
        try {
            const stmt = this.db.prepare(`
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

    public update(folder: Folder): boolean {
        try {
            const stmt = this.db.prepare(`
                UPDATE folders 
                SET name = @name, parentId = @parentId, updatedAt = @updatedAt
                WHERE id = @id
            `)

            const info = stmt.run(folder)
            return info.changes > 0
        } catch (error) {
            logger.error('Failed to update folder:', error)
            return false
        }
    }

    public delete(id: string): boolean {
        try {
            // Transaction to safe delete: unlink prompts then delete folder
            const deleteTx = this.db.transaction(() => {
                // Unlink prompts in this folder (set folderId to null)
                this.db.prepare('UPDATE prompts SET folderId = NULL WHERE folderId = ?').run(id)

                // Delete the folder
                this.db.prepare('DELETE FROM folders WHERE id = ?').run(id)
            })

            deleteTx()
            return true
        } catch (error) {
            logger.error('Failed to delete folder:', error)
            return false
        }
    }
}
