import { useState, useEffect, createContext, useContext } from 'react';

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

export function StoreProvider({ children }) {
  const [watched,       setWatched]       = useState(() => load('watched',   []));
  const [watchlist,     setWatchlist]     = useState(() => load('watchlist', []));
  const [ratings,       setRatings]       = useState(() => load('ratings',   {}));
  const [profile,       setProfile]       = useState(() => load('profile',   { name: 'Кинолюб', avatar: null, bio: '' }));
  // Global rating prompt: set to a movie object to show prompt, null to hide
  const [pendingRating, setPendingRating] = useState(null);

  useEffect(() => save('watched',   watched),   [watched]);
  useEffect(() => save('watchlist', watchlist), [watchlist]);
  useEffect(() => save('ratings',   ratings),   [ratings]);
  useEffect(() => save('profile',   profile),   [profile]);

  const addToWatched = (movie) => {
    const norm = normalize(movie);
    setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    setWatched(prev => {
      if (prev.find(m => m.id === movie.id)) return prev;
      // Trigger rating prompt after state update
      setTimeout(() => setPendingRating(norm), 350);
      return [norm, ...prev];
    });
  };
  const addToWatchlist   = (movie) => {
    if (!watched.find(m => m.id === movie.id))
      setWatchlist(prev => prev.find(m => m.id === movie.id) ? prev : [normalize(movie), ...prev]);
  };
  const removeFromWatched   = (id) => setWatched(prev   => prev.filter(m => m.id !== id));
  const removeFromWatchlist = (id) => setWatchlist(prev => prev.filter(m => m.id !== id));
  const isWatched     = (id) => watched.some(m   => m.id === id);
  const isInWatchlist = (id) => watchlist.some(m => m.id === id);
  const rateMovie     = (id, score) => setRatings(prev => ({ ...prev, [id]: score }));
  const getRating     = (id) => ratings[id] || null;

  return (
    <StoreContext.Provider value={{
      watched, watchlist, ratings, profile, setProfile,
      pendingRating, setPendingRating,
      addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist,
      isWatched, isInWatchlist, rateMovie, getRating,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);