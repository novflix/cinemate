import { useState, useEffect } from 'react';
import { AltArrowLeftLinear, StarLinear, VideoLibraryLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import './CollectionPage.css';

export default function CollectionPage({ item, onBack }) {
  // item = { type: 'collection'|'company', id, name, logo? }
  const [movies,  setMovies]  = useState([]);
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null);
  const { lang } = useTheme();
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setMovies([]);

    if (item.type === 'collection') {
      fetch(`https://api.themoviedb.org/3/collection/${item.id}?language=${langCode}`, { headers: HEADERS })
        .then(r => r.json())
        .then(data => {
          setInfo(data);
          const sorted = (data.parts || [])
            .filter(m => m.poster_path)
            .sort((a, b) => new Date(a.release_date||0) - new Date(b.release_date||0));
          setMovies(sorted);
          setLoading(false);
        }).catch(() => setLoading(false));
    } else {
      // company
      fetch(`https://api.themoviedb.org/3/company/${item.id}?language=${langCode}`, { headers: HEADERS })
        .then(r => r.json()).then(setInfo);
      fetch(`https://api.themoviedb.org/3/discover/movie?with_companies=${item.id}&sort_by=vote_average.desc&vote_count.gte=200&language=${langCode}&page=1`, { headers: HEADERS })
        .then(r => r.json())
        .then(data => { setMovies(data.results||[]); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [item, langCode]);

  if (!item) return null;

  const backdrop = info?.backdrop_path ? tmdb.backdropUrl(info.backdrop_path) : null;
  const avgRating = movies.length
    ? (movies.reduce((s, m) => s + (m.vote_average||0), 0) / movies.length).toFixed(1)
    : null;

  return (
    <div className="collection-page page">
      <div className="collection-page__hero" style={backdrop ? {backgroundImage:`url(${backdrop})`} : {}}>
        <div className="collection-page__hero-fade"/>
        <button className="collection-page__back" onClick={onBack}><AltArrowLeftLinear size={20}/></button>
        <div className="collection-page__hero-content">
          {item.logo && <img className="collection-page__logo" src={item.logo} alt={item.name}/>}
          <div>
            <p className="collection-page__type">{item.type === 'collection' ? t(lang,'Коллекция','Collection') : t(lang,'Студия','Studio')}</p>
            <h1 className="collection-page__title">{info?.name || item.name}</h1>
            <div className="collection-page__meta">
              {movies.length > 0 && <span><VideoLibraryLinear size={12}/> {movies.length} {t(lang,'фильмов','films')}</span>}
              {avgRating > 0 && <span><StarLinear size={12} fill="currentColor"/> {avgRating}</span>}
            </div>
          </div>
        </div>
      </div>

      {info?.overview && (
        <p className="collection-page__overview">{info.overview}</p>
      )}

      {loading ? (
        <div className="collection-page__grid">
          {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{borderRadius:12,aspectRatio:'2/3'}}/>)}
        </div>
      ) : (
        <div className="collection-page__grid">
          {movies.map(m => <div key={m.id}><MovieCard movie={{...m,media_type:'movie'}} onClick={setSelected}/></div>)}
        </div>
      )}

      <MovieModal movie={selected} onClose={()=>setSelected(null)}/>
    </div>
  );
}