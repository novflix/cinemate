import { useNavigate } from 'react-router-dom';
import { useMovieModal } from '../hooks/useMovieModal';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HEADERS, isShowOrAward } from '../api';
import { RefreshLinear, MagicStickLinear } from 'solar-icon-set';
import { useStore } from '../store';
import { useTheme } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import './Recs.css';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GENRE_ANIMATION = 16;
const ANIME_COUNTRIES      = new Set(['JP']);
const EASTASIAN_COUNTRIES  = new Set(['KR', 'CN', 'TW', 'HK', 'TH']);

// Diversity buffer: max consecutive items sharing the same primary genre
const MAX_SAME_GENRE_RUN = 3;
// Diversity buffer: max consecutive items of the same media_type
const MAX_SAME_TYPE_RUN  = 4;
// How many slots (out of every 10) are reserved for "exploration" picks
const EXPLORATION_RATE   = 0.12; // 12%

// ─── ERA DETECTION ────────────────────────────────────────────────────────────
function detectEraPreference(watched, watchlist) {
  const all = [...watched, ...watchlist];
  if (all.length === 0) return { minYear: new Date().getFullYear() - 10, preferRecent: true };

  const years = all
    .map(m => parseInt((m.release_date || m.first_air_date || '').slice(0, 4)))
    .filter(y => y > 1900);

  if (years.length === 0) return { minYear: new Date().getFullYear() - 10, preferRecent: true };

  const avg    = years.reduce((s, y) => s + y, 0) / years.length;
  const min    = Math.min(...years);
  const sorted = [...years].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const enjoysClassics = min < 1985;
  const safeMin        = enjoysClassics ? min - 5 : Math.max(median - 8, 1980);
  const preferRecent   = avg > (new Date().getFullYear() - 8);

  return { minYear: safeMin, preferRecent, median };
}

// ─── TASTE PROFILE BUILDER ───────────────────────────────────────────────────
function buildProfile(watched, watchlist, ratings, likedActors, dislikedIds, tvProgress) {
  const seedMovies  = [];
  const genreBoost  = {};
  const originCount = {};
  const { minYear, preferRecent, median } = detectEraPreference(watched, watchlist);

  // ── Watched titles ────────────────────────────────────────────────────────
  watched.forEach(m => {
    const r = ratings[m.id];

    if (dislikedIds.includes(m.id)) {
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) - 1.5; });
      return;
    }

    // TV progress bonus: finishing a series is the strongest positive signal
    const progress     = tvProgress && m.media_type === 'tv' ? tvProgress[m.id] : null;
    const finishedShow = progress?.finished === true;
    const progressMult = finishedShow ? 1.4 : 1;

    if (!r) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 0.8 * progressMult });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 0.3; });
      return;
    }

    if (r >= 9) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 4 * progressMult });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 2.5; });
      (m.origin_country || []).forEach(c => { originCount[c] = (originCount[c] || 0) + 2; });
    } else if (r >= 7) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 2.5 * progressMult });
      (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 1.2; });
      (m.origin_country || []).forEach(c => { originCount[c] = (originCount[c] || 0) + 1; });
    } else if (r >= 5) {
      seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 0.4 * progressMult });
    } else {
      // 1–4: penalise genres
      (m.genre_ids || []).forEach(g => {
        genreBoost[g] = (genreBoost[g] || 0) - (r <= 2 ? 2.5 : 1.2);
      });
    }
  });

  // ── Watchlist ─────────────────────────────────────────────────────────────
  watchlist.forEach(m => {
    seedMovies.push({ id: m.id, media_type: m.media_type || 'movie', weight: 1.2 });
    (m.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) + 0.6; });
  });

  // ── "Not interested" clicks — penalise genres ────────────────────────────
  dislikedIds.forEach(id => {
    const movie = [...watched, ...watchlist].find(m => m.id === id);
    if (movie && !ratings[id]) {
      (movie.genre_ids || []).forEach(g => { genreBoost[g] = (genreBoost[g] || 0) - 1.2; });
    }
  });

  // ── Origin-country interest ───────────────────────────────────────────────
  const animeInterest     = (originCount['JP'] || 0) >= 2;
  const eastAsianInterest = ['KR','CN','TW','HK','TH'].some(c => (originCount[c] || 0) >= 2);

  // ── Top genres for exploration layer ─────────────────────────────────────
  // We need genres the user likes but that are NOT their top genre,
  // to surface discoveries outside their comfort zone.
  const allPositiveGenres = Object.entries(genreBoost)
    .filter(([, v]) => v > 0.3)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => Number(g));
  const explorationGenres = allPositiveGenres.slice(1, 4); // skip top genre

  // ── Seeds: positive only, deduplicated, sorted by weight ─────────────────
  const seenSeeds = new Set();
  const posSeeds  = seedMovies
    .filter(s => s.weight > 0 && !seenSeeds.has(s.id) && seenSeeds.add(s.id))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 15);

  const avoidIds = new Set([
    ...watched.map(m => m.id),
    ...watchlist.map(m => m.id),
    ...dislikedIds,
  ]);

  return {
    seedMovies:       posSeeds,
    likedActorIds:    Object.keys(likedActors).map(Number),
    genreBoost,
    avoidIds,
    minYear,
    preferRecent,
    medianYear:       median,
    animeInterest,
    eastAsianInterest,
    explorationGenres,
  };
}

// ─── ORIGIN-COUNTRY FILTER ────────────────────────────────────────────────────
function passesOriginFilter(item, animeInterest, eastAsianInterest) {
  const countries = item.origin_country || [];

  if (!animeInterest &&
      countries.some(c => ANIME_COUNTRIES.has(c)) &&
      (item.genre_ids || []).includes(GENRE_ANIMATION)) {
    return false;
  }

  if (!eastAsianInterest && countries.some(c => EASTASIAN_COUNTRIES.has(c))) {
    const isAcclaimed = (item.vote_average || 0) >= 8.2 && (item.vote_count || 0) >= 2000;
    if (!isAcclaimed) return false;
  }

  return true;
}

// ─── DIVERSITY BUFFER ────────────────────────────────────────────────────────
// Takes a flat scored array, returns an interleaved array where:
//   - no more than MAX_SAME_GENRE_RUN items with the same primary genre appear consecutively
//   - no more than MAX_SAME_TYPE_RUN items of the same media_type appear consecutively
//   - EXPLORATION_RATE fraction of slots are filled from lower-scored "discovery" items
//
// Algorithm: greedy slot-fill with a penalty queue for recently-used genres/types.
function applyDiversityBuffer(candidates) {
  if (candidates.length === 0) return [];

  // Split into main pool and exploration pool (bottom ~20% by score)
  const splitIdx      = Math.floor(candidates.length * (1 - EXPLORATION_RATE * 2));
  const mainPool      = candidates.slice(0, splitIdx);
  const exploPool     = candidates.slice(splitIdx);

  const result        = [];
  const mainQueue     = [...mainPool];
  const exploreQueue  = [...exploPool];

  // Track runs
  let genreRun        = { genre: null, count: 0 };
  let typeRun         = { type: null, count: 0 };
  let exploreSlot     = Math.round(1 / EXPLORATION_RATE); // every N slots → exploration

  let slot = 0;
  while (mainQueue.length > 0 || exploreQueue.length > 0) {
    slot++;

    // Decide if this is an exploration slot
    const isExploreSlot = exploreQueue.length > 0 && slot % exploreSlot === 0;

    if (isExploreSlot) {
      result.push(exploreQueue.shift());
      // Reset run tracking after exploration pick
      genreRun = { genre: null, count: 0 };
      typeRun  = { type: null, count: 0 };
      continue;
    }

    if (mainQueue.length === 0) {
      result.push(...exploreQueue.splice(0));
      break;
    }

    // Try to pick the next best from mainQueue that doesn't violate diversity rules
    let picked = null;
    let pickedIdx = -1;

    for (let i = 0; i < Math.min(mainQueue.length, 8); i++) {
      const candidate = mainQueue[i];
      const primaryGenre = (candidate.genre_ids || [])[0] || null;
      const mediaType    = candidate.media_type || 'movie';

      // Check genre run
      const genreOk = primaryGenre === null ||
        genreRun.genre !== primaryGenre ||
        genreRun.count < MAX_SAME_GENRE_RUN;

      // Check type run
      const typeOk = typeRun.type !== mediaType ||
        typeRun.count < MAX_SAME_TYPE_RUN;

      if (genreOk && typeOk) {
        picked    = candidate;
        pickedIdx = i;
        break;
      }
    }

    if (picked === null) {
      // All top candidates violate rules — just take the best one and reset
      picked    = mainQueue[0];
      pickedIdx = 0;
      genreRun  = { genre: null, count: 0 };
      typeRun   = { type: null, count: 0 };
    }

    mainQueue.splice(pickedIdx, 1);
    result.push(picked);

    // Update run trackers
    const pg = (picked.genre_ids || [])[0] || null;
    const pt = picked.media_type || 'movie';
    genreRun = pg === genreRun.genre ? { genre: pg, count: genreRun.count + 1 } : { genre: pg, count: 1 };
    typeRun  = pt === typeRun.type  ? { type: pt, count: typeRun.count + 1 }  : { type: pt, count: 1 };
  }

  return result;
}

// ─── URL HELPERS ─────────────────────────────────────────────────────────────
function buildDiscoverUrl(base, params) {
  return `${base}?${new URLSearchParams(params)}`;
}

function yearParams(minYear, preferRecent, mediaType = 'movie') {
  const currentYear = new Date().getFullYear();
  const dateField   = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
  const cutoff      = preferRecent ? `${currentYear - 12}-01-01` : `${minYear}-01-01`;
  return { [`${dateField}.gte`]: cutoff };
}

// ─── CANDIDATE FETCHER ───────────────────────────────────────────────────────
async function fetchCandidates(profile, page, langCode) {
  const {
    seedMovies, likedActorIds, genreBoost,
    avoidIds, minYear, preferRecent,
    animeInterest, eastAsianInterest,
    explorationGenres,
  } = profile;

  const results = [];
  const lang    = `language=${langCode}`;
  const excludeCountries = (animeInterest && eastAsianInterest) ? '' : [
    !animeInterest     ? 'JP' : '',
    !eastAsianInterest ? 'KR,CN,TW,HK,TH' : '',
  ].filter(Boolean).join(',');

  // ── Strategy 1: /recommendations from rotating seeds ─────────────────────
  if (seedMovies.length > 0) {
    const numSeeds    = Math.min(4, seedMovies.length);
    const offset      = (page - 1) * numSeeds;
    const uniquePicks = [...new Map(
      Array.from({ length: numSeeds }, (_, i) =>
        seedMovies[(offset + i) % seedMovies.length]
      ).map(p => [p.id, p])
    ).values()];

    await Promise.all(uniquePicks.map(async seed => {
      try {
        // Use different pages of /recommendations to avoid always getting the same top-20
        const recPage = Math.min(((page - 1) % 3) + 1, 3);
        const r = await fetch(
          `https://api.themoviedb.org/3/${seed.media_type}/${seed.id}/recommendations?${lang}&page=${recPage}`,
          { headers: HEADERS }
        ).then(r => r.json());
        (r.results || []).forEach(m => results.push({
          ...m, media_type: seed.media_type,
          _source_weight: seed.weight, _strategy: 'recs',
        }));
      } catch {}
    }));
  }

  // ── Strategy 2: liked actors — combined (movie + TV) credits ──────────────
  if (likedActorIds.length > 0) {
    // On deeper pages, cycle through different actors
    const actorPick = likedActorIds[(page - 1) % likedActorIds.length];
    try {
      const r = await fetch(
        `https://api.themoviedb.org/3/person/${actorPick}/combined_credits?${lang}`,
        { headers: HEADERS }
      ).then(r => r.json());

      const credits = [
        ...(r.cast || []),
        ...(r.crew || []).filter(m => ['Director','Writer','Creator'].includes(m.job)),
      ].map(m => ({ ...m, media_type: m.media_type || 'movie' }))
       .filter(m => !isShowOrAward(m));

      credits
        .filter(m =>
          m.poster_path &&
          (m.vote_average || 0) >= 5.5 &&
          (m.vote_count   || 0) >= 30 &&
          (() => { const y = parseInt((m.release_date || m.first_air_date || '0').slice(0, 4)); return !y || y >= minYear; })()
        )
        .sort((a, b) => (b.vote_average * Math.log10(Math.max(b.vote_count || 1, 1))) -
                        (a.vote_average * Math.log10(Math.max(a.vote_count || 1, 1))))
        .slice(0, 30)
        .forEach(m => results.push({
          ...m, _source_weight: 3.5, _strategy: 'actor',
        }));
    } catch {}
  }

  // ── Strategy 3: discover by top liked genres ──────────────────────────────
  const topGenres = Object.entries(genreBoost)
    .filter(([, score]) => score > 0.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => Number(g))
    .filter(g => g !== GENRE_ANIMATION || animeInterest);

  if (topGenres.length > 0) {
    const movieYp = yearParams(minYear, preferRecent, 'movie');
    const tvYp    = yearParams(minYear, preferRecent, 'tv');
    const excl    = excludeCountries ? { without_origin_country: excludeCountries } : {};

    // Alternate sort strategy across pages to surface different content
    const movieSort = page % 2 === 0 ? 'vote_average.desc' : 'popularity.desc';
    const tvSort    = page % 3 === 0 ? 'popularity.desc'   : 'vote_average.desc';

    try {
      const [movies, tv] = await Promise.all([
        fetch(buildDiscoverUrl('https://api.themoviedb.org/3/discover/movie', {
          with_genres: String(topGenres[0]),
          sort_by: movieSort, 'vote_count.gte': '400',
          page: String(page), language: langCode, ...excl, ...movieYp,
        }), { headers: HEADERS }).then(r => r.json()),
        fetch(buildDiscoverUrl('https://api.themoviedb.org/3/discover/tv', {
          with_genres: String(topGenres[0]),
          sort_by: tvSort, 'vote_count.gte': '100',
          page: String(page), language: langCode, ...excl, ...tvYp,
        }), { headers: HEADERS }).then(r => r.json()),
      ]);
      (movies.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 1.2, _strategy: 'genre' }));
      (tv.results    || []).forEach(m => results.push({ ...m, media_type: 'tv',    _source_weight: 1.2, _strategy: 'genre' }));
    } catch {}

    if (topGenres[1]) {
      try {
        const r = await fetch(buildDiscoverUrl('https://api.themoviedb.org/3/discover/movie', {
          with_genres: String(topGenres[1]),
          sort_by: 'popularity.desc', 'vote_count.gte': '200',
          page: String(page), language: langCode, ...excl,
          ...yearParams(minYear, preferRecent, 'movie'),
        }), { headers: HEADERS }).then(r => r.json());
        (r.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.9, _strategy: 'genre2' }));
      } catch {}
    }
  } else {
    // Fallback: trending
    try {
      const [tr, topTv] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/movie/week?${lang}&page=${page}`, { headers: HEADERS }).then(r => r.json()),
        fetch(`https://api.themoviedb.org/3/discover/tv?${lang}&sort_by=vote_average.desc&vote_count.gte=200&page=${page}`, { headers: HEADERS }).then(r => r.json()),
      ]);
      (tr.results    || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.5, _strategy: 'fallback' }));
      (topTv.results || []).forEach(m => results.push({ ...m, media_type: 'tv',    _source_weight: 0.5, _strategy: 'fallback' }));
    } catch {}
  }

  // ── Strategy 4: exploration — secondary liked genres, different sort ──────
  // Surfaces content from genres the user enjoys but that aren't dominating the feed.
  // This prevents the feed from being 100% the same genre endlessly.
  if (explorationGenres.length > 0) {
    const expGenre = explorationGenres[page % explorationGenres.length];
    const excl = excludeCountries ? { without_origin_country: excludeCountries } : {};
    try {
      const r = await fetch(buildDiscoverUrl('https://api.themoviedb.org/3/discover/movie', {
        with_genres: String(expGenre),
        sort_by: 'vote_average.desc', 'vote_count.gte': '500',
        page: String((page % 5) + 1), language: langCode, ...excl,
        ...yearParams(minYear, preferRecent, 'movie'),
      }), { headers: HEADERS }).then(r => r.json());
      // Mark as exploration so diversity buffer can treat them differently
      (r.results || []).forEach(m => results.push({ ...m, media_type: 'movie', _source_weight: 0.7, _strategy: 'explore' }));
    } catch {}
  }

  // ── Dedup + filter + score ─────────────────────────────────────────────────
  const seen     = new Set();
  const maxBoost = Math.max(...Object.values(genreBoost).filter(v => v > 0), 1);

  const scored = results
    .filter(m => {
      if (!m.poster_path)     return false;
      if (avoidIds.has(m.id)) return false;
      if (seen.has(m.id))     return false;
      if (isShowOrAward(m))   return false;
      // Minimum quality gate
      if ((m.vote_count || 0) < 15) return false;
      const y = parseInt((m.release_date || m.first_air_date || '0').slice(0, 4));
      if (y && y < minYear)   return false;
      if (!passesOriginFilter(m, animeInterest, eastAsianInterest)) return false;
      seen.add(m.id);
      return true;
    })
    .map(m => {
      const tmdbScore    = (m.vote_average || 0) / 10;
      const srcWeight    = m._source_weight || 1;

      // Genre affinity: normalised contribution
      let rawGenre = 0;
      (m.genre_ids || []).forEach(g => { rawGenre += (genreBoost[g] || 0); });
      const normGenre = (rawGenre / maxBoost) * 0.4;

      // Quality signal: bayesian-ish — reward high votes, not just high average
      const voteSignal = Math.log10(Math.max(m.vote_count || 1, 1)) / 15;

      // Recency: gentle bonus
      const releaseYear  = parseInt((m.release_date || m.first_air_date || '2000').slice(0, 4));
      const recencyBoost = Math.max(0, (releaseYear - 2000) / 400);

      // Strategy multipliers
      const strategyMult = m._strategy === 'actor'   ? 1.4
                         : m._strategy === 'recs'    ? 1.1
                         : m._strategy === 'explore' ? 0.85 // slight score reduction = lands in exploration pool
                         : 1.0;

      const score = (tmdbScore * srcWeight + normGenre + voteSignal + recencyBoost) * strategyMult;
      return { ...m, _score: score };
    })
    .filter(m => m._score > 0)
    .sort((a, b) => b._score - a._score);

  // ── Apply diversity buffer ─────────────────────────────────────────────────
  return applyDiversityBuffer(scored);
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function Recs() {
  const { watched, watchlist, ratings, likedActors, dislikedIds, addDisliked, tvProgress } = useStore();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const [items,           setItems]           = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [userRefreshing,  setUserRefreshing]  = useState(false);

  const navigate = useNavigate();
  const { selected, openMovie, closeMovie } = useMovieModal();
  const pushNav = (entry) => {
    if (entry.type === 'movie') openMovie(entry.data);
    else if (entry.type === 'actor') navigate(`/actor/${entry.data.id}`, { state: { actor: entry.data } });
  };

  const loaderRef  = useRef(null);
  const loadingRef = useRef(false);
  const profileRef = useRef(null);
  const pageRef    = useRef(1);
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
  const langCode   = TMDB_LANG_MAP[lang] || 'en-US';
  const allSaved   = useMemo(() => [...watched, ...watchlist], [watched, watchlist]);

  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds, tvProgress);
  }, [watched, watchlist, ratings, likedActors, dislikedIds, tvProgress]);

  const [observerKey, setObserverKey] = useState(0);

  const doLoad = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    const prof = profileRef.current;
    if (!prof) return;
    loadingRef.current = true;
    setLoading(true);

    const pageOffset = reset ? (profileRef.current._pageOffset || 0) : 0;
    const pg         = reset ? 1 + pageOffset : pageRef.current;

    try {
      let candidates = await fetchCandidates(prof, pg, langCode);

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
    } catch (e) {
      console.warn('Recs load error:', e);
    } finally {
      setLoading(false);
      setUserRefreshing(false);
      loadingRef.current = false;
      setObserverKey(k => k + 1);
    }
  }, [langCode]);

  const doReset = useCallback(() => {
    const prof      = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds, tvProgress);
    const newOffset = ((profileRef.current?._pageOffset || 0) + Math.floor(Math.random() * 4) + 1) % 10;
    prof._pageOffset = newOffset;
    profileRef.current = prof;
    pageRef.current    = 1 + newOffset;
    setItems([]);
    setLoading(false);
    setUserRefreshing(true);
    loadingRef.current = false;
    setTimeout(() => doLoad(true), 50);
  }, [watched, watchlist, ratings, likedActors, dislikedIds, tvProgress, doLoad]);

  useEffect(() => {
    profileRef.current = buildProfile(watched, watchlist, ratings, likedActors, dislikedIds, tvProgress);
    setItems([]);
    loadingRef.current = false;
    doReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const scrollRoot = el.closest('.app-content') || null;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loadingRef.current) doLoad(false); },
      { root: scrollRoot, rootMargin: '600px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [doLoad, observerKey]);

  const handleDislike = (id) => {
    addDisliked(id);
    setItems(prev => prev.filter(m => m.id !== id));
  };

  const noData     = !loading && allSaved.length === 0 && Object.keys(likedActors).length === 0;
  const hasSignals = watched.length > 0 || watchlist.length > 0 || Object.keys(likedActors).length > 0;

  return (
    <div className="page recs-page">
      <div className="recs-header">
        <div>
          <h1 className="recs-header__title">{t('home.forYou')}</h1>
          <p className="recs-header__sub">
            {!hasSignals
              ? t('home.saveMoviesHint')
              : Object.keys(likedActors).length > 0
              ? t('home.basedOnRatingsActors')
              : t('home.basedOnRatingsLists')}
          </p>
        </div>
        <button className={"recs-refresh"+(userRefreshing?" spinning":"")} onClick={doReset} disabled={userRefreshing}>
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
          <h3>{t('home.nothingYet')}</h3>
          <p>{t('home.startHint')}</p>
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

      <MovieModal movie={selected} onClose={closeMovie} onActorClick={a=>{ navigate(`/actor/${a.id}`, { state: { actor: a } }); }}/>
    </div>
  );
}