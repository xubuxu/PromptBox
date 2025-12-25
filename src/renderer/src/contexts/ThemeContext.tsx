import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'
type UiStyle = 'elevated' | 'gradient'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    uiStyle: UiStyle
    setUiStyle: (style: UiStyle) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_KEY = 'promptbox-theme'
const UI_STYLE_KEY = 'promptbox-ui-style'

/**
 * Get initial theme from localStorage or default to light
 */
function getInitialTheme(): Theme {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(THEME_KEY)
        if (stored === 'light' || stored === 'dark') {
            return stored
        }
    }
    return 'light'
}

/**
 * Get initial UI style from localStorage or default to elevated
 */
function getInitialUiStyle(): UiStyle {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(UI_STYLE_KEY)
        if (stored === 'elevated' || stored === 'gradient') {
            return stored
        }
    }
    return 'elevated'
}

interface ThemeProviderProps {
    children: ReactNode
}

/**
 * Theme provider component
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)
    const [uiStyle, setUiStyleState] = useState<UiStyle>(getInitialUiStyle)

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    // Apply UI style to document
    useEffect(() => {
        document.documentElement.setAttribute('data-ui-style', uiStyle)
        localStorage.setItem(UI_STYLE_KEY, uiStyle)
    }, [uiStyle])

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }

    const setUiStyle = (style: UiStyle) => {
        setUiStyleState(style)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, uiStyle, setUiStyle }}>
            {children}
        </ThemeContext.Provider>
    )
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
