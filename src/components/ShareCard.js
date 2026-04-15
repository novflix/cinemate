import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CloseCircleLinear, DownloadMinimalisticLinear, ShareLinear } from 'solar-icon-set';
import { HEADERS } from '../api';
import { useStore } from '../store';
import { useTheme } from '../theme';
import './ShareCard.css';

// ─── Score colour palette (matches RatingPrompt) ─────────────────────────────
const SCORE_COLORS = [
  '', '#ef4444', '#f97316', '#fb923c', '#fbbf24',
  '#a3a3a3', '#84cc16', '#22c55e', '#10b981', '#3b82f6', '#8b5cf6',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreLabel(score, labels) {
  return labels?.[score] || '';
}

// Load an image via CORS proxy-friendly approach (draw from URL, fallback to solid)
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Wrap text to fit within maxWidth, returns array of lines
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}



// ─── Core card renderer ───────────────────────────────────────────────────────
async function drawCard(canvas, { posterImg, backdropImg, title, year, score, format, ratingLabels, type, username }) {
  const isStory = format === 'story';

  // Story: 720×1280 (9:16).  Square: 720×720 (1:1)
  const W = 720;
  const H = isStory ? 1280 : 720;

  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  const scoreColor = SCORE_COLORS[score] || '#e8c547';

  // ── 1. Dark background ────────────────────────────────────────────────────
  ctx.fillStyle = '#07070f';
  ctx.fillRect(0, 0, W, H);

  // Blurred backdrop
  const bgSrc = backdropImg || posterImg;
  if (bgSrc) {
    const scale = Math.max(W / bgSrc.width, H / bgSrc.height);
    const bw = bgSrc.width * scale, bh = bgSrc.height * scale;
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.filter = 'blur(48px)';
    ctx.drawImage(bgSrc, bx, by, bw, bh);
    ctx.filter = 'none';
    ctx.restore();
  }

  // Full-height gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,    'rgba(7,7,15,0.55)');
  grad.addColorStop(0.45, 'rgba(7,7,15,0.3)');
  grad.addColorStop(1,    'rgba(7,7,15,0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── helpers ───────────────────────────────────────────────────────────────
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawPoster = (x, y, w, h, radius) => {
    if (!posterImg) return;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur  = 36;
    ctx.shadowOffsetY = 14;
    rr(x, y, w, h, radius); ctx.fillStyle = '#111'; ctx.fill();
    ctx.restore();
    ctx.save();
    rr(x, y, w, h, radius); ctx.clip();
    ctx.drawImage(posterImg, x, y, w, h);
    ctx.restore();
    ctx.save();
    rr(x, y, w, h, radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  };

  const drawBadge = (cx, cy, r) => {
    // glow
    ctx.save();
    ctx.shadowColor = scoreColor; ctx.shadowBlur = 32;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = scoreColor; ctx.fill();
    ctx.restore();
    // dark fill
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d1a'; ctx.fill();
    // ring
    ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.strokeStyle = scoreColor; ctx.lineWidth = 3; ctx.stroke();
    // number
    ctx.fillStyle = scoreColor;
    ctx.font = `bold ${Math.round(r * 0.72)}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(score), cx, cy - r * 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = `600 ${Math.round(r * 0.27)}px 'DM Sans', sans-serif`;
    ctx.fillText('/10', cx, cy + r * 0.42);
    ctx.textBaseline = 'alphabetic';
  };

  const drawBranding = (cx, y) => {
    // dot
    ctx.beginPath(); ctx.arc(cx - 52, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c547'; ctx.fill();
    // username
    if (username) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `600 14px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`@${username}`, cx, y + 4);
    }
    // site — right aligned from center
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = `500 12px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('cinimate.fun', cx + 50, y + 4);
  };

  const label = scoreLabel(score, ratingLabels);

  if (isStory) {
    // ── STORY (9:16) layout ───────────────────────────────────────────────
    // Poster fills top ~62% of card
    const PAD    = 48;
    const PW     = W - PAD * 2;          // 624
    const PH     = Math.round(PW * 1.5); // 936  (2:3 ratio)
    const PX     = PAD;
    const PY     = 52;

    drawPoster(PX, PY, PW, PH, 20);

    // Score badge — bottom-right corner of poster
    const BR = 46;
    drawBadge(PX + PW - BR + 6, PY + PH - BR + 6, BR);

    // ── Text block right below poster ─────────────────────────────────────
    const TEXT_TOP = PY + PH + 38;
    let ty = TEXT_TOP;

    // Rating label
    if (label) {
      ctx.fillStyle = scoreColor;
      ctx.font = `700 13px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2.5px';
      ctx.fillText(label.toUpperCase(), W / 2, ty);
      ctx.letterSpacing = '0px';
      ty += 30;
    }

    // Title — font size adapts to remaining space & title length
    const maxTitleW = W - PAD * 2;
    let fontSize = 52;
    ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    while (fontSize > 28 && ctx.measureText(title).width > maxTitleW * 0.85) {
      fontSize -= 2;
      ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    }
    const titleLines = wrapText(ctx, title, maxTitleW);
    const lineH = Math.round(fontSize * 1.18);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    titleLines.slice(0, 3).forEach((line, i) => {
      ctx.globalAlpha = (i === 2 && titleLines.length > 3) ? 0.45 : 1;
      ctx.fillText(line, W / 2, ty + i * lineH);
    });
    ctx.globalAlpha = 1;
    ty += Math.min(titleLines.length, 3) * lineH + 14;

    // Meta
    const meta = [year, type === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ');
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = `500 15px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(meta, W / 2, ty);

    // Branding
    drawBranding(W / 2, H - 38);

  } else {
    // ── SQUARE (1:1) layout ───────────────────────────────────────────────
    const PAD  = 44;
    const PH   = H - PAD * 2;           // 632
    const PW   = Math.round(PH / 1.5);  // 421  (2:3 ratio)
    const PX   = PAD;
    const PY   = PAD;

    drawPoster(PX, PY, PW, PH, 16);

    // Score badge — overlapping bottom-right of poster
    const BR = 44;
    drawBadge(PX + PW - BR + 8, PY + PH - BR + 8, BR);

    // ── Right column ──────────────────────────────────────────────────────
    const RX  = PX + PW + 36;
    const RW  = W - RX - PAD;
    let ry = PY + 16;

    // Rating label
    if (label) {
      ctx.fillStyle = scoreColor;
      ctx.font = `700 11px 'DM Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.letterSpacing = '2px';
      ctx.fillText(label.toUpperCase(), RX, ry);
      ctx.letterSpacing = '0px';
      ry += 26;
    }

    // Title
    let fontSize = 38;
    ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    while (fontSize > 22 && ctx.measureText(title).width > RW * 0.9) {
      fontSize -= 2;
      ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    }
    const titleLines = wrapText(ctx, title, RW);
    const lineH = Math.round(fontSize * 1.2);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    titleLines.slice(0, 4).forEach((line, i) => {
      ctx.globalAlpha = (i === 3 && titleLines.length > 4) ? 0.45 : 1;
      ctx.fillText(line, RX, ry + i * lineH);
    });
    ctx.globalAlpha = 1;
    ry += Math.min(titleLines.length, 4) * lineH + 16;

    // Meta
    const meta = [year, type === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ');
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = `500 13px 'DM Sans', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(meta, RX, ry);
    ry += 32;

    // Score dots
    for (let i = 1; i <= 10; i++) {
      const dx = RX + (i - 1) * 16;
      ctx.beginPath(); ctx.arc(dx + 5, ry, 4, 0, Math.PI * 2);
      ctx.fillStyle = i <= score ? scoreColor : 'rgba(255,255,255,0.12)';
      ctx.fill();
    }
    ry += 22;

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(RX, ry); ctx.lineTo(RX + RW, ry); ctx.stroke();
    ry += 18;

    // Username + branding
    if (username) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = `600 13px 'DM Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`@${username}`, RX, ry);
    }
    // cinimate.fun bottom right
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = `500 12px 'DM Sans', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('cinimate.fun', W - PAD, H - PAD + 10);
    // gold dot before it
    ctx.beginPath(); ctx.arc(W - PAD - ctx.measureText('cinimate.fun').width - 10, H - PAD + 6, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c547'; ctx.fill();
  }
}


// ─── ShareCard Modal ──────────────────────────────────────────────────────────
export default function ShareCard({ movieId, mediaType, score, onClose }) {
  const { t } = useTranslation();
  const { lang } = useTheme();
  const { profile } = useStore();
  const canvasRef   = useRef(null);
  const [format, setFormat]   = useState('story');   // 'story' | 'square'
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const imagesRef = useRef({ poster: null, backdrop: null });

  const langCode = (() => {
    const map = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
    return map[lang] || 'en-US';
  })();

  const ratingLabels = t('ratingLabels', { returnObjects: true });

  // Fetch movie details
  useEffect(() => {
    if (!movieId || !mediaType) return;
    setLoading(true);
    fetch(
      `https://api.themoviedb.org/3/${mediaType}/${movieId}?language=${langCode}`,
      { headers: HEADERS }
    )
      .then(r => r.json())
      .then(data => { setDetails(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movieId, mediaType, langCode]);

  // Load poster + backdrop images once details arrive
  useEffect(() => {
    if (!details) return;
    const posterSrc   = details.poster_path   ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null;
    const backdropSrc = details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null;
    Promise.all([
      posterSrc   ? loadImage(posterSrc)   : Promise.resolve(null),
      backdropSrc ? loadImage(backdropSrc) : Promise.resolve(null),
    ]).then(([poster, backdrop]) => {
      imagesRef.current = { poster, backdrop };
      renderCard();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  const renderCard = useCallback(() => {
    if (!canvasRef.current || !details) return;
    const title = details.title || details.name || '';
    const year  = (details.release_date || details.first_air_date || '').slice(0, 4);
    drawCard(canvasRef.current, {
      posterImg:   imagesRef.current.poster,
      backdropImg: imagesRef.current.backdrop,
      title,
      year,
      score,
      format,
      ratingLabels,
      type: mediaType,
      username: profile?.name || null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, score, format]);

  // Re-render when format changes
  useEffect(() => {
    if (imagesRef.current.poster || imagesRef.current.backdrop) {
      renderCard();
    }
  }, [format, renderCard]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const title = details?.title || details?.name || 'cinimate';
    const slug  = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    canvasRef.current.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `cinimate-${slug}-${score}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    if (!navigator.share) { handleDownload(); return; }
    setSharing(true);
    try {
      const title = details?.title || details?.name || '';
      canvasRef.current.toBlob(async (blob) => {
        const file = new File([blob], `cinimate-${score}.png`, { type: 'image/png' });
        await navigator.share({
          title: `${title} — ${score}/10`,
          text:  `I rated ${title} ${score}/10 on cinimate.fun`,
          files: [file],
        });
      }, 'image/png');
    } catch {
      // User cancelled or API unavailable — fallback to download
      handleDownload();
    } finally {
      setSharing(false);
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const isStory  = format === 'story';

  return createPortal(
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal__header">
          <span className="share-modal__title">{t('shareCard.title')}</span>
          <button className="share-modal__close" onClick={onClose}>
            <CloseCircleLinear size={16} strokeWidth={2.5}/>
          </button>
        </div>

        {/* Format toggle */}
        <div className="share-modal__formats">
          <button
            className={'share-modal__fmt-btn' + (isStory ? ' active' : '')}
            onClick={() => setFormat('story')}
          >
            <span className="share-modal__fmt-icon share-modal__fmt-icon--story"/>
            {t('shareCard.story')}
          </button>
          <button
            className={'share-modal__fmt-btn' + (!isStory ? ' active' : '')}
            onClick={() => setFormat('square')}
          >
            <span className="share-modal__fmt-icon share-modal__fmt-icon--square"/>
            {t('shareCard.square')}
          </button>
        </div>

        {/* Canvas preview */}
        <div className={'share-modal__preview' + (isStory ? ' story' : ' square')}>
          {loading && (
            <div className="share-modal__spinner-wrap">
              <div className="share-modal__spinner"/>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="share-modal__canvas"
            style={{ opacity: loading ? 0 : 1 }}
          />
        </div>

        {/* Actions */}
        <div className="share-modal__actions">
          <button className="share-modal__btn share-modal__btn--download" onClick={handleDownload}>
            <DownloadMinimalisticLinear size={15}/>
            {downloaded ? t('shareCard.saved') : t('shareCard.download')}
          </button>
          {canShare && (
            <button className="share-modal__btn share-modal__btn--share" onClick={handleShare} disabled={sharing}>
              <ShareLinear size={15}/>
              {sharing ? t('shareCard.sharing') : t('shareCard.share')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}