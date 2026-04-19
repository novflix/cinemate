import { useNavigate } from 'react-router-dom';
import { useMovieModal } from '../hooks/useMovieModal';
import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StarLinear, PlayLinear, Chart2Linear, ClapperboardLinear, FlameLinear,
  CupFirstLinear, CalendarDateLinear, TVLinear, MagicStickLinear,
  AltArrowLeftLinear, AltArrowRightLinear, CupLinear,
  SunFogLinear, SnowflakeLinear, LeafLinear, CloudsLinear,
  GhostLinear, StarFallMinimalisticLinear,
} from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme } from '../theme';
import { useAdmin } from '../admin';
import { getCurrentSeason, SEASON_CONFIG } from '../hooks/useSeason';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import ScrollRow from '../components/ScrollRow';
import './Home.css';

/* ─── Cache ─────────────────────────────────────────────────────────────── */
const HOME_CACHE_KEY = 'cinimate_home_cache_v3';
function getHomeCache(lang) {
  try {
    const raw = sessionStorage.getItem(HOME_CACHE_KEY + '_' + lang);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > 5 * 60 * 1000) return null;
    return data;
  } catch { return null; }
}
function setHomeCache(lang, data) {
  try { sessionStorage.setItem(HOME_CACHE_KEY + '_' + lang, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

const CURRENT_YEAR = new Date().getFullYear();
const TMDB_LANG_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR', it: 'it-IT', tr: 'tr-TR', zh: 'zh-CN' };

/* ─── Season meta ────────────────────────────────────────────────────────── */
const SEASON_ICONS = {
  halloween: GhostLinear,
  newyear:   StarFallMinimalisticLinear,
  summer:    SunFogLinear,
  winter:    SnowflakeLinear,
  spring:    LeafLinear,
  autumn:    CloudsLinear,
};

const SEASON_COLORS = {
  halloween: { from: '#ff6b35', to: '#c0392b', glow: 'rgba(255,107,53,0.4)'  },
  newyear:   { from: '#e8c547', to: '#f39c12', glow: 'rgba(232,197,71,0.45)' },
  summer:    { from: '#f7971e', to: '#ffd200', glow: 'rgba(247,151,30,0.4)'  },
  winter:    { from: '#74b9ff', to: '#a29bfe', glow: 'rgba(116,185,255,0.4)' },
  spring:    { from: '#fd79a8', to: '#e84393', glow: 'rgba(253,121,168,0.4)' },
  autumn:    { from: '#e17055', to: '#d35400', glow: 'rgba(225,112,85,0.4)'  },
};

const SEASON_LABEL = {
  halloween: { ru: 'Хэллоуин', en: 'Halloween' },
  newyear:   { ru: 'Новый год', en: 'New Year'  },
  summer:    { ru: 'Лето',      en: 'Summer'     },
  winter:    { ru: 'Зима',      en: 'Winter'     },
  spring:    { ru: 'Весна',     en: 'Spring'     },
  autumn:    { ru: 'Осень',     en: 'Autumn'     },
};

const SEASON_QUOTES = {
  summer:    ['Summer is for films with no subtitles.', 'Sun, popcorn, action.', 'The perfect evening starts here.'],
  winter:    ['Wrap up, press play.', 'Cold outside. Perfect inside.', 'The best company on a winter night.'],
  spring:    ['New season, new favorites.', 'Fresh picks for fresh days.', 'Your watchlist is blooming.'],
  autumn:    ['Leaves fall, great films rise.', 'Cosy season, cosy picks.', 'Perfect time to rediscover cinema.'],
  halloween: ['Things go bump in the night.', 'Enter if you dare.', 'The season of fear is here.'],
  newyear:   ['End the year with a masterpiece.', 'Celebrate with great cinema.', 'The perfect last-night film.'],
};

const GENRE_NAMES = {
  18:    { ru: 'Драма',       en: 'Drama'      },
  27:    { ru: 'Ужасы',       en: 'Horror'     },
  28:    { ru: 'Экшн',        en: 'Action'     },
  35:    { ru: 'Комедия',     en: 'Comedy'     },
  53:    { ru: 'Триллер',     en: 'Thriller'   },
  9648:  { ru: 'Мистика',     en: 'Mystery'    },
  10749: { ru: 'Романтика',   en: 'Romance'    },
  10751: { ru: 'Семейное',    en: 'Family'     },
  10765: { ru: 'Sci-Fi',      en: 'Sci-Fi'     },
  14:    { ru: 'Фэнтези',     en: 'Fantasy'    },
  12:    { ru: 'Приключения', en: 'Adventure'  },
  16:    { ru: 'Анимация',    en: 'Animation'  },
};

/* ─── Hero Slider ────────────────────────────────────────────────────────── */
function HeroSlider({ items, onSelect }) {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState('in');
  const timerRef = useRef(null);

  const goTo = useCallback((next) => {
    setAnim('out');
    setTimeout(() => { setIdx(next); setAnim('in'); }, 350);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => goTo(p => (p + 1) % items.length), 5500);
    return () => clearInterval(timerRef.current);
  }, [items.length, goTo]);

  const prev = () => { clearInterval(timerRef.current); goTo((idx - 1 + items.length) % items.length); };
  const next = () => { clearInterval(timerRef.current); goTo((idx + 1) % items.length); };

  if (!items.length) return null;
  const hero = items[idx];

  return (
    <div className="hero" onClick={() => onSelect(hero)}>
      <div className={"hero__bg hero__bg--" + anim}>
        {tmdb.backdropUrl(hero.backdrop_path) && <img src={tmdb.backdropUrl(hero.backdrop_path)} alt="" />}
        <div className="hero__fade" />
      </div>
      <div className={"hero__content hero__content--" + anim}>
        <div className="hero__label"><Chart2Linear size={10} /> #{idx + 1} Trending</div>
        <h1 className="hero__title">{hero.title || hero.name}</h1>
        <div className="hero__meta">
          {hero.vote_average > 0 && <span><StarLinear size={12} fill="currentColor" /> {hero.vote_average.toFixed(1)}</span>}
          <span>{(hero.release_date || hero.first_air_date || '').slice(0, 4)}</span>
          {hero.media_type && <span className="hero__type-badge">{hero.media_type === 'tv' ? 'Series' : hero.media_type === 'movie' ? 'Film' : ''}</span>}
        </div>
        <button className="hero__btn" onClick={e => { e.stopPropagation(); onSelect(hero); }}>
          <PlayLinear size={13} fill="currentColor" />
        </button>
      </div>
      {items.length > 1 && <>
        <button className="hero__arrow hero__arrow--left" onClick={e => { e.stopPropagation(); prev(); }}><AltArrowLeftLinear size={20} /></button>
        <button className="hero__arrow hero__arrow--right" onClick={e => { e.stopPropagation(); next(); }}><AltArrowRightLinear size={20} /></button>
      </>}
      <div className="hero__dots" onClick={e => e.stopPropagation()}>
        {items.map((_, i) => (
          <button key={i} className={"hero__dot" + (i === idx ? " active" : "")} onClick={() => { clearInterval(timerRef.current); goTo(i); }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Skeleton Row ───────────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <div className="home-section">
    <div className="skeleton" style={{ height: 13, width: 140, marginBottom: 12, marginLeft: 20, borderRadius: 6 }} />
    <div style={{ display: 'flex', gap: 12, overflow: 'hidden', padding: '0 20px' }}>
      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ width: 130, flexShrink: 0, borderRadius: 12, paddingBottom: '195px' }} />)}
    </div>
  </div>
);

/* ─── Section Row ────────────────────────────────────────────────────────── */
const SectionRow = memo(function SectionRow({ items, onSelect, showCountdown = false }) {
  return (
    <ScrollRow>
      {items.map(m => (
        <div key={m.id} className="home-section__item">
          <MovieCard movie={m} onClick={onSelect} showCountdown={showCountdown} />
        </div>
      ))}
    </ScrollRow>
  );
});

/* ─── Single titled section ──────────────────────────────────────────────── */
function ContentSection({ Icon, title, items, onSelect, showCountdown = false }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="home-section">
      <h3 className="home-section__title">
        {Icon && <Icon size={15} className="home-section__icon" />}
        {title}
      </h3>
      <SectionRow items={items} onSelect={onSelect} showCountdown={showCountdown} />
    </div>
  );
}

/* ─── Three-slider block (Movies + Series + Animation) ───────────────────── */
function ThreeCatBlock({ movies, series, animation, onSelect, lang, loading }) {
  const cats = [
    { key: 'movies',    Icon: ClapperboardLinear, ru: 'Фильмы',   en: 'Movies',    items: movies    },
    { key: 'series',    Icon: TVLinear,           ru: 'Сериалы',  en: 'Series',    items: series    },
    { key: 'animation', Icon: MagicStickLinear,   ru: 'Анимация', en: 'Animation', items: animation },
  ];
  if (loading) return <div className="home-sections" style={{ paddingTop: 4 }}>{cats.map(c => <SkeletonRow key={c.key} />)}</div>;
  return (
    <div className="home-sections" style={{ paddingTop: 4 }}>
      {cats.map(c => (
        <ContentSection key={c.key} Icon={c.Icon} title={lang === 'ru' ? c.ru : c.en} items={c.items} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ─── Coming Soon Card ───────────────────────────────────────────────────── */
function ComingSoonCard({ movie, onSelect }) {
  const days = useMemo(() => {
    const d = movie.release_date;
    if (!d) return null;
    const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
    return diff > 0 ? diff : null;
  }, [movie.release_date]);

  return (
    <div className="cs-card" onClick={() => onSelect(movie)}>
      <div className="cs-card__poster">
        {movie.poster_path
          ? <img src={tmdb.posterUrl(movie.poster_path)} alt={movie.title} />
          : <div className="cs-card__no-poster"><ClapperboardLinear size={32} /></div>
        }
        {days !== null && (
          <div className="cs-card__badge">
            <span className="cs-card__days">{days}</span>
            <span className="cs-card__days-label">days</span>
          </div>
        )}
      </div>
      <div className="cs-card__info">
        <div className="cs-card__title">{movie.title || movie.name}</div>
        {movie.release_date && (
          <div className="cs-card__date">
            <CalendarDateLinear size={11} />
            {new Date(movie.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Popular Lists Placeholder ──────────────────────────────────────────── */
function PopularListsPlaceholder({ lang }) {
  return (
    <div className="placeholder-block">
      <div className="placeholder-block__icon"><CupLinear size={40} /></div>
      <h3 className="placeholder-block__title">{lang === 'ru' ? 'Скоро появится' : 'Coming Soon'}</h3>
      <p className="placeholder-block__desc">
        {lang === 'ru'
          ? 'Популярные списки фильмов и сериалов от сообщества сейчас в разработке. Скоро здесь появятся топы, подборки и рейтинги.'
          : 'Community-curated lists are in development. Top picks, collections and rankings coming soon.'}
      </p>
      <div className="placeholder-block__chips">
        {['🎬 Top 100 Movies', '📺 Best Series', '🌍 World Cinema', '🏆 Award Winners'].map(c => (
          <div key={c} className="placeholder-block__chip">{c}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Seasonal Tab ───────────────────────────────────────────────────────── */
function SeasonalTab({ season, seasonCfg, lang, onSelect, langCode }) {
  const [movies, setMovies]       = useState([]);
  const [series, setSeries]       = useState([]);
  const [animation, setAnimation] = useState([]);
  const [loaded, setLoaded]       = useState(false);
  const [quoteIdx, setQuoteIdx]   = useState(0);

  const colors    = SEASON_COLORS[season];
  const SeasonIcon = SEASON_ICONS[season] || MagicStickLinear;
  const label     = SEASON_LABEL[season]?.[lang] || season;
  const quotes    = SEASON_QUOTES[season] || [];

  // Rotate quote
  useEffect(() => {
    if (quotes.length < 2) return;
    const id = setInterval(() => setQuoteIdx(q => (q + 1) % quotes.length), 4200);
    return () => clearInterval(id);
  }, [quotes.length]);

  // Fetch data
  const g = seasonCfg.genres.slice(0, 2).join(',');
  useEffect(() => {
    const minYear = new Date().getFullYear() - 18;
    const JUNK = new Set([10764, 10767, 10763, 10766, 10768]);
    const clean = arr => (arr || []).filter(m => m.poster_path && !(m.genre_ids || []).some(id => JUNK.has(id)));
    Promise.all([
      fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${g}&sort_by=${seasonCfg.sort}&vote_count.gte=200&primary_release_date.gte=${minYear}-01-01&page=1`, { headers: HEADERS }).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/discover/tv?language=${langCode}&with_genres=${g}&sort_by=${seasonCfg.sort}&vote_count.gte=50&first_air_date.gte=${minYear}-01-01&page=1`, { headers: HEADERS }).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=${[seasonCfg.genres[0], 16].join(',')}&sort_by=popularity.desc&vote_count.gte=80&page=1`, { headers: HEADERS }).then(r => r.json()),
    ]).then(([m, tv, anim]) => {
      setMovies(clean(m.results).slice(0, 25));
      setSeries(clean(tv.results).map(x => ({ ...x, media_type: 'tv' })).slice(0, 25));
      setAnimation(clean(anim.results).slice(0, 20));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [g, langCode, seasonCfg.sort, seasonCfg.genres]);

  return (
    <div className="seasonal-tab">
      {/* Seasonal hero banner */}
      <div
        className="seasonal-hero"
        style={{ '--s-from': colors.from, '--s-to': colors.to, '--s-glow': colors.glow }}
      >
        <div className="seasonal-hero__glow" />
        <div className="seasonal-hero__top">
          <div className="seasonal-hero__icon-ring">
            <SeasonIcon size={28} />
          </div>
          <div className="seasonal-hero__titles">
            <div className="seasonal-hero__name">{label}</div>
            <div className="seasonal-hero__sub">{lang === 'ru' ? 'Подборка сезона' : 'Season collection'}</div>
          </div>
        </div>

        {/* Animated rotating quote */}
        {quotes.length > 0 && (
          <div className="seasonal-hero__quote" key={quoteIdx}>
            {quotes[quoteIdx]}
          </div>
        )}

        {/* Genre chips */}
        <div className="seasonal-hero__genres">
          {seasonCfg.genres.slice(0, 5).map(gId => (
            <span key={gId} className="seasonal-hero__chip">
              {GENRE_NAMES[gId]?.[lang] || gId}
            </span>
          ))}
        </div>
      </div>

      {/* Content sliders */}
      <div className="home-sections" style={{ paddingTop: 8 }}>
        {!loaded ? (
          <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
        ) : (
          <>
            <ContentSection Icon={ClapperboardLinear} title={lang === 'ru' ? 'Фильмы' : 'Movies'} items={movies} onSelect={onSelect} />
            <ContentSection Icon={TVLinear} title={lang === 'ru' ? 'Сериалы' : 'Series'} items={series} onSelect={onSelect} />
            <ContentSection Icon={MagicStickLinear} title={lang === 'ru' ? 'Анимация' : 'Animation'} items={animation} onSelect={onSelect} />
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Tabs ──────────────────────────────────────────────────────────── */
const MAIN_TABS = [
  { id: 'trending',   labelRu: 'Trending',           labelEn: 'Trending',        icon: FlameLinear        },
  { id: 'nowplaying', labelRu: 'Now Playing',         labelEn: 'Now Playing',     icon: PlayLinear         },
  { id: 'comingsoon', labelRu: 'Coming Soon',         labelEn: 'Coming Soon',     icon: CalendarDateLinear },
  { id: 'popular',    labelRu: 'Popular',             labelEn: 'Popular',         icon: CupFirstLinear     },
  { id: 'new',        labelRu: `New ${CURRENT_YEAR}`, labelEn: `New ${CURRENT_YEAR}`, icon: MagicStickLinear },
  { id: 'lists',      labelRu: 'Popular Lists',       labelEn: 'Popular Lists',   icon: CupLinear       },
  { id: 'seasonal',   labelRu: null,                  labelEn: null,              icon: null               },
];

/* ─── Home Page ──────────────────────────────────────────────────────────── */
export default function Home() {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [animData, setAnimData] = useState({ trending: [], nowplaying: [], popular: [], new: [] });

  const { selected, openMovie, closeMovie } = useMovieModal();
  const navigate = useNavigate();
  const { lang } = useTheme();
  const { overrides } = useAdmin();
  const langCode    = TMDB_LANG_MAP[lang] || 'en-US';
  const currentYear = new Date().getFullYear();
  const season      = getCurrentSeason(overrides.season);
  const seasonCfg   = SEASON_CONFIG[season];
  const SeasonIcon  = SEASON_ICONS[season] || MagicStickLinear;
  const seasonLabel = SEASON_LABEL[season]?.[lang] || season;
  const seasonColors = SEASON_COLORS[season];

  useEffect(() => {
    const cached = getHomeCache(lang);
    if (cached) { setAllData(cached); setLoading(false); }
    else setLoading(true);

    const JUNK   = new Set([10764, 10767, 10763, 10766, 10768]);
    const isQM   = m => m.poster_path && (m.vote_count||0)>=300 && (m.vote_average||0)>=5.5 && !(m.genre_ids||[]).some(g=>JUNK.has(g)) && (!m.release_date || m.release_date>='1990-01-01');
    const isQTV  = m => m.poster_path && (m.vote_count||0)>=100 && (m.vote_average||0)>=5.5 && !(m.genre_ids||[]).some(g=>JUNK.has(g)) && (!m.first_air_date || m.first_air_date>='1990-01-01');

    Promise.all([
      tmdb.trending('all','week'),
      tmdb.trending('movie','week'),
      tmdb.trending('tv','week'),
      tmdb.popular('movie',2),
      tmdb.popular('tv',2),
      tmdb.nowPlaying(2),
      tmdb.upcoming(2),
      tmdb.discover('movie',{primary_release_year:currentYear,sort_by:'popularity.desc','vote_count.gte':50},2),
      tmdb.discover('tv',   {first_air_date_year:currentYear, sort_by:'popularity.desc','vote_count.gte':20},2),
    ]).then(([tAll,tM,tTV,popM,popTV,nowP,upcom,newM,newTV])=>{
      const today = new Date().toISOString().split('T')[0];
      const data = {
        heroItems:       (tAll.results  ||[]).slice(0,10),
        trendingMovies:  (tM.results    ||[]).filter(m=>m.poster_path).slice(0,30),
        trendingSeries:  (tTV.results   ||[]).filter(m=>m.poster_path).map(m=>({...m,media_type:'tv'})).slice(0,30),
        popularMovies:   (popM.results  ||[]).filter(isQM).slice(0,40),
        popularSeries:   (popTV.results ||[]).filter(isQTV).map(m=>({...m,media_type:'tv'})).slice(0,40),
        nowPlayingMovies:(nowP.results  ||[]).filter(m=>m.poster_path).slice(0,30),
        nowPlayingSeries:(popTV.results ||[]).filter(isQTV).map(m=>({...m,media_type:'tv'})).slice(0,20),
        comingSoon:(upcom.results||[]).filter(m=>m.release_date&&m.release_date>today&&m.poster_path).sort((a,b)=>a.release_date.localeCompare(b.release_date)).slice(0,50),
        newMovies: (newM.results  ||[]).filter(m=>m.poster_path&&(m.vote_count||0)>=30).slice(0,30),
        newSeries: (newTV.results ||[]).filter(m=>m.poster_path&&!(m.genre_ids||[]).some(g=>JUNK.has(g))).map(m=>({...m,media_type:'tv'})).slice(0,30),
      };
      setAllData(data);
      setHomeCache(lang,data);
      setLoading(false);
    }).catch(()=>setLoading(false));

    Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?language=${langCode}`,{headers:HEADERS}).then(r=>r.json()),
      fetch(`https://api.themoviedb.org/3/movie/now_playing?language=${langCode}&page=1`,{headers:HEADERS}).then(r=>r.json()),
      fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=16&sort_by=popularity.desc&vote_count.gte=100&page=1`,{headers:HEADERS}).then(r=>r.json()),
      fetch(`https://api.themoviedb.org/3/discover/movie?language=${langCode}&with_genres=16&primary_release_year=${currentYear}&sort_by=popularity.desc&page=1`,{headers:HEADERS}).then(r=>r.json()),
    ]).then(([tw,np,pop,ny])=>{
      const isAnim = m => m.poster_path && (m.genre_ids||[]).includes(16);
      setAnimData({
        trending:  (tw.results  ||[]).filter(isAnim).slice(0,20),
        nowplaying:(np.results  ||[]).filter(isAnim).slice(0,20),
        popular:   (pop.results ||[]).filter(m=>m.poster_path).slice(0,20),
        new:       (ny.results  ||[]).filter(m=>m.poster_path).slice(0,20),
      });
    }).catch(()=>{});
  },[lang,currentYear,langCode]);

  const handleActorClick = a => navigate(`/actor/${a.id}`,{state:{actor:a}});

  return (
    <div className="page home-page">

      {/* Hero */}
      {!loading && allData && <HeroSlider items={allData.heroItems} onSelect={openMovie}/>}
      {loading && <div className="hero hero--skeleton"><div className="skeleton" style={{width:'100%',height:'100%',borderRadius:0}}/></div>}

      {/* Main Tab Bar */}
      <div className="main-tab-bar-wrap">
        <div className="main-tab-bar">
          {MAIN_TABS.map(tab => {
            const isSeasonal = tab.id === 'seasonal';
            const isActive   = activeTab === tab.id;
            if (isSeasonal) {
              return (
                <button
                  key="seasonal"
                  className={"main-tab main-tab--seasonal" + (isActive ? ' active' : '')}
                  onClick={() => setActiveTab('seasonal')}
                  style={{ '--s-from': seasonColors.from, '--s-to': seasonColors.to, '--s-glow': seasonColors.glow }}
                >
                  <span className="main-tab__s-icon"><SeasonIcon size={13}/></span>
                  <span className="main-tab__s-text">{seasonLabel}</span>
                </button>
              );
            }
            return (
              <button
                key={tab.id}
                className={"main-tab" + (isActive ? ' active' : '')}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon && <tab.icon size={13}/>}
                <span>{lang === 'ru' ? tab.labelRu : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {activeTab === 'trending' && (
          <ThreeCatBlock
            movies={allData?.trendingMovies} series={allData?.trendingSeries}
            animation={animData.trending} onSelect={openMovie} lang={lang} loading={loading}
          />
        )}

        {activeTab === 'nowplaying' && (
          <ThreeCatBlock
            movies={allData?.nowPlayingMovies} series={allData?.nowPlayingSeries}
            animation={animData.nowplaying} onSelect={openMovie} lang={lang} loading={loading}
          />
        )}

        {activeTab === 'popular' && (
          <ThreeCatBlock
            movies={allData?.popularMovies} series={allData?.popularSeries}
            animation={animData.popular} onSelect={openMovie} lang={lang} loading={loading}
          />
        )}

        {activeTab === 'new' && (
          <ThreeCatBlock
            movies={allData?.newMovies} series={allData?.newSeries}
            animation={animData.new} onSelect={openMovie} lang={lang} loading={loading}
          />
        )}

        {activeTab === 'comingsoon' && (
          <div className="coming-soon-grid-wrap">
            {loading
              ? [1,2,3,4,5,6].map(i=><div key={i} className="skeleton cs-card-skeleton"/>)
              : allData?.comingSoon.length > 0
                ? <div className="coming-soon-grid">
                    {allData.comingSoon.map(m=><ComingSoonCard key={m.id} movie={m} onSelect={openMovie}/>)}
                  </div>
                : <div className="tab-empty">{lang==='ru'?'Нет данных':'No data'}</div>
            }
          </div>
        )}

        {activeTab === 'lists' && <PopularListsPlaceholder lang={lang}/>}

        {activeTab === 'seasonal' && (
          <SeasonalTab
            season={season} seasonCfg={seasonCfg}
            lang={lang} langCode={langCode}
            onSelect={openMovie}
          />
        )}
      </div>

      <MovieModal
        movie={selected} onClose={closeMovie}
        onActorClick={a=>handleActorClick(a)}
        onCrewClick={p=>navigate(`/person/${p.id}`,{state:{person:p}})}
        onStudioClick={s=>navigate(`/studio/${s.id}`,{state:{studio:s}})}
      />
    </div>
  );
}