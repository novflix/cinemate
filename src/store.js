import { useState, useEffect, createContext, useContext } from 'react';

const StoreContext = createContext(null);

const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export function StoreProvider({ children }) {
  const [watched, setWatched] = useState(() => load('watched', []));
  const [watchlist, setWatchlist] = useState(() => load('watchlist', []));
  const [profile, setProfile] = useState(() => load('profile', { name: 'Кинолюб', avatar: null, bio: '' }));

  useEffect(() => save('watched', watched), [watched]);
  useEffect(() => save('watchlist', watchlist), [watchlist]);
  useEffect(() => save('profile', profile), [profile]);

  const addToWatched = (movie) => {
    setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    setWatched(prev => prev.find(m => m.id === movie.id) ? prev : [movie, ...prev]);
  };
  const addToWatchlist = (movie) => {
    if (!watched.find(m => m.id === movie.id))
      setWatchlist(prev => prev.find(m => m.id === movie.id) ? prev : [movie, ...prev]);
  };
  const removeFromWatched = (id) => setWatched(prev => prev.filter(m => m.id !== id));
  const removeFromWatchlist = (id) => setWatchlist(prev => prev.filter(m => m.id !== id));
  const isWatched = (id) => watched.some(m => m.id === id);
  const isInWatchlist = (id) => watchlist.some(m => m.id === id);

  return (
    <StoreContext.Provider value={{ watched, watchlist, profile, setProfile, addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist, isWatched, isInWatchlist }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
