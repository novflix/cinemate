import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Calendar, MapPin } from 'lucide-react';
import { tmdb } from '../api';
import { useTheme, t } from '../theme';
import './ActorPage.css';

export default function ActorPage({ actor, onBack, onMovieClick }) {
  const [details, setDetails] = useState(null);
  const [credits, setCredits] = useState([]);
  const { lang } = useTheme();

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${actor.id}?language=${lang==='ru'?'ru-RU':'en-US'}`, {
        headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWU5ZDhiMjQxNmZkZmMzZThkYTIwOTQ3ZWVmZmIyOSIsIm5iZiI6MTc3MzU3ODA1Ny40NTYsInN1YiI6IjY5YjZhNzQ5NWNiYjJlMDcwMzY3MzkxNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oV8T4jCi78cD-1-y_rGlfaPS55RGvXFshRniaiP93FM` }
      }).then(r=>r.json()),
      fetch(`https://api.themoviedb.org/3/person/${actor.id}/combined_credits?language=${lang==='ru'?'ru-RU':'en-US'}`, {
        headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWU5ZDhiMjQxNmZkZmMzZThkYTIwOTQ3ZWVmZmIyOSIsIm5iZiI6MTc3MzU3ODA1Ny40NTYsInN1YiI6IjY5YjZhNzQ5NWNiYjJlMDcwMzY3MzkxNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oV8T4jCi78cD-1-y_rGlfaPS55RGvXFshRniaiP93FM` }
      }).then(r=>r.json()),
    ]).then(([d, c]) => {
      setDetails(d);
      const cast = (c.cast||[])
        .filter(m => m.poster_path && (m.vote_average||0) > 5)
        .sort((a,b) => (b.vote_count||0)-(a.vote_count||0))
        .slice(0, 20);
      setCredits(cast);
    }).catch(()=>{});
  }, [actor, lang]);

  if (!actor) return null;

  const photo = actor.profile_path ? `https://image.tmdb.org/t/p/w342${actor.profile_path}` : null;
  const name = actor.name || '';
  const born = details?.birthday;
  const birthplace = details?.place_of_birth;
  const bio = details?.biography;

  return (
    <div className="actor-page page">
      <div className="actor-page__hero">
        {photo && <img className="actor-page__bg" src={photo} alt="" />}
        <div className="actor-page__bg-fade" />
        <button className="actor-page__back" onClick={onBack}><ArrowLeft size={20}/></button>
        <div className="actor-page__hero-content">
          {photo && <img className="actor-page__photo" src={photo} alt={name} />}
          <div>
            <h1 className="actor-page__name">{name}</h1>
            {details?.known_for_department && <p className="actor-page__role">{details.known_for_department}</p>}
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
            <p className="actor-page__bio">{bio.slice(0, 400)}{bio.length>400?'…':''}</p>
          </div>
        )}

        {credits.length > 0 && (
          <div className="actor-page__filmography">
            <h3 className="actor-page__section-title">{t(lang,'Фильмография','Filmography')}</h3>
            <div className="actor-page__films-grid">
              {credits.map(m => {
                const poster = tmdb.posterUrl(m.poster_path);
                const title = m.title || m.name || '';
                const year = (m.release_date||m.first_air_date||'').slice(0,4);
                return (
                  <div key={m.id+'-'+(m.media_type||'')} className="actor-page__film" onClick={() => onMovieClick && onMovieClick({...m, media_type: m.media_type||'movie'})}>
                    <div className="actor-page__film-poster">
                      {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="actor-page__film-no-poster"/>}
                      {m.vote_average > 0 && <span className="actor-page__film-rating"><Star size={9} fill="currentColor"/>{m.vote_average.toFixed(1)}</span>}
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
