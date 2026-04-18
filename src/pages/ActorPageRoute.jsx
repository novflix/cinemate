import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HEADERS } from '../api';
import { useTheme } from '../theme';
import { useMovieModal } from '../hooks/useMovieModal';
import ActorPage from './ActorPage';
import MovieModal from '../components/MovieModal';

export default function ActorPageRoute() {
  const { actorId }                   = useParams();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const { lang }                      = useTheme();
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
  const langCode                      = TMDB_LANG_MAP[lang] || 'en-US';

  const [actor,   setActor]   = useState(location.state?.actor || null);
  const [loading, setLoading] = useState(!location.state?.actor);

  // Movie modal with ?movie=ID URL sync
  const { selected, openMovie, closeMovie } = useMovieModal();

  // Re-fetch actor when actorId changes (navigating actor→actor)
  useEffect(() => {
    setActor(null);
    setLoading(true);

    // If state was passed for this exact actor, use it immediately
    if (location.state?.actor && String(location.state.actor.id) === String(actorId)) {
      setActor(location.state.actor);
      setLoading(false);
      return;
    }

    if (!actorId) { navigate('/home', { replace: true }); return; }

    fetch(`https://api.themoviedb.org/3/person/${actorId}?language=${langCode}`, { headers: HEADERS })
      .then(r => r.json())
      .then(data => { setActor(data); setLoading(false); })
      .catch(() => navigate('/home', { replace: true }));
  // eslint-disable-next-line
  }, [actorId, langCode]);

  // Back button: always go one step back in history.
  // If a movie modal was open, its ?movie=ID entry is a real history push,
  // so navigate(-1) correctly closes the modal first, then another press goes to the previous page.
  const handleBack = () => navigate(-1);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'80vh'}}>
      <div style={{width:32,height:32,border:'2px solid var(--surface2)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
    </div>
  );

  if (!actor) return null;

  return (
    <>
      <ActorPage
        actor={actor}
        onBack={handleBack}
        onMovieClick={openMovie}
      />
      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onActorClick={(a) => {
          // Don't call closeMovie() here — that would replace the ?movie history entry.
          // Instead navigate forward; the new /actor/:id route will unmount the modal naturally.
          navigate(`/actor/${a.id}`, { state: { actor: a } });
        }}
        onCrewClick={(p) => navigate(`/person/${p.id}`, { state: { person: p } })}
        onStudioClick={(s) => navigate(`/studio/${s.id}`, { state: { studio: s } })}
      />
    </>
  );
}