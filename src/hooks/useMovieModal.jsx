import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HEADERS } from '../api';
import { useTheme } from '../theme';

/**
 * Manages movie modal state synced with ?movie=ID URL param.
 * - Opening a movie pushes a new history entry (?movie=ID) — so browser Back closes it
 * - Closing via closeMovie() removes ?movie from the URL using replace:true
 *   (the modal-open entry is already the current one, so this is safe)
 * - closeSilent() clears the selected state WITHOUT touching history — used when
 *   navigating away from the page (the new route unmounts the modal naturally)
 */
export function useMovieModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(false);
  const { lang } = useTheme();
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';

  const movieId   = searchParams.get('movie');
  const mediaType = searchParams.get('type') || 'movie';

  // On mount (or URL / lang change): if ?movie=ID in URL, fetch and open that movie
  useEffect(() => {
    if (!movieId) { setSelected(null); return; }
    // If we already have this movie open in the same language, don't re-fetch
    if (selected && String(selected.id) === String(movieId) && selected._lang === langCode) return;

    // AbortController so stale in-flight requests don't overwrite newer state
    const controller = new AbortController();

    setLoadingMovie(true);
    fetch(
      `https://api.themoviedb.org/3/${mediaType}/${movieId}?language=${langCode}`,
      { headers: HEADERS, signal: controller.signal }
    )
      .then(r => r.json())
      .then(data => {
        setSelected({ ...data, media_type: mediaType, _lang: langCode });
        setLoadingMovie(false);
      })
      .catch(err => {
        if (err?.name === 'AbortError') return; // navigated away — ignore
        // Bad ID — just clear the param
        setSearchParams(p => { p.delete('movie'); p.delete('type'); return p; }, { replace: true });
        setLoadingMovie(false);
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, langCode]);

  // Push a new history entry so browser Back / navigate(-1) closes the modal
  const openMovie = useCallback((movie) => {
    setSelected(movie);
    const mt = movie.media_type || 'movie';
    setSearchParams(
      p => { p.set('movie', movie.id); p.set('type', mt); return p; },
      { replace: false }   // push — Back will close the modal
    );
  }, [setSearchParams]);

  // Normal close: replace the current ?movie entry with a clean URL
  const closeMovie = useCallback(() => {
    setSelected(null);
    setSearchParams(
      p => { p.delete('movie'); p.delete('type'); return p; },
      { replace: true }
    );
  }, [setSearchParams]);

  return { selected, openMovie, closeMovie, loadingMovie };
}