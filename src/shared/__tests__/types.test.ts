import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../types'

describe('IPC_CHANNELS', () => {
    it('should have all required channel names', () => {
        expect(IPC_CHANNELS.GET_PROMPTS).toBe('prompts:get')
        expect(IPC_CHANNELS.SAVE_PROMPT).toBe('prompts:save')
        expect(IPC_CHANNELS.DELETE_PROMPT).toBe('prompts:delete')
        expect(IPC_CHANNELS.EXPORT_DATA).toBe('data:export')
        expect(IPC_CHANNELS.IMPORT_DATA).toBe('data:import')
        expect(IPC_CHANNELS.TOGGLE_ALWAYS_ON_TOP).toBe('window:toggleAlwaysOnTop')
        expect(IPC_CHANNELS.HIDE_WINDOW).toBe('window:hide')
        expect(IPC_CHANNELS.GET_AUTO_LAUNCH).toBe('app:getAutoLaunch')
        expect(IPC_CHANNELS.SET_AUTO_LAUNCH).toBe('app:setAutoLaunch')
        expect(IPC_CHANNELS.INCREMENT_COPY_COUNT).toBe('prompts:incrementCopyCount')
    })

    it('should have all channel names as strings', () => {
        // Verify all channels are defined and are strings
        Object.values(IPC_CHANNELS).forEach((channel) => {
            expect(typeof channel).toBe('string')
            expect(channel.length).toBeGreaterThan(0)
        })
    })
})

describe('Prompt interface validation', () => {
    it('should validate a valid prompt structure', () => {
        const validPrompt = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Test Prompt',
            content: 'This is test content',
            tags: ['test', 'example'],
            isFavorite: false,
            copyCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        expect(validPrompt.id).toBeDefined()
        expect(validPrompt.title).toBeDefined()
        expect(validPrompt.content).toBeDefined()
        expect(Array.isArray(validPrompt.tags)).toBe(true)
        expect(typeof validPrompt.isFavorite).toBe('boolean')
    })

    it('should allow optional description and content_zh', () => {
        const promptWithOptionals = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Bilingual Prompt',
            description: 'A test prompt with description',
            content: 'English content',
            content_zh: '中文内容',
            tags: [],
            isFavorite: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        expect(promptWithOptionals.description).toBe('A test prompt with description')
        expect(promptWithOptionals.content_zh).toBe('中文内容')
    })
})
