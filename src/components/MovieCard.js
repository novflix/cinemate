import { useState, memo } from 'react';
import { Eye, EyeOff, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { tmdb } from '../api';
import Countdown from './Countdown';
import './MovieCard.css';

// Feature 14: genre → accent color
const GENRE_COLORS = {
  28:    '#ef4444', // Action     → red
  12:    '#f97316', // Adventure  → orange
  16:    '#a855f7', // Animation  → purple
  35:    '#eab308', // Comedy     → yellow
  80:    '#6b7280', // Crime      → gray
  27:    '#dc2626', // Horror     → dark red
  10749: '#ec4899', // Romance    → pink
  878:   '#3b82f6', // Sci-Fi     → blue
  53:    '#78716c', // Thriller   → stone
  18:    '#64748b', // Drama      → slate
  14:    '#8b5cf6', // Fantasy    → violet
  99:    '#0ea5e9', // Documentary→ sky
  10751: '#22c55e', // Family     → green
  36:    '#ca8a04', // History    → amber
  10402: '#f43f5e', // Music      → rose
};

function getGenreColor(genreIds) {
  if (!genreIds?.length) return null;
  for (const id of genreIds) {
    if (GENRE_COLORS[id]) return GENRE_COLORS[id];
  }
  return null;
}

export { GENRE_COLORS };

const MovieCard = memo(function MovieCard({ movie, onClick, showCountdown = false }) {
  const { isWatched, isInWatchlist, addToWatched, addToWatchlist,
          removeFromWatched, removeFromWatchlist, getRating } = useStore();
  const { lang } = useTheme();
  // Feature 13: flash state
  const [flash, setFlash] = useState(null); // 'watched' | 'list' | null

  const watched    = isWatched(movie.id);
  const inList     = isInWatchlist(movie.id);
  const poster     = tmdb.posterUrl(movie.poster_path);
  const title      = movie.title || movie.name || '';
  const year       = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const userRating = getRating(movie.id);
  const type       = movie.media_type || (movie.title ? 'movie' : 'tv');
  // Feature 14: genre color
  const genreColor = getGenreColor(movie.genre_ids);

  const handleWatched = (e) => {
    e.stopPropagation();
    if (watched) { removeFromWatched(movie.id); return; }
    addToWatched({...movie, media_type: type});
    setFlash('watched');
    setTimeout(() => setFlash(null), 700);
  };

  const handleWatchlist = (e) => {
    e.stopPropagation();
    if (inList) { removeFromWatchlist(movie.id); return; }
    addToWatchlist({...movie, media_type: type});
    // Feature 43: heartbeat - handled by CSS class
    setFlash('list');
    setTimeout(() => setFlash(null), 700);
  };

  return (
    <div className="movie-card" onClick={() => onClick && onClick(movie)}>
      <div
        className={"movie-card__poster" + (flash ? ` flash-${flash}` : '')}
        style={genreColor ? {'--genre-color': genreColor} : {}}
      >
        {poster
          ? <img src={poster} alt={title} loading="lazy"/>
          : <div className="movie-card__no-poster"/>
        }

        {/* Feature 14: genre color border line at bottom */}
        {genreColor && <div className="movie-card__genre-line"/>}

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
          {/* Feature 43: heartbeat on bookmark */}
          <button
            className={"movie-card__btn"+(inList&&!watched?" y":"")+(flash==='list'?" heartbeat":"")}
            onClick={handleWatchlist}
            disabled={watched}
          >
            {inList&&!watched ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
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