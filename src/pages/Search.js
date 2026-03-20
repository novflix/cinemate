import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { tmdb } from '../api';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Search.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actor, setActor] = useState(null);
  const [popular, setPopular] = useState([]);
  const timer = useRef();
  const { lang } = useTheme();

  useEffect(() => {
    tmdb.trending('all','day').then(r => setPopular(r.results?.slice(0,20)||[])).catch(()=>{});
  }, [lang]); // reload on lang change

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(() => {
      tmdb.search(query).then(r => {
        setResults((r.results||[]).filter(m => m.media_type!=='person' && (m.poster_path||m.backdrop_path)));
        setLoading(false);
      }).catch(()=>setLoading(false));
    }, 400);
  }, [query]);

  if (actor) return <ActorPage actor={actor} onBack={() => setActor(null)} onMovieClick={m => { setActor(null); setSelected(m); }}/>;

  const displayed = query.trim() ? results : popular;
  const isEmpty = query.trim() && !loading && results.length === 0;

  return (
    <div className="page search-page">
      <div className="search-header">
        <h1 className="search-header__title">{t(lang,'Поиск','Search')}</h1>
        <div className="search-bar">
          <SearchIcon size={16} className="search-bar__icon"/>
          <input className="search-bar__input" placeholder={t(lang,'Фильмы, сериалы...','Movies, series...')} value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" spellCheck="false"/>
          {query && <button className="search-bar__clear" onClick={() => setQuery('')}><X size={14}/></button>}
        </div>
      </div>

      {!query && <h3 className="search-trending-label">{t(lang,'В тренде сегодня','Trending today')}</h3>}
      {loading && <div className="search-loading"><div className="search-loading__spinner"/></div>}
      {isEmpty && <div className="search-empty"><p>{t(lang,`Ничего по «${query}»`,`Nothing for "${query}"`)}</p></div>}

      {!loading && displayed.length > 0 && (
        <div className="search-grid">
          {displayed.map(m => <div key={m.id}><MovieCard movie={m} onClick={setSelected}/></div>)}
        </div>
      )}

      <MovieModal movie={selected} onClose={() => setSelected(null)} onActorClick={a => { setSelected(null); setActor(a); }}/>
    </div>
  );
}
