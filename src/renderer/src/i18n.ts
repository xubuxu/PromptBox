import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'
import zh from './locales/zh'

// Check if there is a saved language in localStorage, otherwise default to 'en'
// NOTE: Since this is Electron, we could also check app.getLocale() from main process ideally,
// but for simplicity we'll start with 'en' or localStorage.
const savedLanguage = localStorage.getItem('language') || 'en'

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh }
        },
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // not needed for react as it escapes by default
        }
    })

export default i18n
