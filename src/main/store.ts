import { promises as fs } from 'fs'
import type { Prompt } from '@shared/types'

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
