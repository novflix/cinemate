import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HEADERS } from '../api';
import { useTheme } from '../theme';
import { useMovieModal } from '../hooks/useMovieModal';
import ActorPage from './ActorPage';
import MovieModal from '../components/MovieModal';

export default function ActorPageRoute() {
  const { actorId } = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { lang }    = useTheme();
  const langCode    = lang === 'ru' ? 'ru-RU' : 'en-US';

  const [actor,   setActor]   = useState(location.state?.actor || null);
  const [loading, setLoading] = useState(!location.state?.actor);

  // Movie modal with ?movie=ID URL sync
  const { selected, openMovie, closeMovie } = useMovieModal();

  // Re-fetch actor when actorId changes (navigating actor→actor)
  useEffect(() => {
    // Reset actor state on id change so we show loader
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
        onBack={() => navigate(-1)}
        onMovieClick={openMovie}
      />
      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onActorClick={(a) => {
          closeMovie();
          navigate(`/actor/${a.id}`, { state: { actor: a } });
        }}
      />
    </>
  );
}