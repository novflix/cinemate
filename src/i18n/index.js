import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import tr from './locales/tr.json';
import zh from './locales/zh.json';

// ─── Supported languages ───────────────────────────────────────────────────
// To add a new language:
//   1. Create src/i18n/locales/<code>.json  (copy en.json as a template)
//   2. Add it to SUPPORTED_LANGUAGES below
//   3. Import the JSON above and add it to `resources`
//   4. Add the TMDB language code to TMDB_LANG_MAP in api.js
// ──────────────────────────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  { code: 'ru', label: 'Русский',    countryCode: 'ru' },
  { code: 'en', label: 'English',    countryCode: 'gb' },
  { code: 'es', label: 'Español',    countryCode: 'es' },
  { code: 'fr', label: 'Français',   countryCode: 'fr' },
  { code: 'de', label: 'Deutsch',    countryCode: 'de' },
  { code: 'pt', label: 'Português',  countryCode: 'pt' },
  { code: 'it', label: 'Italiano',   countryCode: 'it' },
  { code: 'tr', label: 'Türkçe',     countryCode: 'tr' },
  { code: 'zh', label: '中文',        countryCode: 'cn' },
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
      pt: { translation: pt },
      it: { translation: it },
      tr: { translation: tr },
      zh: { translation: zh },
    },
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;