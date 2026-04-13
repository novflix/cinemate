import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TVLinear, PinLinear,
  StarLinear, TrashBinMinimalistic2Linear,
} from 'solar-icon-set';
import { tmdb } from '../../api';
import Countdown from '../../components/Countdown';
import './PosterGrid.css';

/* ─── PosterGrid ─────────────────────────────────────────────────────────────
   Renders a grid of movie/show posters with optional rating, TV progress,
   pin and remove actions.
   ─────────────────────────────────────────────────────────────────────────── */
export function PosterGrid({
  items, onSelect, onRemove, listTab,
  getRating, getTvProgress,
  pinnedIds, pinItem, unpinItem,
  lang, // kept for future localisation use
}) {
  const { t } = useTranslation();
  const [pinAnim, setPinAnim] = useState(null);

  const handlePin = (e, id) => {
    e.stopPropagation();
    const isPinned = pinnedIds && pinnedIds.includes(id);
    setPinAnim(id);
    setTimeout(() => setPinAnim(null), 700);
    if (isPinned) unpinItem(id);
    else pinItem(id);
  };

  if (!items.length) return null;

  return (
    <div className="poster-grid">
      {items.map(m => {
        const poster   = tmdb.posterUrl(m.poster_path);
        const title    = m.title || m.name || m._fallback_title || '';
        const rating   = getRating(m.id);
        const isPinned = pinnedIds && pinnedIds.includes(m.id);
        const isAnim   = pinAnim === m.id;
        const rd       = m.release_date || m.first_air_date;
        const today    = new Date().toISOString().slice(0, 10);
        const isUnreleased = !rd || rd > today;

        return (
          <div
            key={m.id}
            className={`poster-grid__item${isPinned ? ' poster-grid__item--pinned' : ''}`}
            onClick={() => onSelect(m)}
          >
            <div className="poster-grid__poster">
              {poster
                ? <img src={poster} alt={title} loading="lazy"/>
                : <div className="poster-grid__no-poster"/>
              }
              {isPinned && <div className="poster-grid__pin-glow"/>}

              {/* Countdown for unreleased titles */}
              {isUnreleased && (rd ? <Countdown releaseDate={rd}/> : <Countdown noDate={true}/>)}

              {/* Star rating badge */}
              {listTab === 'watched' && rating && (
                <div className="poster-grid__rating"><StarLinear size={11}/>{rating}</div>
              )}

              {/* TV progress bar */}
              {listTab === 'watchlist' && getTvProgress?.(m.id) && (() => {
                const p = getTvProgress(m.id);
                return (
                  <div className="poster-grid__progress">
                    <span>S{p.season}·E{p.episode}</span>
                    <div className="poster-grid__progress-bar">
                      <div
                        className="poster-grid__progress-fill"
                        style={{ width: `${calcTvPct(p)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Pin button */}
              {listTab === 'watchlist' && (
                <button
                  className={`poster-grid__pin${isPinned ? ' poster-grid__pin--active' : ''}${isAnim ? ' poster-grid__pin--burst' : ''}`}
                  onClick={e => handlePin(e, m.id)}
                  title={isPinned ? t('profile.unpin') : t('profile.pinToTop')}
                >
                  <PinLinear size={12}/>
                </button>
              )}

              {/* Remove button */}
              <button
                className="poster-grid__remove"
                onClick={e => { e.stopPropagation(); onRemove(m.id); }}
              >
                <TrashBinMinimalistic2Linear size={11}/>
              </button>
            </div>
            <p className="poster-grid__title">{title}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Helper: TV episode → percentage 0–100 ─────────────────────────────── */
function calcTvPct(p) {
  const ts   = Math.max(p.totalSeasons || 1, 1);
  const eps  = p.episodesInSeason || null;
  const slot = 100 / ts;
  const base = (p.season - 1) * slot;
  const frac = eps && eps > 1 ? (p.episode - 1) / (eps - 1) : 0;
  return Math.min(100, Math.max(0, base + slot * frac));
}

/* ─── WatchlistContent ───────────────────────────────────────────────────────
   Splits the watchlist into "currently watching" (TV with progress) and
   the regular queue.
   ─────────────────────────────────────────────────────────────────────────── */
export function WatchlistContent({
  listTab, displayItems, localizedWatchlist,
  onSelect, removeFromWatched, removeFromWatchlist,
  getRating, getTvProgress, lang,
  pinnedIds, pinItem, unpinItem,
}) {
  const { t } = useTranslation();

  if (listTab === 'watched') {
    return (
      <PosterGrid
        items={displayItems}
        onSelect={onSelect}
        onRemove={removeFromWatched}
        listTab="watched"
        getRating={getRating}
        lang={lang}
      />
    );
  }

  const watching = localizedWatchlist.filter(
    m => (m.media_type === 'tv' || (!m.title && m.name)) && getTvProgress(m.id)
  );
  const queued = localizedWatchlist.filter(m => !watching.find(w => w.id === m.id));

  const gridProps = { onSelect, onRemove: removeFromWatchlist, listTab: 'watchlist', getRating, getTvProgress, pinnedIds, pinItem, unpinItem, lang };

  return (
    <>
      {watching.length > 0 && (
        <>
          <p className="profile-watching-label">
            <TVLinear size={13}/> {t('profile.currentlyWatching')}
          </p>
          <PosterGrid items={watching} {...gridProps}/>
          {queued.length > 0 && <div className="profile-watching-divider" data-label={t('profile.upNext')}/>}
        </>
      )}
      {queued.length > 0 && <PosterGrid items={queued} {...gridProps}/>}
    </>
  );
}