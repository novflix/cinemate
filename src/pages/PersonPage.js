import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AltArrowLeftLinear, CalendarLinear, PinLinear, VideoLibraryLinear, TVLinear, UsersGroupTwoRoundedLinear } from 'solar-icon-set';
import { HEADERS, isShowOrAward } from '../api';
import { useTheme } from '../theme';
import MovieCard from '../components/MovieCard';
import './ActorPage.css';
import './PersonPage.css';

function PersonBio({ bio }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const limit = 380;
  const short = bio.length > limit;
  return (
    <div>
      <p className="actor-page__bio">
        {expanded || !short ? bio : bio.slice(0, limit) + '…'}
      </p>
      {short && (
        <button className="actor-page__bio-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded ? t('modal.showLess') : t('modal.readMore')}
        </button>
      )}
    </div>
  );
}

export default function PersonPage({ person, onBack, onMovieClick }) {
  const [details, setDetails] = useState(null);
  const [credits, setCredits] = useState([]);
  const { lang } = useTheme();
  const { t } = useTranslation();
  const TMDB_LANG_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR', it: 'it-IT', tr: 'tr-TR', zh: 'zh-CN' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';

  useEffect(() => {
    if (!person) return;
    setDetails(null);
    setCredits([]);
    Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${person.id}?language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/person/${person.id}/combined_credits?language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
    ]).then(([d, c]) => {
      setDetails(d);
      const deduped = new Map();
      for (const m of (c.crew || [])) {
        if (!m.poster_path) continue;
        if (isShowOrAward(m)) continue;
        const existing = deduped.get(m.id);
        if (!existing || (m.vote_count || 0) > (existing.vote_count || 0)) {
          deduped.set(m.id, { ...m, _jobs: existing ? [...(existing._jobs || [existing.job]), m.job] : [m.job] });
        } else if (existing) {
          existing._jobs = [...(existing._jobs || [existing.job]), m.job];
        }
      }
      const all = [...deduped.values()]
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      setCredits(all);
    }).catch(() => {});
  }, [person, langCode]);

  if (!person) return null;

  const photo = person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null;
  const name = person.name || '';
  const born = details?.birthday;
  const birthplace = details?.place_of_birth;
  const bio = details?.biography;
  const dept = details?.known_for_department || person.department || person.known_for_department;
  const movieCount = credits.filter(m => m.media_type === 'movie').length;
  const tvCount = credits.filter(m => m.media_type === 'tv').length;

  return (
    <div className="actor-page page">
      {/* ── Hero ── */}
      <div className="actor-page__hero">
        {photo
          ? <img className="actor-page__bg" src={photo} alt="" />
          : <div className="person-page__bg-placeholder" />}
        <div className="actor-page__bg-fade" />

        <div className="actor-page__topbar">
          <button className="actor-page__back" onClick={onBack}>
            <AltArrowLeftLinear size={20} />
          </button>
        </div>

        <div className="actor-page__hero-content">
          {photo
            ? <img className="actor-page__photo" src={photo} alt={name} />
            : (
              <div className="person-page__photo-placeholder">
                <UsersGroupTwoRoundedLinear size={36} color="rgba(255,255,255,0.35)" />
              </div>
            )}
          <div>
            <h1 className="actor-page__name">{name}</h1>
            {dept && <p className="actor-page__dept">{dept}</p>}
            <div className="actor-page__counts">
              {movieCount > 0 && <span><VideoLibraryLinear size={11} />{movieCount} {t('actor.movies')}</span>}
              {tvCount > 0 && <span><TVLinear size={11} />{tvCount} {t('actor.series')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="actor-page__body">

        {(born || birthplace) && (
          <div className="actor-page__info-row">
            {born && (
              <span className="actor-page__info-item">
                <CalendarLinear size={14} />{born}
              </span>
            )}
            {birthplace && (
              <span className="actor-page__info-item">
                <PinLinear size={14} />{birthplace}
              </span>
            )}
          </div>
        )}

        {bio && (
          <div className="actor-page__bio-wrap">
            <h3 className="actor-page__section-title">{t('actor.biography')}</h3>
            <PersonBio bio={bio} />
          </div>
        )}

        {credits.length > 0 && (
          <div className="actor-page__filmography">
            <h3 className="actor-page__section-title">
              {t('actor.filmography')}
              <span className="actor-page__count-badge">{credits.length}</span>
            </h3>
            <div className="actor-page__films-grid">
              {credits.map((m) => (
                <div key={m.id}>
                  <MovieCard
                    movie={{ ...m, media_type: m.media_type || 'movie' }}
                    onClick={() => onMovieClick && onMovieClick({ ...m, media_type: m.media_type || 'movie' })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}