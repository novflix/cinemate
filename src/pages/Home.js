import { useState, useEffect } from 'react';
import { Star, Play, TrendingUp, Clapperboard, Flame, Trophy, CalendarDays, Tv2, Sparkles } from 'lucide-react';
import { tmdb } from '../api';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Home.css';

const Section = ({ icon: Icon, title, items, onSelect }) => (
  <div className="home-section">
    <h3 className="home-section__title">
      {Icon && <Icon size={16} className="home-section__icon"/>}
      {title}
    </h3>
    <div className="home-section__scroll">
      {items.map(m => (
        <div key={m.id} className="home-section__item">
          <MovieCard movie={m} onClick={onSelect}/>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="home-section">
    <div className="skeleton" style={{height:15,width:180,marginBottom:14,marginLeft:20,borderRadius:6}}/>
    <div style={{display:'flex',gap:12,overflow:'hidden',padding:'0 20px'}}>
      {[1,2,3,4].map(i => (
        <div key={i} className="skeleton" style={{width:130,flexShrink:0,borderRadius:12,paddingBottom:'195px'}}/>
      ))}
    </div>
  </div>
);

export default function Home() {
  const [trending,     setTrending]     = useState([]);
  const [popular,      setPopular]      = useState([]);
  const [topRated,     setTopRated]     = useState([]);
  const [nowPlaying,   setNowPlaying]   = useState([]);
  const [upcoming,     setUpcoming]     = useState([]);
  const [popularTV,    setPopularTV]    = useState([]);
  const [topRatedTV,   setTopRatedTV]   = useState([]);
  const [newThisYear,  setNewThisYear]  = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [actor,        setActor]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [hero,         setHero]         = useState(null);
  const { lang } = useTheme();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      tmdb.trending('all', 'week'),
      tmdb.popular('movie'),
      tmdb.topRated('movie'),
      tmdb.nowPlaying(),
      tmdb.upcoming(),
      tmdb.popular('tv'),
      tmdb.topRated('tv'),
      tmdb.discover('movie', { primary_release_year: currentYear, sort_by: 'popularity.desc', 'vote_count.gte': 50 }),
    ]).then(([tr, p, top, np, up, ptv, ttv, ny]) => {
      const items = tr.results || [];
      setTrending(items);
      setHero(items[Math.floor(Math.random() * Math.min(5, items.length))]);
      setPopular(p.results   || []);
      setTopRated(top.results|| []);
      setNowPlaying(np.results || []);
      setUpcoming(up.results || []);
      setPopularTV((ptv.results || []).map(m => ({...m, media_type:'tv'})));
      setTopRatedTV((ttv.results|| []).map(m => ({...m, media_type:'tv'})));
      setNewThisYear(ny.results|| []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lang, currentYear]);

  if (actor) return (
    <ActorPage actor={actor} onBack={() => setActor(null)} onMovieClick={m => { setActor(null); setSelected(m); }}/>
  );

  return (
    <div className="page home-page">
      {hero && (
        <div className="hero" onClick={() => setSelected(hero)}>
          <div className="hero__bg">
            {tmdb.backdropUrl(hero.backdrop_path) && <img src={tmdb.backdropUrl(hero.backdrop_path)} alt=""/>}
            <div className="hero__fade"/>
          </div>
          <div className="hero__content">
            <div className="hero__label">
              <TrendingUp size={10}/> {t(lang,'В тренде','Trending')}
            </div>
            <h1 className="hero__title">{hero.title || hero.name}</h1>
            <div className="hero__meta">
              {hero.vote_average && <span><Star size={12} fill="currentColor"/> {hero.vote_average.toFixed(1)}</span>}
              <span>{(hero.release_date || hero.first_air_date || '').slice(0, 4)}</span>
              <span>{hero.media_type === 'tv' ? t(lang,'Сериал','Series') : t(lang,'Фильм','Movie')}</span>
            </div>
            <button className="hero__btn">
              <Play size={13} fill="currentColor"/> {t(lang,'Подробнее','Details')}
            </button>
          </div>
        </div>
      )}

      <div className="home-sections">
        {loading ? <>{[1,2,3,4,5,6,7,8].map(i => <SkeletonRow key={i}/>)}</> : (
          <>
            <Section icon={Flame}        title={t(lang,'В тренде','Trending')}                    items={trending.slice(0,10)}    onSelect={setSelected}/>
            <Section icon={Clapperboard} title={t(lang,'Сейчас в кино','Now Playing')}            items={nowPlaying.slice(0,10)}  onSelect={setSelected}/>
            <Section icon={CalendarDays} title={t(lang,'Скоро в кино','Coming Soon')}             items={upcoming.slice(0,10)}    onSelect={setSelected}/>
            <Section icon={Sparkles}     title={t(lang,`Новинки ${currentYear}`,`New in ${currentYear}`)} items={newThisYear.slice(0,10)} onSelect={setSelected}/>
            <Section icon={TrendingUp}   title={t(lang,'Популярные фильмы','Popular Movies')}     items={popular.slice(0,10)}     onSelect={setSelected}/>
            <Section icon={Trophy}       title={t(lang,'Лучшие фильмы всех времён','All-Time Best Movies')} items={topRated.slice(0,10)} onSelect={setSelected}/>
            <Section icon={Tv2}          title={t(lang,'Популярные сериалы','Popular Series')}    items={popularTV.slice(0,10)}   onSelect={setSelected}/>
            <Section icon={Trophy}       title={t(lang,'Лучшие сериалы','Top Rated Series')}      items={topRatedTV.slice(0,10)}  onSelect={setSelected}/>
          </>
        )}
      </div>

      <MovieModal movie={selected} onClose={() => setSelected(null)} onActorClick={a => { setSelected(null); setActor(a); }}/>
    </div>
  );
}