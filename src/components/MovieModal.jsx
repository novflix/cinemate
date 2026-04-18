import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloseCircleLinear, EyeLinear, EyeClosedLinear, BookmarkLinear, BookmarkOpenedLinear,
  StarLinear, ClockCircleLinear, TVLinear, VideoLibraryLinear, LinkMinimalisticLinear,
  MonitorLinear, PenLinear, RefreshCircleLinear, ListLinear, PlayLinear, CheckCircleLinear,
  InfinityLinear, InfoCircleLinear, AltArrowDownLinear, CalendarLinear, GlobalLinear,
  BuildingsLinear, DollarMinimalisticLinear, FlagLinear, LayersMinimalisticLinear,
} from 'solar-icon-set';
import { tmdb, HEADERS, STREAMING_LINKS } from '../api';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { useTranslation } from 'react-i18next';
import { useDominantColor } from '../hooks/useDominantColor';
import './MovieModal.css';

/* ─── Where To Watch ──────────────────────────────────────────────────────── */
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
    <div className="mm-section">
      <div className="mm-section__label">
        <PlayLinear size={11} />
        {t('modal.whereToWatch')}
      </div>
      <div className="mm-watch-list">
        {linked.map(p => (
          <a key={p.provider_id} className="mm-watch-item" href={p.href} target="_blank" rel="noopener noreferrer">
            {p.logo_path
              ? <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} />
              : <span className="mm-watch-fallback"><PlayLinear size={14} /></span>}
            <span className="mm-watch-name">{p.svc?.name || p.provider_name}</span>
            {!p.streaming && <span className="mm-watch-tag">{t('modal.rent')}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Inline Rating ───────────────────────────────────────────────────────── */
function InlineRating({ movieId, getRating, rateMovie }) {
  const { t } = useTranslation();
  const current = getRating(movieId);
  const [hovered, setHovered] = useState(0);
  const COLORS = ['', '#ef4444', '#f97316', '#fb923c', '#fbbf24', '#a3a3a3', '#84cc16', '#22c55e', '#10b981', '#3b82f6', '#8b5cf6'];
  const display = hovered || current || 0;
  const color = COLORS[display] || 'var(--accent)';

  return (
    <div className="mm-section">
      <div className="mm-rating-header">
        <div className="mm-section__label">
          <StarLinear size={11} />
          {t('modal.yourRating')}
        </div>
        {display > 0 && (
          <span className="mm-rating-score" style={{ color }}>{display}<span>/10</span></span>
        )}
      </div>
      <div className="mm-rating-stars">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button
            key={n}
            className={'mm-rating-star' + (n <= display ? ' active' : '')}
            style={n <= display ? { background: color, color: n <= 4 ? '#fff' : '#000', borderColor: 'transparent' } : {}}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => rateMovie(movieId, n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── TV Progress Tracker ─────────────────────────────────────────────────── */
function calcProgress(season, episode, episodesInSeason, totalSeasons) {
  const ts = Math.max(totalSeasons || 1, 1);
  const eps = episodesInSeason || null;
  const slotSize = 100 / ts;
  const seasonsDone = season - 1;
  const baseFromSeasons = seasonsDone * slotSize;
  const episodeFraction = (eps && eps > 1) ? (episode - 1) / (eps - 1) : 0;
  const withinSlot = slotSize * episodeFraction;
  return Math.min(100, Math.max(0, baseFromSeasons + withinSlot));
}

function TvProgressTracker({ id, progress, totalSeasons, onChange, onClear }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [season, setSeason] = useState(progress?.season || 1);
  const [episode, setEpisode] = useState(progress?.episode || 1);
  const [episodesInSeason, setEpisodesInSeason] = useState(null);
  const epCache = useRef({});

  useEffect(() => {
    if (!open) return;
    if (epCache.current[season]) { setEpisodesInSeason(epCache.current[season]); return; }
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
    setSeason(progress?.season || 1);
    setEpisode(progress?.episode || 1);
    setOpen(true);
  };

  const handleSave = () => {
    onChange({ season, episode, totalSeasons, episodesInSeason });
    setOpen(false);
  };

  const badgePct = calcProgress(progress?.season || 1, progress?.episode || 1, progress?.episodesInSeason || null, ts);
  const editorPct = calcProgress(season, episode, episodesInSeason, ts);

  const isFinished = progress &&
    progress.season >= ts &&
    progress.episodesInSeason &&
    progress.episode >= progress.episodesInSeason;

  return (
    <div className="mm-section">
      <div className="mm-section__label">
        <MonitorLinear size={11} />
        {t('tvtracker.trackProgress')}
      </div>

      <div className="mm-tracker-row">
        {progress ? (
          <button className="mm-tracker-badge" onClick={handleOpen}>
            <div className="mm-tracker-badge__info">
              <span className="mm-tracker-badge__pos">
                S{progress.season} · E{progress.episode}
                {progress.episodesInSeason && <span className="mm-tracker-badge__of">/{progress.episodesInSeason}</span>}
              </span>
              {isFinished && (
                <span className="mm-tracker-badge__done">
                  <CheckCircleLinear size={11} /> {t('tvtracker.finished') || 'Done'}
                </span>
              )}
            </div>
            <div className="mm-tracker-badge__right">
              <div className="mm-tracker-bar">
                <div className="mm-tracker-bar__fill" style={{ width: `${badgePct}%` }} />
              </div>
              <div className="mm-tracker-badge__meta">
                <span className="mm-tracker-badge__pct">{Math.round(badgePct)}%</span>
                {ts > 1 && (
                  <div className="mm-tracker-pips">
                    {Array.from({ length: Math.min(ts, 20) }, (_, i) => (
                      <span
                        key={i}
                        className={
                          'mm-tracker-pip' +
                          (i < (progress.season - 1) ? ' done' :
                            i === progress.season - 1 ? ' current' : '')
                        }
                      />
                    ))}
                    {ts > 20 && <span className="mm-tracker-pips-more">+{ts - 20}</span>}
                  </div>
                )}
              </div>
              <PenLinear size={11} className="mm-tracker-badge__edit" />
            </div>
          </button>
        ) : (
          <button className="mm-tracker-start" onClick={handleOpen}>
            <MonitorLinear size={14} />
            <span>{t('tvtracker.trackProgress')}</span>
          </button>
        )}
        {progress && (
          <button className="mm-tracker-clear" onClick={onClear} title={t('tvtracker.reset')}>
            <RefreshCircleLinear size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="mm-tracker-editor">
          <div className="mm-tracker-editor__bar-row">
            <div className="mm-tracker-editor__bar">
              <div className="mm-tracker-editor__bar-fill" style={{ width: `${editorPct}%` }} />
            </div>
            <span className="mm-tracker-editor__pct">{Math.round(editorPct)}%</span>
          </div>
          <div className="mm-tracker-controls">
            <div className="mm-tracker-control">
              <span className="mm-tracker-control__label">{t('tvtracker.season')}</span>
              <div className="mm-tracker-stepper">
                <button onClick={() => setSeason(s => Math.max(1, s - 1))} disabled={season <= 1}>−</button>
                <span className="mm-tracker-stepper__val">
                  {season}
                  {ts > 1 && <small>/{ts}</small>}
                </span>
                <button onClick={() => setSeason(s => Math.min(ts, s + 1))} disabled={season >= ts}>+</button>
              </div>
            </div>
            <div className="mm-tracker-divider" />
            <div className="mm-tracker-control">
              <span className="mm-tracker-control__label">{t('tvtracker.episode')}</span>
              <div className="mm-tracker-stepper">
                <button onClick={() => setEpisode(e => Math.max(1, e - 1))} disabled={episode <= 1}>−</button>
                <span className="mm-tracker-stepper__val">
                  {episode}
                  {episodesInSeason
                    ? <small>/{episodesInSeason}</small>
                    : <small className="loading">…</small>}
                </span>
                <button onClick={() => setEpisode(e => Math.min(maxEpisode, e + 1))}>+</button>
              </div>
            </div>
          </div>
          <div className="mm-tracker-editor__actions">
            <button className="mm-tracker-editor__cancel" onClick={() => setOpen(false)}>{t('tvtracker.cancel')}</button>
            <button className="mm-tracker-editor__save" onClick={handleSave}>{t('tvtracker.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── More Menu ───────────────────────────────────────────────────────────── */
function MoreMenu({ movie }) {
  const { t } = useTranslation();
  const { customLists, addToCustomList, removeFromCustomList, isInCustomList } = useStore();
  const [panel, setPanel] = useState('closed');

  const lists = Object.values(customLists).sort((a, b) => b.createdAt - a.createdAt);
  const inAnyList = lists.some(l => isInCustomList(l.id, movie.id));
  const close = () => setPanel('closed');

  return (
    <div className="mm-more" onClick={e => e.stopPropagation()}>
      <button
        className={'mm-more__btn' + (inAnyList ? ' active' : '')}
        onClick={e => { e.stopPropagation(); setPanel(v => v === 'closed' ? 'main' : 'closed'); }}
        aria-label="More options"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
        {inAnyList && <span className="mm-more__dot" />}
      </button>

      {panel !== 'closed' && (
        <>
          <div className="mm-more__backdrop" onClick={close} />
          <div className="mm-more__panel" onClick={e => e.stopPropagation()}>
            {panel === 'main' && (
              <button className={'mm-more__item' + (inAnyList ? ' accent' : '')} onClick={() => setPanel('lists')}>
                <ListLinear size={15} />
                <span>{t('tvtracker.addToList')}</span>
                {inAnyList && <CheckCircleLinear size={13} className="mm-more__check" />}
              </button>
            )}
            {panel === 'lists' && (
              <>
                <div className="mm-more__lists-header">
                  <button className="mm-more__back" onClick={() => setPanel('main')}>‹ {t('tvtracker.back')}</button>
                  <span>{t('tvtracker.addToListFull')}</span>
                </div>
                {lists.length === 0 && (
                  <p className="mm-more__empty">{t('tvtracker.noLists')}</p>
                )}
                {lists.map(list => {
                  const inList = isInCustomList(list.id, movie.id);
                  return (
                    <button
                      key={list.id}
                      className={'mm-more__item' + (inList ? ' accent' : '')}
                      onClick={() => { inList ? removeFromCustomList(list.id, movie.id) : addToCustomList(list.id, movie); close(); }}
                    >
                      <ListLinear size={14} />
                      <span className="mm-more__item-name">{list.name}</span>
                      <span className="mm-more__item-count">{list.items?.length ?? 0}</span>
                      {inList && <CheckCircleLinear size={13} className="mm-more__check" />}
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

/* ─── Scrollable People Block ─────────────────────────────────────────────── */
function ScrollablePeopleBlock({ title, items, onItemClick }) {
  const listRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
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
    <div className="mm-people">
      <div className="mm-people__header">
        <span className="mm-section__label" style={{ marginBottom: 0 }}>{title}</span>
        <div className="mm-people__arrows">
          <button className={'mm-people__arrow' + (canScrollLeft ? '' : ' disabled')} onClick={() => scroll(-1)} disabled={!canScrollLeft}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className={'mm-people__arrow' + (canScrollRight ? '' : ' disabled')} onClick={() => scroll(1)} disabled={!canScrollRight}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
      <div className="mm-people__list" ref={listRef}>
        {items.map(item => (
          <div
            key={item.id}
            className={'mm-people__card' + (onItemClick ? ' clickable' : '')}
            onClick={() => onItemClick?.(item)}
          >
            <div className="mm-people__photo">
              {item.profile_path
                ? <img src={`https://image.tmdb.org/t/p/w185${item.profile_path}`} alt={item.name} />
                : <span className="mm-people__initial">{item.name?.[0] ?? '?'}</span>}
            </div>
            <span className="mm-people__name">{item.name}</span>
            {item.sub && <span className="mm-people__role" title={item.sub}>{item.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Movie Details Panel ─────────────────────────────────────────────────── */
function MovieDetailsPanel({ details, type, t, onStudioClick }) {
  const [open, setOpen] = useState(false);

  const budget = details?.budget;
  const revenue = details?.revenue;
  const tagline = details?.tagline;
  const status = details?.status;
  const originalTitle = details?.original_title || details?.original_name;
  const originalLang = details?.original_language;
  const homepage = details?.homepage;
  const studios = (details?.production_companies || []).slice(0, 4);
  const countries = (details?.production_countries || []).map(c => c.name);
  const languages = (details?.spoken_languages || []).map(l => l.english_name || l.name);
  const releaseDate = details?.release_date || details?.first_air_date;
  const networks = (details?.networks || []).slice(0, 3);
  const episodeRuntime = details?.episode_run_time?.[0];
  const totalEpisodes = details?.number_of_episodes;
  const inProduction = details?.in_production;

  const formatMoney = (n) => {
    if (!n || n === 0) return null;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  const LANG_NAMES = { en: 'English', ru: 'Russian', fr: 'French', de: 'German', es: 'Spanish', it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', pt: 'Portuguese', hi: 'Hindi', ar: 'Arabic', nl: 'Dutch', tr: 'Turkish', pl: 'Polish', sv: 'Swedish' };

  const hasContent = tagline || status || originalTitle || budget || revenue || studios.length || countries.length || homepage || networks.length || episodeRuntime || totalEpisodes;
  if (!hasContent || !details) return null;

  return (
    <div className="mm-details">
      <button className={'mm-details__toggle' + (open ? ' open' : '')} onClick={() => setOpen(v => !v)}>
        <span className="mm-details__toggle-left">
          <InfoCircleLinear size={13} />
          <span>{t('modal.moreDetails')}</span>
        </span>
        <AltArrowDownLinear size={14} className="mm-details__chevron" />
      </button>

      <div className={'mm-details__panel' + (open ? ' open' : '')}>
        <div className="mm-details__inner">

          {tagline && (
            <div className="mm-details__tagline">
              &ldquo;{tagline}&rdquo;
            </div>
          )}

          <div className="mm-details__grid">
            {status && (
              <div className="mm-details__item">
                <span className="mm-details__label"><LayersMinimalisticLinear size={11} />{t('modal.status')}</span>
                <span className={'mm-details__value' + (inProduction ? ' inprod' : '')}>{status}</span>
              </div>
            )}
            {releaseDate && (
              <div className="mm-details__item">
                <span className="mm-details__label"><CalendarLinear size={11} />{t('modal.releaseDate')}</span>
                <span className="mm-details__value">{new Date(releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            {originalTitle && originalTitle !== details?.title && originalTitle !== details?.name && (
              <div className="mm-details__item">
                <span className="mm-details__label"><FlagLinear size={11} />{t('modal.originalTitle')}</span>
                <span className="mm-details__value">{originalTitle}</span>
              </div>
            )}
            {originalLang && (
              <div className="mm-details__item">
                <span className="mm-details__label"><GlobalLinear size={11} />{t('modal.originalLanguage')}</span>
                <span className="mm-details__value">{LANG_NAMES[originalLang] || originalLang?.toUpperCase()}</span>
              </div>
            )}
            {type === 'tv' && episodeRuntime && (
              <div className="mm-details__item">
                <span className="mm-details__label"><ClockCircleLinear size={11} />{t('modal.episodeRuntime')}</span>
                <span className="mm-details__value">{episodeRuntime} {t('modal.minutesShort')}</span>
              </div>
            )}
            {type === 'tv' && totalEpisodes && (
              <div className="mm-details__item">
                <span className="mm-details__label"><TVLinear size={11} />{t('modal.totalEpisodes')}</span>
                <span className="mm-details__value">{totalEpisodes}</span>
              </div>
            )}
            {formatMoney(budget) && (
              <div className="mm-details__item">
                <span className="mm-details__label"><DollarMinimalisticLinear size={11} />{t('modal.budget')}</span>
                <span className="mm-details__value">{formatMoney(budget)}</span>
              </div>
            )}
            {formatMoney(revenue) && (
              <div className="mm-details__item">
                <span className="mm-details__label"><DollarMinimalisticLinear size={11} />{t('modal.revenue')}</span>
                <span className={'mm-details__value' + (revenue > budget && budget > 0 ? ' profit' : '')}>{formatMoney(revenue)}</span>
              </div>
            )}
            {details?.vote_count > 0 && (
              <div className="mm-details__item">
                <span className="mm-details__label"><StarLinear size={11} />{t('modal.voteCount')}</span>
                <span className="mm-details__value">{details.vote_count.toLocaleString()} {t('modal.votes')}</span>
              </div>
            )}
            {countries.length > 0 && (
              <div className="mm-details__item mm-details__item--wide">
                <span className="mm-details__label"><GlobalLinear size={11} />{t('modal.countries')}</span>
                <span className="mm-details__value">{countries.join(', ')}</span>
              </div>
            )}
            {languages.length > 0 && (
              <div className="mm-details__item mm-details__item--wide">
                <span className="mm-details__label"><GlobalLinear size={11} />{t('modal.languages')}</span>
                <span className="mm-details__value">{languages.join(', ')}</span>
              </div>
            )}
          </div>

          {(studios.length > 0 || networks.length > 0) && (
            <div className="mm-details__studios-section">
              <span className="mm-details__section-label">
                <BuildingsLinear size={11} />
                {type === 'tv' ? t('modal.networksStudios') : t('modal.production')}
              </span>
              <div className="mm-details__studios">
                {[...networks.map(n => ({ ...n, _entityType: 'network' })),
                  ...studios.map(s => ({ ...s, _entityType: 'company' }))].slice(0, 5).map(s => (
                    <div
                      key={s.id}
                      className={'mm-details__studio' + (onStudioClick ? ' clickable' : '')}
                      onClick={() => onStudioClick && onStudioClick({ id: s.id, name: s.name, entityType: s._entityType, logo: s.logo_path ? `https://image.tmdb.org/t/p/w300${s.logo_path}` : null })}
                      title={s.name}
                    >
                      {s.logo_path
                        ? <img src={`https://image.tmdb.org/t/p/w300${s.logo_path}`} alt={s.name} className="mm-details__studio-logo" />
                        : <span className="mm-details__studio-name">{s.name}</span>}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {homepage && (
            <a href={homepage} target="_blank" rel="noopener noreferrer" className="mm-details__homepage">
              <GlobalLinear size={12} />
              <span>{t('modal.officialSite')}</span>
              <LinkMinimalisticLinear size={10} style={{ opacity: 0.5, marginLeft: 'auto' }} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Modal ──────────────────────────────────────────────────────────── */
const MovieModal = memo(function MovieModal({ movie, onClose, onActorClick, onCrewClick, onStudioClick }) {
  const [details, setDetails] = useState(null);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const {
    isWatched, isInWatchlist, addToWatched, addToWatchlist,
    removeFromWatched, removeFromWatchlist, getRating, rateMovie,
    setTvProgressEntry, getTvProgress, clearTvProgress,
  } = useStore();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const watched = movie ? isWatched(movie.id) : false;
  const inList = movie ? isInWatchlist(movie.id) : false;
  const type = movie?.media_type || (movie?.title ? 'movie' : 'tv');
  const TMDB_LANG_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
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

  const title = details?.title || details?.name || movie.title || movie.name || '';
  const overview = details?.overview || movie.overview || '';
  const year = (details?.release_date || details?.first_air_date || movie.release_date || movie.first_air_date || '').slice(0, 4);
  const backdrop = tmdb.backdropUrl(details?.backdrop_path || movie.backdrop_path);
  const poster = tmdb.posterUrl(details?.poster_path || movie.poster_path, 'w780');
  const rating = (details?.vote_average || movie.vote_average)?.toFixed(1);
  const genres = details?.genres?.slice(0, 4).map(g => g.name) || [];
  const runtime = details?.runtime
    ? `${Math.floor(details.runtime / 60)}${t('modal.hours')} ${details.runtime % 60}${t('modal.minutes')}`
    : null;
  const seasons = details?.number_of_seasons;
  const certification = (() => {
    if (type === 'movie') {
      const results = details?.release_dates?.results || [];
      const us = results.find(r => r.iso_3166_1 === 'US');
      const cert = us?.release_dates?.find(d => d.certification)?.certification;
      if (cert) return cert;
      for (const r of results) {
        const c = r.release_dates?.find(d => d.certification)?.certification;
        if (c) return c;
      }
    } else {
      const results = details?.content_ratings?.results || [];
      const us = results.find(r => r.iso_3166_1 === 'US');
      if (us?.rating) return us.rating;
      const first = results.find(r => r.rating);
      if (first?.rating) return first.rating;
    }
    return null;
  })();

  const cast = details?.credits?.cast || [];
  const crew = details?.credits?.crew || [];
  const progress = movie ? getTvProgress(movie.id) : null;
  const totalSeasons = details?.number_of_seasons || 1;

  const handleMarkWatched = () => {
    if (watched) removeFromWatched(movie.id);
    else addToWatched({ ...movie, media_type: type });
  };

  const handleWatchlist = () => {
    if (inList) removeFromWatchlist(movie.id);
    else addToWatchlist({ ...movie, media_type: type });
  };

  const accentStyle = accentColor ? {
    '--mm-accent': `rgb(${accentColor})`,
    '--mm-accent-rgb': accentColor,
  } : {};

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm" onClick={e => e.stopPropagation()} style={accentStyle}>

        {/* ── Accent border top ── */}
        {accentColor && <div className="mm__accent-line" />}

        {/* ── Hero ── */}
        <div className="mm__hero">
          <div className="mm__backdrop">
            {(backdrop || poster) && (
              <img src={backdrop || poster} alt="" className="mm__backdrop-img" />
            )}
            <div className="mm__backdrop-fade" />
          </div>

          <button className="mm__close" onClick={e => { e.stopPropagation(); onClose(); }}>
            <CloseCircleLinear size={18} strokeWidth={2.5} />
          </button>

          {/* ── Poster + title overlay ── */}
          <div className="mm__hero-content">
            {poster && (
              <div className="mm__poster-wrap">
                <img className="mm__poster" src={poster} alt={title} />
                {accentColor && <div className="mm__poster-glow" />}
              </div>
            )}
            <div className="mm__title-block">
              <div className="mm__title-row">
                <h2 className="mm__title">{title}</h2>
                <MoreMenu movie={movie} />
              </div>

              {/* Meta pills */}
              <div className="mm__meta">
                {year && <span className="mm__meta-item">{year}</span>}
                {rating && (
                  <span className="mm__meta-item mm__meta-item--rating">
                    <StarLinear size={10} fill="currentColor" />
                    {rating}
                  </span>
                )}
                {runtime && (
                  <span className="mm__meta-item">
                    <ClockCircleLinear size={10} />
                    {runtime}
                  </span>
                )}
                {seasons && (
                  <span className="mm__meta-item">
                    <TVLinear size={10} />
                    {seasons} {t('modal.seasons')}
                  </span>
                )}
                {certification && (
                  <span className="mm__meta-item mm__meta-item--cert">{certification}</span>
                )}
                <span className="mm__meta-item mm__meta-item--type">
                  {type === 'tv'
                    ? <><TVLinear size={10} />{t('modal.series')}</>
                    : <><VideoLibraryLinear size={10} />{t('modal.movie')}</>}
                </span>
              </div>

              {/* Genre tags */}
              {genres.length > 0 && (
                <div className="mm__genres">
                  {genres.map(g => <span key={g} className="mm__genre">{g}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="mm__body">

          {/* Overview */}
          {overview && (
            <div className="mm__overview-wrap">
              <p className={'mm__overview' + (overviewExpanded ? ' expanded' : '')}>{overview}</p>
              {overview.length > 200 && (
                <button className="mm__overview-toggle" onClick={() => setOverviewExpanded(v => !v)}>
                  {overviewExpanded ? t('modal.showLess') : t('modal.readMore')}
                </button>
              )}
            </div>
          )}

          {/* Rating (only when watched) */}
          {watched && (
            <InlineRating movieId={movie.id} getRating={getRating} rateMovie={rateMovie} />
          )}

          {/* TV tracker (only when in watchlist) */}
          {type === 'tv' && inList && (
            <TvProgressTracker
              id={movie.id}
              progress={progress}
              totalSeasons={totalSeasons}
              onChange={(data) => setTvProgressEntry(movie.id, data)}
              onClear={() => clearTvProgress(movie.id)}
            />
          )}

          {/* Where to watch */}
          <WhereToWatch movieId={movie.id} type={type} lang={lang} title={title} />

          {/* Details panel */}
          <MovieDetailsPanel details={details} type={type} t={t} onStudioClick={onStudioClick} />

          {/* Cast */}
          {cast.length > 0 && (
            <ScrollablePeopleBlock
              title={t('modal.cast')}
              items={cast.map(c => ({ id: c.id, name: c.name, profile_path: c.profile_path, sub: c.character }))}
              onItemClick={(item) => onActorClick?.({ id: item.id, name: item.name, profile_path: item.profile_path })}
            />
          )}

          {/* Crew */}
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
                    const ex = seen.get(c.id);
                    if (!ex.jobs.includes(c.job)) ex.jobs.push(c.job);
                    if (!ex.profile_path && c.profile_path) ex.profile_path = c.profile_path;
                  } else {
                    seen.set(c.id, { id: c.id, name: c.name, profile_path: c.profile_path, jobs: [c.job], department: c.department });
                  }
                });
                const allPeople = Array.from(seen.values()).map(p => ({ ...p, sub: p.jobs.join(', ') }));
                const writerCount = allPeople.filter(p => p.jobs.some(j => KEY_WRITING_JOBS.has(j))).length;
                const producerCount = allPeople.filter(p => p.jobs.some(j => KEY_PRODUCING_JOBS.has(j))).length;
                const deptOrder = { Directing: 0, Writing: 1, Production: 2, 'Visual Effects': 3, Sound: 4, Camera: 5, Editing: 6, Art: 7, 'Costume & Make-Up': 8 };
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
              onItemClick={onCrewClick ? (item) => onCrewClick({ id: item.id, name: item.name, profile_path: item.profile_path, department: item.department }) : null}
            />
          )}

          {/* Similar button */}
          <button
            className="mm__similar-btn"
            onClick={() => {
              const fromPath = window.location.pathname;
              onClose();
              navigate(`/similar/${type}/${movie.id}`, { state: { sourceMovie: { ...movie, media_type: type }, fromPath } });
            }}
          >
            <InfinityLinear size={14} />
            {t('modal.similar')}
          </button>
        </div>

        {/* ── Sticky action bar ── */}
        <div className="mm__actions">
          <button
            className={'mm__action-btn mm__action-btn--watch' + (watched ? ' active' : '')}
            onClick={handleMarkWatched}
          >
            {watched ? <EyeClosedLinear size={16} /> : <EyeLinear size={16} />}
            <span>{watched ? t('modal.watched') : t('modal.markWatched')}</span>
          </button>
          <button
            className={'mm__action-btn mm__action-btn--list' + (inList && !watched ? ' active' : '')}
            onClick={handleWatchlist}
            disabled={watched}
          >
            {inList && !watched ? <BookmarkOpenedLinear size={16} /> : <BookmarkLinear size={16} />}
            <span>{inList && !watched ? t('modal.inList') : t('modal.watchlist')}</span>
          </button>
        </div>

      </div>
    </div>
  );
});

export default MovieModal;