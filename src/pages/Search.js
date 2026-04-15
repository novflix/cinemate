import { useNavigate } from 'react-router-dom';
import { useMovieModal } from '../hooks/useMovieModal';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MagniferLinear, CloseCircleLinear, FilterLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme } from '../theme';
import { useStore } from '../store';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import './Search.css';

const GENRES = [
  { id: 28,    ru: 'Экшен',       en: 'Action' },
  { id: 35,    ru: 'Комедия',     en: 'Comedy' },
  { id: 18,    ru: 'Драма',       en: 'Drama' },
  { id: 27,    ru: 'Ужасы',       en: 'Horror' },
  { id: 10749, ru: 'Романтика',   en: 'Romance' },
  { id: 878,   ru: 'Фантастика',  en: 'Sci-Fi' },
  { id: 16,    ru: 'Мультфильм',  en: 'Animation' },
  { id: 53,    ru: 'Триллер',     en: 'Thriller' },
  { id: 12,    ru: 'Приключения', en: 'Adventure' },
  { id: 14,    ru: 'Фэнтези',     en: 'Fantasy' },
  { id: 80,    ru: 'Криминал',    en: 'Crime' },
  { id: 99,    ru: 'Документалка',en: 'Documentary' },
  { id: 9648,  ru: 'Мистика',     en: 'Mystery' },
  { id: 10751, ru: 'Семейный',    en: 'Family' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc',    ru: 'По популярности',  en: 'Most popular' },
  { value: 'vote_average.desc',  ru: 'По рейтингу',      en: 'Highest rated' },
  { value: 'release_date.desc',  ru: 'Сначала новые',    en: 'Newest first' },
  { value: 'release_date.asc',   ru: 'Сначала старые',   en: 'Oldest first' },
];

const YEAR_NOW = new Date().getFullYear();
const YEAR_RANGES = [
  { label: '2020–' + YEAR_NOW, gte: '2020-01-01', lte: null },
  { label: '2010–2019',        gte: '2010-01-01', lte: '2019-12-31' },
  { label: '2000–2009',        gte: '2000-01-01', lte: '2009-12-31' },
  { label: '1990–1999',        gte: '1990-01-01', lte: '1999-12-31' },
  { label: 'До 1990',          gte: null,         lte: '1989-12-31' },
];

const TYPE_OPTIONS = [
  { value: 'all',   ru: 'Всё',      en: 'All' },
  { value: 'movie', ru: 'Фильмы',   en: 'Movies' },
  { value: 'tv',    ru: 'Сериалы',  en: 'Series' },
];

// ─── Session-level search result cache ───────────────────────────────────────
// Key: `${query}|${langCode}|${type}|${page}`, Value: results array
const _searchCache = new Map();
const MAX_CACHE_SIZE = 60;

function cacheSet(key, value) {
  if (_searchCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    _searchCache.delete(_searchCache.keys().next().value);
  }
  _searchCache.set(key, value);
}

// ─── Title match scoring ──────────────────────────────────────────────────────
// Mirrors how Letterboxd / JustWatch approach text relevance:
// 1. Exact match on any title variant beats everything
// 2. Prefix match (user typed the start of the title)
// 3. Whole-word boundary match inside the title
// 4. Any substring hit
// Then boosted by a calibrated popularity signal and penalised for
// zero-vote garbage — but NOT penalised simply for being old (classic films
// like "Metropolis" should still surface if the user types them exactly).
function scoreRelevance(m, query) {
  const q = query.toLowerCase().trim();
  const qLen = q.length;

  // All title variants we check
  const title    = (m.title          || '').toLowerCase();
  const name     = (m.name           || '').toLowerCase();
  const origT    = (m.original_title || '').toLowerCase();
  const origN    = (m.original_name  || '').toLowerCase();
  const titles   = [title, name, origT, origN].filter(Boolean);

  let matchTier = 0; // higher = better

  for (const t of titles) {
    if (t === q)              { matchTier = Math.max(matchTier, 6); break; }
    if (t.startsWith(q + ' ') || t === q) { matchTier = Math.max(matchTier, 5); }
    else if (t.startsWith(q)) { matchTier = Math.max(matchTier, 4); }
  }

  if (matchTier < 4) {
    // Word-boundary check — e.g. query "ring" should match "The Ring" at word start
    const wbRe = new RegExp('(?:^|\\s)' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    for (const t of titles) {
      if (wbRe.test(t)) { matchTier = Math.max(matchTier, 3); break; }
    }
  }

  if (matchTier < 3) {
    for (const t of titles) {
      if (t.includes(q)) { matchTier = Math.max(matchTier, 2); break; }
    }
  }

  if (matchTier < 2) {
    // Short query (≤3 chars): require word-boundary to avoid noise
    if (qLen >= 4) {
      for (const t of titles) {
        if (t.includes(q)) { matchTier = Math.max(matchTier, 1); break; }
      }
    }
  }

  // Tier base scores — large gaps so popularity never flips tiers
  const TIER_SCORES = [0, 200, 1000, 3000, 8000, 20000, 50000];
  let score = TIER_SCORES[matchTier];

  // ── Popularity signal (log scale, bounded) ───────────────────────────────
  const pop = m.popularity || 0;
  score += Math.min(Math.log10(Math.max(pop, 1)) * 60, 400);

  // ── Vote count signal — more votes = more credible ───────────────────────
  const votes = m.vote_count || 0;
  if      (votes === 0)     score -= 400; // completely unrated, likely junk
  else if (votes < 5)       score -= 200;
  else if (votes < 20)      score -= 80;
  else if (votes >= 1000)   score += 120;
  else if (votes >= 300)    score += 60;
  else if (votes >= 100)    score += 20;

  // ── Rating boost — higher rating = higher priority ───────────────────────
  const rating = m.vote_average || 0;
  if (votes >= 50) {
    if      (rating >= 9.0) score += 400;
    else if (rating >= 8.5) score += 300;
    else if (rating >= 8.0) score += 220;
    else if (rating >= 7.5) score += 150;
    else if (rating >= 7.0) score += 90;
    else if (rating >= 6.5) score += 40;
  }

  // ── Recency bonus — newer projects get a boost for non-exact matches ─────
  if (matchTier < 5) {
    const dateStr = m.release_date || m.first_air_date || '';
    const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
    if (year) {
      if      (year >= YEAR_NOW - 1) score += 120;
      else if (year >= YEAR_NOW - 3) score += 70;
      else if (year >= YEAR_NOW - 6) score += 30;
    }
  }

  return score;
}

// ─── Deduplicated result accumulator ─────────────────────────────────────────
function makeAccumulator() {
  const seen = new Map();
  return {
    add(items, mediaType) {
      (items || []).forEach(m => {
        if (!m.poster_path) return;
        const type = m.media_type || mediaType;
        const key  = `${m.id}-${type}`;
        if (!seen.has(key)) seen.set(key, { ...m, media_type: type });
      });
    },
    values() { return [...seen.values()]; },
  };
}

// ─── Core search function ─────────────────────────────────────────────────────
// Strategy (mirrors how JustWatch / TMDB's own UI works):
//
// 1. Use /search/multi as the primary source — it covers movies, TV, people
//    in one request and TMDB's own backend handles ngram/translation matching.
//    This means "Terminator" typed in Russian UI still surfaces English results.
//
// 2. Simultaneously fetch /search/movie and /search/tv as supplementary
//    sources (page 1 only) — they sometimes surface different results due
//    to TMDB's different ranking per-endpoint.
//
// 3. Merge and deduplicate by (id, media_type).
//
// 4. Year detection: if query contains a 4-digit year, add a dedicated
//    discover pass with that year constraint.
//
// 5. Re-rank with scoreRelevance only when the user hasn't chosen a
//    custom sort.  Custom sort (e.g. vote_average.desc) overrides entirely.
//
// 6. Filter (genre, year range, type) is applied client-side after merge.

async function enhancedSearch(query, langCode, filters, page = 1, signal) {
  const q = query.trim();
  const hasFilters = filters.genres.length > 0 || filters.yearRange ||
    filters.sort !== 'popularity.desc' || filters.type !== 'all';

  // ── Pure-filter browse (no text query) ────────────────────────────────────
  if (!q && hasFilters) {
    const cacheKey = `browse|${JSON.stringify(filters)}|${langCode}|${page}`;
    if (_searchCache.has(cacheKey)) return _searchCache.get(cacheKey);

    const results = [];
    const params = new URLSearchParams({
      language: langCode,
      sort_by: filters.sort,
      'vote_count.gte': '30',
      page: String(page),
    });
    if (filters.genres.length) params.set('with_genres', filters.genres.join(','));

    const types = filters.type === 'all' ? ['movie', 'tv'] : [filters.type];
    await Promise.all(types.map(async type => {
      const dateParam = type === 'tv' ? 'first_air_date' : 'primary_release_date';
      const p = new URLSearchParams(params);
      if (filters.yearRange?.gte) p.set(`${dateParam}.gte`, filters.yearRange.gte);
      if (filters.yearRange?.lte) p.set(`${dateParam}.lte`, filters.yearRange.lte);
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/${type}?${p}`, {
          headers: HEADERS, signal,
        }).then(r => r.json());
        (r.results || []).filter(m => m.poster_path).forEach(m =>
          results.push({ ...m, media_type: type })
        );
      } catch (e) { if (e?.name !== 'AbortError') console.warn(e); }
    }));

    const out = results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    cacheSet(cacheKey, out);
    return out;
  }

  if (!q) return [];

  const cacheKey = `q|${q}|${langCode}|${filters.type}|${page}`;
  if (_searchCache.has(cacheKey)) {
    let cached = _searchCache.get(cacheKey);
    cached = applyFiltersAndSort(cached, filters, q);
    return cached;
  }

  const acc = makeAccumulator();

  // On page 1 we cast a wider net to get better re-ranking candidates.
  // On subsequent pages we just advance through multi.
  const multiPages = page === 1 ? [1, 2] : [page + 1]; // page+1 because pages 1+2 were already fetched

  const fetches = [];

  // Primary: /search/multi (covers both movie + tv + person in one shot,
  // includes translated/alternative titles in TMDB's own ranking)
  const typeParam = filters.type !== 'all' ? `&include_adult=false` : '';
  multiPages.forEach(pg => {
    fetches.push(
      fetch(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=${langCode}&page=${pg}${typeParam}`,
        { headers: HEADERS, signal }
      )
        .then(r => r.json())
        .then(r => acc.add(r.results, null))
        .catch(e => { if (e?.name !== 'AbortError') console.warn(e); })
    );
  });

  // Supplementary: per-type search (page 1 only; additional pages come from multi)
  if (page === 1) {
    const types = filters.type === 'all' ? ['movie', 'tv'] : [filters.type];
    types.forEach(type => {
      fetches.push(
        fetch(
          `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(q)}&language=${langCode}&page=1`,
          { headers: HEADERS, signal }
        )
          .then(r => r.json())
          .then(r => acc.add(r.results, type))
          .catch(e => { if (e?.name !== 'AbortError') console.warn(e); })
      );
    });

    // English fallback: if UI language is not English, also fetch English results.
    // This ensures "Ведьмак" typed in Russian still finds "The Witcher" via the
    // English multi endpoint (TMDB sometimes misses CJK/Cyrillic → Latin mappings).
    if (langCode !== 'en-US') {
      fetches.push(
        fetch(
          `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=en-US&page=1`,
          { headers: HEADERS, signal }
        )
          .then(r => r.json())
          .then(r => acc.add(r.results, null))
          .catch(e => { if (e?.name !== 'AbortError') console.warn(e); })
      );
    }
  }

  // Year-in-query pass: "Dune 2021" → targeted discover
  const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch && page === 1) {
    const year = yearMatch[1];
    const rest = q.replace(year, '').trim();
    const types = filters.type === 'all' ? ['movie', 'tv'] : [filters.type];
    types.forEach(type => {
      const dateField = type === 'tv' ? 'first_air_date_year' : 'primary_release_year';
      const endpoint = rest
        ? `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(rest)}&${dateField}=${year}&language=${langCode}&page=1`
        : `https://api.themoviedb.org/3/discover/${type}?${dateField}=${year}&sort_by=popularity.desc&language=${langCode}&page=1`;
      fetches.push(
        fetch(endpoint, { headers: HEADERS, signal })
          .then(r => r.json())
          .then(r => acc.add(r.results, type))
          .catch(e => { if (e?.name !== 'AbortError') console.warn(e); })
      );
    });
  }

  await Promise.all(fetches);

  const raw = acc.values();
  cacheSet(cacheKey, raw);

  return applyFiltersAndSort(raw, filters, q);
}

// ─── Filter + sort (pure, no fetching) ───────────────────────────────────────
function applyFiltersAndSort(items, filters, q) {
  let arr = [...items];

  // Remove unrated entries (vote_average === 0) — they add noise with no signal
  arr = arr.filter(m => (m.vote_average || 0) > 0);

  // Type filter (multi may return persons — exclude them)
  if (filters.type !== 'all') {
    arr = arr.filter(m => m.media_type === filters.type);
  } else {
    // Always exclude persons from results grid (they go to the actors tab)
    arr = arr.filter(m => m.media_type !== 'person');
  }

  // Genre filter
  if (filters.genres.length) {
    arr = arr.filter(m => (m.genre_ids || []).some(g => filters.genres.includes(g)));
  }

  // Year range filter
  if (filters.yearRange) {
    arr = arr.filter(m => {
      const date = m.release_date || m.first_air_date || '';
      if (!date) return false;
      if (filters.yearRange.gte && date < filters.yearRange.gte) return false;
      if (filters.yearRange.lte && date > filters.yearRange.lte) return false;
      return true;
    });
  }

  // Sort
  if (filters.sort === 'vote_average.desc') {
    arr.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  } else if (filters.sort === 'release_date.desc') {
    arr.sort((a, b) =>
      (b.release_date || b.first_air_date || '').localeCompare(
        a.release_date || a.first_air_date || ''
      )
    );
  } else if (filters.sort === 'release_date.asc') {
    arr.sort((a, b) =>
      (a.release_date || a.first_air_date || '').localeCompare(
        b.release_date || b.first_air_date || ''
      )
    );
  } else {
    // Default: relevance — always applied when there's a text query
    if (q) {
      arr.sort((a, b) => scoreRelevance(b, q) - scoreRelevance(a, q));
    } else {
      arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
  }

  return arr;
}

// ─── Actor search ─────────────────────────────────────────────────────────────
async function searchActors(query, langCode, watched, signal) {
  if (!query.trim()) return [];
  const cacheKey = `actors|${query.trim().toLowerCase()}|${langCode}`;
  if (_searchCache.has(cacheKey)) return _searchCache.get(cacheKey);
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&language=${langCode}&page=1`,
      { headers: HEADERS, signal }
    ).then(r => r.json());
    const watchedSet = new Set(watched.map(m => m.id));
    const out = (r.results || [])
      .filter(a => a.profile_path && a.known_for_department === 'Acting')
      .map(a => ({
        ...a,
        _watchedCount: (a.known_for || []).filter(m => watchedSet.has(m.id)).length,
      }))
      .sort((a, b) => b._watchedCount - a._watchedCount || (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20);
    cacheSet(cacheKey, out);
    return out;
  } catch (e) {
    if (e?.name !== 'AbortError') console.warn(e);
    return [];
  }
}

const DEFAULT_FILTERS = { genres: [], yearRange: null, sort: 'popularity.desc', type: 'all' };

const SEARCH_LANG_MAP = {
  ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR',
  de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN',
};

export default function Search() {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { selected, openMovie, closeMovie } = useMovieModal();
  const navigate = useNavigate();
  const [popular,     setPopular]     = useState([]);
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [searchTab,   setSearchTab]   = useState('movies'); // 'movies' | 'actors'
  const [actorResults,setActorResults]= useState([]);

  const movieAbort   = useRef(null);
  const actorAbort   = useRef(null);
  const movieTimer   = useRef();
  const actorTimer   = useRef();
  const loaderRef    = useRef(null);
  const loadingMoreRef = useRef(false);

  const { lang } = useTheme();
  const { t }    = useTranslation();
  const { watched } = useStore();
  const langCode = SEARCH_LANG_MAP[lang] || 'en-US';

  const setFilter = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleGenre = useCallback((id) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(id)
        ? prev.genres.filter(g => g !== id)
        : [...prev.genres, id],
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount =
    filters.genres.length +
    (filters.yearRange ? 1 : 0) +
    (filters.sort !== 'popularity.desc' ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0);

  // Trending on empty state
  useEffect(() => {
    if (!query.trim() && activeFilterCount === 0) {
      tmdb.trending('all', 'day')
        .then(r => setPopular(r.results?.filter(m => m.poster_path).slice(0, 20) || []))
        .catch(() => {});
    }
  }, [lang, query, activeFilterCount]);

  // ── Main search effect ──────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(movieTimer.current);
    const hasFilters = activeFilterCount > 0;

    if (!query.trim() && !hasFilters) {
      // Cancel any in-flight request
      movieAbort.current?.abort();
      setResults([]);
      setLoading(false);
      setPage(1);
      setHasMore(true);
      return;
    }

    setLoading(true);
    setPage(1);
    setHasMore(true);

    // Debounce: 300 ms for typing responsiveness
    movieTimer.current = setTimeout(async () => {
      // Cancel previous request
      movieAbort.current?.abort();
      const controller = new AbortController();
      movieAbort.current = controller;

      try {
        const r = await enhancedSearch(query, langCode, filters, 1, controller.signal);
        if (controller.signal.aborted) return;
        setResults(r);
        setLoading(false);
        setHasMore(r.length >= 10);
      } catch (e) {
        if (e?.name !== 'AbortError') {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(movieTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, langCode, JSON.stringify(filters)]);

  // ── Load more (infinite scroll) ─────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    const hasFilters = activeFilterCount > 0;
    if (!query.trim() && !hasFilters) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const controller = new AbortController();
    const nextPage = page + 1;

    try {
      const r = await enhancedSearch(query, langCode, filters, nextPage, controller.signal);
      setResults(prev => {
        const existing = new Set(prev.map(m => `${m.id}-${m.media_type}`));
        return [...prev, ...r.filter(m => !existing.has(`${m.id}-${m.media_type}`))];
      });
      setPage(nextPage);
      setHasMore(r.length >= 5);
    } catch (e) {
      if (e?.name !== 'AbortError') console.warn(e);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [page, hasMore, query, langCode, filters, activeFilterCount]);

  // Intersection observer
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // ── Actor search effect ──────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(actorTimer.current);
    if (!query.trim() || searchTab !== 'actors') {
      actorAbort.current?.abort();
      setActorResults([]);
      return;
    }
    setLoading(true);
    actorTimer.current = setTimeout(async () => {
      actorAbort.current?.abort();
      const controller = new AbortController();
      actorAbort.current = controller;
      try {
        const r = await searchActors(query, langCode, watched, controller.signal);
        if (controller.signal.aborted) return;
        setActorResults(r);
        setLoading(false);
      } catch (e) {
        if (e?.name !== 'AbortError') setLoading(false);
      }
    }, 300);
    return () => clearTimeout(actorTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, langCode, searchTab]);

  const handleActorClick = (actor) => navigate(`/actor/${actor.id}`, { state: { actor } });

  const showingFiltered = query.trim() || activeFilterCount > 0;
  const displayed       = showingFiltered ? results : popular;
  const isEmpty         = showingFiltered && !loading && results.length === 0;

  return (
    <div className="page search-page">
      <div className="search-header">
        <h1 className="search-header__title">{t('search.title')}</h1>

        <div className="search-top-row">
          <div className="search-bar">
            <MagniferLinear size={16} className="search-bar__icon"/>
            <input
              className="search-bar__input"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off" spellCheck="false"
            />
            {query && (
              <button className="search-bar__clear" onClick={() => setQuery('')}>
                <CloseCircleLinear size={14}/>
              </button>
            )}
          </div>

          <button
            className={
              'search-filter-btn' +
              (showFilters ? ' active' : '') +
              (activeFilterCount ? ' has-active' : '')
            }
            onClick={() => setShowFilters(v => !v)}
          >
            <FilterLinear size={16}/>
            {activeFilterCount > 0 && (
              <span className="search-filter-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="search-filters">
            {/* Type */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t('search.type')}</span>
              <div className="search-filter-chips">
                {TYPE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={'search-chip' + (filters.type === o.value ? ' active' : '')}
                    onClick={() => setFilter('type', o.value)}
                  >
                    {lang === 'ru' ? o.ru : o.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t('search.sort')}</span>
              <div className="search-filter-chips">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={'search-chip' + (filters.sort === o.value ? ' active' : '')}
                    onClick={() => setFilter('sort', o.value)}
                  >
                    {lang === 'ru' ? o.ru : o.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t('search.year')}</span>
              <div className="search-filter-chips">
                {YEAR_RANGES.map((r, i) => (
                  <button
                    key={i}
                    className={'search-chip' + (filters.yearRange === r ? ' active' : '')}
                    onClick={() => setFilter('yearRange', filters.yearRange === r ? null : r)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t('search.genres')}</span>
              <div className="search-filter-chips search-filter-chips--wrap">
                {GENRES.map(g => (
                  <button
                    key={g.id}
                    className={'search-chip' + (filters.genres.includes(g.id) ? ' active' : '')}
                    onClick={() => toggleGenre(g.id)}
                  >
                    {lang === 'ru' ? g.ru : g.en}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button className="search-filter-clear" onClick={clearFilters}>
                {t('search.clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {!showingFiltered && (
        <h3 className="search-trending-label">{t('search.trendingToday')}</h3>
      )}
      {showingFiltered && !loading && results.length > 0 && searchTab === 'movies' && (
        <p className="search-results-count">
          {t('search.found', { count: results.length })}
        </p>
      )}

      {/* Tabs */}
      {query.trim() && (
        <div className="search-tabs">
          <button
            className={'search-tab-btn' + (searchTab === 'movies' ? ' active' : '')}
            onClick={() => setSearchTab('movies')}
          >
            {t('search.moviesAndShows')}
          </button>
          <button
            className={'search-tab-btn' + (searchTab === 'actors' ? ' active' : '')}
            onClick={() => setSearchTab('actors')}
          >
            {t('search.actors')}
          </button>
        </div>
      )}

      {loading && (
        <div className="search-loading">
          <div className="search-loading__spinner"/>
        </div>
      )}

      {isEmpty && searchTab === 'movies' && (
        <div className="search-empty">
          <MagniferLinear size={32} strokeWidth={1}/>
          {!query.trim() && activeFilterCount > 0 ? (
            <>
              <p>{t('search.adjustFilters')}</p>
              <p className="search-empty__hint">{t('search.orTypeTitle')}</p>
            </>
          ) : (
            <>
              <p>{t('search.nothingFor', { query: query || t('search.selectedFilters') })}</p>
              <p className="search-empty__hint">{t('search.tryChanging')}</p>
            </>
          )}
        </div>
      )}

      {/* Actor results */}
      {searchTab === 'actors' && !loading && actorResults.length > 0 && (
        <div className="search-actors-grid">
          {actorResults.map(a => (
            <div key={a.id} className="search-actor-card" onClick={() => handleActorClick(a)}>
              <div className="search-actor-card__avatar">
                <img
                  src={`https://image.tmdb.org/t/p/w185${a.profile_path}`}
                  alt={a.name}
                />
              </div>
              <p className="search-actor-card__name">{a.name}</p>
              {a._watchedCount > 0 && (
                <p className="search-actor-card__watched">
                  {t('search.actorWatched', { count: a._watchedCount })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {searchTab === 'actors' && !loading && query.trim() && actorResults.length === 0 && (
        <div className="search-empty">
          <MagniferLinear size={32} strokeWidth={1}/>
          <p>{t('search.noActorsFor', { query })}</p>
        </div>
      )}

      {/* Movies/TV grid */}
      {!loading && searchTab === 'movies' && displayed.length > 0 && (
        <div className="search-grid">
          {displayed.map(m => (
            <div key={`${m.id}-${m.media_type}`}>
              <MovieCard movie={m} onClick={openMovie}/>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {showingFiltered && (
        <>
          <div ref={loaderRef} style={{ height: 40 }}/>
          {loadingMore && (
            <div className="search-loading" style={{ padding: '12px 0' }}>
              <div className="search-loading__spinner"/>
            </div>
          )}
        </>
      )}

      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onActorClick={a => { handleActorClick(a); }}
        onCrewClick={p => { navigate(`/person/${p.id}`, { state: { person: p } }); }}
        onStudioClick={s => { navigate(`/studio/${s.id}`, { state: { studio: s } }); }}
      />
    </div>
  );
}