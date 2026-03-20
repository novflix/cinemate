import { useState } from 'react';
import { useStore } from '../store';
import { tmdb } from '../api';
import MovieModal from '../components/MovieModal';
import './Lists.css';

function EmptyState({ tab }) {
  return (
    <div className="lists-empty">
      <div className="lists-empty__icon">{tab==='watched'?'👁':'📋'}</div>
      <h3>{tab==='watched'?'Пока пусто':'Список пуст'}</h3>
      <p>{tab==='watched'?'Добавляй фильмы и сериалы которые уже посмотрел':'Добавляй то что хочешь посмотреть'}</p>
    </div>
  );
}

function MovieListItem({ movie, onSelect, onRemove }) {
  const title = movie.title || movie.name || '';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const poster = tmdb.posterUrl(movie.poster_path);
  const rating = movie.vote_average?.toFixed(1);
  const type = movie.media_type || (movie.title ? 'movie' : 'tv');

  return (
    <div className="list-item" onClick={() => onSelect(movie)}>
      <div className="list-item__poster">
        {poster ? <img src={poster} alt={title} loading="lazy" /> : <span>🎬</span>}
      </div>
      <div className="list-item__info">
        <h4>{title}</h4>
        <div className="list-item__meta">
          {year && <span>{year}</span>}
          {rating && <span>⭐ {rating}</span>}
          <span>{type==='tv'?'Сериал':'Фильм'}</span>
        </div>
      </div>
      <button className="list-item__remove" onClick={e=>{e.stopPropagation();onRemove(movie.id);}}>✕</button>
    </div>
  );
}

export default function Lists() {
  const { watched, watchlist, removeFromWatched, removeFromWatchlist } = useStore();
  const [tab, setTab] = useState('watchlist');
  const [selected, setSelected] = useState(null);

  const items = tab === 'watched' ? watched : watchlist;

  return (
    <div className="page lists-page">
      <div className="lists-header">
        <h1 className="lists-header__title">Мои списки</h1>
        <div className="lists-tabs">
          <button className={"lists-tab"+(tab==='watchlist'?" active":"")} onClick={()=>setTab('watchlist')}>
            Хочу смотреть <span>{watchlist.length}</span>
          </button>
          <button className={"lists-tab"+(tab==='watched'?" active":"")} onClick={()=>setTab('watched')}>
            Смотрел <span>{watched.length}</span>
          </button>
        </div>
      </div>

      <div className="lists-content">
        {items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="lists-grid">
            {items.map(m => (
              <MovieListItem
                key={m.id}
                movie={m}
                onSelect={setSelected}
                onRemove={tab==='watched' ? removeFromWatched : removeFromWatchlist}
              />
            ))}
          </div>
        )}
      </div>

      <MovieModal movie={selected} onClose={()=>setSelected(null)} />
    </div>
  );
}
