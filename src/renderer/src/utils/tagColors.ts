/**
 * Tag color utility - assigns consistent colors to tags based on hash
 */

// Color palette for tags - carefully selected for both light and dark themes
const TAG_COLORS = [
    { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', darkText: '#60a5fa' },   // Blue
    { bg: 'rgba(139, 92, 246, 0.15)', text: '#7c3aed', darkText: '#a78bfa' },   // Purple
    { bg: 'rgba(236, 72, 153, 0.15)', text: '#db2777', darkText: '#f472b6' },   // Pink
    { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', darkText: '#34d399' },   // Green
    { bg: 'rgba(245, 158, 11, 0.15)', text: '#d97706', darkText: '#fbbf24' },   // Amber
    { bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626', darkText: '#f87171' },    // Red
    { bg: 'rgba(6, 182, 212, 0.15)', text: '#0891b2', darkText: '#22d3ee' },    // Cyan
    { bg: 'rgba(99, 102, 241, 0.15)', text: '#4f46e5', darkText: '#818cf8' },   // Indigo
    { bg: 'rgba(132, 204, 22, 0.15)', text: '#65a30d', darkText: '#a3e635' },   // Lime
    { bg: 'rgba(249, 115, 22, 0.15)', text: '#ea580c', darkText: '#fb923c' },   // Orange
    { bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea', darkText: '#c084fc' },   // Violet
    { bg: 'rgba(20, 184, 166, 0.15)', text: '#0d9488', darkText: '#2dd4bf' },   // Teal
] as const

/**
 * Simple string hash function (djb2 algorithm)
 * @param str - The string to hash
 * @returns A positive integer hash value
 */
function hashString(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i)
    }
    return Math.abs(hash)
}

/**
 * Gets the color for a tag based on its name
 * Same tag name will always return the same color
 * @param tagName - The tag name
 * @returns Color object with bg and text properties
 */
export function getTagColor(tagName: string): { bg: string; text: string; darkText: string } {
    const hash = hashString(tagName.toLowerCase())
    const index = hash % TAG_COLORS.length
    return TAG_COLORS[index]
}

/**
 * Sorts tags alphabetically (case-insensitive)
 * @param tags - Array of tag strings
 * @returns Sorted array of tags
 */
export function sortTags(tags: string[]): string[] {
    return [...tags].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}
