import { useState, useEffect } from 'react';
import { Shuffle, X, Eye, Bookmark, Play } from 'lucide-react';
import { tmdb } from '../api';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import './Roulette.css';

export default function Roulette({ onMovieClick }) {
  const { watchlist, addToWatched } = useStore();
  const { lang } = useTheme();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [offset, setOffset] = useState(0);
  const [settled, setSettled] = useState(false);

  const items = watchlist.filter(m => m.poster_path);

  const spin = () => {
    if (spinning || items.length === 0) return;
    setWinner(null);
    setSettled(false);
    setSpinning(true);

    const winIdx = Math.floor(Math.random() * items.length);
    const CARD_W = 130 + 12; // width + gap
    const loops = 4; // full loops for dramatic effect
    const finalOffset = -(loops * items.length * CARD_W + winIdx * CARD_W);

    // animate via CSS transition
    setOffset(finalOffset);

    setTimeout(() => {
      setSpinning(false);
      setSettled(true);
      setWinner(items[winIdx]);
    }, 3200);
  };

  // reset offset after settled so we can spin again
  useEffect(() => {
    if (!spinning && settled) {
      // After a short delay, silently reset (no transition)
      const t = setTimeout(() => setOffset(0), 800);
      return () => clearTimeout(t);
    }
  }, [spinning, settled]);

  if (!open) {
    return (
      <button className="roulette-trigger" onClick={() => { setOpen(true); setWinner(null); setSettled(false); }}>
        <Shuffle size={18}/>
        <span>{t(lang, 'Что посмотреть?', "What to watch?")}</span>
      </button>
    );
  }

  // build looped strip: repeat items enough times
  const strip = [...items, ...items, ...items, ...items, ...items, ...items];

  return (
    <div className="roulette-overlay" onClick={() => !spinning && setOpen(false)}>
      <div className="roulette-modal" onClick={e => e.stopPropagation()}>
        <div className="roulette-header">
          <h2 className="roulette-title">{t(lang, 'Крутим рулетку!', 'Spinning the wheel!')}</h2>
          <button className="roulette-close" onClick={() => setOpen(false)}><X size={18}/></button>
        </div>

        {items.length < 2 ? (
          <div className="roulette-empty">
            <Bookmark size={36} strokeWidth={1}/>
            <p>{t(lang, 'Добавь хотя бы 2 фильма в «Хочу посмотреть»', 'Add at least 2 movies to your watchlist')}</p>
          </div>
        ) : (
          <>
            {/* Wheel viewport */}
            <div className="roulette-viewport">
              <div className="roulette-pointer"/>
              <div
                className="roulette-strip"
                style={{
                  transform: `translateX(${offset}px)`,
                  transition: spinning
                    ? 'transform 3.2s cubic-bezier(0.15, 0.85, 0.35, 1.0)'
                    : 'none',
                }}
              >
                {strip.map((m, i) => {
                  const poster = tmdb.posterUrl(m.poster_path);
                  return (
                    <div key={`${m.id}-${i}`} className="roulette-card">
                      {poster ? <img src={poster} alt="" loading="lazy"/> : <div className="roulette-card__fallback"/>}
                    </div>
                  );
                })}
              </div>
              {/* gradient masks */}
              <div className="roulette-mask-left"/>
              <div className="roulette-mask-right"/>
            </div>

            {/* Winner reveal */}
            {settled && winner && (
              <div className="roulette-winner">
                <div className="roulette-winner__glow"/>
                <div className="roulette-winner__content">
                  {tmdb.posterUrl(winner.poster_path) && (
                    <img className="roulette-winner__poster" src={tmdb.posterUrl(winner.poster_path)} alt=""/>
                  )}
                  <div className="roulette-winner__info">
                    <p className="roulette-winner__label">{t(lang, '🎬 Смотри сегодня!', '🎬 Watch tonight!')}</p>
                    <h3 className="roulette-winner__title">{winner.title || winner.name}</h3>
                    <p className="roulette-winner__year">{(winner.release_date||winner.first_air_date||'').slice(0,4)}</p>
                    <div className="roulette-winner__actions">
                      <button className="roulette-winner__btn primary" onClick={() => onMovieClick && onMovieClick(winner)}>
                        <Play size={14} fill="currentColor"/> {t(lang,'Подробнее','Details')}
                      </button>
                      <button className="roulette-winner__btn" onClick={() => { addToWatched(winner); setOpen(false); }}>
                        <Eye size={14}/> {t(lang,'Смотрел','Watched')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="roulette-footer">
              <button
                className={"roulette-spin-btn" + (spinning ? " spinning" : "")}
                onClick={spin}
                disabled={spinning}
              >
                <Shuffle size={18}/>
                {spinning ? t(lang, 'Крутится...', 'Spinning...') : settled ? t(lang, 'Покрутить ещё', 'Spin again') : t(lang, 'Крутить!', 'Spin!')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
