import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { HEADERS } from '../api';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Recs.css';

// Build taste profile from watched + watchlist
// Stronger signals: high ratings > watchlist > unrated watched
function buildProfile(watched, watchlist, ratings) {
  const genreWeight = {};
  // Also track which specific movies scored high (for similar() fetches)
  const highRatedMovies = [];
  const lowRatedMovies  = [];

  // Watchlist: strong positive — user explicitly wants this
  watchlist.forEach(m => {
    (m.genre_ids || []).forEach(g => {
      genreWeight[g] = (genreWeight[g] || 0) + 3;
    });
  });

  // Watched: weight by rating
  watched.forEach(m => {
    const r = ratings[m.id];
    let weight;
    if (r) {
      // Non-linear: 8-10 → strong positive, 6-7 → mild positive, 1-5 → negative
      weight = r >= 8 ? (r - 5) * 2.5
             : r >= 6 ? (r - 5) * 1.0
             : (r - 6) * 2.0; // negative
      if (r >= 8) highRatedMovies.push(m);
      if (r <= 4) lowRatedMovies.push(m);
    } else {
      weight = 1.5; // watched but unrated = mild positive
    }
    (m.genre_ids || []).forEach(g => {
      genreWeight[g] = (genreWeight[g] || 0) + weight;
    });
  });

  const sorted = Object.entries(genreWeight).sort((a, b) => b[1] - a[1]);
  const topGenres    = sorted.filter(([, w]) => w > 0).slice(0, 6).map(([g]) => Number(g));
  const bannedGenres = sorted.filter(([, w]) => w < -5).map(([g]) => Number(g));

  return { topGenres, bannedGenres, genreWeight, highRatedMovies, lowRatedMovies };
}

async function fetchCandidates(profile, savedIds, page, langCode) {
  const { topGenres, bannedGenres, genreWeight, highRatedMovies } = profile;
  const results = [];

  if (topGenres.length === 0) {
    // No taste data — show trending/popular
    try {
      const [tr, tv] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/movie/week?language=${langCode}&page=${page}`, { headers: HEADERS }).then(r=>r.json()),
        fetch(`https://api.themoviedb.org/3/tv/popular?language=${langCode}&page=${page}`, { headers: HEADERS }).then(r=>r.json()),
      ]);
      (tr.results||[]).forEach(m=>results.push({...m,media_type:'movie'}));
      (tv.results||[]).forEach(m=>results.push({...m,media_type:'tv'}));
    } catch {}
    return finalize(results, savedIds, bannedGenres, genreWeight);
  }

  // Strategy 1: Similar to high-rated movies (most direct signal)
  if (highRatedMovies.length > 0 && page <= 3) {
    const pick = highRatedMovies[Math.floor((page - 1) % highRatedMovies.length)];
    const mtype = pick.media_type === 'tv' ? 'tv' : 'movie';
    try {
      const sim = await fetch(`https://api.themoviedb.org/3/${mtype}/${pick.id}/recommendations?language=${langCode}&page=1`, { headers: HEADERS }).then(r=>r.json());
      (sim.results||[]).forEach(m=>results.push({...m,media_type:mtype}));
    } catch {}
  }

  // Strategy 2: Discover by top genre combo (movies)
  const g1 = topGenres.slice(0, 2).join(',');
  try {
    const movies = await fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${g1}&sort_by=vote_average.desc&vote_count.gte=150&page=${page}`, { headers: HEADERS }).then(r=>r.json());
    (movies.results||[]).forEach(m=>results.push({...m,media_type:'movie'}));
  } catch {}

  // Strategy 3: Discover TV for top genre
  try {
    const tv = await fetch(`https://api.themoviedb.org/3/discover/tv?language=${langCode}&with_genres=${topGenres[0]}&sort_by=vote_average.desc&vote_count.gte=50&page=${page}`, { headers: HEADERS }).then(r=>r.json());
    (tv.results||[]).forEach(m=>results.push({...m,media_type:'tv'}));
  } catch {}

  // Strategy 4: Second genre cluster for variety
  if (topGenres[2]) {
    try {
      const g2 = topGenres.slice(2, 4).join(',');
      const extra = await fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${g2}&sort_by=popularity.desc&vote_count.gte=100&page=${page}`, { headers: HEADERS }).then(r=>r.json());
      (extra.results||[]).forEach(m=>results.push({...m,media_type:'movie'}));
    } catch {}
  }

  return finalize(results, savedIds, bannedGenres, genreWeight);
}

function finalize(results, savedIds, bannedGenres, genreWeight) {
  const seen = new Set();
  return results
    .filter(m => {
      if (!m.poster_path || !m.vote_average) return false;
      if (savedIds.has(m.id)) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      // Skip if ALL genres are banned
      if (bannedGenres.length && (m.genre_ids||[]).length > 0) {
        if ((m.genre_ids||[]).every(g => bannedGenres.includes(g))) return false;
      }
      return true;
    })
    .map(m => {
      // Score = TMDB quality * taste match
      let genreBonus = 0;
      (m.genre_ids||[]).forEach(g => { genreBonus += (genreWeight[g] || 0); });
      const score = (m.vote_average||0) + genreBonus * 0.3;
      return { ...m, _score: score };
    })
    .sort((a, b) => b._score - a._score);
}

export default function Recs() {
  const { watched, watchlist, ratings } = useStore();
  const { lang } = useTheme();
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(false);

  const [hasMore,  setHasMore] = useState(true);
  const [selected, setSelected]= useState(null);
  const [actor,    setActor]   = useState(null);

  const loaderRef  = useRef(null);
  const loadingRef = useRef(false);
  // Snapshot of savedIds at load time - does NOT update when user saves from Recs
  // This prevents recs from reloading when user marks something
  const savedIdsRef = useRef(new Set());
  const profileRef  = useRef(null);
  const pageRef     = useRef(1);
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';

  const allSaved = useMemo(() => [...watched, ...watchlist], [watched, watchlist]);

  // Rebuild profile when watched/watchlist/ratings change
  // But DON'T reload items - just update profile for next page loads
  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings);
  }, [watched, watchlist, ratings]);

  const doLoad = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    const prof = profileRef.current;
    if (!prof) return;

    loadingRef.current = true;
    setLoading(true);

    const pg = reset ? 1 : pageRef.current;

    try {
      const candidates = await fetchCandidates(prof, savedIdsRef.current, pg, langCode);
      if (reset) {
        setItems(candidates);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          return [...prev, ...candidates.filter(m => !existingIds.has(m.id))];
        });
      }
      pageRef.current = pg + 1;

      setHasMore(candidates.length > 5);
    } catch {}

    setLoading(false);
    loadingRef.current = false;
  }, [langCode]);

  // Initial load - only on mount and lang change
  // Takes a snapshot of savedIds so adding items doesn't retrigger
  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings);
    savedIdsRef.current = new Set(allSaved.map(m => m.id));
    pageRef.current = 1;
    setItems([]);
    setHasMore(true);
    loadingRef.current = false;
    doLoad(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        doLoad(false);
      }
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, doLoad]);

  const handleRefresh = () => {
    profileRef.current = buildProfile(watched, watchlist, ratings);
    savedIdsRef.current = new Set(allSaved.map(m => m.id));
    pageRef.current = 1;
    setItems([]);
    setHasMore(true);
    loadingRef.current = false;
    doLoad(true);
  };

  if (actor) return <ActorPage actor={actor} onBack={()=>setActor(null)} onMovieClick={m=>{setActor(null);setSelected(m);}}/>;

  const noData = !loading && allSaved.length === 0;
  const hasRatings = Object.keys(ratings).length > 0;

  return (
    <div className="page recs-page">
      <div className="recs-header">
        <div>
          <h1 className="recs-header__title">{t(lang,'Для вас','For You')}</h1>
          <p className="recs-header__sub">
            {!hasRatings && watched.length > 0
              ? t(lang,'Оцените просмотренные — рекомендации станут точнее','Rate watched films for better results')
              : t(lang,'На основе ваших вкусов','Based on your taste')}
          </p>
        </div>
        <button className={"recs-refresh"+(loading?" spinning":"")} onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={18}/>
        </button>
      </div>

      {noData && (
        <div className="recs-empty">
          <Sparkles size={44} strokeWidth={1}/>
          <h3>{t(lang,'Пока пусто','Nothing yet')}</h3>
          <p>{t(lang,'Добавь фильмы в списки — мы подберём рекомендации','Save movies to get recommendations')}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="recs-grid">
          {items.map(m => (
            <div key={m.id}><MovieCard movie={m} onClick={setSelected}/></div>
          ))}
        </div>
      )}

      {/* Loading skeletons on first load */}
      {loading && items.length === 0 && (
        <div className="recs-grid">
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} className="skeleton" style={{borderRadius:12,aspectRatio:'2/3'}}/>
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} style={{height:1}}/>
      {loading && items.length > 0 && (
        <div className="recs-loader"><div className="recs-spinner"/></div>
      )}

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
    </div>
  );
}