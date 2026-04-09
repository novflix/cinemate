import { useNavigate } from 'react-router-dom';
import { useMovieModal } from '../hooks/useMovieModal';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StarLinear, PlayLinear, Chart2Linear, ClapperboardLinear, FlameLinear, CupFirstLinear, CalendarDateLinear, TVLinear, MagicStickLinear, HeartLinear, AltArrowLeftLinear, AltArrowRightLinear, SmileCircleLinear, GhostLinear, BoltCircleLinear, GlassesLinear, ConfettiMinimalisticLinear, UsersGroupRoundedLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme } from '../theme';
import { useAdmin } from '../admin';
import { getCurrentSeason, SEASON_CONFIG } from '../hooks/useSeason';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ScrollRow from '../components/ScrollRow';
import './Home.css';

// Session cache — avoids refetching on tab switch within same session
const HOME_CACHE_KEY = 'cinimate_home_cache_v1';
function getHomeCache(lang) {
  try {
    const raw = sessionStorage.getItem(HOME_CACHE_KEY + '_' + lang);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > 5 * 60 * 1000) return null; // 5 min TTL
    return data;
  } catch { return null; }
}
function setHomeCache(lang, data) {
  try { sessionStorage.setItem(HOME_CACHE_KEY + '_' + lang, JSON.stringify({ data, ts: Date.now() })); } catch {}
}


// TMDB uses different genre IDs for movies vs TV.
// 'genres' = movie genre IDs, 'tvGenres' = TV-specific overrides (falls back to genres if not set)
// Key differences: Action(28→10759), Adventure(12→10759), Sci-Fi(878→10765), Family(10751→10762)
const MOODS = [
  { id: 'all',    Icon: ClapperboardLinear, genres: [],              tvGenres: [],                ru: 'Всё',       en: 'All'     },
  { id: 'fun',    Icon: SmileCircleLinear,  genres: [35,10751],     tvGenres: [35,10762,10751],  ru: 'Весёлое',   en: 'Fun'     },
  { id: 'scary',  Icon: GhostLinear,        genres: [27,53],        tvGenres: [27,53,80],           ru: 'Страшное',  en: 'Scary'   },
  { id: 'action', Icon: BoltCircleLinear,   genres: [28,12],        tvGenres: [10759],           ru: 'Экшн',      en: 'Action'  },
  { id: 'drama',  Icon: HeartLinear,        genres: [18,10749],     tvGenres: [18,10749],        ru: 'Драма',     en: 'Drama'   },
  { id: 'mind',   Icon: GlassesLinear,        genres: [878,9648,99],  tvGenres: [10765,9648,99],   ru: 'Для ума',   en: 'Mindful' },
];

const CURRENT_YEAR = new Date().getFullYear();
const TOGETHER_TAGS = [
  { id: 'date',    ru: 'Для свидания', en: 'First date',   Icon: HeartLinear,
    params: { with_genres: '10749,35', sort_by: 'popularity.desc', 'vote_count.gte': 800,  'vote_average.gte': 6.5, 'primary_release_date.gte': `${CURRENT_YEAR - 10}-01-01` } },
  { id: 'friends', ru: 'С друзьями',   en: 'With friends', Icon: ConfettiMinimalisticLinear,
    params: { with_genres: '35,28',    sort_by: 'popularity.desc', 'vote_count.gte': 1000, 'vote_average.gte': 6.5, 'primary_release_date.gte': `${CURRENT_YEAR - 10}-01-01` } },
  { id: 'family',  ru: 'Для семьи',    en: 'Family',       Icon: UsersGroupRoundedLinear,
    params: { with_genres: '10751,16', sort_by: 'popularity.desc', 'vote_count.gte': 400,  'vote_average.gte': 6.8, 'primary_release_date.gte': `${CURRENT_YEAR - 15}-01-01` } },
];


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
    timerRef.current = setInterval(() => goTo(p => (p+1)%items.length), 5500);
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
        <div className="hero__label"><Chart2Linear size={10}/> #{idx+1}</div>
        <h1 className="hero__title">{hero.title||hero.name}</h1>
        <div className="hero__meta">
          {hero.vote_average > 0 && <span><StarLinear size={12} fill="currentColor"/> {hero.vote_average.toFixed(1)}</span>}
          <span>{(hero.release_date||hero.first_air_date||'').slice(0,4)}</span>
        </div>
        <button className="hero__btn" onClick={e=>{e.stopPropagation();onSelect(hero);}}>
          <PlayLinear size={13} fill="currentColor"/>
        </button>
      </div>
      {items.length > 1 && <>
        <button className="hero__arrow hero__arrow--left"  onClick={e=>{e.stopPropagation();prev();}}><AltArrowLeftLinear  size={20}/></button>
        <button className="hero__arrow hero__arrow--right" onClick={e=>{e.stopPropagation();next();}}><AltArrowRightLinear size={20}/></button>
      </>}
      <div className="hero__dots" onClick={e=>e.stopPropagation()}>
        {items.map((_,i)=>(
          <button key={i} className={"hero__dot"+(i===idx?" active":"")} onClick={()=>{clearInterval(timerRef.current);goTo(i);}}/>
        ))}
      </div>
    </div>
  );
}

const SectionRow = memo(function SectionRow({ items, onSelect, showCountdown=false, gold=false }) {
  return (
    <ScrollRow>
      {items.map(m => (
        <div key={m.id} className={"home-section__item"+(gold?" home-section__item--gold":"")}>
          <MovieCard movie={m} onClick={onSelect} showCountdown={showCountdown}/>
        </div>
      ))}
    </ScrollRow>
  );
});

function TogetherSection({ onSelect, lang }) {
  const { t } = useTranslation();
  const [activeTag, setActiveTag] = useState('date');
  const [movies, setMovies] = useState({});
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';

  useEffect(() => {
    TOGETHER_TAGS.forEach(tag => {
      const query = new URLSearchParams({
        language: langCode,
        page: '1',
        ...tag.params,
      }).toString();
      fetch(`https://api.themoviedb.org/3/discover/movie?${query}`, { headers: HEADERS })
        .then(r=>r.json()).then(data=>{
          setMovies(prev=>({...prev,[tag.id]:(data.results||[]).filter(m=>m.poster_path).slice(0,15)}));
        }).catch(()=>{});
    });
  }, [langCode]);

  const current = movies[activeTag] || [];
  return (
    <div className="home-section together-section">
      <h3 className="home-section__title"><HeartLinear size={15} className="home-section__icon"/>{t('profile.watchTogether')}</h3>
      <div className="together-tags">
        {TOGETHER_TAGS.map(tag=>(
          <button key={tag.id} className={"together-tag"+(activeTag===tag.id?' active':'')} onClick={()=>setActiveTag(tag.id)}>
            <tag.Icon size={14}/> {lang==='ru'?tag.ru:tag.en}
          </button>
        ))}
      </div>
      <ScrollRow>
        {current.length > 0
          ? current.map(m=><div key={m.id} className="home-section__item"><MovieCard movie={{...m,media_type:'movie'}} onClick={onSelect}/></div>)
          : [1,2,3,4].map(i=><div key={i} className="skeleton home-section__item" style={{paddingBottom:'195px',borderRadius:12}}/>)
        }
      </ScrollRow>
    </div>
  );
}


function dedup(arrays) {
  const seen = new Set();
  return arrays.map(arr => arr.filter(m => { if(seen.has(m.id))return false; seen.add(m.id); return true; }));
}

const SkeletonRow = () => (
  <div className="home-section">
    <div className="skeleton" style={{height:14,width:160,marginBottom:14,marginLeft:20,borderRadius:6}}/>
    <div style={{display:'flex',gap:12,overflow:'hidden',padding:'0 20px'}}>
      {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{width:130,flexShrink:0,borderRadius:12,paddingBottom:'195px'}}/>)}
    </div>
  </div>
);

export default function Home() {
  const [allData,     setAllData]     = useState(null);
  const [mood,        setMood]        = useState('all');
  const [moodData,    setMoodData]    = useState(null);
  const [seasonData,  setSeasonData]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [moodLoading, setMoodLoading] = useState(false);
  const { selected, openMovie, closeMovie } = useMovieModal();
  const navigate = useNavigate();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const { overrides } = useAdmin();
  const langCode = lang==='en'?'en-US':'ru-RU';
  const currentYear = new Date().getFullYear();
  const season = getCurrentSeason(overrides.season);
  const seasonCfg = SEASON_CONFIG[season];

  useEffect(() => {
    setMood('all'); setMoodData(null);
    // Try cache first
    const cached = getHomeCache(lang);
    if (cached) { setAllData(cached); setLoading(false); }
    else setLoading(true);
    Promise.all([
      tmdb.trending('all','week'),
      tmdb.popular('movie',2),
      tmdb.topRated('movie',2),
      tmdb.nowPlaying(2),
      tmdb.upcoming(2),
      tmdb.popular('tv',2),
      tmdb.topRated('tv',2),
      tmdb.discover('movie',{primary_release_year:currentYear,sort_by:'popularity.desc','vote_count.gte':50},2),
    ]).then(([tr,pm,tm,np,up,ptv,ttv,ny]) => {
      const homeData = {
        trending:  (tr.results||[]).slice(0,10),
        popularM:  (pm.results||[]).slice(0,50),
        topM:      (tm.results||[]).slice(0,50),
        nowPlaying:(np.results||[]).slice(0,50),
        upcoming:  (() => {
        const today = new Date().toISOString().split('T')[0];
        return (up.results||[])
          .filter(m => m.release_date && m.release_date > today)
          .sort((a,b) => a.release_date.localeCompare(b.release_date))
          .slice(0,50);
      })(),
        popularTV: (ptv.results||[]).slice(0,50).map(m=>({...m,media_type:'tv'})),
        topTV:     (ttv.results||[]).slice(0,50).map(m=>({...m,media_type:'tv'})),
        newYear:   (ny.results||[]).slice(0,50),
      };
      setAllData(homeData);
      setHomeCache(lang, homeData);
      setLoading(false);
    }).catch(()=>setLoading(false));

    const g = seasonCfg.genres.slice(0,2).join(',');
    const minYear = new Date().getFullYear() - 20;
    fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${g}&sort_by=${seasonCfg.sort}&vote_count.gte=200&primary_release_date.gte=${minYear}-01-01&page=1`,{headers:HEADERS})
      .then(r=>r.json()).then(data=>setSeasonData((data.results||[]).filter(m=>m.poster_path).slice(0,20)))
      .catch(()=>{});
  }, [lang, currentYear, langCode, seasonCfg.genres, seasonCfg.sort]);

  useEffect(() => {
    if (mood==='all'||!allData){setMoodData(null);return;}
    const cfg=MOODS.find(m=>m.id===mood);
    if(!cfg?.genres.length){setMoodData(null);return;}
    setMoodLoading(true);
    const gMovie = cfg.genres.join('|');
    // TV uses different genre IDs than movies — use tvGenres if defined
    const gTv = (cfg.tvGenres?.length ? cfg.tvGenres : cfg.genres).join('|');
    Promise.all([
      tmdb.discover('movie',{with_genres:gMovie,sort_by:'popularity.desc','vote_count.gte':200,'primary_release_date.gte':`${new Date().getFullYear()-15}-01-01`},3),
      tmdb.discover('tv',   {with_genres:gTv,  sort_by:'popularity.desc','vote_count.gte':50, 'first_air_date.gte':`${new Date().getFullYear()-15}-01-01`},3),
    ]).then(([movies,tv])=>{
      setMoodData({
        movies:(movies.results||[]).filter(m=>m.poster_path).map(m=>({...m,media_type:'movie'})),
        tv:    (tv.results   ||[]).filter(m=>m.poster_path).map(m=>({...m,media_type:'tv'})),
      });
      setMoodLoading(false);
    }).catch(()=>setMoodLoading(false));
  }, [mood, allData]);

  const handleActorClick = (actor) => navigate(`/actor/${actor.id}`, { state: { actor } });

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
      { icon:ClapperboardLinear, title:t('home.nowPlaying'),   items:nowP.slice(0,50),  countdown:false, gold:false },
      { icon:CalendarDateLinear, title:t('home.comingSoon'),    items:upcom.slice(0,50), countdown:true,  gold:false },
      { icon:MagicStickLinear,     title:t('home.newYear', {year: currentYear}), items:newY.slice(0,50), countdown:false, gold:false },
      { icon:FlameLinear,        title:t('home.popularMovies'),  items:popM.slice(0,50),  countdown:false, gold:false },
      { icon:CupFirstLinear,       title:t('home.topMovies'),          items:topM.slice(0,50),  countdown:false, gold:true  },
      { icon:TVLinear,          title:t('home.popularSeries'), items:popTV.slice(0,50), countdown:false, gold:false },
      { icon:CupFirstLinear,       title:t('home.topSeries'),         items:topTV.slice(0,50), countdown:false, gold:true  },
      ...(seas.length?[{icon:MagicStickLinear,title:seasonCfg[lang==='en'?'en':'ru'],items:seas.slice(0,20),countdown:false,gold:false}]:[]),
    ];
  } else if (allData && moodData) {
    const cfg=MOODS.find(m=>m.id===mood);
    const [movies,tv]=dedup([moodData.movies,moodData.tv]);
    const moodLabel = cfg ? t(`moods.${cfg.id}`) : mood;
    sections=[
      {icon:FlameLinear,title:lang === 'ru' ? `Фильмы — ${moodLabel}` : `Movies — ${moodLabel}`,items:movies.slice(0,50),countdown:false,gold:false},
      {icon:TVLinear,  title:lang === 'ru' ? `Сериалы — ${moodLabel}` : `Series — ${moodLabel}`,items:tv.slice(0,50),   countdown:false,gold:false},
    ];
  }

  return (
    <div className="page home-page">
      {!loading && allData && <HeroSlider items={allData.trending} onSelect={openMovie}/>}
      {loading && <div className="hero hero--skeleton"><div className="skeleton" style={{width:'100%',height:'100%',borderRadius:0}}/></div>}

      <div className="mood-bar">
        {MOODS.map(m=>(
          <button key={m.id} className={"mood-btn"+(mood===m.id?' active':'')} onClick={()=>setMood(m.id)}>
            <span className="mood-btn__icon"><m.Icon size={18}/></span>
            <span className="mood-btn__label">{t(`moods.${m.id}`)}</span>
          </button>
        ))}
      </div>

      <div className="home-sections">
        {(loading||moodLoading) ? <>{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</> : (
          <>
            {allData && mood==='all' && (
              <div className="home-section">
                <h3 className="home-section__title home-section__title--trending">
                  <FlameLinear size={15} className="home-section__icon"/>
                  {t('home.trending')}
                </h3>
                <SectionRow items={allData.trending.slice(0,10)} onSelect={openMovie}/>
              </div>
            )}

            {sections.map((s,i)=>(
              <div key={i} className="home-section">
                <h3 className="home-section__title">
                  {s.icon && <s.icon size={15} className="home-section__icon"/>}
                  {s.title}
                </h3>
                <SectionRow items={s.items} onSelect={openMovie} showCountdown={s.countdown} gold={s.gold}/>
              </div>
            ))}

            {mood==='all' && <TogetherSection onSelect={openMovie} lang={lang}/>}
          </>
        )}
      </div>

      <MovieModal movie={selected} onClose={closeMovie} onActorClick={a=>{ handleActorClick(a); }}/>
    </div>
  );
}