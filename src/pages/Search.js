import { useState, useEffect, useRef, useCallback } from 'react';
import { MagniferLinear, CloseCircleLinear, FilterLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
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

async function enhancedSearch(query, langCode, filters) {
  const q = query.trim();
  const hasFilters = filters.genres.length > 0 || filters.yearRange || filters.sort !== 'popularity.desc' || filters.type !== 'all';

  // Pure filter browse (no query)
  if (!q && hasFilters) {
    const results = [];
    const params = new URLSearchParams({
      language: langCode,
      sort_by: filters.sort,
      'vote_count.gte': '50',
    });
    if (filters.genres.length) params.set('with_genres', filters.genres.join(','));
    if (filters.yearRange?.gte) params.set('primary_release_date.gte', filters.yearRange.gte);
    if (filters.yearRange?.lte) params.set('primary_release_date.lte', filters.yearRange.lte);

    const types = filters.type === 'all' ? ['movie', 'tv'] : [filters.type];
    await Promise.all(types.map(async type => {
      const dateParam = type === 'tv' ? 'first_air_date' : 'primary_release_date';
      const p = new URLSearchParams(params);
      if (filters.yearRange?.gte) { p.delete('primary_release_date.gte'); p.set(`${dateParam}.gte`, filters.yearRange.gte); }
      if (filters.yearRange?.lte) { p.delete('primary_release_date.lte'); p.set(`${dateParam}.lte`, filters.yearRange.lte); }
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/${type}?${p}`, { headers: HEADERS }).then(r => r.json());
        (r.results || []).filter(m => m.poster_path).forEach(m => results.push({ ...m, media_type: type }));
      } catch {}
    }));
    return results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  if (!q) return [];

  const seen = new Map();
  const add = (arr, type) => arr.forEach(m => {
    if (!m.poster_path) return;
    const key = `${m.id}-${type || m.media_type}`;
    if (!seen.has(key)) seen.set(key, { ...m, media_type: m.media_type || type });
  });

  const types = filters.type === 'all' ? ['movie', 'tv'] : [filters.type];

  // Text search
  await Promise.all(types.map(async type => {
    try {
      const r = await fetch(`https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(q)}&language=${langCode}`, { headers: HEADERS }).then(r => r.json());
      add(r.results || [], type);
    } catch {}
  }));

  // Year detection
  const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const year = yearMatch[1];
    const rest = q.replace(year, '').trim();
    await Promise.all(types.map(async type => {
      const dateField = type === 'tv' ? 'first_air_date_year' : 'primary_release_year';
      const endpoint = rest
        ? `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(rest)}&${dateField}=${year}&language=${langCode}`
        : `https://api.themoviedb.org/3/discover/${type}?${dateField === 'first_air_date_year' ? 'first_air_date_year' : 'primary_release_year'}=${year}&sort_by=popularity.desc&language=${langCode}`;
      try {
        const r = await fetch(endpoint, { headers: HEADERS }).then(r => r.json());
        add(r.results || [], type);
      } catch {}
    }));
  }

  let arr = [...seen.values()];

  // Apply genre filter to text search results
  if (filters.genres.length) {
    arr = arr.filter(m => (m.genre_ids || []).some(g => filters.genres.includes(g)));
  }
  // Apply year range filter
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
  if (filters.sort === 'vote_average.desc') arr.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  else if (filters.sort === 'release_date.desc') arr.sort((a, b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''));
  else if (filters.sort === 'release_date.asc') arr.sort((a, b) => (a.release_date || a.first_air_date || '').localeCompare(b.release_date || b.first_air_date || ''));
  else arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return arr;
}

const DEFAULT_FILTERS = { genres: [], yearRange: null, sort: 'popularity.desc', type: 'all' };

export default function Search() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [actor,    setActor]    = useState(null);
  const [popular,  setPopular]  = useState([]);
  const [filters,  setFilters]  = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const timer = useRef();
  const { lang } = useTheme();
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';

  const setFilter = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleGenre = useCallback((id) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(id) ? prev.genres.filter(g => g !== id) : [...prev.genres, id],
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = filters.genres.length +
    (filters.yearRange ? 1 : 0) +
    (filters.sort !== 'popularity.desc' ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0);

  useEffect(() => {
    if (!query.trim() && activeFilterCount === 0) {
      tmdb.trending('all', 'day').then(r => setPopular(r.results?.slice(0, 20) || [])).catch(() => {});
    }
  }, [lang, query, activeFilterCount]);

  useEffect(() => {
    clearTimeout(timer.current);
    const hasFilters = activeFilterCount > 0;
    if (!query.trim() && !hasFilters) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const r = await enhancedSearch(query, langCode, filters);
      setResults(r);
      setLoading(false);
    }, 350);
  }, [query, langCode, filters, activeFilterCount]);

  if (actor) return <ActorPage actor={actor} onBack={() => setActor(null)} onMovieClick={m => { setActor(null); setSelected(m); }}/>;

  const showingFiltered = query.trim() || activeFilterCount > 0;
  const displayed = showingFiltered ? results : popular;
  const isEmpty = showingFiltered && !loading && results.length === 0;

  return (
    <div className="page search-page">
      <div className="search-header">
        <h1 className="search-header__title">{t(lang, 'Поиск', 'Search')}</h1>

        <div className="search-top-row">
          <div className="search-bar">
            <MagniferLinear size={16} className="search-bar__icon"/>
            <input
              className="search-bar__input"
              placeholder={t(lang, 'Название, год, жанр...', 'Title, year, genre...')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off" spellCheck="false"
            />
            {query && <button className="search-bar__clear" onClick={() => setQuery('')}><CloseCircleLinear size={14}/></button>}
          </div>

          <button
            className={"search-filter-btn" + (showFilters ? ' active' : '') + (activeFilterCount ? ' has-active' : '')}
            onClick={() => setShowFilters(v => !v)}
          >
            <FilterLinear size={16}/>
            {activeFilterCount > 0 && <span className="search-filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="search-filters">
            {/* Type */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t(lang, 'Тип', 'Type')}</span>
              <div className="search-filter-chips">
                {TYPE_OPTIONS.map(o => (
                  <button key={o.value}
                    className={"search-chip" + (filters.type === o.value ? ' active' : '')}
                    onClick={() => setFilter('type', o.value)}>
                    {lang === 'ru' ? o.ru : o.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t(lang, 'Сортировка', 'Sort')}</span>
              <div className="search-filter-chips">
                {SORT_OPTIONS.map(o => (
                  <button key={o.value}
                    className={"search-chip" + (filters.sort === o.value ? ' active' : '')}
                    onClick={() => setFilter('sort', o.value)}>
                    {lang === 'ru' ? o.ru : o.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t(lang, 'Год', 'Year')}</span>
              <div className="search-filter-chips">
                {YEAR_RANGES.map((r, i) => (
                  <button key={i}
                    className={"search-chip" + (filters.yearRange === r ? ' active' : '')}
                    onClick={() => setFilter('yearRange', filters.yearRange === r ? null : r)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div className="search-filter-row">
              <span className="search-filter-label">{t(lang, 'Жанры', 'Genres')}</span>
              <div className="search-filter-chips search-filter-chips--wrap">
                {GENRES.map(g => (
                  <button key={g.id}
                    className={"search-chip" + (filters.genres.includes(g.id) ? ' active' : '')}
                    onClick={() => toggleGenre(g.id)}>
                    {lang === 'ru' ? g.ru : g.en}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button className="search-filter-clear" onClick={clearFilters}>
                {t(lang, 'Сбросить фильтры', 'Clear filters')}
              </button>
            )}
          </div>
        )}
      </div>

      {!showingFiltered && <h3 className="search-trending-label">{t(lang, 'В тренде сегодня', 'Trending today')}</h3>}
      {showingFiltered && !loading && results.length > 0 && (
        <p className="search-results-count">{t(lang, `Найдено: ${results.length}`, `Found: ${results.length}`)}</p>
      )}

      {loading && <div className="search-loading"><div className="search-loading__spinner"/></div>}

      {isEmpty && (
        <div className="search-empty">
          <MagniferLinear size={32} strokeWidth={1}/>
          <p>{t(lang, `Ничего по «${query || 'выбранным фильтрам'}»`, `Nothing for "${query || 'selected filters'}"`)}</p>
          <p className="search-empty__hint">{t(lang, 'Попробуй изменить фильтры', 'Try changing filters')}</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="search-grid">
          {displayed.map(m => <div key={`${m.id}-${m.media_type}`}><MovieCard movie={m} onClick={setSelected}/></div>)}
        </div>
      )}

      <MovieModal movie={selected} onClose={() => setSelected(null)} onActorClick={a => { setSelected(null); setActor(a); }}/>
    </div>
  );
}