import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HEADERS } from '../api';
import { useTheme } from '../theme';
import { useMovieModal } from '../hooks/useMovieModal';
import PersonPage from './PersonPage';
import MovieModal from '../components/MovieModal';

export default function PersonPageRoute() {
  const { personId }                  = useParams();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const { lang }                      = useTheme();
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
  const langCode                      = TMDB_LANG_MAP[lang] || 'en-US';

  const [person,  setPerson]  = useState(location.state?.person || null);
  const [loading, setLoading] = useState(!location.state?.person);

  const { selected, openMovie, closeMovie } = useMovieModal();

  useEffect(() => {
    setPerson(null);
    setLoading(true);

    if (location.state?.person && String(location.state.person.id) === String(personId)) {
      setPerson(location.state.person);
      setLoading(false);
      return;
    }

    if (!personId) { navigate('/home', { replace: true }); return; }

    fetch(`https://api.themoviedb.org/3/person/${personId}?language=${langCode}`, { headers: HEADERS })
      .then(r => r.json())
      .then(data => { setPerson(data); setLoading(false); })
      .catch(() => navigate('/home', { replace: true }));
  // eslint-disable-next-line
  }, [personId, langCode]);

  const handleBack = () => navigate(-1);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--surface2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  );

  if (!person) return null;

  return (
    <>
      <PersonPage
        person={person}
        onBack={handleBack}
        onMovieClick={openMovie}
      />
      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onCrewClick={(p) => {
          navigate(`/person/${p.id}`, { state: { person: p } });
        }}
        onActorClick={(a) => {
          navigate(`/actor/${a.id}`, { state: { actor: a } });
        }}
        onStudioClick={(s) => {
          navigate(`/studio/${s.id}`, { state: { studio: s } });
        }}
      />
    </>
  );
}