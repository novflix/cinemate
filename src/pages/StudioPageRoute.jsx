import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HEADERS } from '../api';
import { useTheme } from '../theme';
import { useMovieModal } from '../hooks/useMovieModal';
import CollectionPage from './CollectionPage';
import MovieModal from '../components/MovieModal';

export default function StudioPageRoute() {
  const { studioId }  = useParams();
  const navigate      = useNavigate();
  const location      = useLocation();
  const { lang }      = useTheme();
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
  const langCode      = TMDB_LANG_MAP[lang] || 'en-US';

  const [studio, setStudio]   = useState(location.state?.studio || null);
  const [loading, setLoading] = useState(!location.state?.studio);

  const { selected, openMovie, closeMovie } = useMovieModal();

  useEffect(() => {
    if (!studioId) { navigate('/home', { replace: true }); return; }

    // Use state if it matches the current id
    if (location.state?.studio && String(location.state.studio.id) === String(studioId)) {
      setStudio({ entityType: 'company', ...location.state.studio });
      setLoading(false);
      return;
    }

    setStudio(null);
    setLoading(true);
    fetch(`https://api.themoviedb.org/3/company/${studioId}?language=${langCode}`, { headers: HEADERS })
      .then(r => r.json())
      .then(data => {
        setStudio({
          id: data.id,
          name: data.name,
          entityType: location.state?.studio?.entityType || 'company',
          logo: data.logo_path ? `https://image.tmdb.org/t/p/w92${data.logo_path}` : null,
        });
        setLoading(false);
      })
      .catch(() => navigate('/home', { replace: true }));
  // eslint-disable-next-line
  }, [studioId, langCode]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--surface2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  );

  if (!studio) return null;

  return (
    <>
      <CollectionPage
        item={{ type: 'company', entityType: studio.entityType || 'company', id: studio.id, name: studio.name, logo: studio.logo }}
        onBack={() => navigate(-1)}
        onMovieClick={openMovie}
      />
      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onActorClick={(a) => navigate(`/actor/${a.id}`, { state: { actor: a } })}
        onCrewClick={(p) => navigate(`/person/${p.id}`, { state: { person: p } })}
        onStudioClick={(s) => navigate(`/studio/${s.id}`, { state: { studio: s } })}
      />
    </>
  );
}