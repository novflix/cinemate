import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Play, TrendingUp, Clapperboard, Flame, Trophy, CalendarDays, Tv2, Sparkles, Heart, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { tmdb, HEADERS } from '../api';
import { useTheme, t } from '../theme';
import { getCurrentSeason, SEASON_CONFIG } from '../hooks/useSeason';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import CollectionPage from './CollectionPage';
import './Home.css';

// ─── Mood filter ──────────────────────────────────────────────────────────────
const MOODS = [
  { id: 'all',     ru: 'Всё',       en: 'All',      icon: '✦', genres: [] },
  { id: 'fun',     ru: 'Весело',    en: 'Fun',      icon: '😄', genres: [35,10751] },
  { id: 'scary',   ru: 'Страшно',   en: 'Scary',    icon: '😱', genres: [27,53] },
  { id: 'action',  ru: 'Экшен',     en: 'Action',   icon: '💥', genres: [28,12] },
  { id: 'drama',   ru: 'Поплакать', en: 'Drama',    icon: '😢', genres: [18,10749] },
  { id: 'mind',    ru: 'Подумать',  en: 'Mind',     icon: '🧠', genres: [878,9648,99] },
];

// ─── Together section tags ────────────────────────────────────────────────────
const TOGETHER_TAGS = [
  { id: 'date',    ru: 'Для свидания', en: 'First date', genres: [10749,35],       icon: '💕' },
  { id: 'friends', ru: 'С друзьями',   en: 'With friends',genres: [35,28,12,16],   icon: '🎉' },
  { id: 'family',  ru: 'Для семьи',    en: 'Family',      genres: [10751,16,12,35], icon: '👨‍👩‍👧' },
];

// ─── Popular studios ─────────────────────────────────────────────────────────
const STUDIOS = [
  { id: 41077, name: 'A24',         logo: null },
  { id: 3,     name: 'Pixar',       logo: null },
  { id: 174,   name: 'Warner Bros', logo: null },
  { id: 33,    name: 'Universal',   logo: null },
  { id: 7505,  name: 'Marvel',      logo: null },
  { id: 2,     name: 'Disney',      logo: null },
];

// ─── Notable collections ─────────────────────────────────────────────────────
const COLLECTIONS = [
  { id: 131292, name: 'Marvel Cinematic Universe', type: 'company', companyId: 420 },
  { id: 645,    name: 'James Bond', type: 'collection' },
  { id: 230,    name: 'Крёстный отец', enName: 'The Godfather', type: 'collection' },
  { id: 8650,   name: 'Мстители', enName: 'Avengers', type: 'collection' },
  { id: 10,     name: 'Звёздные войны', enName: 'Star Wars', type: 'collection' },
  { id: 33540,  name: 'Гарри Поттер', enName: 'Harry Potter', type: 'collection' },
];

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSlider({ items, onSelect }) {
  const [idx,  setIdx]  = useState(0);
  const [anim, setAnim] = useState('in');
  const timerRef = useRef(null);

  const goTo = useCallback((next) => {
    setAnim('out');
    setTimeout(() => { setIdx(next); setAnim('in'); }, 350);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => goTo(p => (p+1) % items.length), 5500);
    return () => clearInterval(timerRef.current);
  }, [items.length, goTo]);

  const prev = () => { clearInterval(timerRef.current); goTo((idx-1+items.length)%items.length); };
  const next = () => { clearInterval(timerRef.current); goTo((idx+1)%items.length); };

  if (!items.length) return null;
  const hero = items[idx];
  return (
    <div className="hero" onClick={() => onSelect(hero)}>
      <div className={"hero__bg hero__bg--"+anim}>
        {tmdb.backdropUrl(hero.backdrop_path) && <img src={tmdb.backdropUrl(hero.backdrop_path)} alt=""/>}
        <div className="hero__fade"/>
      </div>
      <div className={"hero__content hero__content--"+anim}>
        <div className="hero__label"><TrendingUp size={10}/> #{idx+1}</div>
        <h1 className="hero__title">{hero.title||hero.name}</h1>
        <div className="hero__meta">
          {hero.vote_average > 0 && <span><Star size={12} fill="currentColor"/> {hero.vote_average.toFixed(1)}</span>}
          <span>{(hero.release_date||hero.first_air_date||'').slice(0,4)}</span>
        </div>
        <button className="hero__btn" onClick={e=>{e.stopPropagation();onSelect(hero);}}>
          <Play size={13} fill="currentColor"/>
        </button>
      </div>
      {items.length > 1 && <>
        <button className="hero__arrow hero__arrow--left"  onClick={e=>{e.stopPropagation();prev();}}><ChevronLeft  size={20}/></button>
        <button className="hero__arrow hero__arrow--right" onClick={e=>{e.stopPropagation();next();}}><ChevronRight size={20}/></button>
      </>}
      <div className="hero__dots" onClick={e=>e.stopPropagation()}>
        {items.map((_,i)=><button key={i} className={"hero__dot"+(i===idx?" active":"")} onClick={()=>{clearInterval(timerRef.current);goTo(i);}}/>)}
      </div>
    </div>
  );
}

// ─── Standard section row ─────────────────────────────────────────────────────
function Section({ icon: Icon, title, items, onSelect, showCountdown=false }) {
  if (!items.length) return null;
  return (
    <div className="home-section">
      <h3 className="home-section__title">{Icon && <Icon size={15} className="home-section__icon"/>}{title}</h3>
      <div className="home-section__scroll">
        {items.map(m=>(
          <div key={m.id} className="home-section__item">
            <MovieCard movie={m} onClick={onSelect} showCountdown={showCountdown}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Together section with tags ───────────────────────────────────────────────
function TogetherSection({ onSelect, lang }) {
  const [activeTag, setActiveTag] = useState('date');
  const [movies, setMovies] = useState({});
  const langCode = lang==='en'?'en-US':'ru-RU';

  useEffect(() => {
    TOGETHER_TAGS.forEach(tag => {
      const genres = tag.genres.slice(0,2).join(',');
      fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${genres}&sort_by=vote_average.desc&vote_count.gte=300&page=1`, { headers: HEADERS })
        .then(r=>r.json()).then(data=>{
          setMovies(prev=>({...prev, [tag.id]: (data.results||[]).filter(m=>m.poster_path).slice(0,15)}));
        }).catch(()=>{});
    });
  }, [langCode]);

  const current = movies[activeTag] || [];

  return (
    <div className="home-section together-section">
      <h3 className="home-section__title"><Heart size={15} className="home-section__icon"/>{t(lang,'Не смотри один','Watch Together')}</h3>
      <div className="together-tags">
        {TOGETHER_TAGS.map(tag=>(
          <button key={tag.id} className={"together-tag"+(activeTag===tag.id?' active':'')} onClick={()=>setActiveTag(tag.id)}>
            <span>{tag.icon}</span> {lang==='ru'?tag.ru:tag.en}
          </button>
        ))}
      </div>
      <div className="home-section__scroll">
        {current.map(m=>(
          <div key={m.id} className="home-section__item">
            <MovieCard movie={{...m,media_type:'movie'}} onClick={onSelect}/>
          </div>
        ))}
        {!current.length && [1,2,3,4].map(i=>(
          <div key={i} className="skeleton home-section__item" style={{paddingBottom:'195px',borderRadius:12}}/>
        ))}
      </div>
    </div>
  );
}

// ─── Collections row ──────────────────────────────────────────────────────────
function CollectionsRow({ onOpen, lang }) {
  return (
    <div className="home-section">
      <h3 className="home-section__title"><Sparkles size={15} className="home-section__icon"/>{t(lang,'Знаменитые коллекции','Famous Collections')}</h3>
      <div className="collections-row">
        {COLLECTIONS.map(col=>(
          <button key={col.id} className="collection-chip"
            onClick={()=>onOpen({ type: col.type==='company'?'company':'collection', id: col.type==='company'?col.companyId:col.id, name: lang==='en'?(col.enName||col.name):col.name })}>
            {lang==='en'?(col.enName||col.name):col.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Studios row ──────────────────────────────────────────────────────────────
function StudiosRow({ onOpen, lang }) {
  return (
    <div className="home-section">
      <h3 className="home-section__title"><Building2 size={15} className="home-section__icon"/>{t(lang,'Студии','Studios')}</h3>
      <div className="studios-row">
        {STUDIOS.map(s=>(
          <button key={s.id} className="studio-chip"
            onClick={()=>onOpen({ type:'company', id:s.id, name:s.name })}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Dedup helper ─────────────────────────────────────────────────────────────
function dedup(arrays) {
  const seen = new Set();
  return arrays.map(arr => arr.filter(m => { if(seen.has(m.id)) return false; seen.add(m.id); return true; }));
}

const SkeletonRow = () => (
  <div className="home-section">
    <div className="skeleton" style={{height:14,width:160,marginBottom:14,marginLeft:20,borderRadius:6}}/>
    <div style={{display:'flex',gap:12,overflow:'hidden',padding:'0 20px'}}>
      {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{width:130,flexShrink:0,borderRadius:12,paddingBottom:'195px'}}/>)}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const [allData,      setAllData]      = useState(null);
  const [mood,         setMood]         = useState('all');
  const [moodData,     setMoodData]     = useState(null);
  const [seasonData,   setSeasonData]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [moodLoading,  setMoodLoading]  = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [actor,        setActor]        = useState(null);
  const [collection,   setCollection]   = useState(null);
  const { lang } = useTheme();
  const langCode = lang==='en'?'en-US':'ru-RU';
  const currentYear = new Date().getFullYear();
  const season = getCurrentSeason();
  const seasonCfg = SEASON_CONFIG[season];

  useEffect(() => {
    setLoading(true); setMood('all'); setMoodData(null);
    Promise.all([
      tmdb.trending('all','week'),
      tmdb.popular('movie',3),
      tmdb.topRated('movie',3),
      tmdb.nowPlaying(3),
      tmdb.upcoming(3),
      tmdb.popular('tv',3),
      tmdb.topRated('tv',3),
      tmdb.discover('movie',{primary_release_year:currentYear,sort_by:'popularity.desc','vote_count.gte':50},3),
    ]).then(([tr,pm,tm,np,up,ptv,ttv,ny]) => {
      setAllData({
        trending:  (tr.results||[]).slice(0,10),
        popularM:  (pm.results||[]).slice(0,50),
        topM:      (tm.results||[]).slice(0,50),
        nowPlaying:(np.results||[]).slice(0,50),
        upcoming:  (up.results||[]).slice(0,50),
        popularTV: (ptv.results||[]).slice(0,50).map(m=>({...m,media_type:'tv'})),
        topTV:     (ttv.results||[]).slice(0,50).map(m=>({...m,media_type:'tv'})),
        newYear:   (ny.results||[]).slice(0,50),
      });
      setLoading(false);
    }).catch(()=>setLoading(false));

    // Seasonal section
    const g = seasonCfg.genres.slice(0,2).join(',');
    fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${g}&sort_by=${seasonCfg.sort}&vote_count.gte=200&page=1`, {headers:HEADERS})
      .then(r=>r.json()).then(data=>setSeasonData((data.results||[]).filter(m=>m.poster_path).slice(0,20)))
      .catch(()=>{});
  }, [lang, currentYear, langCode, seasonCfg.genres, seasonCfg.sort]);

  useEffect(() => {
    if (mood==='all'||!allData) { setMoodData(null); return; }
    const cfg = MOODS.find(m=>m.id===mood);
    if (!cfg?.genres.length) { setMoodData(null); return; }
    setMoodLoading(true);
    const g = cfg.genres.join('|');
    Promise.all([
      tmdb.discover('movie',{with_genres:g,sort_by:'popularity.desc','vote_count.gte':200},3),
      tmdb.discover('tv',   {with_genres:g,sort_by:'popularity.desc','vote_count.gte':50}, 3),
    ]).then(([movies,tv])=>{
      setMoodData({
        movies:(movies.results||[]).map(m=>({...m,media_type:'movie'})),
        tv:    (tv.results   ||[]).map(m=>({...m,media_type:'tv'})),
      });
      setMoodLoading(false);
    }).catch(()=>setMoodLoading(false));
  }, [mood, allData]);

  if (actor)      return <ActorPage actor={actor} onBack={()=>setActor(null)} onMovieClick={m=>{setActor(null);setSelected(m);}}/>;
  if (collection) return <CollectionPage item={collection} onBack={()=>setCollection(null)}/>;

  // Build deduplicated sections
  let sections = [];
  if (allData && mood==='all') {
    const heroIds = new Set(allData.trending.map(m=>m.id));
    const [nowP,upcom,newY,popM,topM,popTV,topTV,seas] = dedup([
      allData.nowPlaying,
      allData.upcoming,
      allData.newYear,
      allData.popularM.filter(m=>!heroIds.has(m.id)),
      allData.topM.filter(m=>!heroIds.has(m.id)),
      allData.popularTV,
      allData.topTV,
      seasonData,
    ]);
    sections = [
      { icon:Clapperboard, title:t(lang,'Сейчас в кино','Now Playing'),         items:nowP.slice(0,50),  countdown:false },
      { icon:CalendarDays,  title:t(lang,'Скоро в кино','Coming Soon'),          items:upcom.slice(0,50), countdown:true },
      { icon:Sparkles,      title:t(lang,`Новинки ${currentYear}`,`New ${currentYear}`), items:newY.slice(0,50), countdown:false },
      { icon:Flame,         title:t(lang,'Популярные фильмы','Popular Movies'),  items:popM.slice(0,50),  countdown:false },
      { icon:Trophy,        title:t(lang,'Лучшие фильмы','Top Movies'),          items:topM.slice(0,50),  countdown:false },
      { icon:Tv2,           title:t(lang,'Популярные сериалы','Popular Series'), items:popTV.slice(0,50), countdown:false },
      { icon:Trophy,        title:t(lang,'Лучшие сериалы','Top Series'),         items:topTV.slice(0,50), countdown:false },
      ...(seas.length ? [{ icon:Sparkles, title:seasonCfg[lang==='en'?'en':'ru'], items:seas.slice(0,20), countdown:false }] : []),
    ];
  } else if (allData && moodData) {
    const cfg = MOODS.find(m=>m.id===mood);
    const [movies,tv] = dedup([moodData.movies,moodData.tv]);
    sections = [
      { icon:Flame, title:t(lang,`Фильмы — ${cfg.ru}`,`Movies — ${cfg.en}`), items:movies.slice(0,50), countdown:false },
      { icon:Tv2,   title:t(lang,`Сериалы — ${cfg.ru}`,`Series — ${cfg.en}`), items:tv.slice(0,50),    countdown:false },
    ];
  }

  return (
    <div className="page home-page">
      {!loading && allData && <HeroSlider items={allData.trending} onSelect={setSelected}/>}
      {loading && <div className="hero hero--skeleton"><div className="skeleton" style={{width:'100%',height:'100%',borderRadius:0}}/></div>}

      {/* Mood bar */}
      <div className="mood-bar">
        {MOODS.map(m=>(
          <button key={m.id} className={"mood-btn"+(mood===m.id?' active':'')} onClick={()=>setMood(m.id)}>
            <span className="mood-btn__icon">{m.icon}</span>
            <span className="mood-btn__label">{lang==='ru'?m.ru:m.en}</span>
          </button>
        ))}
      </div>

      <div className="home-sections">
        {(loading||moodLoading) ? <>{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</> : (
          <>
            {sections.map((s,i)=>(
              <Section key={i} icon={s.icon} title={s.title} items={s.items} onSelect={setSelected} showCountdown={s.countdown}/>
            ))}

            {/* Together section — always shown in 'all' mode */}
            {mood==='all' && <TogetherSection onSelect={setSelected} lang={lang}/>}

            {/* Collections */}
            {mood==='all' && <CollectionsRow onOpen={setCollection} lang={lang}/>}

            {/* Studios */}
            {mood==='all' && <StudiosRow onOpen={setCollection} lang={lang}/>}
          </>
        )}
      </div>

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
    </div>
  );
}