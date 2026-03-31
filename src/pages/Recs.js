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
  const seedMovies   = [];
  const genreBoost   = {};

  watched.forEach(m => {
    const r = ratings[m.id];
    if (!r) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 1 });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 0.5; });
      return;
    }
    if (r >= 9) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 4 });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 2; });
    } else if (r >= 7) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 2.5 });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1; });
    } else if (r >= 5) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 0.5 });
    } else if (r >= 4) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: -0.5 });
    }
    // 1-3: don't seed from this movie at all
  });

  watchlist.forEach(m => {
    seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 1.5 });
    (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1; });
  });

  const posSeeds = seedMovies
    .filter(s => s.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

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

  // Strategy 1: /recommendations for top-weighted seed movies
  if (seedMovies.length > 0) {
    const picks = [];
    for (let i = 0; i < Math.min(3, seedMovies.length); i++) {
      picks.push(seedMovies[(page - 1 + i) % seedMovies.length]);
    }
    await Promise.all(picks.map(async seed => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/${seed.media_type}/${seed.id}/recommendations?language=${langCode}&page=${page}`,
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
      const tmdbScore = (m.vote_average || 0) / 10;
      const srcWeight = m._source_weight || 1;
      let genreScore  = 0;
      (m.genre_ids || []).forEach(g => { genreScore += (genreBoost[g] || 0) * 0.15; });
      return { ...m, _score: tmdbScore * srcWeight + genreScore };
    })
    .sort((a, b) => b._score - a._score);
}

export default function Recs() {
  const { watched, watchlist, ratings, likedActors, dislikedIds, addDisliked } = useStore();
  const { lang } = useTheme();
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(false);
  const [hasMore,  setHasMore] = useState(true);

  // Navigation stack: each entry is { type: 'movie'|'actor', data }
  const [navStack, setNavStack] = useState([]);

  const pushNav  = (entry) => setNavStack(prev => [...prev, entry]);
  const popNav   = () => setNavStack(prev => prev.slice(0, -1));
  const clearNav = () => setNavStack([]);

  const currentNav = navStack[navStack.length - 1] || null;
  const selected   = currentNav?.type === 'movie' ? currentNav.data : null;
  const actor      = currentNav?.type === 'actor' ? currentNav.data : null;

  const loaderRef    = useRef(null);
  const loadingRef   = useRef(false);
  const profileRef   = useRef(null);
  const pageRef      = useRef(1);
  const langCode     = lang === 'en' ? 'en-US' : 'ru-RU';
  const allSaved     = useMemo(() => [...watched, ...watchlist], [watched, watchlist]);

  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds);
  }, [watched, watchlist, ratings, likedActors, dislikedIds]);

  const [observerKey, setObserverKey] = useState(0);

  const doLoad = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    const prof = profileRef.current;
    if (!prof) return;
    loadingRef.current = true;
    setLoading(true);
    const pageOffset = reset ? profileRef.current._pageOffset || 0 : 0;
    const pg = reset ? 1 + pageOffset : pageRef.current;
    try {
      let candidates = await fetchCandidates(prof, pg, langCode);

      // If candidates dried up on this page, jump to a new random page
      if (candidates.length < 4 && !reset) {
        const fallbackPage = (pg % 20) + 1;
        candidates = await fetchCandidates(prof, fallbackPage, langCode);
        pageRef.current = fallbackPage + 1;
      } else {
        pageRef.current = pg + 1;
      }

      if (reset) {
        setItems(candidates);
      } else {
        setItems(prev => {
          const existing = new Set(prev.map(m => m.id));
          const fresh = candidates.filter(m => !existing.has(m.id));
          return [...prev, ...fresh];
        });
      }
      setHasMore(true);
    } catch {}
    setLoading(false);
    loadingRef.current = false;
    // Bump key so the observer re-attaches and immediately checks visibility
    setObserverKey(k => k + 1);
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

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          doLoad(false);
        }
      },
      { rootMargin: '600px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [doLoad, observerKey]);

  const handleDislike = (id) => {
    addDisliked(id);
    setItems(prev => prev.filter(m => m.id !== id));
  };

  if (actor) return <ActorPage actor={actor} onBack={popNav} onMovieClick={m=>{ pushNav({ type: 'movie', data: m }); }}/>;

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
              <MovieCard movie={m} onClick={m => pushNav({ type: 'movie', data: m })} onDislike={handleDislike}/>
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

      <MovieModal movie={selected} onClose={popNav} onActorClick={a=>{ pushNav({ type: 'actor', data: a }); }}/>
    </div>
  );
}