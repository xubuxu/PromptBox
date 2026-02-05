import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <ThemeProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </ThemeProvider>
    </React.StrictMode>
)

