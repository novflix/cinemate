import { useState, memo } from 'react';
import { CloseCircleLinear, StarLinear } from 'solar-icon-set';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import { tmdb } from '../api';
import { SparkBurst } from './Effects';
import './RatingPrompt.css';

const COLORS    = ['','#ef4444','#f97316','#fb923c','#fbbf24','#a3a3a3','#84cc16','#22c55e','#10b981','#3b82f6','#8b5cf6'];

const RatingPrompt = memo(function RatingPrompt({ movie, onClose }) {
  const { rateMovie, getRating } = useStore();
  const { t } = useTranslation();
  const [hovered,  setHovered]  = useState(0);
  const [selected, setSelected] = useState(getRating(movie?.id) || 0);
  const [phase,    setPhase]    = useState('pick');
  const [showSparks, setShowSparks] = useState(false); // 'pick' | 'confirm' | 'done'

  if (!movie) return null;

  const title  = movie.title || movie.name || movie._fallback_title || '';
  const poster = tmdb.posterUrl(movie.poster_path);
  const display = hovered || selected;
  const labels = t('ratingLabels', { returnObjects: true });
  const label  = labels[display] || '';
  const color  = COLORS[display] || 'var(--accent)';

  const handleRate = (score) => {
    setSelected(score);
    rateMovie(movie.id, score);
    if (score === 10) setShowSparks(true);
    setPhase('confirm');
    // After showing confirm animation, close
    setTimeout(() => setPhase('done'), 1800);
    setTimeout(() => onClose(), 2400);
  };

  return (
    <div className={"rating-overlay" + (phase==='done' ? ' fading' : '')} onClick={phase==='pick' ? onClose : undefined}>
      <div className={"rating-prompt rating-prompt--" + phase} onClick={e => e.stopPropagation()}>

        {phase === 'pick' && (
          <button className="rating-prompt__close" onClick={onClose}><CloseCircleLinear size={15}/></button>
        )}

        <div className="rating-prompt__header">
          {poster && <img className="rating-prompt__poster" src={poster} alt={title}/>}
          <div>
            <p className="rating-prompt__ask">
              {phase === 'pick'
                ? t('rating.howWasIt')
                : t('rating.ratingSaved')}
            </p>
            <p className="rating-prompt__title">{title}</p>
          </div>
        </div>

        {phase === 'pick' && (
          <>
            <div className="rating-prompt__stars">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  className={"rating-star" + (n <= (hovered || selected) ? ' active' : '')}
                  style={n <= (hovered || selected) ? { background: color, borderColor: 'transparent' } : {}}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onTouchStart={() => setHovered(n)}
                  onClick={() => handleRate(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="rating-prompt__label-row">
              {display > 0
                ? <p className="rating-prompt__label" style={{ color }}><StarLinear size={13} fill={color}/> {display}/10 — {label}</p>
                : <p className="rating-prompt__hint">{t('rating.tapNumber')}</p>
              }
            </div>

            <button className="rating-prompt__skip" onClick={onClose}>
              {t('rating.skip')}
            </button>
          </>
        )}

        {phase === 'confirm' && (
          <div className="rating-prompt__confirm">
            <div className="rating-confirm__ring" style={{ '--c': color }}>
              <span className="rating-confirm__score" style={{ color }}>{selected}</span>
              <span className="rating-confirm__max">/10</span>
            </div>
            <p className="rating-confirm__label" style={{ color }}>{label}</p>
            <div className="rating-confirm__stars">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} className={"rating-confirm__dot" + (n <= selected ? ' filled' : '')}
                  style={n <= selected ? { background: color, animationDelay: `${n * 60}ms` } : {}}
                />
              ))}
            </div>
          </div>
        )}

      </div>
      {showSparks && <SparkBurst active={showSparks} onDone={() => setShowSparks(false)}/>}
    </div>
  );
});

export default RatingPrompt;