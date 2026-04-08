import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { CloseCircleLinear, EyeLinear, EyeClosedLinear, BookmarkLinear, BookmarkOpenedLinear, StarLinear, ClockCircleLinear, TVLinear, VideoLibraryLinear, LinkMinimalisticLinear, MonitorLinear, PenLinear, RefreshCircleLinear, ListLinear } from 'solar-icon-set';
import { tmdb, HEADERS, STREAMING_LINKS } from '../api';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { useTranslation } from 'react-i18next';
import { useDominantColor } from '../hooks/useDominantColor';
import './MovieModal.css';

function WhereToWatch({ movieId, type, lang, title }) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState(null);
  useEffect(() => {
    if (!movieId) return;
    tmdb.watchProviders(type, movieId).then(data => {
      const results = data.results || {};
      const region = results['RU'] || results['US'] || results['GB'] || Object.values(results)[0];
      setProviders(region || null);
    }).catch(() => {});
  }, [movieId, type]);
  if (!providers) return null;
  const flatrate = providers.flatrate || [];
  const rent = (providers.rent || []).filter(r => !flatrate.find(f => f.provider_id === r.provider_id));
  const all = [...flatrate, ...rent].slice(0, 6);
  const enc = encodeURIComponent(title || '');
  const linked = all.map(p => {
    const svc = STREAMING_LINKS[p.provider_id];
    const href = svc ? svc.url + enc : null;
    return href ? { ...p, svc, href, streaming: !!flatrate.find(f => f.provider_id === p.provider_id) } : null;
  }).filter(Boolean);
  if (!linked.length) return null;
  return (
    <div className="modal__where">
      <h4>{t('modal.whereToWatch')}</h4>
      <div className="modal__where-list">
        {linked.map(p => (
          <a key={p.provider_id} className="modal__where-item" href={p.href} target="_blank" rel="noopener noreferrer">
            {p.logo_path ? <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name}/> : <span>▶</span>}
            <span className="modal__where-name">
              {p.svc?.name || p.provider_name}
              {!p.streaming && <span className="modal__where-tag">{t('modal.rent')}</span>}
            </span>
            <LinkMinimalisticLinear size={11} style={{opacity:0.4,marginLeft:'auto'}}/>
          </a>
        ))}
      </div>
    </div>
  );
}

// Inline rating row shown inside modal for watched movies
function InlineRating({ movieId, lang, getRating, rateMovie }) {
  const { t } = useTranslation();
  const current = getRating(movieId);
  const [hovered, setHovered] = useState(0);
  const COLORS = ['','#ef4444','#f97316','#fb923c','#fbbf24','#a3a3a3','#84cc16','#22c55e','#10b981','#3b82f6','#8b5cf6'];
  const display = hovered || current || 0;
  const color = COLORS[display] || 'var(--accent)';

  return (
    <div className="modal__rating-row">
      <p className="modal__rating-label">{t('modal.yourRating')}</p>
      <div className="modal__rating-stars">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button
            key={n}
            className={"modal__rating-star" + (n <= display ? " active" : "")}
            style={n <= display ? { background: color, color: n <= 4 ? '#fff' : '#000', borderColor: 'transparent' } : {}}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => rateMovie(movieId, n)}
          >
            {n}
          </button>
        ))}
      </div>
      {display > 0 && (
        <p className="modal__rating-value" style={{ color }}>{display}/10</p>
      )}
    </div>
  );
}


// ─── TV Progress Tracker ─────────────────────────────────────────────────────
// Progress formula: seasons carry most of the weight (each completed season = 1/totalSeasons of bar).
// Within the current season, episode progress adds a fractional amount inside the current season slot.
// This means jumping a season moves the bar much more than jumping an episode, which is logical.
function calcProgress(season, episode, episodesInSeason, totalSeasons) {
  const ts = Math.max(totalSeasons || 1, 1);
  const eps = episodesInSeason || null;
  const slotSize = 100 / ts;                            // % per season
  const seasonsDone = season - 1;
  const baseFromSeasons = seasonsDone * slotSize;       // fully done seasons
  // Episode fraction within current season slot
  const episodeFraction = (eps && eps > 1) ? (episode - 1) / (eps - 1) : 0;
  const withinSlot = slotSize * episodeFraction;
  return Math.min(100, Math.max(0, baseFromSeasons + withinSlot));
}

function TvProgressTracker({ id, progress, totalSeasons, lang, onChange, onClear }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [season,  setSeason]  = useState(progress?.season  || 1);
  const [episode, setEpisode] = useState(progress?.episode || 1);
  const [episodesInSeason, setEpisodesInSeason] = useState(null);
  const epCache = useRef({});

  useEffect(() => {
    if (!open) return;
    if (epCache.current[season]) {
      setEpisodesInSeason(epCache.current[season]);
      return;
    }
    setEpisodesInSeason(null);
    fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?language=en-US`, { headers: HEADERS })
      .then(r => r.json())
      .then(data => {
        const count = data.episodes?.length || null;
        if (count) epCache.current[season] = count;
        setEpisodesInSeason(count);
        if (count && episode > count) setEpisode(count);
      })
      .catch(() => setEpisodesInSeason(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, season, id]);

  const maxEpisode = episodesInSeason || 999;
  const ts = totalSeasons || 1;

  const handleOpen = () => {
    setSeason(progress?.season   || 1);
    setEpisode(progress?.episode || 1);
    setOpen(true);
  };

  const handleSave = () => {
    onChange({ season, episode, totalSeasons, episodesInSeason });
    setOpen(false);
  };

  const badgePct  = calcProgress(progress?.season || 1, progress?.episode || 1, progress?.episodesInSeason || null, ts);
  const editorPct = calcProgress(season, episode, episodesInSeason, ts);

  const isFinished = progress &&
    progress.season >= ts &&
    progress.episodesInSeason &&
    progress.episode >= progress.episodesInSeason;

  return (
    <>
      {/* ── Compact badge / start button ───────────────────────────────── */}
      <div className="tv-tracker__row">
        {progress ? (
          <div className="tv-tracker__badge" onClick={handleOpen}>
            <div className="tv-tracker__badge-left">
              <MonitorLinear size={15} className="tv-tracker__badge-icon"/>
              <div className="tv-tracker__badge-pos-wrap">
                <span className="tv-tracker__badge-pos">
                  {t('tvtracker.seasonBadge')} {progress.season}
                  {' · '}
                  {t('tvtracker.episodeBadge')} {progress.episode}
                  {progress.episodesInSeason
                    ? <span className="tv-tracker__badge-total">/{progress.episodesInSeason}</span>
                    : null}
                </span>
              </div>
              {isFinished && <span className="tv-tracker__badge-done">✓</span>}
            </div>
            <div className="tv-tracker__badge-right">
              <div className="tv-tracker__badge-pct-row">
                <span className="tv-tracker__badge-pct-val">{Math.round(badgePct)}%</span>
                <PenLinear size={11} className="tv-tracker__badge-edit"/>
              </div>
              <div className="tv-tracker__bar">
                <div className="tv-tracker__bar-fill" style={{ width: `${badgePct}%` }}/>
              </div>
              {ts > 1 && (
                <div className="tv-tracker__pips">
                  {Array.from({ length: Math.min(ts, 16) }, (_, i) => (
                    <span
                      key={i}
                      className={
                        'tv-tracker__pip' +
                        (i < (progress.season - 1) ? ' done' :
                         i === progress.season - 1  ? ' current' : '')
                      }
                    />
                  ))}
                  {ts > 16 && <span className="tv-tracker__pips-more">+{ts - 16}</span>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button className="tv-tracker__start" onClick={handleOpen}>
            <span className="tv-tracker__start-inner">
              <MonitorLinear size={14}/>
              <span>{t('tvtracker.trackProgress')}</span>
            </span>
          </button>
        )}
        {progress && (
          <button className="tv-tracker__clear" onClick={onClear} title={t('tvtracker.reset')}>
            <RefreshCircleLinear size={13}/>
          </button>
        )}
      </div>

      {/* ── Expanded editor ─────────────────────────────────────────────── */}
      {open && (
        <div className="tv-tracker__editor">
          {/* Live progress bar */}
          <div className="tv-tracker__editor-preview">
            <div className="tv-tracker__editor-bar">
              <div className="tv-tracker__editor-bar-fill" style={{ width: `${editorPct}%` }}/>
            </div>
            <span className="tv-tracker__editor-pct">{Math.round(editorPct)}%</span>
          </div>

          {/* Season + Episode controls */}
          <div className="tv-tracker__controls">
            <div className="tv-tracker__control-block">
              <span className="tv-tracker__control-label">{t('tvtracker.season')}</span>
              <div className="tv-tracker__stepper">
                <button
                  className="tv-tracker__step-btn"
                  onClick={() => setSeason(s => Math.max(1, s - 1))}
                  disabled={season <= 1}
                >−</button>
                <span className="tv-tracker__step-val">
                  {season}
                  {ts > 1 && <span className="tv-tracker__of">/{ts}</span>}
                </span>
                <button
                  className="tv-tracker__step-btn"
                  onClick={() => setSeason(s => Math.min(ts, s + 1))}
                  disabled={season >= ts}
                >+</button>
              </div>
            </div>

            <div className="tv-tracker__control-divider"/>

            <div className="tv-tracker__control-block">
              <span className="tv-tracker__control-label">{t('tvtracker.episode')}</span>
              <div className="tv-tracker__stepper">
                <button
                  className="tv-tracker__step-btn"
                  onClick={() => setEpisode(e => Math.max(1, e - 1))}
                  disabled={episode <= 1}
                >−</button>
                <span className="tv-tracker__step-val">
                  {episode}
                  {episodesInSeason
                    ? <span className="tv-tracker__of">/{episodesInSeason}</span>
                    : <span className="tv-tracker__of loading">…</span>}
                </span>
                <button
                  className="tv-tracker__step-btn"
                  onClick={() => setEpisode(e => Math.min(maxEpisode, e + 1))}
                >+</button>
              </div>
            </div>
          </div>

          <div className="tv-tracker__editor-actions">
            <button className="tv-tracker__cancel" onClick={() => setOpen(false)}>{t('tvtracker.cancel')}</button>
            <button className="tv-tracker__save" onClick={handleSave}>{t('tvtracker.save')}</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── More Menu (three dots button next to title) ──────────────────────────────────────
function MoreMenu({ movie, lang }) {
  const { t } = useTranslation();
  const { customLists, addToCustomList, removeFromCustomList, isInCustomList } = useStore();
  const [panel, setPanel] = useState('closed');

  const lists     = Object.values(customLists).sort((a, b) => b.createdAt - a.createdAt);
  const inAnyList = lists.some(l => isInCustomList(l.id, movie.id));
  const close     = () => setPanel('closed');

  return (
    <div className="modal__more" onClick={e => e.stopPropagation()}>
      <button
        className={"modal__more-btn" + (inAnyList ? ' in-list' : '')}
        onClick={e => { e.stopPropagation(); setPanel(v => v === 'closed' ? 'main' : 'closed'); }}
        aria-label="More options"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3"  r="1.5"/>
          <circle cx="8" cy="8"  r="1.5"/>
          <circle cx="8" cy="13" r="1.5"/>
        </svg>
      </button>

      {panel !== 'closed' && (
        <>
          <div className="modal__more-backdrop" onClick={close}/>
          <div className="modal__more-panel" onClick={e => e.stopPropagation()}>

            {panel === 'main' && (
              <button
                className={"modal__more-item" + (inAnyList ? ' accent' : '')}
                onClick={() => setPanel('lists')}
              >
                <ListLinear size={15}/>
                <span>{t('tvtracker.addToList')}</span>
                {inAnyList && <span className="modal__more-dot"/>}
              </button>
            )}

            {panel === 'lists' && (
              <>
                <div className="modal__more-lists-header">
                  <button className="modal__more-back" onClick={() => setPanel('main')}>
                    {String.fromCharCode(8249)} {t('tvtracker.back')}
                  </button>
                  <span>{t('tvtracker.addToListFull')}</span>
                </div>
                {lists.length === 0 && (
                  <p className="modal__more-empty">
                    {t('tvtracker.noLists')}
                  </p>
                )}
                {lists.map(list => {
                  const inList = isInCustomList(list.id, movie.id);
                  return (
                    <button key={list.id}
                      className={"modal__more-item" + (inList ? ' accent' : '')}
                      onClick={() => { inList ? removeFromCustomList(list.id, movie.id) : addToCustomList(list.id, movie); close(); }}
                    >
                      <ListLinear size={14}/>
                      <span className="modal__more-item-name">{list.name}</span>
                      <span className="modal__more-item-count">{list.items?.length ?? 0}</span>
                      {inList && <span className="modal__more-check">✓</span>}
                    </button>
                  );
                })}
              </>
            )}

          </div>
        </>
      )}
    </div>
  );
}

// ─── Scrollable People Block (cast & crew) ───────────────────────────────────
function ScrollablePeopleBlock({ title, items, onItemClick }) {
  const listRef = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, items]);

  const scroll = (dir) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;
  return (
    <div className="modal__people-block">
      <div className="modal__people-header">
        <h4>{title}</h4>
        <div className="modal__people-arrows">
          <button
            className={"modal__people-arrow" + (canScrollLeft ? '' : ' disabled')}
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className={"modal__people-arrow" + (canScrollRight ? '' : ' disabled')}
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            disabled={!canScrollRight}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="modal__people-list" ref={listRef}>
        {items.map(item => (
          <div
            key={item.id}
            className={"modal__people-card" + (onItemClick ? ' modal__people-card--clickable' : '')}
            onClick={() => onItemClick?.(item)}
          >
            <div className="modal__people-photo">
              {item.profile_path
                ? <img src={`https://image.tmdb.org/t/p/w185${item.profile_path}`} alt={item.name}/>
                : <span className="modal__people-initials">{item.name?.[0] ?? '?'}</span>}
            </div>
            <div className="modal__people-info">
              <span className="modal__people-name">{item.name}</span>
              {item.sub && (
                <span className="modal__people-role" title={item.sub}>{item.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MovieModal = memo(function MovieModal({ movie, onClose, onActorClick }) {
  const [details, setDetails]         = useState(null);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const { isWatched, isInWatchlist, addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist, getRating, rateMovie, setTvProgressEntry, getTvProgress, clearTvProgress } = useStore();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const watched  = movie ? isWatched(movie.id)     : false;
  const inList   = movie ? isInWatchlist(movie.id) : false;
  const type     = movie?.media_type || (movie?.title ? 'movie' : 'tv');
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';
  const posterUrl = tmdb.posterUrl(movie?.poster_path, 'w342');
  const accentColor = useDominantColor(posterUrl);

  useEffect(() => {
    document.body.classList.toggle('modal-open', !!movie);
    return () => document.body.classList.remove('modal-open');
  }, [movie]);

  useEffect(() => {
    if (!movie) { setDetails(null); return; }
    setDetails(null);
    const fetcher = type === 'tv' ? tmdb.tvDetails : tmdb.movieDetails;
    fetcher(movie.id).then(setDetails).catch(() => {});
  }, [movie, type, langCode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!movie) return null;

  const title    = details?.title    || details?.name   || movie.title || movie.name || '';
  const overview = details?.overview || movie.overview  || '';
  const year     = (details?.release_date || details?.first_air_date || movie.release_date || movie.first_air_date || '').slice(0,4);
  const backdrop = tmdb.backdropUrl(details?.backdrop_path || movie.backdrop_path);
  const poster   = tmdb.posterUrl(details?.poster_path || movie.poster_path, 'w780');
  const rating   = (details?.vote_average || movie.vote_average)?.toFixed(1);
  const genres   = details?.genres?.slice(0,3).map(g => g.name) || [];
  const runtime  = details?.runtime ? `${Math.floor(details.runtime/60)}${t('modal.hours')} ${details.runtime%60}${t('modal.minutes')}` : null;
  const seasons  = details?.number_of_seasons;
  const cast     = details?.credits?.cast || [];
  const crew     = details?.credits?.crew || [];
  const progress = movie ? getTvProgress(movie.id) : null;
  const totalSeasons  = details?.number_of_seasons  || 1;

  const handleMarkWatched = () => {
    if (watched) {
      removeFromWatched(movie.id);
    } else {
      addToWatched({ ...movie, media_type: type });
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal"
          onClick={e => e.stopPropagation()}
          style={accentColor ? {
            '--modal-accent': `rgb(${accentColor})`,
            '--modal-accent-border': `rgba(${accentColor}, 0.35)`,
          } : {}}
        >
          {accentColor && <div className="modal__accent-border" style={{background: `rgb(${accentColor})`}}/>}

          <div className="modal__backdrop">
            {(backdrop || poster) && <img src={backdrop || poster} alt="" className="modal__backdrop-img"/>}
            <div className="modal__backdrop-fade"/>
            <button className="modal__close" onClick={e => { e.stopPropagation(); onClose(); }}>
              <CloseCircleLinear size={16} strokeWidth={2.5}/>
            </button>
          </div>

          <div className="modal__poster-wrap">
            {poster && <img className="modal__poster" src={poster} alt={title}/>}
            <div className="modal__title-block">
              <div className="modal__title-row">
                <h2 className="modal__title">{title}</h2>
                <MoreMenu movie={movie} lang={lang}/>
              </div>
              <div className="modal__sub">
                {year    && <span>{year}</span>}
                {rating  && <span><StarLinear size={11} fill="currentColor"/>{rating}</span>}
                {runtime && <span><ClockCircleLinear size={11}/>{runtime}</span>}
                {seasons && <span><TVLinear size={11}/>{seasons} {t('modal.seasons')}</span>}
                <span className="modal__type-badge">
                  {type==='tv' ? <><TVLinear size={10}/>{t('modal.series')}</> : <><VideoLibraryLinear size={10}/>{t('modal.movie')}</>}
                </span>
              </div>
              {genres.length > 0 && <div className="modal__genres">{genres.map(g=><span key={g} className="modal__genre">{g}</span>)}</div>}
            </div>
          </div>

          <div className="modal__content">
            {overview && (
              <div className="modal__overview-wrap">
                <p className={"modal__overview" + (overviewExpanded ? ' expanded' : '')}>
                  {overview}
                </p>
                {overview.length > 180 && (
                  <button className="modal__overview-toggle" onClick={() => setOverviewExpanded(v => !v)}>
                    {overviewExpanded ? t('modal.showLess') : t('modal.readMore')}
                  </button>
                )}
              </div>
            )}

            {watched && (
              <InlineRating movieId={movie.id} lang={lang} getRating={getRating} rateMovie={rateMovie}/>
            )}

            {type === 'tv' && inList && (
              <TvProgressTracker
                id={movie.id}
                progress={progress}
                totalSeasons={totalSeasons}
                lang={lang}
                onChange={(data) => setTvProgressEntry(movie.id, data)}
                onClear={() => clearTvProgress(movie.id)}
              />
            )}

            <WhereToWatch movieId={movie.id} type={type} lang={lang} title={title}/>

            {cast.length > 0 && (
              <ScrollablePeopleBlock
                title={t('modal.cast')}
                items={cast.map(c => ({
                  id: c.id,
                  name: c.name,
                  profile_path: c.profile_path,
                  sub: c.character,
                }))}
                onItemClick={(item) => onActorClick?.({ id: item.id, name: item.name, profile_path: item.profile_path })}
              />
            )}

            {crew.length > 0 && (
              <ScrollablePeopleBlock
                title={t('modal.crew')}
                items={(() => {
                  const ALWAYS_SHOW_JOBS = new Set(['Director', 'Co-Director']);
                  const KEY_WRITING_JOBS = new Set(['Screenplay', 'Writer', 'Story', 'Script', 'Original Story', 'Teleplay', 'Creator']);
                  const KEY_PRODUCING_JOBS = new Set(['Producer', 'Executive Producer']);

                  const seen = new Map();
                  crew.forEach(c => {
                    if (seen.has(c.id)) {
                      const existing = seen.get(c.id);
                      if (!existing.jobs.includes(c.job)) existing.jobs.push(c.job);
                      if (!existing.profile_path && c.profile_path) existing.profile_path = c.profile_path;
                    } else {
                      seen.set(c.id, { id: c.id, name: c.name, profile_path: c.profile_path, jobs: [c.job], department: c.department });
                    }
                  });

                  const allPeople = Array.from(seen.values()).map(p => ({ ...p, sub: p.jobs.join(', ') }));
                  const writerCount   = allPeople.filter(p => p.jobs.some(j => KEY_WRITING_JOBS.has(j))).length;
                  const producerCount = allPeople.filter(p => p.jobs.some(j => KEY_PRODUCING_JOBS.has(j))).length;

                  const deptOrder = { Directing:0, Writing:1, Production:2, 'Visual Effects':3, Sound:4, Camera:5, Editing:6, Art:7, 'Costume & Make-Up':8 };

                  const filtered = allPeople.filter(p => {
                    if (p.profile_path) return true;
                    if (p.jobs.some(j => ALWAYS_SHOW_JOBS.has(j))) return true;
                    if (p.jobs.some(j => KEY_WRITING_JOBS.has(j)) && writerCount <= 2) return true;
                    if (p.jobs.some(j => KEY_PRODUCING_JOBS.has(j)) && producerCount <= 2) return true;
                    return false;
                  });

                  const jobPriority = (p) => {
                    if (p.jobs.some(j => ALWAYS_SHOW_JOBS.has(j))) return 0;
                    if (p.jobs.some(j => KEY_WRITING_JOBS.has(j))) return 1;
                    if (p.jobs.some(j => KEY_PRODUCING_JOBS.has(j))) return 2;
                    return 3;
                  };

                  return filtered.sort((a, b) => {
                    const jp = jobPriority(a) - jobPriority(b);
                    if (jp !== 0) return jp;
                    return (deptOrder[a.department] ?? 99) - (deptOrder[b.department] ?? 99);
                  });
                })()}
                onItemClick={null}
              />
            )}

            <div className="modal__actions">
              <button className={"modal__action-btn"+(watched?" active-green":"")} onClick={handleMarkWatched}>
                {watched ? <><EyeClosedLinear size={15}/>{t('modal.watched')}</> : <><EyeLinear size={15}/>{t('modal.markWatched')}</>}
              </button>
              <button className={"modal__action-btn secondary"+(inList&&!watched?" active-yellow":"")}
                onClick={() => inList ? removeFromWatchlist(movie.id) : addToWatchlist({...movie,media_type:type})}
                disabled={watched}>
                {inList&&!watched ? <><BookmarkOpenedLinear size={15}/>{t('modal.inList')}</> : <><BookmarkLinear size={15}/>{t('modal.watchlist')}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
export default MovieModal;