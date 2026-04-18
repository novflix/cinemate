import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AltArrowLeftLinear, StarLinear, VideoLibraryLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import './CollectionPage.css';

export default function CollectionPage({ item, onBack }) {
  // item = { type: 'collection'|'company', id, name, logo? }
  const [movies,  setMovies]  = useState([]);
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null);
  const navigate = useNavigate();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';

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
      // company/network — smart multi-strategy fetch
      const isNetwork = item.entityType === 'network';

      const fetchPages = (url, pages = 3) =>
        Promise.all(
          Array.from({ length: pages }, (_, i) =>
            fetch(`${url}&page=${i + 1}`, { headers: HEADERS }).then(r => r.json())
          )
        ).then(results => results.flatMap(d => d.results || []));

      // Exclude reality, talk shows, awards, news, soap operas, shorts
      const JUNK_GENRES = new Set([10764, 10767, 10763, 10766, 10768]);
      const isQuality = m =>
        m.poster_path &&
        !(m.genre_ids || []).some(g => JUNK_GENRES.has(g)) &&
        (m.vote_count || 0) >= 20;

      const dedupe = (items) => {
        const seen = new Set();
        return items
          .filter(m => isQuality(m) && !seen.has(m.id) && seen.add(m.id))
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      };

      if (isNetwork) {
        // Networks (Netflix, HBO, Prime Video etc.) — use with_networks for TV
        // and search company discover for movies as fallback
        fetch(`https://api.themoviedb.org/3/network/${item.id}?language=${langCode}`, { headers: HEADERS })
          .then(r => r.json()).then(setInfo).catch(() => {});

        const tvUrl    = `https://api.themoviedb.org/3/discover/tv?with_networks=${item.id}&sort_by=popularity.desc&language=${langCode}`;
        const movieUrl = `https://api.themoviedb.org/3/discover/movie?with_companies=${item.id}&sort_by=popularity.desc&language=${langCode}`;

        Promise.all([fetchPages(tvUrl, 4), fetchPages(movieUrl, 2)])
          .then(([shows, films]) => {
            const merged = [
              ...shows.map(s => ({ ...s, media_type: 'tv' })),
              ...films.map(m => ({ ...m, media_type: 'movie' })),
            ];
            setMovies(dedupe(merged));
            setLoading(false);
          })
          .catch(() => setLoading(false));

      } else {
        // Production companies — try both discover/movie and discover/tv
        fetch(`https://api.themoviedb.org/3/company/${item.id}?language=${langCode}`, { headers: HEADERS })
          .then(r => r.json()).then(setInfo).catch(() => {});

        const movieUrl = `https://api.themoviedb.org/3/discover/movie?with_companies=${item.id}&sort_by=popularity.desc&language=${langCode}`;
        const tvUrl    = `https://api.themoviedb.org/3/discover/tv?with_companies=${item.id}&sort_by=popularity.desc&language=${langCode}`;

        Promise.all([fetchPages(movieUrl, 3), fetchPages(tvUrl, 3)])
          .then(([films, shows]) => {
            const merged = [
              ...films.map(m => ({ ...m, media_type: 'movie' })),
              ...shows.map(s => ({ ...s, media_type: 'tv' })),
            ];
            setMovies(dedupe(merged));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
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
            <p className="collection-page__type">{item.type === 'collection' ? t('collection.collection') : t('collection.studio')}</p>
            <h1 className="collection-page__title">{info?.name || item.name}</h1>
            <div className="collection-page__meta">
              {movies.length > 0 && <span><VideoLibraryLinear size={12}/> {movies.length} {t('collection.films')}</span>}
              {avgRating > 0 && <span><StarLinear size={12} fill="currentColor"/> {avgRating}</span>}
            </div>
          </div>
        </div>
      </div>

      {info?.overview && info.overview !== 'Placeholder' && (
        <p className="collection-page__overview">{info.overview}</p>
      )}

      {loading ? (
        <div className="collection-page__grid">
          {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{borderRadius:12,aspectRatio:'2/3'}}/>)}
        </div>
      ) : (
        <div className="collection-page__grid">
          {movies.map(m => <div key={m.id}><MovieCard movie={m} onClick={setSelected}/></div>)}
        </div>
      )}

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>navigate(`/actor/${a.id}`,{state:{actor:a}})} onCrewClick={p=>navigate(`/person/${p.id}`,{state:{person:p}})} onStudioClick={s=>navigate(`/studio/${s.id}`,{state:{studio:s}})}/>
    </div>
  );
}