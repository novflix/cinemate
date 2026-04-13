import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
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

    const sourceFetch = fetch(
      `https://api.themoviedb.org/3/${type}/${id}?language=${langCode}`,
      { headers: HEADERS }
    ).then(r => r.json());

    const similarFetch = tmdb.similar(type, id);

    Promise.all([sourceFetch, similarFetch])
      .then(([source, similar]) => {
        setSourceTitle(source.title || source.name || '');
        const results = (similar.results || []).map(m => ({
          ...m,
          media_type: type,
        }));
        setItems(results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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