import { Eye, EyeOff, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { useStore } from '../store';
import { tmdb } from '../api';
import './MovieCard.css';

export default function MovieCard({ movie, onClick }) {
  const { isWatched, isInWatchlist, addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist } = useStore();
  const watched = isWatched(movie.id);
  const inList = isInWatchlist(movie.id);
  const poster = tmdb.posterUrl(movie.poster_path);
  const title = movie.title || movie.name || '';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const type = movie.media_type || (movie.title ? 'movie' : 'tv');

  const handleWatched = (e) => { e.stopPropagation(); watched ? removeFromWatched(movie.id) : addToWatched({...movie, media_type:type}); };
  const handleWatchlist = (e) => { e.stopPropagation(); inList ? removeFromWatchlist(movie.id) : addToWatchlist({...movie, media_type:type}); };

  return (
    <div className="movie-card" onClick={() => onClick && onClick(movie)}>
      <div className="movie-card__poster">
        {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="movie-card__no-poster"/>}
        {watched && <div className="movie-card__badge watched"><Eye size={10}/></div>}
        {!watched && inList && <div className="movie-card__badge watchlist"><Bookmark size={10}/></div>}
        {rating && <div className="movie-card__rating"><Star size={9} fill="currentColor"/> {rating}</div>}
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
