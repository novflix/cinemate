import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { tmdb, HEADERS } from '../api';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Recs.css';

async function buildRecs(watched, watchlist) {
  const allSaved = [...watched, ...watchlist];
  if (allSaved.length === 0) return null;

  const genreCount = {};
  allSaved.forEach(m => (m.genre_ids||[]).forEach(g => { genreCount[g] = (genreCount[g]||0)+1; }));
  const topGenres = Object.entries(genreCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  const savedIds = new Set(allSaved.map(m=>m.id));
  const langCode = (() => { try { return localStorage.getItem('lang')==='en'?'en-US':'ru-RU'; } catch { return 'ru-RU'; } })();

  const results = [];

  // Fetch similar for last 3 watched
  for (const m of watched.slice(0, 3)) {
    const type = m.media_type==='tv' ? 'tv' : 'movie';
    try {
      const r = await fetch(`https://api.themoviedb.org/3/${type}/${m.id}/recommendations?language=${langCode}`, { headers: HEADERS }).then(r=>r.json());
      (r.results||[]).filter(x=>x.poster_path&&!savedIds.has(x.id)).forEach(x=>results.push({...x,media_type:type,_reason:m.title||m.name}));
    } catch {}
  }

  // Discover by top genres
  if (topGenres.length > 0) {
    try {
      const r = await tmdb.discover('movie', { with_genres: topGenres[0], sort_by: 'popularity.desc', 'vote_count.gte': 100 });
      (r.results||[]).filter(x=>x.poster_path&&!savedIds.has(x.id)).forEach(x=>results.push({...x,media_type:'movie',_reason:'genre'}));
    } catch {}
    try {
      const r = await tmdb.discover('tv', { with_genres: topGenres[0], sort_by: 'popularity.desc' });
      (r.results||[]).filter(x=>x.poster_path&&!savedIds.has(x.id)).forEach(x=>results.push({...x,media_type:'tv',_reason:'genre'}));
    } catch {}
  }

  const seen = new Set();
  const deduped = results.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
  deduped.sort((a,b) => {
    const sa = (a.vote_average||0)*Math.log((a.vote_count||1)+1);
    const sb = (b.vote_average||0)*Math.log((b.vote_count||1)+1);
    return sb-sa;
  });

  const becauseOf = {};
  deduped.filter(m=>m._reason&&m._reason!=='genre').forEach(m => {
    if (!becauseOf[m._reason]) becauseOf[m._reason] = [];
    if (becauseOf[m._reason].length < 8) becauseOf[m._reason].push(m);
  });
  const byGenre = deduped.filter(m=>m._reason==='genre').slice(0, 12);

  return { becauseOf, byGenre, hasData: true };
}

const Section = ({ title, items, onSelect }) => (
  <div className="recs-section">
    <h3 className="recs-section__title">{title}</h3>
    <div className="recs-section__scroll">
      {items.map(m=><div key={m.id} className="recs-section__item"><MovieCard movie={m} onClick={onSelect}/></div>)}
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="recs-section">
    <div className="skeleton" style={{height:15,width:220,marginBottom:12,marginLeft:20,borderRadius:6}}/>
    <div style={{display:'flex',gap:12,overflow:'hidden',padding:'0 20px'}}>
      {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{width:130,flexShrink:0,borderRadius:12,paddingBottom:'195px'}}/>)}
    </div>
  </div>
);

export default function Recs() {
  const { watched, watchlist } = useStore();
  const { lang } = useTheme();
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actor, setActor] = useState(null);
  // Track if we've loaded at least once — prevent reloading on every store update
  const loadedRef = useRef(false);
  const watchedRef = useRef(watched);
  const watchlistRef = useRef(watchlist);

  // Only reload recs when the page first mounts, or when user clicks refresh
  // NOT when watched/watchlist changes (that caused the reload-on-save bug)
  const doLoad = () => {
    setLoading(true);
    buildRecs(watchedRef.current, watchlistRef.current)
      .then(r => { setRecs(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // Keep refs in sync with latest values without triggering reload
    watchedRef.current = watched;
    watchlistRef.current = watchlist;
  }, [watched, watchlist]);

  useEffect(() => {
    // Load once on mount
    if (!loadedRef.current) {
      loadedRef.current = true;
      doLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when language changes
  useEffect(() => {
    if (loadedRef.current) {
      doLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (actor) return <ActorPage actor={actor} onBack={()=>setActor(null)} onMovieClick={m=>{setActor(null);setSelected(m);}}/>;

  const noData = !loading && (!recs || !recs.hasData);

  return (
    <div className="page recs-page">
      <div className="recs-header">
        <div>
          <h1 className="recs-header__title">{t(lang,'Для вас','For You')}</h1>
          <p className="recs-header__sub">{t(lang,'На основе ваших вкусов','Based on your taste')}</p>
        </div>
        <button className={"recs-refresh"+(loading?" spinning":"")} onClick={doLoad} disabled={loading}>
          <RefreshCw size={18}/>
        </button>
      </div>

      {loading && <>{[1,2].map(i=><SkeletonRow key={i}/>)}</>}

      {noData && (
        <div className="recs-empty">
          <Sparkles size={44} strokeWidth={1}/>
          <h3>{t(lang,'Пока пусто','Nothing yet')}</h3>
          <p>{t(lang,'Добавь фильмы в списки и мы подберём рекомендации','Add movies to your lists and we\'ll suggest similar ones')}</p>
        </div>
      )}

      {!loading && recs?.hasData && (
        <>
          {Object.entries(recs.becauseOf).map(([title, items]) => items.length > 0 && (
            <Section key={title} title={`${t(lang,'Потому что смотрел','Because you watched')} «${title}»`} items={items} onSelect={setSelected}/>
          ))}
          {recs.byGenre.length > 0 && (
            <Section title={t(lang,'Популярное по вашим жанрам','Popular in your genres')} items={recs.byGenre} onSelect={setSelected}/>
          )}
        </>
      )}

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
    </div>
  );
}