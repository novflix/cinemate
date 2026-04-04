import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

// ─── Supported languages ───────────────────────────────────────────────────
// To add a new language:
//   1. Create src/i18n/locales/<code>.json  (copy en.json as a template)
//   2. Add it to SUPPORTED_LANGUAGES below
//   3. Import the JSON above and add it to `resources`
//   4. Add the TMDB language code to TMDB_LANG_MAP in api.js
// ──────────────────────────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'en', label: 'English',    flag: '🇪🇳' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  // Example future additions:
  // { code: 'pt', label: 'Português', flag: '🇧🇷' },
  // { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
  // { code: 'zh', label: '中文',       flag: '🇨🇳' },
  // { code: 'ja', label: '日本語',     flag: '🇯🇵' },
  // { code: 'ko', label: '한국어',     flag: '🇰🇷' },
  // { code: 'ar', label: 'العربية',   flag: '🇸🇦' },
  // { code: 'tr', label: 'Türkçe',    flag: '🇹🇷' },
];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
    },
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;