import { useState, useRef, useEffect } from 'react';
import { Shuffle, X, Eye, ExternalLink, Star } from 'lucide-react';
import { tmdb } from '../api';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import './Roulette.css';

// Particle burst effect on win
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
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 14,
      r: Math.random() * 5 + 2,
      color: Math.random() > 0.5 ? '#e8c547' : Math.random() > 0.5 ? '#ff6b35' : '#fff',
      life: 1,
      decay: Math.random() * 0.025 + 0.015,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.life -= p.decay;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
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
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);       // the winning movie object
  const [winnerIdx, setWinnerIdx] = useState(-1);   // index in strip that's the winner
  const [particles, setParticles] = useState(false);
  const stripRef = useRef();
  const items = watchlist.filter(m => m.poster_path);

  // Build a long strip: enough copies so spin feels infinite
  // We render: [copy1...copyN] and scroll into the right copy
  const COPIES = 6;
  const strip = Array.from({ length: COPIES }, () => items).flat();

  const CARD_W = 130; // px
  const GAP = 10;     // px
  const STEP = CARD_W + GAP;

  const reset = () => {
    setWinner(null);
    setWinnerIdx(-1);
    setParticles(false);
    if (stripRef.current) {
      stripRef.current.style.transition = 'none';
      stripRef.current.style.transform = 'translateX(0)';
    }
  };

  const handleOpen = () => {
    reset();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const spin = () => {
    if (spinning || items.length === 0 || !stripRef.current) return;

    reset();
    setSpinning(true);

    // Pick winner from original items
    const winIdx = Math.floor(Math.random() * items.length);

    // We want to land on that item in the 4th copy (middle of strip)
    // Position of that card in the strip:
    const targetCopy = 3; // 0-indexed, use 3rd copy
    const targetPos = targetCopy * items.length * STEP + winIdx * STEP;

    // Center in viewport: viewport center = 50% of parent width
    // We want that card centered, so offset by half card width
    const viewportCenter = (stripRef.current.parentElement?.offsetWidth || 300) / 2;
    const finalTranslate = -(targetPos - viewportCenter + CARD_W / 2);

    // Animate
    const el = stripRef.current;
    el.style.transition = 'none';
    el.style.transform = 'translateX(0)';

    // Force reflow
    void el.offsetWidth;

    el.style.transition = 'transform 3.5s cubic-bezier(0.12, 0.8, 0.3, 1)';
    el.style.transform = `translateX(${finalTranslate}px)`;

    // Which strip index did we land on?
    const stripWinnerIdx = targetCopy * items.length + winIdx;

    setTimeout(() => {
      setSpinning(false);
      setWinner(items[winIdx]);
      setWinnerIdx(stripWinnerIdx);
      setParticles(true);
      setTimeout(() => setParticles(false), 2200);
    }, 3550);
  };

  if (!open) {
    return (
      <button className="roulette-trigger" onClick={handleOpen}>
        <Shuffle size={18}/>
        <span>{t(lang, 'Что посмотреть?', 'What to watch?')}</span>
      </button>
    );
  }

  return (
    <div className="roulette-overlay" onClick={!spinning ? handleClose : undefined}>
      <div className="roulette-modal" onClick={e => e.stopPropagation()}>

        <div className="roulette-header">
          <h2 className="roulette-title">{t(lang, 'Крутим рулетку', 'Spin the wheel')}</h2>
          {!spinning && (
            <button className="roulette-close" onClick={handleClose}><X size={18}/></button>
          )}
        </div>

        {items.length < 2 ? (
          <div className="roulette-empty">
            <p>{t(lang, 'Добавь хотя бы 2 фильма в «Хочу посмотреть»', 'Add at least 2 movies to your watchlist')}</p>
          </div>
        ) : (
          <>
            {/* THE WHEEL */}
            <div className="roulette-viewport">
              {/* Particles burst from center */}
              <Particles active={particles}/>

              {/* Center selector frame */}
              <div className="roulette-frame"/>

              {/* The scrolling strip */}
              <div className="roulette-strip" ref={stripRef}>
                {strip.map((m, i) => {
                  const isWinner = winner && i === winnerIdx;
                  const poster = tmdb.posterUrl(m.poster_path);
                  return (
                    <div
                      key={i}
                      className={"roulette-card" + (isWinner ? " winner" : "")}
                      onClick={() => isWinner && onMovieClick && onMovieClick(m)}
                    >
                      {poster && <img src={poster} alt="" loading="lazy"/>}
                      {isWinner && (
                        <div className="roulette-card__winner-info">
                          <p className="roulette-card__title">{m.title || m.name}</p>
                          {m.vote_average > 0 && (
                            <p className="roulette-card__rating">
                              <Star size={10} fill="currentColor"/> {m.vote_average.toFixed(1)}
                            </p>
                          )}
                          <div className="roulette-card__actions">
                            <button className="roulette-card__btn-open" onClick={e => { e.stopPropagation(); onMovieClick && onMovieClick(m); }}>
                              <ExternalLink size={12}/> {t(lang, 'Открыть', 'Open')}
                            </button>
                            <button className="roulette-card__btn-watched" onClick={e => { e.stopPropagation(); addToWatched(m); handleClose(); }}>
                              <Eye size={12}/> {t(lang, 'Смотрел', 'Watched')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Edge fades */}
              <div className="roulette-fade-left"/>
              <div className="roulette-fade-right"/>
            </div>

            {/* Winner title below wheel */}
            {winner && (
              <div className="roulette-result">
                <p className="roulette-result__label">{t(lang, 'Смотри сегодня!', 'Watch tonight!')}</p>
                <p className="roulette-result__title">{winner.title || winner.name}</p>
              </div>
            )}

            <div className="roulette-footer">
              <button
                className={"roulette-spin-btn" + (spinning ? " spinning" : "")}
                onClick={spin}
                disabled={spinning}
              >
                <Shuffle size={18}/>
                {spinning
                  ? t(lang, 'Крутится…', 'Spinning…')
                  : winner
                    ? t(lang, 'Ещё раз!', 'Again!')
                    : t(lang, 'Крутить!', 'Spin!')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}