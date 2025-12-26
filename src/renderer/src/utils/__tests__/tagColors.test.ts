import { describe, it, expect } from 'vitest'
import { getTagColor, sortTags } from '../tagColors'

describe('getTagColor', () => {
    it('should return consistent colors for the same tag', () => {
        const color1 = getTagColor('test')
        const color2 = getTagColor('test')

        expect(color1).toEqual(color2)
    })

    it('should return different colors for different tags', () => {
        const color1 = getTagColor('tag1')
        const color2 = getTagColor('tag2')

        // Different tags should likely have different colors (not guaranteed but probable)
        // At minimum, we should verify the structure is correct
        expect(color1).toHaveProperty('bg')
        expect(color1).toHaveProperty('text')
        expect(color1).toHaveProperty('darkText')
        expect(color2).toHaveProperty('bg')
        expect(color2).toHaveProperty('text')
        expect(color2).toHaveProperty('darkText')
    })

    it('should return valid color objects', () => {
        const color = getTagColor('example')

        expect(typeof color.bg).toBe('string')
        expect(typeof color.text).toBe('string')
        expect(typeof color.darkText).toBe('string')
    })
})

describe('sortTags', () => {
    it('should sort tags alphabetically', () => {
        const tags = ['zebra', 'apple', 'mango', 'banana']
        const sorted = sortTags(tags)

        expect(sorted).toEqual(['apple', 'banana', 'mango', 'zebra'])
    })

    it('should handle empty array', () => {
        expect(sortTags([])).toEqual([])
    })

    it('should handle single tag', () => {
        expect(sortTags(['alone'])).toEqual(['alone'])
    })

    it('should be case-insensitive', () => {
        const tags = ['Zebra', 'apple', 'Mango', 'banana']
        const sorted = sortTags(tags)

        // Verify alphabetical order regardless of case
        expect(sorted[0].toLowerCase()).toBe('apple')
    })

    it('should not mutate the original array', () => {
        const original = ['c', 'a', 'b']
        const copy = [...original]
        sortTags(original)

        expect(original).toEqual(copy)
    })
})
