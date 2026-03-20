import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { tmdb } from '../api';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Recs.css';

// Simple recommendation algorithm:
// 1. Get genres from watched + watchlist
// 2. Fetch similar movies for recently watched
// 3. Fetch popular in top genres
// 4. Deduplicate and remove already seen/listed
async function buildRecs(watched, watchlist) {
  const allSaved = [...watched, ...watchlist];
  if (allSaved.length === 0) return null; // no data yet

  // Count genres
  const genreCount = {};
  allSaved.forEach(m => (m.genre_ids||[]).forEach(g => { genreCount[g] = (genreCount[g]||0)+1; }));
  const topGenres = Object.entries(genreCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  const savedIds = new Set(allSaved.map(m=>m.id));

  const results = [];

  // Fetch similar for last 3 watched
  const recents = watched.slice(0,3);
  for (const m of recents) {
    const type = m.media_type==='tv' ? 'tv' : 'movie';
    try {
      const r = await fetch(`https://api.themoviedb.org/3/${type}/${m.id}/recommendations?language=ru-RU`, {
        headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWU5ZDhiMjQxNmZkZmMzZThkYTIwOTQ3ZWVmZmIyOSIsIm5iZiI6MTc3MzU3ODA1Ny40NTYsInN1YiI6IjY5YjZhNzQ5NWNiYjJlMDcwMzY3MzkxNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oV8T4jCi78cD-1-y_rGlfaPS55RGvXFshRniaiP93FM` }
      }).then(r=>r.json());
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

  // Deduplicate
  const seen = new Set();
  const deduped = results.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

  // Sort by score: vote_average * log(vote_count)
  deduped.sort((a,b) => {
    const sa = (a.vote_average||0) * Math.log((a.vote_count||1)+1);
    const sb = (b.vote_average||0) * Math.log((b.vote_count||1)+1);
    return sb - sa;
  });

  // Group: "because you watched X" + "popular in your genres"
  const becauseOf = {};
  deduped.filter(m=>m._reason&&m._reason!=='genre').forEach(m=>{
    if (!becauseOf[m._reason]) becauseOf[m._reason]=[];
    if (becauseOf[m._reason].length < 8) becauseOf[m._reason].push(m);
  });
  const byGenre = deduped.filter(m=>m._reason==='genre').slice(0,12);

  return { becauseOf, byGenre, hasData: true };
}

const Section = ({ title, items, onSelect }) => (
  <div className="recs-section">
    <h3 className="recs-section__title">{title}</h3>
    <div className="recs-section__scroll">
      {items.map(m => <div key={m.id} className="recs-section__item"><MovieCard movie={m} onClick={onSelect}/></div>)}
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="recs-section">
    <div className="skeleton" style={{height:16,width:200,marginBottom:12,marginLeft:20,borderRadius:6}}/>
    <div style={{display:'flex',gap:12,overflow:'hidden',padding:'0 20px'}}>
      {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{width:130,height:195,flexShrink:0}}/>)}
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

  const load = useCallback(() => {
    setLoading(true);
    buildRecs(watched, watchlist).then(r => { setRecs(r); setLoading(false); }).catch(()=>setLoading(false));
  }, [watched, watchlist]);

  useEffect(() => { load(); }, [load]);

  if (actor) return <ActorPage actor={actor} onBack={()=>setActor(null)} onMovieClick={m=>{setActor(null);setSelected(m);}}/>;

  const noData = !loading && (!recs || !recs.hasData);

  return (
    <div className="page recs-page">
      <div className="recs-header">
        <div>
          <h1 className="recs-header__title">{t(lang,'Для вас','For You')}</h1>
          <p className="recs-header__sub">{t(lang,'На основе ваших вкусов','Based on your taste')}</p>
        </div>
        <button className={"recs-refresh"+(loading?" spinning":"")} onClick={load} disabled={loading}>
          <RefreshCw size={18}/>
        </button>
      </div>

      {loading && <>{[1,2].map(i=><SkeletonRow key={i}/>)}</>}

      {noData && (
        <div className="recs-empty">
          <Sparkles size={48} strokeWidth={1}/>
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
