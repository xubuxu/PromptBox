import { useState, useMemo, useEffect } from 'react'
import { X, Copy, Sparkles, RotateCcw } from 'lucide-react'

interface VariableInputModalProps {
    isOpen: boolean
    content: string
    promptTitle: string
    promptId: string
    onClose: () => void
    onCopy: (filledContent: string) => void
}

interface VariableInfo {
    name: string
    defaultValue: string
}

const STORAGE_KEY_PREFIX = 'promptbox_var_'

/**
 * Get stored variable values from localStorage
 */
function getStoredValues(promptId: string): Record<string, string> {
    try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${promptId}`)
        return stored ? JSON.parse(stored) : {}
    } catch {
        return {}
    }
}

/**
 * Save variable values to localStorage
 */
function saveStoredValues(promptId: string, values: Record<string, string>): void {
    try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${promptId}`, JSON.stringify(values))
    } catch {
        // Ignore storage errors
    }
}

/**
 * Extracts variable names and default values from content
 * Supports both {{variable}} and {{variable::defaultValue}} syntax
 */
function extractVariables(content: string): VariableInfo[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || []
    const variableMap = new Map<string, string>()

    for (const match of matches) {
        const inner = match.replace(/\{\{|\}\}/g, '').trim()
        // Check for default value syntax: {{name::default}}
        const separatorIndex = inner.indexOf('::')
        if (separatorIndex !== -1) {
            const name = inner.substring(0, separatorIndex).trim()
            const defaultValue = inner.substring(separatorIndex + 2).trim()
            if (!variableMap.has(name)) {
                variableMap.set(name, defaultValue)
            }
        } else {
            if (!variableMap.has(inner)) {
                variableMap.set(inner, '')
            }
        }
    }

    return Array.from(variableMap.entries()).map(([name, defaultValue]) => ({
        name,
        defaultValue
    }))
}

/**
 * Modal for filling in template variables before copying
 */
export function VariableInputModal({
    isOpen,
    content,
    promptTitle,
    promptId,
    onClose,
    onCopy
}: VariableInputModalProps) {
    const variables = useMemo(() => extractVariables(content), [content])
    const storedValues = useMemo(() => getStoredValues(promptId), [promptId])

    const [values, setValues] = useState<Record<string, string>>({})

    // Initialize values when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialValues: Record<string, string> = {}
            for (const v of variables) {
                // Priority: stored value > default value > empty
                initialValues[v.name] = storedValues[v.name] ?? v.defaultValue ?? ''
            }
            setValues(initialValues)
        }
    }, [isOpen, variables, storedValues])

    if (!isOpen) return null

    const handleValueChange = (variable: string, value: string) => {
        setValues((prev) => ({ ...prev, [variable]: value }))
    }

    const handleReset = (variable: string) => {
        const varInfo = variables.find((v) => v.name === variable)
        if (varInfo) {
            setValues((prev) => ({ ...prev, [variable]: varInfo.defaultValue }))
        }
    }

    const handleCopy = () => {
        // Save values for future use
        saveStoredValues(promptId, values)

        let filledContent = content
        for (const [variable, value] of Object.entries(values)) {
            // Replace all occurrences of {{variable}} and {{variable::default}} with the value
            const regex = new RegExp(`\\{\\{\\s*${variable}(?:::[^}]*)?\\s*\\}\\}`, 'g')
            filledContent = filledContent.replace(regex, value || `{{${variable}}}`)
        }
        onCopy(filledContent)
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleCopy()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        <h2 className="text-lg font-semibold text-foreground">Fill Variables</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Prompt Title */}
                <p className="mb-4 text-sm text-muted-foreground">
                    Filling variables for: <span className="font-medium text-foreground">{promptTitle}</span>
                </p>

                {/* Variable Inputs */}
                <div className="mb-6 space-y-4 max-h-[300px] overflow-y-auto">
                    {variables.map((varInfo, index) => (
                        <div key={varInfo.name}>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">
                                    {varInfo.name}
                                </label>
                                {varInfo.defaultValue && (
                                    <button
                                        onClick={() => handleReset(varInfo.name)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        title="Reset to default"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Reset
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={values[varInfo.name] || ''}
                                onChange={(e) => handleValueChange(varInfo.name, e.target.value)}
                                placeholder={varInfo.defaultValue || `Enter ${varInfo.name}...`}
                                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                                autoFocus={index === 0}
                            />
                            {varInfo.defaultValue && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Default: {varInfo.defaultValue}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                    >
                        <Copy className="h-4 w-4" />
                        Copy
                    </button>
                </div>

                {/* Hint */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Press <kbd className="rounded bg-secondary px-1.5 py-0.5">Ctrl</kbd> + <kbd className="rounded bg-secondary px-1.5 py-0.5">Enter</kbd> to copy
                    {Object.keys(storedValues).length > 0 && (
                        <span className="block mt-1 text-accent">Values remembered from last use</span>
                    )}
                </p>
            </div>
        </div>
    )
}
