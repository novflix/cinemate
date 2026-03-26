import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { HEADERS } from '../api';
import { RefreshLinear, MagicStickLinear } from 'solar-icon-set';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Recs.css';

// ─── SIGNAL WEIGHTS ───────────────────────────────────────────────────────────
// Rating 9-10  → strong positive on the MOVIE itself (get more like THIS movie)
// Rating 7-8   → mild positive
// Rating 4-6   → neutral / mild signal (don't penalise genres)
// Rating 1-3   → negative on THIS movie, mild negative on director/cast
// Watchlist    → positive signal (user wants to see this type)
// Liked actor  → fetch all their movies, prioritise them
// Disliked id  → never show again

function buildProfile(watched, watchlist, ratings, likedActors, dislikedIds) {
  const seedMovies = [];
  const genreBoost = {};
  const genrePenalty = {}; // track explicitly bad-rated genres

  // ── Watched + ratings ──
  watched.forEach(m => {
    const r = ratings[m.id];
    const type = m.media_type || 'movie';
    const genres = m.genre_ids || [];

    if (!r) {
      // Unrated: mild positive seed
      seedMovies.push({ id: m.id, media_type: type, weight: 0.8 });
      genres.forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 0.3; });
      return;
    }

    if (r >= 9) {
      // Loved: strongest signal — use both /recommendations and similar
      seedMovies.push({ id: m.id, media_type: type, weight: 5 });
      seedMovies.push({ id: m.id, media_type: type, weight: 5, strategy: 'similar' });
      genres.forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 2.5; });
    } else if (r >= 8) {
      seedMovies.push({ id: m.id, media_type: type, weight: 3.5 });
      genres.forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1.5; });
    } else if (r >= 7) {
      seedMovies.push({ id: m.id, media_type: type, weight: 2 });
      genres.forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 0.8; });
    } else if (r >= 5) {
      // OK: very weak positive
      seedMovies.push({ id: m.id, media_type: type, weight: 0.4 });
    } else if (r >= 4) {
      // Meh: skip as seed but no penalty
    } else {
      // 1-3: don't seed, mild genre penalty ONLY if multiple bad ratings in same genre
      genres.forEach(g => { genrePenalty[g] = (genrePenalty[g] || 0) + 1; });
    }
  });

  // Only penalise genres with 2+ bad ratings (pattern, not accident)
  Object.entries(genrePenalty).forEach(([g, count]) => {
    if (count >= 2) {
      genreBoost[g] = (genreBoost[g] || 0) - (count * 0.8);
    }
  });

  // ── Watchlist: user explicitly wants this ──
  watchlist.forEach(m => {
    const type = m.media_type || 'movie';
    seedMovies.push({ id: m.id, media_type: type, weight: 2 });
    (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1.2; });
  });

  // Sort by weight, take top 10 positive seeds
  const posSeeds = seedMovies
    .filter(s => s.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  const avoidIds = new Set([
    ...watched.map(m => m.id),
    ...watchlist.map(m => m.id),
    ...dislikedIds,
  ]);

  return {
    seedMovies: posSeeds,
    likedActorIds: Object.keys(likedActors).map(Number),
    genreBoost,
    avoidIds,
  };
}

async function fetchCandidates(profile, page, langCode) {
  const { seedMovies, likedActorIds, genreBoost, avoidIds } = profile;
  const results = [];

  // Strategy 1: /recommendations + /similar for top-weighted seeds
  if (seedMovies.length > 0) {
    const picks = [];
    for (let i = 0; i < Math.min(4, seedMovies.length); i++) {
      picks.push(seedMovies[(page - 1 + i) % seedMovies.length]);
    }
    await Promise.all(picks.map(async seed => {
      try {
        // Use /similar for seeds marked with strategy:'similar', else /recommendations
        const endpoint = seed.strategy === 'similar' ? 'similar' : 'recommendations';
        const r = await fetch(
          `https://api.themoviedb.org/3/${seed.media_type}/${seed.id}/${endpoint}?language=${langCode}&page=${page}`,
          { headers: HEADERS }
        ).then(r => r.json());
        (r.results || []).forEach(m => results.push({
          ...m, media_type: seed.media_type, _source_weight: seed.weight,
        }));
      } catch {}
    }));
  }

  // Strategy 2: liked actors filmographies
  if (likedActorIds.length > 0) {
    const actorPick = likedActorIds[(page - 1) % likedActorIds.length];
    try {
      const r = await fetch(
        `https://api.themoviedb.org/3/person/${actorPick}/movie_credits?language=${langCode}`,
        { headers: HEADERS }
      ).then(r => r.json());
      (r.cast || [])
        .filter(m => m.poster_path && (m.vote_average || 0) >= 5)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20)
        .forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 3 }));
    } catch {}
  }

  // Strategy 3: discover by boosted genres
  const topGenres = Object.entries(genreBoost)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => Number(g));

  if (topGenres.length > 0) {
    try {
      const [movies, tv] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${topGenres[0]}&sort_by=vote_average.desc&vote_count.gte=200&page=${page}`, { headers: HEADERS }).then(r => r.json()),
        fetch(`https://api.themoviedb.org/3/discover/tv?language=${langCode}&with_genres=${topGenres[0]}&sort_by=vote_average.desc&vote_count.gte=50&page=${page}`, { headers: HEADERS }).then(r => r.json()),
      ]);
      (movies.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 1 }));
      (tv.results    || []).forEach(m => results.push({ ...m, media_type: 'tv',    _source_weight: 1 }));
    } catch {}
    if (topGenres[1]) {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${topGenres[1]}&sort_by=popularity.desc&vote_count.gte=100&page=${page}`, { headers: HEADERS }).then(r => r.json());
        (r.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.8 }));
      } catch {}
    }
  } else {
    try {
      const [tr, tv] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/movie/week?language=${langCode}&page=${page}`, { headers: HEADERS }).then(r => r.json()),
        fetch(`https://api.themoviedb.org/3/tv/top_rated?language=${langCode}&page=${page}`, { headers: HEADERS }).then(r => r.json()),
      ]);
      (tr.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.5 }));
      (tv.results || []).forEach(m => results.push({ ...m, media_type: 'tv',    _source_weight: 0.5 }));
    } catch {}
  }

  const seen = new Set();
  return results
    .filter(m => {
      if (!m.poster_path)     return false;
      if (avoidIds.has(m.id)) return false;
      if (seen.has(m.id))     return false;
      seen.add(m.id);
      return true;
    })
    .map(m => {
      const voteAvg    = m.vote_average || 0;
      const voteCount  = m.vote_count   || 0;
      // Bayesian average: weight score by vote count (penalise obscure films)
      const bayesian   = (voteAvg * voteCount + 6 * 100) / (voteCount + 100);
      const srcWeight  = m._source_weight || 1;
      let genreScore   = 0;
      (m.genre_ids || []).forEach(g => { genreScore += (genreBoost[g] || 0) * 0.12; });
      // Recency bonus: newer films get a small boost
      const year = parseInt((m.release_date || m.first_air_date || '2000').slice(0, 4));
      const recency = Math.max(0, (year - 2000) / 25) * 0.3;
      return { ...m, _score: bayesian * srcWeight + genreScore + recency };
    })
    .sort((a, b) => b._score - a._score);
}

export default function Recs() {
  const { watched, watchlist, ratings, likedActors, dislikedIds, addDisliked } = useStore();
  const { lang } = useTheme();
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(false);
  const [hasMore,  setHasMore] = useState(true);
  const [selected, setSelected]= useState(null);
  const [actor,    setActor]   = useState(null);

  const loaderRef    = useRef(null);
  const loadingRef   = useRef(false);
  const profileRef   = useRef(null);
  const pageRef      = useRef(1);
  const langCode     = lang === 'en' ? 'en-US' : 'ru-RU';
  const allSaved     = useMemo(() => [...watched, ...watchlist], [watched, watchlist]);

  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds);
  }, [watched, watchlist, ratings, likedActors, dislikedIds]);

  const doLoad = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    const prof = profileRef.current;
    if (!prof) return;
    loadingRef.current = true;
    setLoading(true);
    const pageOffset = reset ? profileRef.current._pageOffset || 0 : 0;
    const pg = reset ? 1 + pageOffset : pageRef.current;
    try {
      const candidates = await fetchCandidates(prof, pg, langCode);
      if (reset) {
        setItems(candidates);
      } else {
        setItems(prev => {
          const existing = new Set(prev.map(m => m.id));
          const next = [...prev, ...candidates.filter(m => !existing.has(m.id))];
          return next.slice(0, 120); // cap to avoid memory bloat
        });
      }
      pageRef.current = pg + 1;
      setHasMore(candidates.length > 3);
    } catch {}
    setLoading(false);
    loadingRef.current = false;
  }, [langCode]);

  const doReset = useCallback(() => {
    const prof = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds);
    const newOffset = ((profileRef.current?._pageOffset || 0) + Math.floor(Math.random() * 4) + 1) % 10;
    prof._pageOffset = newOffset;
    profileRef.current = prof;
    pageRef.current = 1 + newOffset;
    setItems([]);
    setHasMore(true);
    loadingRef.current = false;
    doLoad(true);
  }, [watched, watchlist, ratings, likedActors, dislikedIds, doLoad]);

  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds);
    doReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode]);

  // Stable refs so scroll handler never goes stale
  const hasMoreRef = useRef(hasMore);
  const doLoadRef  = useRef(doLoad);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { doLoadRef.current  = doLoad;  }, [doLoad]);

  useEffect(() => {
    // Mount once — handler uses refs so always sees latest state
    const getScrollEl = () =>
      loaderRef.current?.closest('.app-content') || window;

    const checkScroll = () => {
      if (loadingRef.current || !hasMoreRef.current) return;
      const loader = loaderRef.current;
      if (!loader) return;
      const rect = loader.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewH + 800) {
        doLoadRef.current(false);
      }
    };

    const scrollEl = getScrollEl();
    scrollEl.addEventListener('scroll', checkScroll, { passive: true });
    // Initial check
    setTimeout(checkScroll, 300);
    return () => scrollEl.removeEventListener('scroll', checkScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // mount once only

  const handleDislike = (id) => {
    addDisliked(id);
    setItems(prev => prev.filter(m => m.id !== id));
  };

  if (actor) return <ActorPage actor={actor} onBack={()=>setActor(null)} onMovieClick={m=>{setActor(null);setSelected(m);}}/>;

  const noData = !loading && allSaved.length === 0 && Object.keys(likedActors).length === 0;
  const hasSignals = watched.length > 0 || watchlist.length > 0 || Object.keys(likedActors).length > 0;

  return (
    <div className="page recs-page">
      <div className="recs-header">
        <div>
          <h1 className="recs-header__title">{t(lang,'Для вас','For You')}</h1>
          <p className="recs-header__sub">
            {!hasSignals
              ? t(lang,'Добавь фильмы или поставь лайк актёру','Save movies or like an actor to start')
              : Object.keys(likedActors).length > 0
              ? t(lang,'Любимые актёры + твои оценки · наведи на карточку чтобы убрать','Based on your ratings & liked actors · hover to remove')
              : t(lang,'На основе твоих оценок и списков · наведи на карточку чтобы убрать','Based on your ratings & lists · hover to remove')}
          </p>
        </div>
        <button className={"recs-refresh"+(loading?" spinning":"")} onClick={doReset} disabled={loading}>
          <RefreshLinear size={18}/>
        </button>
      </div>

      {Object.keys(likedActors).length > 0 && (
        <div className="recs-actors">
          {Object.values(likedActors).map(a => (
            <div key={a.id} className="recs-actor-chip">
              {a.profile_path
                ? <img src={`https://image.tmdb.org/t/p/w45${a.profile_path}`} alt={a.name}/>
                : <div className="recs-actor-chip__placeholder">{a.name[0]}</div>
              }
              <span>{a.name}</span>
            </div>
          ))}
        </div>
      )}

      {noData && (
        <div className="recs-empty">
          <MagicStickLinear size={44} strokeWidth={1}/>
          <h3>{t(lang,'Пока пусто','Nothing yet')}</h3>
          <p>{t(lang,'Добавь фильмы в списки, оцени просмотренные или поставь лайк любимому актёру','Save movies, rate what you watched, or like a favourite actor')}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="recs-grid">
          {items.map(m => (
            <div key={m.id}>
              <MovieCard movie={m} onClick={setSelected} onDislike={handleDislike}/>
            </div>
          ))}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="recs-grid">
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} className="skeleton" style={{borderRadius:12,aspectRatio:'2/3'}}/>
          ))}
        </div>
      )}

      <div ref={loaderRef} style={{height:40, marginBottom:8}}/>
      {loading && items.length > 0 && (
        <div className="recs-loader"><div className="recs-spinner"/></div>
      )}

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
    </div>
  );
}