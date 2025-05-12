import { createI18n } from 'vue-i18n'
import vi from './locales/vi.json'
import en from './locales/en.json'

// Use the main locale files directly
const viMessages = vi
const enMessages = en

const i18n = createI18n({
  legacy: false,
  locale: 'vi', // Mặc định là tiếng Việt
  fallbackLocale: 'en',
  messages: {
    vi: viMessages,
    en: enMessages
  }
})

export default i18n
