import { useState, useEffect, useRef } from 'react';
import { HEADERS } from './api';

// In-memory cache: "id-mediaType-lang" -> localized movie object
const memCache = {};

// localStorage cache key
const LC_KEY = 'tmdb_locale_cache';

// Load persisted cache from localStorage
let persistedCache = {};
try {
  const raw = localStorage.getItem(LC_KEY);
  if (raw) persistedCache = JSON.parse(raw);
} catch {}

function savePersistedCache() {
  try {
    // Keep only last 200 entries to avoid bloat
    const keys = Object.keys(persistedCache);
    if (keys.length > 200) {
      const drop = keys.slice(0, keys.length - 200);
      drop.forEach(k => delete persistedCache[k]);
    }
    localStorage.setItem(LC_KEY, JSON.stringify(persistedCache));
  } catch {}
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
export function useLocalizedMovies(entries, lang) {
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';
  const [localized, setLocalized] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!entries.length) { setLocalized([]); return; }

    // Build initial list from cache (instant, no flicker)
    const initial = entries.map(entry => {
      const cacheKey = `${entry.id}-${entry.media_type}-${langCode}`;
      const cached = memCache[cacheKey] || persistedCache[cacheKey];
      if (cached) return { ...entry, ...cached };
      // Fallback: show stored data with fallback title
      return {
        ...entry,
        title: entry._fallback_title || '',
        name:  entry._fallback_title || '',
      };
    });
    setLocalized(initial);

    // Fetch missing ones in parallel
    const missing = entries.filter(e => {
      const k = `${e.id}-${e.media_type}-${langCode}`;
      return !memCache[k] && !persistedCache[k];
    });

    if (!missing.length) return;

    // Fetch in batches to avoid hammering API
    const BATCH = 6;
    let i = 0;
    const next = async () => {
      const batch = missing.slice(i, i + BATCH);
      i += BATCH;
      await Promise.all(batch.map(e => fetchLocalized(e.id, e.media_type, langCode)));
      if (!mountedRef.current) return;
      // Update state with newly fetched data
      setLocalized(prev => prev.map(item => {
        const k = `${item.id}-${item.media_type}-${langCode}`;
        const fresh = memCache[k];
        return fresh ? { ...item, ...fresh } : item;
      }));
      if (i < missing.length) next();
    };
    next();
  }, [entries, langCode]);

  return localized;
}