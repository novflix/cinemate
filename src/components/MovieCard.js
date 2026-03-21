import { Eye, EyeOff, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { tmdb } from '../api';
import Countdown from './Countdown';
import './MovieCard.css';

export default function MovieCard({ movie, onClick, showCountdown = false }) {
  const { isWatched, isInWatchlist, addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist, getRating } = useStore();
  const { lang } = useTheme();
  const watched    = isWatched(movie.id);
  const inList     = isInWatchlist(movie.id);
  const poster     = tmdb.posterUrl(movie.poster_path);
  const title      = movie.title || movie.name || '';
  const year       = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const userRating = getRating(movie.id);
  const type       = movie.media_type || (movie.title ? 'movie' : 'tv');

  const handleWatched   = (e) => { e.stopPropagation(); watched ? removeFromWatched(movie.id) : addToWatched({...movie,media_type:type}); };
  const handleWatchlist = (e) => { e.stopPropagation(); inList  ? removeFromWatchlist(movie.id) : addToWatchlist({...movie,media_type:type}); };

  return (
    <div className="movie-card" onClick={() => onClick && onClick(movie)}>
      <div className="movie-card__poster">
        {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="movie-card__no-poster"/>}

        {watched && <div className="movie-card__badge watched"><Eye size={10}/></div>}
        {!watched && inList && <div className="movie-card__badge watchlist"><Bookmark size={10}/></div>}

        {userRating ? (
          <div className="movie-card__user-rating"><Star size={8} fill="currentColor"/> {userRating}</div>
        ) : tmdbRating ? (
          <div className="movie-card__rating"><Star size={8} fill="currentColor"/> {tmdbRating}</div>
        ) : null}

        {showCountdown && movie.release_date && (
          <Countdown releaseDate={movie.release_date} lang={lang}/>
        )}

        <div className="movie-card__overlay">
          <button className={"movie-card__btn"+(watched?" g":"")} onClick={handleWatched}>
            {watched ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
          <button className={"movie-card__btn"+(inList&&!watched?" y":"")} onClick={handleWatchlist} disabled={watched}>
            {inList&&!watched ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
          </button>
        </div>
      </div>
      <p className="movie-card__title">{title}</p>
      <span className="movie-card__year">{year}</span>
    </div>
  );
}