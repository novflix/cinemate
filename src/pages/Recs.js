import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { HEADERS } from '../api';
import { RefreshCw, Sparkles, X } from 'lucide-react';
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

// ─── Build taste profile ──────────────────────────────────────────────────────
// Returns: { 
//   seedMovieIds: [...],    // movies to fetch /recommendations for (weighted)
//   likedActorIds: [...],   // actor ids to fetch credits for
//   genreBoost: {id: weight},  // gentle genre boost (NOT exclusion)
//   avoidIds: Set,           // never show these
// }
function buildProfile(watched, watchlist, ratings, likedActors, dislikedIds) {
  const seedMovies   = [];  // { id, media_type, weight }
  const genreBoost   = {};

  // ── Ratings: treat as signal for THIS specific movie, not its whole genre
  watched.forEach(m => {
    const r = ratings[m.id];
    if (!r) {
      // Unrated watched → mild positive seed
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 1 });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 0.5; });
      return;
    }
    if (r >= 9) {
      // Loved it → strong seed, boost genres mildly
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 4 });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 2; });
    } else if (r >= 7) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 2.5 });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1; });
    } else if (r >= 5) {
      // OK → very weak seed, no genre signal
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 0.5 });
    } else if (r >= 4) {
      // Meh → tiny negative seed weight but DON'T penalise genre
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: -0.5 });
    }
    // 1-3: don't seed from this movie at all. Penalise only the specific movie.
  });

  // ── Watchlist → positive seeds (user actively wants this type)
  watchlist.forEach(m => {
    seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 1.5 });
    (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1; });
  });

  // ── Sort seeds by weight, take top 8 positive
  const posSeeds = seedMovies
    .filter(s => s.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  // ── Never show these
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

// ─── Fetch candidates ─────────────────────────────────────────────────────────
async function fetchCandidates(profile, page, langCode) {
  const { seedMovies, likedActorIds, genreBoost, avoidIds } = profile;
  const results = [];

  // Strategy 1: /recommendations for top-weighted seed movies (most accurate signal)
  // Rotate seeds across pages so variety improves over time
  if (seedMovies.length > 0) {
    const picks = [];
    // Take 2-3 seeds per page, rotating by page number
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
          ...m,
          media_type: seed.media_type,
          _source_weight: seed.weight,
        }));
      } catch {}
    }));
  }

  // Strategy 2: liked actors — fetch their filmographies
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

  // Strategy 3: discover by boosted genres (only if we have genre data)
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

    // Second genre for variety
    if (topGenres[1]) {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${topGenres[1]}&sort_by=popularity.desc&vote_count.gte=100&page=${page}`, { headers: HEADERS }).then(r => r.json());
        (r.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.8 }));
      } catch {}
    }
  } else {
    // No taste data yet — show curated popular
    try {
      const [tr, tv] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/movie/week?language=${langCode}&page=${page}`, { headers: HEADERS }).then(r => r.json()),
        fetch(`https://api.themoviedb.org/3/tv/top_rated?language=${langCode}&page=${page}`, { headers: HEADERS }).then(r => r.json()),
      ]);
      (tr.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.5 }));
      (tv.results || []).forEach(m => results.push({ ...m, media_type: 'tv',    _source_weight: 0.5 }));
    } catch {}
  }

  // ── Score, dedup, filter ──────────────────────────────────────────────────
  const seen = new Set();
  return results
    .filter(m => {
      if (!m.poster_path)    return false;
      if (avoidIds.has(m.id)) return false;
      if (seen.has(m.id))    return false;
      seen.add(m.id);
      return true;
    })
    .map(m => {
      // Score = tmdb quality × source relevance + genre boost
      const tmdbScore  = (m.vote_average || 0) / 10;
      const srcWeight  = m._source_weight || 1;
      let genreScore = 0;
      (m.genre_ids || []).forEach(g => { genreScore += (genreBoost[g] || 0) * 0.15; });
      const score = tmdbScore * srcWeight + genreScore;
      return { ...m, _score: score };
    })
    .sort((a, b) => b._score - a._score);
}

// ─── Not Interested card overlay ─────────────────────────────────────────────
function NotInterestedOverlay({ movie, onDislike }) {
  const [hovered, setHovered] = useState(false);
  const { lang } = useTheme();

  return (
    <div
      className="recs-card-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <button
          className="recs-not-interested"
          onClick={e => { e.stopPropagation(); onDislike(movie.id); }}
          title={t(lang, 'Не интересно', 'Not interested')}
        >
          <X size={12}/>
        </button>
      )}
      {movie._slot}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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

  // Rebuild profile on data changes
  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds);
  }, [watched, watchlist, ratings, likedActors, dislikedIds]);

  const doLoad = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    const prof = profileRef.current;
    if (!prof) return;
    loadingRef.current = true;
    setLoading(true);
    // On reset, use a page offset so refresh shows different TMDB pages
    const pageOffset = reset ? profileRef.current._pageOffset || 0 : 0;
    const pg = reset ? 1 + pageOffset : pageRef.current;
    try {
      const candidates = await fetchCandidates(prof, pg, langCode);
      if (reset) {
        setItems(candidates);
      } else {
        setItems(prev => {
          const existing = new Set(prev.map(m => m.id));
          return [...prev, ...candidates.filter(m => !existing.has(m.id))];
        });
      }
      pageRef.current = pg + 1;
      setHasMore(candidates.length > 3);
    } catch {}
    setLoading(false);
    loadingRef.current = false;
  }, [langCode]);

  // Initial load / refresh
  const doReset = useCallback(() => {
    const prof = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds);
    // Rotate through pages 0-9 on each manual refresh so results vary
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

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) doLoad(false);
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, doLoad]);

  // Remove disliked from current list instantly
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
              ? t(lang,`Любимые актёры + твои оценки · наведи на карточку чтобы убрать`,'Based on your ratings & liked actors · hover a card to remove')
              : t(lang,'На основе твоих оценок и списков · наведи на карточку чтобы убрать','Based on your ratings & lists · hover a card to remove')}
          </p>
        </div>
        <button
          className={"recs-refresh"+(loading?" spinning":"")}
          onClick={doReset}
          disabled={loading}
        >
          <RefreshCw size={18}/>
        </button>
      </div>

      {/* Liked actors chips */}
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
          <Sparkles size={44} strokeWidth={1}/>
          <h3>{t(lang,'Пока пусто','Nothing yet')}</h3>
          <p>{t(lang,'Добавь фильмы в списки, оцени просмотренные или поставь лайк любимому актёру — мы подберём что-то крутое','Save movies, rate what you watched, or like a favourite actor')}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="recs-grid">
          {items.map(m => (
            <NotInterestedOverlay key={m.id} movie={{...m, _slot: (
              <MovieCard movie={m} onClick={setSelected}/>
            )}} onDislike={handleDislike}/>
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

      <div ref={loaderRef} style={{height:1}}/>
      {loading && items.length > 0 && (
        <div className="recs-loader"><div className="recs-spinner"/></div>
      )}

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
    </div>
  );
}