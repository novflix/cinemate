import { useState, useEffect, useRef } from 'react';
import { HEADERS } from './api';

// In-memory cache: "id-mediaType-lang" -> localized movie object
const memCache = {};

// localStorage cache key
const LC_KEY = 'tmdb_locale_cache';

// Load persisted cache from localStorage (with size eviction on load)
let persistedCache = {};
try {
  const raw = localStorage.getItem(LC_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    // Guard: must be a plain object, not an array or primitive
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      if (keys.length > 300) {
        // Evict oldest entries on load so the cache never silently bloats
        keys.slice(0, keys.length - 300).forEach(k => delete parsed[k]);
      }
      persistedCache = parsed;
    }
  }
} catch {
  // Corrupted cache — start fresh
  try { localStorage.removeItem(LC_KEY); } catch {}
}

let _saveCacheTimer = null;
function savePersistedCache() {
  // Debounce: don't thrash localStorage on rapid sequential fetches
  if (_saveCacheTimer) return;
  _saveCacheTimer = setTimeout(() => {
    _saveCacheTimer = null;
    try {
      const keys = Object.keys(persistedCache);
      if (keys.length > 300) {
        const drop = keys.slice(0, keys.length - 300);
        drop.forEach(k => delete persistedCache[k]);
      }
      localStorage.setItem(LC_KEY, JSON.stringify(persistedCache));
    } catch {}
  }, 2000);
}

async function fetchLocalized(id, mediaType, langCode) {
  const cacheKey = `${id}-${mediaType}-${langCode}`;

  // Check memory cache first
  if (memCache[cacheKey]) return memCache[cacheKey];
  // Check persisted cache
  if (persistedCache[cacheKey]) {
    memCache[cacheKey] = persistedCache[cacheKey];
    return persistedCache[cacheKey];
  }

  try {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?language=${langCode}`;
    const data = await fetch(url, { headers: HEADERS }).then(r => r.json());
    const result = {
      id,
      media_type: mediaType,
      title:        data.title        || data.name || '',
      name:         data.name         || data.title || '',
      overview:     data.overview     || '',
      poster_path:  data.poster_path  || null,
      backdrop_path:data.backdrop_path|| null,
      vote_average: data.vote_average || 0,
      vote_count:   data.vote_count   || 0,
      release_date:     data.release_date      || null,
      first_air_date:   data.first_air_date     || null,
      genre_ids:    data.genre_ids    || (data.genres?.map(g => g.id) || []),
    };
    memCache[cacheKey] = result;
    persistedCache[cacheKey] = result;
    savePersistedCache();
    return result;
  } catch {
    return null;
  }
}

// Hook: given a list of stored (language-neutral) entries,
// returns them hydrated with localized data in the current language.
// Shows fallback data instantly, replaces with real data as fetches complete.
// Maps app language codes to TMDB language codes (must match TMDB_LANG_MAP in api.js)
const TMDB_LANG_MAP = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  it: 'it-IT',
  tr: 'tr-TR',
  zh: 'zh-CN',
};

export function useLocalizedMovies(entries, lang) {
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';
  const [localized, setLocalized] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Per-run cancelled flag — prevents stale fetches from overwriting fresh state
    let cancelled = false;

    if (!entries.length) { setLocalized([]); return () => { cancelled = true; }; }

    // Build initial list from cache for the CURRENT language (instant, no flicker)
    const initial = entries.map(entry => {
      const cacheKey = `${entry.id}-${entry.media_type}-${langCode}`;
      const cached = memCache[cacheKey] || persistedCache[cacheKey];
      if (cached) return { ...entry, ...cached };
      // Fallback: show stored data with fallback title
      return {
        ...entry,
        title: entry._fallback_title || entry.title || '',
        name:  entry._fallback_title || entry.name  || '',
      };
    });
    // Set immediately so language change shows cached translations instantly
    setLocalized(initial);

    // Fetch entries not yet in cache for this language
    const missing = entries.filter(e => {
      const k = `${e.id}-${e.media_type}-${langCode}`;
      return !memCache[k] && !persistedCache[k];
    });

    if (!missing.length) return () => { cancelled = true; };

    // Fetch in batches to avoid hammering API
    const BATCH = 10;
    let i = 0;
    const next = async () => {
      const batch = missing.slice(i, i + BATCH);
      i += BATCH;
      await Promise.all(batch.map(e => fetchLocalized(e.id, e.media_type, langCode)));
      if (cancelled || !mountedRef.current) return;
      // Update state with newly fetched data for current langCode only
      setLocalized(prev => prev.map(item => {
        const k = `${item.id}-${item.media_type}-${langCode}`;
        const fresh = memCache[k];
        return fresh ? { ...item, ...fresh } : item;
      }));
      if (i < missing.length) next();
    };
    next();

    return () => { cancelled = true; };
  }, [entries, langCode]);

  return localized;
}