import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Calendar, MapPin, Film, Tv2 } from 'lucide-react';
import { tmdb, HEADERS } from '../api';
import { useTheme, t } from '../theme';
import './ActorPage.css';

export default function ActorPage({ actor, onBack, onMovieClick }) {
  const [details, setDetails] = useState(null);
  const [credits, setCredits] = useState([]);
  const { lang } = useTheme();
  const langCode = lang === 'ru' ? 'ru-RU' : 'en-US';

  useEffect(() => {
    if (!actor) return;
    setDetails(null);
    setCredits([]);
    Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${actor.id}?language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/person/${actor.id}/combined_credits?language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
    ]).then(([d, c]) => {
      setDetails(d);
      // Show ALL credits that have a poster, sorted by popularity/vote_count - NO slice limit
      const all = (c.cast || [])
        .filter(m => m.poster_path)
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      setCredits(all);
    }).catch(() => {});
  }, [actor, langCode]);

  if (!actor) return null;

  const photo = actor.profile_path ? `https://image.tmdb.org/t/p/w342${actor.profile_path}` : null;
  const name = actor.name || '';
  const born = details?.birthday;
  const birthplace = details?.place_of_birth;
  const bio = details?.biography;
  const movieCount = credits.filter(m => m.media_type === 'movie').length;
  const tvCount = credits.filter(m => m.media_type === 'tv').length;

  return (
    <div className="actor-page page">
      <div className="actor-page__hero">
        {photo && <img className="actor-page__bg" src={photo} alt=""/>}
        <div className="actor-page__bg-fade"/>
        <button className="actor-page__back" onClick={onBack}><ArrowLeft size={20}/></button>
        <div className="actor-page__hero-content">
          {/* Rounded rect photo — shows faces properly */}
          {photo && <img className="actor-page__photo" src={photo} alt={name}/>}
          <div>
            <h1 className="actor-page__name">{name}</h1>
            {details?.known_for_department && <p className="actor-page__dept">{details.known_for_department}</p>}
            <div className="actor-page__counts">
              {movieCount > 0 && <span><Film size={11}/> {movieCount} {t(lang,'фильмов','movies')}</span>}
              {tvCount > 0 && <span><Tv2 size={11}/> {tvCount} {t(lang,'сериалов','series')}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="actor-page__body">
        {(born || birthplace) && (
          <div className="actor-page__info-row">
            {born && <span className="actor-page__info-item"><Calendar size={13}/> {born}</span>}
            {birthplace && <span className="actor-page__info-item"><MapPin size={13}/> {birthplace}</span>}
          </div>
        )}

        {bio && (
          <div className="actor-page__bio-wrap">
            <h3 className="actor-page__section-title">{t(lang,'Биография','Biography')}</h3>
            <ActorBio bio={bio}/>
          </div>
        )}

        {credits.length > 0 && (
          <div className="actor-page__filmography">
            <h3 className="actor-page__section-title">
              {t(lang,'Фильмография','Filmography')}
              <span className="actor-page__count-badge">{credits.length}</span>
            </h3>
            <div className="actor-page__films-grid">
              {credits.map((m, i) => {
                const poster = tmdb.posterUrl(m.poster_path);
                const title = m.title || m.name || '';
                const year = (m.release_date || m.first_air_date || '').slice(0, 4);
                return (
                  <div key={`${m.id}-${i}`} className="actor-page__film"
                    onClick={() => onMovieClick && onMovieClick({...m, media_type: m.media_type || 'movie'})}>
                    <div className="actor-page__film-poster">
                      {poster
                        ? <img src={poster} alt={title} loading="lazy"/>
                        : <div className="actor-page__film-no-poster"/>
                      }
                      {m.vote_average > 0 && (
                        <span className="actor-page__film-rating">
                          <Star size={9} fill="currentColor"/>{m.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="actor-page__film-title">{title}</p>
                    <p className="actor-page__film-year">{year}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActorBio({ bio }) {
  const [expanded, setExpanded] = useState(false);
  const limit = 320;
  const short = bio.length > limit;
  return (
    <div>
      <p className="actor-page__bio">
        {expanded || !short ? bio : bio.slice(0, limit) + '…'}
      </p>
      {short && (
        <button className="actor-page__bio-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Скрыть' : 'Читать далее'}
        </button>
      )}
    </div>
  );
}