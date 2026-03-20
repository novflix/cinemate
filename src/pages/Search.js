import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import { tmdb, HEADERS } from '../api';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Search.css';

// Enhanced search: tries multi search, then year-based discover, then keyword search
async function enhancedSearch(query, langCode) {
  const q = query.trim();
  if (!q) return [];

  const results = new Map(); // deduplicate by id
  const addAll = (arr, type) => arr.forEach(m => {
    if (!m.poster_path) return;
    const key = `${m.id}-${type||m.media_type}`;
    if (!results.has(key)) results.set(key, {...m, media_type: m.media_type || type});
  });

  // 1. Standard multi-search
  try {
    const r = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=${langCode}`, { headers: HEADERS }).then(r => r.json());
    addAll((r.results||[]).filter(m => m.media_type !== 'person'), '');
  } catch {}

  // 2. Year detection — if query contains a 4-digit year like 2024/2025
  const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const year = yearMatch[1];
    const rest = q.replace(year, '').trim();
    try {
      const params = new URLSearchParams({ language: langCode, primary_release_year: year, sort_by: 'popularity.desc' });
      if (rest) params.set('query', rest);
      const endpoint = rest
        ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(rest)}&primary_release_year=${year}&language=${langCode}`
        : `https://api.themoviedb.org/3/discover/movie?primary_release_year=${year}&sort_by=popularity.desc&language=${langCode}`;
      const r = await fetch(endpoint, { headers: HEADERS }).then(r => r.json());
      addAll(r.results || [], 'movie');
    } catch {}
    try {
      const endpoint = rest
        ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(rest)}&first_air_date_year=${year}&language=${langCode}`
        : `https://api.themoviedb.org/3/discover/tv?first_air_date_year=${year}&sort_by=popularity.desc&language=${langCode}`;
      const r = await fetch(endpoint, { headers: HEADERS }).then(r => r.json());
      addAll(r.results || [], 'tv');
    } catch {}
  }

  // 3. Keyword / description search — search for keywords matching query words
  if (q.length > 4 && results.size < 5) {
    try {
      const kwRes = await fetch(`https://api.themoviedb.org/3/search/keyword?query=${encodeURIComponent(q)}`, { headers: HEADERS }).then(r => r.json());
      const kw = (kwRes.results || []).slice(0, 2);
      for (const k of kw) {
        const r = await fetch(`https://api.themoviedb.org/3/discover/movie?with_keywords=${k.id}&sort_by=popularity.desc&language=${langCode}`, { headers: HEADERS }).then(r => r.json());
        addAll((r.results || []).slice(0, 5), 'movie');
      }
    } catch {}
  }

  return [...results.values()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actor, setActor] = useState(null);
  const [popular, setPopular] = useState([]);
  const timer = useRef();
  const { lang } = useTheme();
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';

  useEffect(() => {
    tmdb.trending('all', 'day').then(r => setPopular(r.results?.slice(0, 20) || [])).catch(() => {});
  }, [lang]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const r = await enhancedSearch(query, langCode);
      setResults(r);
      setLoading(false);
    }, 450);
  }, [query, langCode]);

  if (actor) return <ActorPage actor={actor} onBack={() => setActor(null)} onMovieClick={m => { setActor(null); setSelected(m); }}/>;

  const displayed = query.trim() ? results : popular;
  const isEmpty = query.trim() && !loading && results.length === 0;

  return (
    <div className="page search-page">
      <div className="search-header">
        <h1 className="search-header__title">{t(lang,'Поиск','Search')}</h1>
        <div className="search-bar">
          <SearchIcon size={16} className="search-bar__icon"/>
          <input
            className="search-bar__input"
            placeholder={t(lang,'Название, год, жанр...','Title, year, genre...')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off" spellCheck="false"
          />
          {query && <button className="search-bar__clear" onClick={() => setQuery('')}><X size={14}/></button>}
        </div>
        <p className="search-hint">
          {t(lang,'Попробуй: «Человек-паук 2025» или просто «2025»','Try: "Spider-Man 2025" or just "2025"')}
        </p>
      </div>

      {!query && <h3 className="search-trending-label">{t(lang,'В тренде сегодня','Trending today')}</h3>}
      {loading && <div className="search-loading"><div className="search-loading__spinner"/></div>}
      {isEmpty && (
        <div className="search-empty">
          <SlidersHorizontal size={32} strokeWidth={1}/>
          <p>{t(lang,`Ничего по «${query}»`,`Nothing for "${query}"`)}</p>
          <p className="search-empty__hint">{t(lang,'Попробуй добавить год или жанр','Try adding a year or genre')}</p>
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