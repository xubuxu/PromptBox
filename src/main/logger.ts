/**
 * Logging utility for PromptBox using electron-log
 * Provides structured logging with file persistence and log rotation
 */

import log from 'electron-log/main'
import { app } from 'electron'
import { join } from 'path'

// Configure log file location and settings
log.transports.file.resolvePathFn = () => join(app.getPath('userData'), 'logs', 'main.log')
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB max file size
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
    log.transports.console.level = 'debug'
    log.transports.file.level = 'debug'
} else {
    log.transports.console.level = 'warn'
    log.transports.file.level = 'info'
}

/**
 * Logger interface for the application
 */
export const logger = {
    /**
     * Log debug information (only in development)
     */
    debug: (message: string, ...params: unknown[]) => {
        log.debug(message, ...params)
    },

    /**
     * Log general information
     */
    info: (message: string, ...params: unknown[]) => {
        log.info(message, ...params)
    },

    /**
     * Log warning messages
     */
    warn: (message: string, ...params: unknown[]) => {
        log.warn(message, ...params)
    },

    /**
     * Log error messages with optional error object
     */
    error: (message: string, error?: unknown, ...params: unknown[]) => {
        if (error instanceof Error) {
            log.error(message, {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...params
            })
        } else if (error !== undefined) {
            log.error(message, error, ...params)
        } else {
            log.error(message, ...params)
        }
    },

    /**
     * Get the log file path
     */
    getLogPath: () => {
        return join(app.getPath('userData'), 'logs', 'main.log')
    }
}

export default logger
