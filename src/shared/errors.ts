/**
 * Custom error classes for PromptBox
 * Provides structured error handling with error codes for better debugging
 */

/**
 * Error codes for categorizing different types of errors
 */
export enum ErrorCode {
    /** Database operation failed */
    DATABASE_ERROR = 'DATABASE_ERROR',
    /** IPC communication error */
    IPC_ERROR = 'IPC_ERROR',
    /** Input validation failed */
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    /** File system operation failed */
    FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
    /** Unexpected application error */
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base error class for PromptBox application errors
 */
export class PromptBoxError extends Error {
    /** Error code for categorization */
    public readonly code: ErrorCode
    /** Original error that caused this error */
    public readonly cause?: unknown
    /** Timestamp when the error occurred */
    public readonly timestamp: number

    constructor(message: string, code: ErrorCode, cause?: unknown) {
        super(message)
        this.name = 'PromptBoxError'
        this.code = code
        this.cause = cause
        this.timestamp = Date.now()

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PromptBoxError)
        }
    }

    /**
     * Converts error to a JSON-serializable object
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            stack: this.stack
        }
    }
}

/**
 * Database-specific error
 */
export class DatabaseError extends PromptBoxError {
    constructor(message: string, cause?: unknown) {
        super(message, ErrorCode.DATABASE_ERROR, cause)
        this.name = 'DatabaseError'
    }
}

/**
 * IPC communication error
 */
export class IpcError extends PromptBoxError {
    constructor(message: string, cause?: unknown) {
        super(message, ErrorCode.IPC_ERROR, cause)
        this.name = 'IpcError'
    }
}

/**
 * Validation error for invalid inputs
 */
export class ValidationError extends PromptBoxError {
    /** Fields that failed validation */
    public readonly fields?: string[]

    constructor(message: string, fields?: string[], cause?: unknown) {
        super(message, ErrorCode.VALIDATION_ERROR, cause)
        this.name = 'ValidationError'
        this.fields = fields
    }
}

/**
 * File system operation error
 */
export class FileSystemError extends PromptBoxError {
    /** Path that caused the error */
    public readonly path?: string

    constructor(message: string, path?: string, cause?: unknown) {
        super(message, ErrorCode.FILE_SYSTEM_ERROR, cause)
        this.name = 'FileSystemError'
        this.path = path
    }
}

/**
 * Helper to wrap unknown errors into PromptBoxError
 */
export function wrapError(error: unknown, defaultMessage = 'An unexpected error occurred'): PromptBoxError {
    if (error instanceof PromptBoxError) {
        return error
    }

    if (error instanceof Error) {
        return new PromptBoxError(error.message || defaultMessage, ErrorCode.UNKNOWN_ERROR, error)
    }

    return new PromptBoxError(defaultMessage, ErrorCode.UNKNOWN_ERROR, error)
}

/**
 * Type guard to check if error is a PromptBoxError
 */
export function isPromptBoxError(error: unknown): error is PromptBoxError {
    return error instanceof PromptBoxError
}
