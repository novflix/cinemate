import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftLinear } from 'solar-icon-set';
import { tmdb, HEADERS, traktRelated } from '../api';
import { useTheme } from '../theme';
import { useMovieModal } from '../hooks/useMovieModal';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import './SimilarPage.css';

export default function SimilarPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { lang } = useTheme();
  const { selected, openMovie, closeMovie } = useMovieModal();

  const [sourceTitle, setSourceTitle] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const langCode = lang === 'ru' ? 'ru-RU' : 'en-US';

  // sourceMovie and fromPath passed via navigation state from MovieModal
  const sourceMovie = location.state?.sourceMovie || null;
  const fromPath    = location.state?.fromPath    || null;

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);

    const controller = new AbortController();
    const { signal } = controller;

    const sourceFetch = fetch(
      `https://api.themoviedb.org/3/${type}/${id}?language=${langCode}`,
      { headers: HEADERS, signal }
    ).then(r => r.json());

    // TMDB recommendations (their own similar engine)
    const tmdbSimilarFetch = tmdb.similar(type, id);

    // Trakt related (user-behaviour based, much more accurate)
    const traktFetch = traktRelated(Number(id), type, signal);

    Promise.all([sourceFetch, tmdbSimilarFetch, traktFetch])
      .then(async ([source, tmdbSimilar, traktItems]) => {
        setSourceTitle(source.title || source.name || '');

        const tmdbResults = (tmdbSimilar.results || []).map(m => ({
          ...m,
          media_type: type,
          _source: 'tmdb',
        }));

        // For each Trakt result, fetch TMDB details to get poster + vote data
        const traktEnriched = await Promise.all(
          traktItems.slice(0, 20).map(async item => {
            try {
              const details = await fetch(
                `https://api.themoviedb.org/3/${type}/${item.tmdb_id}?language=${langCode}`,
                { headers: HEADERS, signal }
              ).then(r => r.json());
              if (!details.poster_path || (details.vote_average || 0) === 0) return null;
              return { ...details, media_type: type, _source: 'trakt' };
            } catch { return null; }
          })
        );

        const traktResults = traktEnriched.filter(Boolean);

        // Merge: Trakt results first (better quality), then TMDB to fill gaps
        // Deduplicate by TMDB id
        const seen = new Set();
        const merged = [];

        // Trakt results get priority — they're based on actual user behaviour
        for (const m of traktResults) {
          if (!seen.has(m.id)) { seen.add(m.id); merged.push(m); }
        }
        // TMDB fills in anything Trakt missed
        for (const m of tmdbResults) {
          if (!seen.has(m.id) && m.poster_path && (m.vote_average || 0) > 0) {
            seen.add(m.id);
            merged.push(m);
          }
        }

        // Sort merged list: by vote_average * log(vote_count) — quality-weighted
        merged.sort((a, b) => {
          const scoreA = (a.vote_average || 0) * Math.log10(Math.max(a.vote_count || 1, 1));
          const scoreB = (b.vote_average || 0) * Math.log10(Math.max(b.vote_count || 1, 1));
          // Trakt items get a small boost to stay near the top
          const boostA = a._source === 'trakt' ? 1.15 : 1;
          const boostB = b._source === 'trakt' ? 1.15 : 1;
          return (scoreB * boostB) - (scoreA * boostA);
        });

        setItems(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, type, langCode]);

  const handleBack = () => {
    if (sourceMovie && fromPath) {
      // Navigate back to the page the modal was on, re-opening the modal via URL params
      const mediaType = sourceMovie.media_type || type;
      navigate(`${fromPath}?movie=${sourceMovie.id}&type=${mediaType}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="similar-page">
      <div className="similar-header">
        <button className="similar-back" onClick={handleBack}>
          <ArrowLeftLinear size={18} />
        </button>
        <div className="similar-header__text">
          <span className="similar-header__label">{t('similar.title')}</span>
          {sourceTitle && (
            <span className="similar-header__source">{sourceTitle}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="similar-loading">
          <div className="similar-loading__spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="similar-empty">
          <p>{t('similar.empty')}</p>
        </div>
      ) : (
        <div className="similar-grid">
          {items.map(m => (
            <div key={`${m.id}-${m.media_type}`}>
              <MovieCard movie={m} onClick={openMovie} />
            </div>
          ))}
        </div>
      )}

      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onActorClick={actor => navigate(`/actor/${actor.id}`, { state: { actor } })}
        onCrewClick={person => navigate(`/person/${person.id}`, { state: { person: person } })}
      />
    </div>
  );
}