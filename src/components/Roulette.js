import { useState, useEffect, useRef } from 'react';
import { Shuffle, X, Eye, ExternalLink } from 'lucide-react';
import { tmdb } from '../api';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import { useLocalizedMovies } from '../useLocalizedMovies';
import './Roulette.css';

function Particles({ active }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 48 }, () => ({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.7) * 14,
      r: Math.random() * 5 + 2,
      color: Math.random() > 0.5 ? '#e8c547' : Math.random() > 0.5 ? '#ff6b35' : '#fff',
      life: 1, decay: Math.random() * 0.025 + 0.015,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= p.decay;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="roulette-particles"/>;
}

export default function Roulette({ onMovieClick }) {
  const { watchlist, addToWatched } = useStore();
  const { lang } = useTheme();
  const [open,      setOpen]      = useState(false);
  const [spinning,  setSpinning]  = useState(false);
  const [winner,    setWinner]    = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(-1);
  const [particles, setParticles] = useState(false);
  const stripRef = useRef();

  // Localized watchlist — titles and posters in current language
  const localizedWatchlist = useLocalizedMovies(watchlist, lang);
  const items = localizedWatchlist.filter(m => m.poster_path);

  const COPIES = 6;
  const strip  = Array.from({ length: COPIES }, () => items).flat();
  const CARD_W = 130, GAP = 10, STEP = CARD_W + GAP;

  const reset = () => {
    setWinner(null); setWinnerIdx(-1); setParticles(false);
    if (stripRef.current) {
      stripRef.current.style.transition = 'none';
      stripRef.current.style.transform  = 'translateX(0)';
    }
  };

  const handleOpen  = () => { reset(); setOpen(true); };
  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const spin = () => {
    if (spinning || items.length === 0 || !stripRef.current) return;
    reset();
    setSpinning(true);
    const winIdx = Math.floor(Math.random() * items.length);
    const targetPos = 3 * items.length * STEP + winIdx * STEP;
    const viewCenter = (stripRef.current.parentElement?.offsetWidth || 300) / 2;
    const finalTranslate = -(targetPos - viewCenter + CARD_W / 2);
    const el = stripRef.current;
    el.style.transition = 'none';
    el.style.transform  = 'translateX(0)';
    void el.offsetWidth;
    el.style.transition = 'transform 3.5s cubic-bezier(0.12, 0.8, 0.3, 1)';
    el.style.transform  = `translateX(${finalTranslate}px)`;
    setTimeout(() => {
      setSpinning(false);
      setWinner(items[winIdx]);
      setWinnerIdx(3 * items.length + winIdx);
      setParticles(true);
      setTimeout(() => setParticles(false), 2200);
    }, 3550);
  };

  if (!open) {
    return (
      <button className="roulette-trigger" onClick={handleOpen}>
        <Shuffle size={18}/>
        <span>{t(lang,'Что посмотреть?','What to watch?')}</span>
      </button>
    );
  }

  return (
    <div className="roulette-overlay" onClick={!spinning ? handleClose : undefined}>
      <div className="roulette-modal" onClick={e => e.stopPropagation()}>
        <div className="roulette-header">
          <h2 className="roulette-title">{t(lang,'Крутим рулетку','Spin the wheel')}</h2>
          {!spinning && <button className="roulette-close" onClick={handleClose}><X size={18}/></button>}
        </div>

        {items.length < 2 ? (
          <div className="roulette-empty">
            <p>{t(lang,'Добавь хотя бы 2 фильма в «Хочу посмотреть»','Add at least 2 movies to your watchlist')}</p>
          </div>
        ) : (
          <>
            <div className="roulette-viewport">
              <Particles active={particles}/>
              <div className="roulette-frame"/>
              <div className="roulette-strip" ref={stripRef}>
                {strip.map((m, i) => {
                  const isWinner = winner && i === winnerIdx;
                  const poster   = tmdb.posterUrl(m.poster_path);
                  return (
                    <div key={i} className={"roulette-card" + (isWinner ? " winner" : "")}>
                      {poster && <img src={poster} alt="" loading="lazy"/>}
                    </div>
                  );
                })}
              </div>
              <div className="roulette-fade-left"/>
              <div className="roulette-fade-right"/>
            </div>

            {winner && (
              <div className="roulette-result">
                <div className="roulette-result__row">
                  {tmdb.posterUrl(winner.poster_path) && (
                    <img className="roulette-result__poster" src={tmdb.posterUrl(winner.poster_path)} alt=""/>
                  )}
                  <div className="roulette-result__info">
                    <p className="roulette-result__label">{t(lang,'Смотри сегодня!','Watch tonight!')}</p>
                    <p className="roulette-result__title">{winner.title || winner.name}</p>
                    <p className="roulette-result__year">{(winner.release_date||winner.first_air_date||'').slice(0,4)}</p>
                  </div>
                </div>
                <div className="roulette-result__actions">
                  <button className="roulette-result__btn primary" onClick={() => { handleClose(); setTimeout(() => onMovieClick?.(winner), 320); }}>
                    <ExternalLink size={15}/> {t(lang,'Открыть','Open')}
                  </button>
                  <button className="roulette-result__btn" onClick={() => { addToWatched(winner); handleClose(); }}>
                    <Eye size={15}/> {t(lang,'Смотрел','Watched')}
                  </button>
                </div>
              </div>
            )}

            <div className="roulette-footer">
              <button className={"roulette-spin-btn"+(spinning?" spinning":"")} onClick={spin} disabled={spinning}>
                <Shuffle size={18}/>
                {spinning ? t(lang,'Крутится…','Spinning…') : winner ? t(lang,'Ещё раз!','Again!') : t(lang,'Крутить!','Spin!')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}