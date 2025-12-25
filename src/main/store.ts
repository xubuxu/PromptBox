import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { Prompt } from '@shared/types'

/**
 * Get the path to the prompts.json file in userData directory
 */
function getPromptsFilePath(): string {
    return join(app.getPath('userData'), 'prompts.json')
}

/**
 * Read all prompts from disk
 * @returns Array of Prompt objects, empty array if file doesn't exist
 */
export async function getPromptsFromDisk(): Promise<Prompt[]> {
    const filePath = getPromptsFilePath()

    try {
        const data = await fs.readFile(filePath, 'utf-8')
        const parsed = JSON.parse(data)

        // Validate that parsed data is an array
        if (!Array.isArray(parsed)) {
            console.warn('prompts.json is not an array, returning empty array')
            return []
        }

        return parsed as Prompt[]
    } catch (error) {
        // File doesn't exist or is invalid - return empty array
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []
        }
        console.error('Error reading prompts.json:', error)
        return []
    }
}

/**
 * Write all prompts to disk
 * @param prompts Array of Prompt objects to save
 */
export async function savePromptsToDisk(prompts: Prompt[]): Promise<void> {
    const filePath = getPromptsFilePath()

    try {
        const data = JSON.stringify(prompts, null, 2)
        await fs.writeFile(filePath, data, 'utf-8')
    } catch (error) {
        console.error('Error writing prompts.json:', error)
        throw error
    }
}

/**
 * Export prompts to a user-selected file
 * @param prompts Array of Prompt objects to export
 * @param targetPath The file path to export to
 */
export async function exportPromptsToFile(
    prompts: Prompt[],
    targetPath: string
): Promise<void> {
    const exportData = {
        version: '1.0',
        exportDate: Date.now(),
        prompts
    }

    const data = JSON.stringify(exportData, null, 2)
    await fs.writeFile(targetPath, data, 'utf-8')
}

/**
 * Import prompts from a file
 * @param sourcePath The file path to import from
 * @returns Array of Prompt objects
 */
export async function importPromptsFromFile(sourcePath: string): Promise<Prompt[]> {
    const data = await fs.readFile(sourcePath, 'utf-8')
    const parsed = JSON.parse(data)

    // Handle both raw array and versioned export format
    if (Array.isArray(parsed)) {
        return parsed as Prompt[]
    }

    if (parsed.prompts && Array.isArray(parsed.prompts)) {
        return parsed.prompts as Prompt[]
    }

    throw new Error('Invalid import file format')
}
