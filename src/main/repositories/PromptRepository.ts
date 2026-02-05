import { BaseRepository } from './BaseRepository'
import type { Prompt } from '@shared/types'
import { logger } from '../logger'

interface PromptRow {
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
}

export class PromptRepository extends BaseRepository<Prompt> {
    protected tableName = 'prompts'

    private mapRowToPrompt(row: PromptRow): Prompt {
        return {
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
        }
    }

    public findAll(orderBy: string = 'updatedAt DESC'): Prompt[] {
        const rows = super.findAll(orderBy) as unknown as PromptRow[]
        return rows.map(this.mapRowToPrompt)
    }

    public findById(id: string): Prompt | undefined {
        const row = super.findById(id) as unknown as PromptRow | undefined
        return row ? this.mapRowToPrompt(row) : undefined
    }

    public save(prompt: Prompt): boolean {
        try {
            const stmt = this.db.prepare(`
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

    public saveBatch(prompts: Prompt[]): boolean {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO prompts (id, title, description, content, content_zh, tags, isFavorite, copyCount, folderId, createdAt, updatedAt)
                VALUES (@id, @title, @description, @content, @content_zh, @tags, @isFavorite, @copyCount, @folderId, @createdAt, @updatedAt)
            `)

            const transaction = this.db.transaction((items: Prompt[]) => {
                for (const prompt of items) {
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
                }
            })

            transaction(prompts)
            return true
        } catch (error) {
            logger.error('Failed to save batch prompts:', error)
            return false
        }
    }

    public incrementCopyCount(id: string): boolean {
        try {
            const stmt = this.db.prepare('UPDATE prompts SET copyCount = copyCount + 1 WHERE id = ?')
            const info = stmt.run(id)
            return info.changes > 0
        } catch (error) {
            logger.error('Failed to increment copy count:', error)
            return false
        }
    }
}
