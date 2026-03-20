import { useState, useEffect, createContext, useContext } from 'react';

const StoreContext = createContext(null);
const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// Stored entry: only language-neutral fields
// { id, media_type, added_at }
// We keep a few neutral fields for fallback display before fetch completes:
// poster_path, genre_ids, vote_average, vote_count, popularity
// These don't change with language — only title/name/overview/poster do

export function StoreProvider({ children }) {
  const [watched,   setWatched]   = useState(() => load('watched',   []));
  const [watchlist, setWatchlist] = useState(() => load('watchlist', []));
  const [profile,   setProfile]   = useState(() => load('profile',   { name: 'Кинолюб', avatar: null, bio: '' }));

  useEffect(() => save('watched',   watched),   [watched]);
  useEffect(() => save('watchlist', watchlist), [watchlist]);
  useEffect(() => save('profile',   profile),   [profile]);

  // Strip language-sensitive fields before saving, keep neutral ones
  const normalize = (movie) => ({
    id:           movie.id,
    media_type:   movie.media_type || (movie.title ? 'movie' : 'tv'),
    // Language-neutral fields kept for offline/fallback:
    poster_path:  movie.poster_path  || null,
    backdrop_path:movie.backdrop_path|| null,
    vote_average: movie.vote_average || 0,
    vote_count:   movie.vote_count   || 0,
    popularity:   movie.popularity   || 0,
    genre_ids:    movie.genre_ids    || [],
    release_date:      movie.release_date       || null,
    first_air_date:    movie.first_air_date      || null,
    // Keep original title as absolute fallback (shown briefly before fetch)
    _fallback_title: movie.title || movie.name  || '',
  });

  const addToWatched = (movie) => {
    setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    setWatched(prev => prev.find(m => m.id === movie.id) ? prev : [normalize(movie), ...prev]);
  };
  const addToWatchlist = (movie) => {
    if (!watched.find(m => m.id === movie.id))
      setWatchlist(prev => prev.find(m => m.id === movie.id) ? prev : [normalize(movie), ...prev]);
  };
  const removeFromWatched   = (id) => setWatched(prev   => prev.filter(m => m.id !== id));
  const removeFromWatchlist = (id) => setWatchlist(prev => prev.filter(m => m.id !== id));
  const isWatched    = (id) => watched.some(m   => m.id === id);
  const isInWatchlist= (id) => watchlist.some(m => m.id === id);

  return (
    <StoreContext.Provider value={{
      watched, watchlist, profile, setProfile,
      addToWatched, addToWatchlist,
      removeFromWatched, removeFromWatchlist,
      isWatched, isInWatchlist,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);