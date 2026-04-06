import { useState, memo, useCallback, useRef } from 'react';
import { EyeLinear, EyeClosedLinear, BookmarkLinear, BookmarkOpenedLinear, StarLinear, CloseCircleLinear } from 'solar-icon-set';
import { useStore } from '../store';
import { tmdb } from '../api';
import Countdown from './Countdown';
import './MovieCard.css';

export const GENRE_COLORS = {};

const MovieCard = memo(function MovieCard({ movie, onClick, showCountdown = false, onDislike = null }) {
  const { isWatched, isInWatchlist, addToWatched, addToWatchlist,
          removeFromWatched, removeFromWatchlist, getRating, getTvProgress } = useStore();
  const [flash, setFlash] = useState(null); // 'watched' | 'list' | null
  const flashTimer = useRef(null);

  const watched    = isWatched(movie.id);
  const inList     = isInWatchlist(movie.id);
  const poster     = tmdb.posterUrl(movie.poster_path);
  const title      = movie.title || movie.name || '';
  const year       = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const userRating = getRating(movie.id);
  const type       = movie.media_type || (movie.title ? 'movie' : 'tv');
  const progress   = type === 'tv' ? getTvProgress(movie.id) : null;

  const triggerFlash = useCallback((kind) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(kind);
    flashTimer.current = setTimeout(() => setFlash(null), 800);
  }, []);

  const handleWatched = useCallback((e) => {
    e.stopPropagation();
    if (watched) { removeFromWatched(movie.id); return; }
    addToWatched({...movie, media_type: type});
    triggerFlash('watched');
  }, [watched, movie, type, removeFromWatched, addToWatched, triggerFlash]);

  const handleWatchlist = useCallback((e) => {
    e.stopPropagation();
    if (inList) { removeFromWatchlist(movie.id); return; }
    addToWatchlist({...movie, media_type: type});
    triggerFlash('list');
  }, [inList, movie, type, removeFromWatchlist, addToWatchlist, triggerFlash]);

  const handleClick = useCallback(() => {
    if (onClick) onClick(movie);
  }, [onClick, movie]);

  const handleDislikeClick = useCallback((e) => {
    e.stopPropagation();
    onDislike(movie.id);
  }, [onDislike, movie.id]);

  return (
    <div className="movie-card" onClick={handleClick}>
      <div
        className={"movie-card__poster" + (flash ? ` flash-${flash}` : '')}
        style={flash ? { willChange: 'transform, box-shadow' } : undefined}
      >
        {poster
          ? <img src={poster} alt={title} loading="lazy" decoding="async"/>
          : <div className="movie-card__no-poster"/>
        }

        {watched && <div className="movie-card__badge watched"><EyeLinear size={10}/></div>}
        {!watched && inList && <div className="movie-card__badge watchlist"><BookmarkLinear size={10}/></div>}

        {userRating ? (
          <div className="movie-card__user-rating"><StarLinear size={8} fill="currentColor"/> {userRating}</div>
        ) : tmdbRating ? (
          <div className="movie-card__rating"><StarLinear size={8} fill="currentColor"/> {tmdbRating}</div>
        ) : null}

        {(() => {
          const rd = movie.release_date || movie.first_air_date;
          const today = new Date().toISOString().slice(0, 10);
          const isUnreleased = !rd || rd > today;
          if (!isUnreleased) return null;
          return rd
            ? <Countdown releaseDate={rd}/>
            : <Countdown noDate={true}/>;
        })()}

        {progress && (
          <div className="movie-card__progress">
            <span>S{progress.season}·E{progress.episode}</span>
            <div className="movie-card__progress-bar">
              <div className="movie-card__progress-fill"
                style={{width:`${(()=>{const ts=Math.max(progress.totalSeasons||1,1);const eps=progress.episodesInSeason||null;const slot=100/ts;const base=(progress.season-1)*slot;const frac=(eps&&eps>1)?((progress.episode-1)/(eps-1)):0;return Math.min(100,Math.max(0,base+slot*frac));})()}%`}}/>
            </div>
          </div>
        )}
        {onDislike && (
          <button className="movie-card__dislike" onClick={handleDislikeClick}>
            <CloseCircleLinear size={13}/>
          </button>
        )}
        <div className="movie-card__overlay">
          <button className={"movie-card__btn"+(watched?" g":"")} onClick={handleWatched}>
            {watched ? <EyeClosedLinear size={14}/> : <EyeLinear size={14}/>}
          </button>
          <button
            className={"movie-card__btn"+(inList&&!watched?" y":"")+(flash==='list'?" heartbeat":"")}
            onClick={handleWatchlist}
            disabled={watched}
          >
            {inList&&!watched ? <BookmarkOpenedLinear size={14}/> : <BookmarkLinear size={14}/>}
          </button>
        </div>
      </div>
      <p className="movie-card__title">{title}</p>
      <span className="movie-card__year">{year}</span>
    </div>
  );
}
);
export default MovieCard;