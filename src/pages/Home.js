import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Play, TrendingUp, Clapperboard, Flame, Trophy, CalendarDays, Tv2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { tmdb } from '../api';
import { useTheme, t } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Home.css';

// ─── Mood filter config ───────────────────────────────────────────────────────
const MOODS = [
  { id: 'all',     ru: 'Всё',        en: 'All',       icon: '✦',  genres: [] },
  { id: 'fun',     ru: 'Весело',     en: 'Fun',       icon: '😄', genres: [35, 10751] },       // Comedy, Family
  { id: 'scary',   ru: 'Страшно',    en: 'Scary',     icon: '😱', genres: [27, 53] },           // Horror, Thriller
  { id: 'action',  ru: 'Экшен',      en: 'Action',    icon: '💥', genres: [28, 12] },           // Action, Adventure
  { id: 'drama',   ru: 'Поплакать',  en: 'Drama',     icon: '😢', genres: [18, 10749] },        // Drama, Romance
  { id: 'mind',    ru: 'Подумать',   en: 'Mind',      icon: '🧠', genres: [878, 9648, 99] },    // Sci-Fi, Mystery, Doc
];

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSlider({ items, onSelect }) {
  const [idx, setIdx]     = useState(0);
  const [anim, setAnim]   = useState('in');
  const timerRef = useRef(null);

  const goTo = useCallback((next) => {
    setAnim('out');
    setTimeout(() => {
      setIdx(next);
      setAnim('in');
    }, 350);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => {
      goTo((prev) => (prev + 1) % items.length);   // functional update avoids stale closure
    }, 5500);
    return () => clearInterval(timerRef.current);
  }, [items.length, goTo]);

  const prev = () => { clearInterval(timerRef.current); goTo((idx - 1 + items.length) % items.length); };
  const next = () => { clearInterval(timerRef.current); goTo((idx + 1) % items.length); };

  if (!items.length) return null;
  const hero = items[idx];

  return (
    <div className="hero" onClick={() => onSelect(hero)}>
      <div className={"hero__bg hero__bg--" + anim}>
        {tmdb.backdropUrl(hero.backdrop_path) && <img src={tmdb.backdropUrl(hero.backdrop_path)} alt=""/>}
        <div className="hero__fade"/>
      </div>

      <div className={"hero__content hero__content--" + anim}>
        <div className="hero__label"><TrendingUp size={10}/> #{idx + 1}</div>
        <h1 className="hero__title">{hero.title || hero.name}</h1>
        <div className="hero__meta">
          {hero.vote_average > 0 && <span><Star size={12} fill="currentColor"/> {hero.vote_average.toFixed(1)}</span>}
          <span>{(hero.release_date || hero.first_air_date || '').slice(0, 4)}</span>
        </div>
        <button className="hero__btn" onClick={e => { e.stopPropagation(); onSelect(hero); }}>
          <Play size={13} fill="currentColor"/>
        </button>
      </div>

      {/* Prev / Next arrows */}
      {items.length > 1 && (
        <>
          <button className="hero__arrow hero__arrow--left"  onClick={e=>{e.stopPropagation();prev();}}><ChevronLeft  size={20}/></button>
          <button className="hero__arrow hero__arrow--right" onClick={e=>{e.stopPropagation();next();}}><ChevronRight size={20}/></button>
        </>
      )}

      {/* Dots */}
      <div className="hero__dots" onClick={e => e.stopPropagation()}>
        {items.map((_, i) => (
          <button key={i} className={"hero__dot" + (i === idx ? " active" : "")} onClick={() => { clearInterval(timerRef.current); goTo(i); }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Section row ─────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, items, onSelect }) => {
  if (!items.length) return null;
  return (
    <div className="home-section">
      <h3 className="home-section__title">
        {Icon && <Icon size={15} className="home-section__icon"/>}
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
};

const SkeletonRow = () => (
  <div className="home-section">
    <div className="skeleton" style={{height:14,width:160,marginBottom:14,marginLeft:20,borderRadius:6}}/>
    <div style={{display:'flex',gap:12,overflow:'hidden',padding:'0 20px'}}>
      {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{width:130,flexShrink:0,borderRadius:12,paddingBottom:'195px'}}/>)}
    </div>
  </div>
);

// ─── Dedup helper ─────────────────────────────────────────────────────────────
// Given ordered list of arrays, removes items from later arrays if they appeared earlier
function dedup(arrays) {
  const seen = new Set();
  return arrays.map(arr => arr.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }));
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const [allData, setAllData]   = useState(null);   // raw API data
  const [mood, setMood]         = useState('all');
  const [moodData, setMoodData] = useState(null);   // filtered by mood
  const [loading, setLoading]   = useState(true);
  const [moodLoading, setMoodLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actor, setActor]       = useState(null);
  const { lang } = useTheme();
  const currentYear = new Date().getFullYear();

  // Load all base sections on mount / lang change
  useEffect(() => {
    setLoading(true);
    setMood('all');
    setMoodData(null);
    Promise.all([
      tmdb.trending('all', 'week'),
      tmdb.popular('movie', 3),
      tmdb.topRated('movie', 3),
      tmdb.nowPlaying(3),
      tmdb.upcoming(3),
      tmdb.popular('tv', 3),
      tmdb.topRated('tv', 3),
      tmdb.discover('movie', { primary_release_year: currentYear, sort_by: 'popularity.desc', 'vote_count.gte': 50 }, 3),
    ]).then(([tr, pm, tm, np, up, ptv, ttv, ny]) => {
      setAllData({
        trending:    (tr.results  || []).slice(0, 50),
        popularM:    (pm.results  || []).slice(0, 50),
        topM:        (tm.results  || []).slice(0, 50),
        nowPlaying:  (np.results  || []).slice(0, 50),
        upcoming:    (up.results  || []).slice(0, 50),
        popularTV:   (ptv.results || []).slice(0, 15).map(m=>({...m,media_type:'tv'})),
        topTV:       (ttv.results || []).slice(0, 15).map(m=>({...m,media_type:'tv'})),
        newYear:     (ny.results  || []).slice(0, 50),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lang, currentYear]);

  // When mood changes, fetch genre-filtered data
  useEffect(() => {
    if (mood === 'all' || !allData) { setMoodData(null); return; }
    const cfg = MOODS.find(m => m.id === mood);
    if (!cfg?.genres.length) { setMoodData(null); return; }
    setMoodLoading(true);
    const genreStr = cfg.genres.join('|');
    Promise.all([
      tmdb.discover('movie', { with_genres: genreStr, sort_by: 'popularity.desc', 'vote_count.gte': 200 }, 3),
      tmdb.discover('tv',    { with_genres: genreStr, sort_by: 'popularity.desc', 'vote_count.gte': 50 }, 3),
    ]).then(([movies, tv]) => {
      setMoodData({
        movies: (movies.results || []).map(m=>({...m,media_type:'movie'})),
        tv:     (tv.results    || []).map(m=>({...m,media_type:'tv'})),
      });
      setMoodLoading(false);
    }).catch(() => setMoodLoading(false));
  }, [mood, allData]);

  if (actor) return (
    <ActorPage actor={actor} onBack={()=>setActor(null)} onMovieClick={m=>{setActor(null);setSelected(m);}}/>
  );

  // Build sections with dedup
  let sections = [];
  if (allData) {
    if (mood === 'all' || !moodData) {
      // All sections, hero items excluded from sections
      const heroIds = new Set(allData.trending.map(m=>m.id));

      // Each section: priority order for dedup
      const raw = [
        allData.nowPlaying,
        allData.upcoming,
        allData.newYear,
        allData.popularM.filter(m=>!heroIds.has(m.id)),
        allData.topM.filter(m=>!heroIds.has(m.id)),
        allData.popularTV,
        allData.topTV,
      ];
      const [nowP, upcom, newY, popM, topM, popTV, topTV] = dedup(raw);

      sections = [
        { icon: Clapperboard, title: t(lang,'Сейчас в кино','Now Playing'),             items: nowP.slice(0,50) },
        { icon: CalendarDays, title: t(lang,'Скоро в кино','Coming Soon'),              items: upcom.slice(0,50) },
        { icon: Sparkles,     title: t(lang,`Новинки ${currentYear}`,`New ${currentYear}`), items: newY.slice(0,50) },
        { icon: Flame,        title: t(lang,'Популярные фильмы','Popular Movies'),      items: popM.slice(0,50) },
        { icon: Trophy,       title: t(lang,'Лучшие фильмы','Top Movies'),             items: topM.slice(0,50) },
        { icon: Tv2,          title: t(lang,'Популярные сериалы','Popular Series'),     items: popTV.slice(0,50) },
        { icon: Trophy,       title: t(lang,'Лучшие сериалы','Top Series'),            items: topTV.slice(0,50) },
      ];
    } else {
      // Mood mode — just two deduplicated sections
      const [movies, tv] = dedup([moodData.movies, moodData.tv]);
      const moodCfg = MOODS.find(m => m.id === mood);
      sections = [
        { icon: Flame, title: t(lang,`Фильмы — ${moodCfg.ru}`,`Movies — ${moodCfg.en}`), items: movies.slice(0,50) },
        { icon: Tv2,   title: t(lang,`Сериалы — ${moodCfg.ru}`,`Series — ${moodCfg.en}`), items: tv.slice(0,50) },
      ];
    }
  }

  return (
    <div className="page home-page">
      {/* Hero slider */}
      {!loading && allData && (
        <HeroSlider items={allData.trending} onSelect={setSelected}/>
      )}
      {loading && <div className="hero hero--skeleton"><div className="skeleton" style={{width:'100%',height:'100%',borderRadius:0}}/></div>}

      {/* Mood bar */}
      <div className="mood-bar">
        {MOODS.map(m => (
          <button
            key={m.id}
            className={"mood-btn" + (mood === m.id ? " active" : "")}
            onClick={() => setMood(m.id)}
          >
            <span className="mood-btn__icon">{m.icon}</span>
            <span className="mood-btn__label">{lang === 'ru' ? m.ru : m.en}</span>
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="home-sections">
        {(loading || moodLoading)
          ? <>{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</>
          : sections.map((s, i) => <Section key={i} icon={s.icon} title={s.title} items={s.items} onSelect={setSelected}/>)
        }
      </div>

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
    </div>
  );
}