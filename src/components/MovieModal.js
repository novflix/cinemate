import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Bookmark, BookmarkCheck, Star, Clock, Tv2, Film, ChevronRight, ExternalLink } from 'lucide-react';
import { tmdb, HEADERS, STREAMING_LINKS } from '../api';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import './MovieModal.css';

function WhereToWatch({ movieId, type, lang, title }) {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    tmdb.watchProviders(type, movieId).then(data => {
      const results = data.results || {};
      const region = results['RU'] || results['US'] || results['GB'] || Object.values(results)[0];
      setProviders(region || null);
    }).catch(() => setProviders(null));
  }, [movieId, type]);

  if (!providers) return null;

  const flatrate = providers.flatrate || [];
  const rent = (providers.rent || []).filter(r => !flatrate.find(f => f.provider_id === r.provider_id));
  const all = [...flatrate, ...rent].slice(0, 6);
  if (all.length === 0) return null;

  const encodedTitle = encodeURIComponent(title || '');

  return (
    <div className="modal__where">
      <h4>{t(lang, 'Где посмотреть', 'Where to watch')}</h4>
      <div className="modal__where-list">
        {all.map(p => {
          const svc = STREAMING_LINKS[p.provider_id];
          const logoUrl = p.logo_path ? `https://image.tmdb.org/t/p/w45${p.logo_path}` : null;
          const href = svc ? svc.url + encodedTitle : null;
          const isStreaming = !!flatrate.find(f => f.provider_id === p.provider_id);
          return href ? (
            <a key={p.provider_id} className="modal__where-item" href={href} target="_blank" rel="noopener noreferrer">
              {logoUrl ? <img src={logoUrl} alt={p.provider_name}/> : <span className="modal__where-dot">▶</span>}
              <span className="modal__where-name">
                {svc?.name || p.provider_name}
                {!isStreaming && <span className="modal__where-tag">{t(lang,'аренда','rent')}</span>}
              </span>
              <ExternalLink size={11} className="modal__where-ext"/>
            </a>
          ) : null;
        })}
      </div>
    </div>
  );
}

export default function MovieModal({ movie, onClose, onActorClick }) {
  const [details, setDetails] = useState(null);
  const { isWatched, isInWatchlist, addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist } = useStore();
  const { lang } = useTheme();
  const watched = movie ? isWatched(movie.id) : false;
  const inList = movie ? isInWatchlist(movie.id) : false;
  const type = movie?.media_type || (movie?.title ? 'movie' : 'tv');
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';

  useEffect(() => {
    if (!movie) return;
    setDetails(null);
    // Fetch details with current language
    const path = type === 'tv'
      ? `https://api.themoviedb.org/3/tv/${movie.id}?language=${langCode}&append_to_response=credits,videos`
      : `https://api.themoviedb.org/3/movie/${movie.id}?language=${langCode}&append_to_response=credits,videos`;
    fetch(path, { headers: HEADERS }).then(r => r.json()).then(setDetails).catch(() => {});
  }, [movie, type, langCode]);

  if (!movie) return null;

  // Prefer details data (language-correct) over cached movie data
  const title = details?.title || details?.name || movie.title || movie.name || '';
  const overview = details?.overview || movie.overview || '';
  const year = (details?.release_date || details?.first_air_date || movie.release_date || movie.first_air_date || '').slice(0, 4);
  const backdrop = tmdb.backdropUrl(details?.backdrop_path || movie.backdrop_path);
  const poster = tmdb.posterUrl(details?.poster_path || movie.poster_path);
  const rating = (details?.vote_average || movie.vote_average)?.toFixed(1);
  const genres = details?.genres?.slice(0, 3).map(g => g.name) || [];
  const runtime = details?.runtime ? `${Math.floor(details.runtime/60)}${t(lang,'ч','h')} ${details.runtime%60}${t(lang,'м','m')}` : null;
  const seasons = details?.number_of_seasons;
  const cast = details?.credits?.cast?.slice(0, 12) || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Backdrop image */}
        <div className="modal__backdrop">
          {backdrop && <img src={backdrop} alt=""/>}
          {!backdrop && poster && <img src={poster} alt="" style={{objectPosition:'center top'}}/>}
          <div className="modal__backdrop-fade"/>
          <button className="modal__close" onClick={onClose}><X size={16} strokeWidth={2.5}/></button>
        </div>

        {/* Poster floats out of backdrop */}
        <div className="modal__poster-wrap">
          {poster && <img className="modal__poster" src={poster} alt={title}/>}
          <div className="modal__title-block">
            <h2 className="modal__title">{title}</h2>
            <div className="modal__sub">
              {year && <span>{year}</span>}
              {rating && <span><Star size={11} fill="currentColor"/>{rating}</span>}
              {runtime && <span><Clock size={11}/>{runtime}</span>}
              {seasons && <span><Tv2 size={11}/>{seasons} {t(lang,'сез.','seas.')}</span>}
              <span className="modal__type-badge">{type==='tv'?<><Tv2 size={10}/>{t(lang,'Сериал','Series')}</>:<><Film size={10}/>{t(lang,'Фильм','Movie')}</>}</span>
            </div>
            {genres.length > 0 && <div className="modal__genres">{genres.map(g=><span key={g} className="modal__genre">{g}</span>)}</div>}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="modal__content">
          {overview && <p className="modal__overview">{overview}</p>}

          <WhereToWatch movieId={movie.id} type={type} lang={lang} title={title}/>

          {cast.length > 0 && (
            <div className="modal__cast">
              <h4>{t(lang,'В ролях','Cast')}</h4>
              <div className="modal__cast-list">
                {cast.map(c => (
                  <div key={c.id} className="modal__cast-item" onClick={() => onActorClick && onActorClick(c)}>
                    <div className="modal__cast-avatar">
                      {c.profile_path
                        ? <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name}/>
                        : <span className="modal__cast-initials">{c.name[0]}</span>}
                    </div>
                    <span className="modal__cast-name">{c.name}</span>
                    <ChevronRight size={9} className="modal__cast-arrow"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal__actions">
            <button className={"modal__action-btn"+(watched?" active-green":"")} onClick={() => watched ? removeFromWatched(movie.id) : addToWatched({...movie,media_type:type})}>
              {watched ? <><EyeOff size={15}/>{t(lang,'Смотрел','Watched')}</> : <><Eye size={15}/>{t(lang,'Уже смотрел','Mark watched')}</>}
            </button>
            <button className={"modal__action-btn secondary"+(inList&&!watched?" active-yellow":"")} onClick={() => inList ? removeFromWatchlist(movie.id) : addToWatchlist({...movie,media_type:type})} disabled={watched}>
              {inList&&!watched ? <><BookmarkCheck size={15}/>{t(lang,'В списке','In list')}</> : <><Bookmark size={15}/>{t(lang,'Хочу посмотреть','Watchlist')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
