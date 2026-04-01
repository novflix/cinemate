import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { supabase } from './supabase';

const StoreContext = createContext(null);
const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const normalize = (movie) => ({
  id:            movie.id,
  media_type:    movie.media_type || (movie.title ? 'movie' : 'tv'),
  poster_path:   movie.poster_path   || null,
  backdrop_path: movie.backdrop_path || null,
  vote_average:  movie.vote_average  || 0,
  vote_count:    movie.vote_count    || 0,
  popularity:    movie.popularity    || 0,
  genre_ids:     movie.genre_ids     || [],
  release_date:      movie.release_date      || null,
  first_air_date:    movie.first_air_date     || null,
  _fallback_title:   movie.title || movie.name || '',
});

async function syncToCloud(userId, data) {
  if (!userId) return;
  await supabase.from('user_data').upsert({
    user_id:     userId,
    watched:     data.watched,
    watchlist:   data.watchlist,
    ratings:     data.ratings,
    profile:     data.profile,
    liked_actors:data.likedActors,
    disliked_ids:data.dislikedIds,
    tv_progress: data.tvProgress,
    custom_lists:data.customLists,
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

async function loadFromCloud(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('user_data').select('*').eq('user_id', userId).single();
  if (error || !data) return null;
  return data;
}

export function StoreProvider({ children, userId }) {
  const [watched,      setWatched]      = useState(() => load('watched',       []));
  const [watchlist,    setWatchlist]    = useState(() => load('watchlist',     []));
  const [ratings,      setRatings]      = useState(() => load('ratings',       {}));
  const [profile,      setProfile]      = useState(() => load('profile',       { name: 'Кинолюб', avatar: null, bio: '' }));
  // { [actorId]: { id, name, profile_path } }
  const [likedActors,  setLikedActors]  = useState(() => load('likedActors',   {}));
  // Set of movie/tv ids user said "not interested"
  const [dislikedIds,  setDislikedIds]  = useState(() => load('dislikedIds',   []));
  // { [id]: { season: N, episode: N, totalSeasons: N, totalEpisodes: N } }
  const [tvProgress,   setTvProgress]   = useState(() => load('tvProgress',    {}));
  // { [listId]: { id, name, items: [], createdAt } }
  const [customLists,  setCustomLists]  = useState(() => load('customLists',   {}));
  const [pendingRating,setPendingRating]= useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [syncing,      setSyncing]      = useState(false);

  useEffect(() => {
    if (!userId) return;
    setSyncing(true);
    loadFromCloud(userId).then(data => {
      if (data) {
        if (data.watched)      { setWatched(data.watched);           save('watched',      data.watched); }
        if (data.watchlist)    { setWatchlist(data.watchlist);       save('watchlist',    data.watchlist); }
        if (data.ratings)      { setRatings(data.ratings);           save('ratings',      data.ratings); }
        if (data.profile)      { setProfile(data.profile);           save('profile',      data.profile); }
        if (data.liked_actors) { setLikedActors(data.liked_actors);  save('likedActors',  data.liked_actors); }
        if (data.disliked_ids) { setDislikedIds(data.disliked_ids);  save('dislikedIds',  data.disliked_ids); }
        if (data.tv_progress)  { setTvProgress(data.tv_progress);    save('tvProgress',   data.tv_progress); }
        if (data.custom_lists) { setCustomLists(data.custom_lists);  save('customLists',  data.custom_lists); }
      }
      setSyncing(false);
    });
  }, [userId]);

  useEffect(() => save('watched',     watched),     [watched]);
  useEffect(() => save('watchlist',   watchlist),   [watchlist]);
  useEffect(() => save('ratings',     ratings),     [ratings]);
  useEffect(() => save('profile',     profile),     [profile]);
  useEffect(() => save('likedActors', likedActors), [likedActors]);
  useEffect(() => save('dislikedIds', dislikedIds), [dislikedIds]);
  useEffect(() => save('tvProgress',   tvProgress),   [tvProgress]);
  useEffect(() => save('customLists',  customLists),  [customLists]);

  const syncRef = useCallback(() => {
    if (!userId) return;
    syncToCloud(userId, { watched, watchlist, ratings, profile, likedActors, dislikedIds, tvProgress, customLists });
  }, [userId, watched, watchlist, ratings, profile, likedActors, dislikedIds, tvProgress, customLists]);

  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(syncRef, 1500);
    return () => clearTimeout(t);
  }, [userId, watched, watchlist, ratings, profile, likedActors, dislikedIds, customLists, syncRef]);

  const addToWatched = (movie) => {
    const norm = normalize(movie);
    setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    setWatched(prev => {
      if (prev.find(m => m.id === movie.id)) return prev;
      setTimeout(() => setPendingRating(norm), 350);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1400);
      return [norm, ...prev];
    });
  };
  const addToWatchlist   = (movie) => {
    if (!watched.find(m => m.id === movie.id))
      setWatchlist(prev => prev.find(m => m.id === movie.id) ? prev : [normalize(movie), ...prev]);
  };
  const removeFromWatched   = (id) => setWatched(prev   => prev.filter(m => m.id !== id));
  const removeFromWatchlist = (id) => setWatchlist(prev => prev.filter(m => m.id !== id));
  const isWatched     = (id) => watched.some(m => m.id === id);
  const isInWatchlist = (id) => watchlist.some(m => m.id === id);
  const rateMovie     = (id, score) => setRatings(prev => ({ ...prev, [id]: score }));
  const getRating     = (id) => ratings[id] || null;

  const likeActor   = (actor) => setLikedActors(prev => ({ ...prev, [actor.id]: { id: actor.id, name: actor.name, profile_path: actor.profile_path || null } }));
  const unlikeActor = (id)    => setLikedActors(prev => { const n = {...prev}; delete n[id]; return n; });
  const isActorLiked= (id)    => !!likedActors[id];

  const addDisliked    = (id) => setDislikedIds(prev => prev.includes(id) ? prev : [...prev, id]);

  const setTvProgressEntry = (id, data) => setTvProgress(prev => ({ ...prev, [id]: { ...prev[id], ...data } }));
  const getTvProgress      = (id) => tvProgress[id] || null;
  const clearTvProgress    = (id) => setTvProgress(prev => { const n = {...prev}; delete n[id]; return n; });
  const isDisliked     = (id) => dislikedIds.includes(id);

  // ── Custom Lists ──────────────────────────────────────────────────────────
  const createCustomList = (name, description = '', image = null) => {
    const id = `list_${Date.now()}`;
    setCustomLists(prev => ({ ...prev, [id]: { id, name, description, image, items: [], createdAt: Date.now() } }));
    return id;
  };
  const deleteCustomList = (listId) => setCustomLists(prev => { const n = {...prev}; delete n[listId]; return n; });
  const renameCustomList = (listId, name) => setCustomLists(prev => ({
    ...prev, [listId]: { ...prev[listId], name }
  }));
  const addToCustomList  = (listId, movie) => setCustomLists(prev => {
    const list = prev[listId];
    if (!list) return prev;
    if (list.items.find(m => m.id === movie.id)) return prev;
    return { ...prev, [listId]: { ...list, items: [normalize(movie), ...list.items] } };
  });
  const removeFromCustomList = (listId, movieId) => setCustomLists(prev => {
    const list = prev[listId];
    if (!list) return prev;
    return { ...prev, [listId]: { ...list, items: list.items.filter(m => m.id !== movieId) } };
  });
  const isInCustomList = (listId, movieId) => !!customLists[listId]?.items.find(m => m.id === movieId);
  const updateListMeta = (listId, meta) => setCustomLists(prev => {
    const list = prev[listId];
    if (!list) return prev;
    return { ...prev, [listId]: { ...list, ...meta } };
  });

  const ctxValue = useMemo(() => ({
    watched, watchlist, ratings, profile, setProfile, syncing,
    likedActors, likeActor, unlikeActor, isActorLiked,
    dislikedIds, addDisliked, isDisliked,
    tvProgress, setTvProgressEntry, getTvProgress, clearTvProgress,
    customLists, createCustomList, deleteCustomList, renameCustomList,
    addToCustomList, removeFromCustomList, isInCustomList, updateListMeta,
    pendingRating, setPendingRating, showConfetti, setShowConfetti,
    addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist,
    isWatched, isInWatchlist, rateMovie, getRating,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [watched, watchlist, ratings, profile, likedActors, dislikedIds,
       tvProgress, customLists, pendingRating, showConfetti, syncing]);

  return (
    <StoreContext.Provider value={ctxValue}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);