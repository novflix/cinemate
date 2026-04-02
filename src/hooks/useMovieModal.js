import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HEADERS } from '../api';
import { useTheme } from '../theme';

/**
 * Manages movie modal state synced with ?movie=ID URL param.
 * - Opening a movie adds ?movie=ID to the URL (shareable link)
 * - Closing removes it
 * - If page loads with ?movie=ID, fetches that movie and opens the modal
 */
export function useMovieModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(false);
  const { lang } = useTheme();
  const langCode = lang === 'ru' ? 'ru-RU' : 'en-US';

  // On mount (or lang change): if ?movie=ID in URL, fetch and open that movie
  useEffect(() => {
    const movieId    = searchParams.get('movie');
    const mediaType  = searchParams.get('type') || 'movie';

    if (!movieId) { setSelected(null); return; }
    // If we already have this movie open, don't re-fetch
    if (selected && String(selected.id) === String(movieId)) return;

    setLoadingMovie(true);
    fetch(
      `https://api.themoviedb.org/3/${mediaType}/${movieId}?language=${langCode}`,
      { headers: HEADERS }
    )
      .then(r => r.json())
      .then(data => {
        setSelected({ ...data, media_type: mediaType });
        setLoadingMovie(false);
      })
      .catch(() => {
        // Bad ID — just clear the param
        setSearchParams(p => { p.delete('movie'); p.delete('type'); return p; }, { replace: true });
        setLoadingMovie(false);
      });
  // eslint-disable-next-line
  }, [searchParams.get('movie'), langCode]);

  const openMovie = useCallback((movie) => {
    setSelected(movie);
    const mediaType = movie.media_type || 'movie';
    setSearchParams(
      p => { p.set('movie', movie.id); p.set('type', mediaType); return p; },
      { replace: false }
    );
  }, [setSearchParams]);

  const closeMovie = useCallback(() => {
    setSelected(null);
    setSearchParams(
      p => { p.delete('movie'); p.delete('type'); return p; },
      { replace: true }
    );
  }, [setSearchParams]);

  return { selected, openMovie, closeMovie, loadingMovie };
}