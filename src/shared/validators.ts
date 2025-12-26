/**
 * Runtime validation schemas using Zod
 * Provides type-safe validation for data at runtime boundaries (IPC, file I/O)
 */

import { z } from 'zod'

/**
 * Schema for Prompt data model
 */
export const PromptSchema = z.object({
    id: z.string().uuid('Invalid prompt ID format'),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters'),
    description: z
        .string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    content: z
        .string()
        .min(1, 'Content is required')
        .max(50000, 'Content must be less than 50,000 characters'),
    content_zh: z
        .string()
        .max(50000, 'Chinese content must be less than 50,000 characters')
        .optional(),
    tags: z
        .array(z.string().max(50, 'Tag must be less than 50 characters'))
        .max(20, 'Maximum 20 tags allowed'),
    isFavorite: z.boolean(),
    copyCount: z.number().int().nonnegative().optional(),
    createdAt: z.number().int().positive('Invalid creation timestamp'),
    updatedAt: z.number().int().positive('Invalid update timestamp')
})

/**
 * Schema for creating a new prompt (ID will be generated)
 */
export const CreatePromptSchema = PromptSchema.omit({ id: true }).extend({
    id: z.string().uuid().optional()
})

/**
 * Type inferred from PromptSchema
 */
export type ValidatedPrompt = z.infer<typeof PromptSchema>

/**
 * Schema for import/export data structure
 */
export const PromptExportSchema = z.object({
    version: z.string().optional(),
    exportedAt: z.number().optional(),
    prompts: z.array(PromptSchema)
})

/** Type for validation results */
export type PromptValidationResult = ReturnType<typeof PromptSchema.safeParse>

/**
 * Validate a prompt object
 * @param data - Data to validate
 * @returns Validation result with success/error
 */
export function validatePrompt(data: unknown): PromptValidationResult {
    return PromptSchema.safeParse(data)
}

/**
 * Validate and return prompt or throw
 * @param data - Data to validate
 * @throws ZodError if validation fails
 */
export function parsePrompt(data: unknown): ValidatedPrompt {
    return PromptSchema.parse(data)
}

/** Type for array validation results */
export type PromptArrayValidationResult = ReturnType<typeof validatePromptArray>

/**
 * Validate an array of prompts for import
 * @param data - Data to validate
 * @returns Validation result
 */
export function validatePromptArray(data: unknown) {
    return z.array(PromptSchema).safeParse(data)
}

/**
 * Extract validation error messages from ZodError
 * @param error - Zod error object
 * @returns Array of user-friendly error messages
 */
export function formatZodErrors(error: z.ZodError<unknown>): string[] {
    return error.issues.map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
    })
}

