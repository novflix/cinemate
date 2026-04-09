import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AltArrowLeftLinear, HeartLinear, CalendarLinear, PinLinear, VideoLibraryLinear, TVLinear } from 'solar-icon-set';
import { HEADERS, isShowOrAward } from '../api';
import { useStore } from '../store';
import { useTheme } from '../theme';
import MovieCard from '../components/MovieCard';
import './ActorPage.css';

export default function ActorPage({ actor, onBack, onMovieClick }) {
  const { likeActor, unlikeActor, isActorLiked } = useStore();
  const liked = isActorLiked(actor?.id);
  const [details, setDetails] = useState(null);
  const [credits, setCredits] = useState([]);
  const { lang } = useTheme();
  const { t } = useTranslation();
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
      // Filter out talk shows, award ceremonies, reality/news shows
      // then dedup by id (same film can appear via multiple roles) keeping highest vote_count
      const deduped = new Map();
      for (const m of (c.cast || [])) {
        if (!m.poster_path) continue;
        if (isShowOrAward(m)) continue;
        const existing = deduped.get(m.id);
        if (!existing || (m.vote_count || 0) > (existing.vote_count || 0)) {
          deduped.set(m.id, m);
        }
      }
      const all = [...deduped.values()]
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      setCredits(all);
    }).catch(() => {});
  }, [actor, langCode]);

  if (!actor) return null;

  const photo = actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null;
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
        <div className="actor-page__topbar">
          <button className="actor-page__back" onClick={onBack}><AltArrowLeftLinear size={20}/></button>
          <button
            className={"actor-page__like-btn" + (liked ? ' liked' : '')}
            onClick={() => liked ? unlikeActor(actor.id) : likeActor(actor)}
          >
            <HeartLinear size={16} fill={liked ? 'currentColor' : 'none'}/>
            {liked ? (lang==='ru'?'В избранном':'Liked') : (lang==='ru'?'Нравится':'Like')}
          </button>
        </div>
        <div className="actor-page__hero-content">
          {/* Rounded rect photo — shows faces properly */}
          {photo && <img className="actor-page__photo" src={photo} alt={name}/>}
          <div>
            <h1 className="actor-page__name">{name}</h1>
            {details?.known_for_department && <p className="actor-page__dept">{details.known_for_department}</p>}
            <div className="actor-page__counts">
              {movieCount > 0 && <span><VideoLibraryLinear size={11}/> {movieCount} {t('actor.movies')}</span>}
              {tvCount > 0 && <span><TVLinear size={11}/> {tvCount} {t('actor.series')}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="actor-page__body">
        {(born || birthplace) && (
          <div className="actor-page__info-row">
            {born && <span className="actor-page__info-item"><CalendarLinear size={13}/> {born}</span>}
            {birthplace && <span className="actor-page__info-item"><PinLinear size={13}/> {birthplace}</span>}
          </div>
        )}

        {bio && (
          <div className="actor-page__bio-wrap">
            <h3 className="actor-page__section-title">{t('actor.biography')}</h3>
            <ActorBio bio={bio}/>
          </div>
        )}

        {credits.length > 0 && (
          <div className="actor-page__filmography">
            <h3 className="actor-page__section-title">
              {t('actor.filmography')}
              <span className="actor-page__count-badge">{credits.length}</span>
            </h3>
            <div className="actor-page__films-grid">
              {credits.map((m) => {
                return (
                  <div key={m.id}>
                    <MovieCard
                      movie={{...m, media_type: m.media_type || 'movie'}}
                      onClick={() => onMovieClick && onMovieClick({...m, media_type: m.media_type || 'movie'})}
                    />
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