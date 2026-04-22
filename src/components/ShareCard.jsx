import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CloseCircleLinear, DownloadMinimalisticLinear, ShareLinear } from 'solar-icon-set';
import { HEADERS } from '../api';
import { useStore } from '../store';
import { useTheme } from '../theme';
import './ShareCard.css';
import Wordmark from './Wordmark';

// ─── Score colour palette ─────────────────────────────────────────────────────
const SCORE_COLORS = [
  '', '#ef4444', '#f97316', '#fb923c', '#fbbf24',
  '#a3a3a3', '#84cc16', '#22c55e', '#10b981', '#3b82f6', '#8b5cf6',
];

function scoreLabel(score, labels) {
  return labels?.[score] || '';
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

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

// ─── Rounded-rect path helper ─────────────────────────────────────────────────
function rrPath(ctx, x, y, w, h, r) {
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
}

// ─── Draw the CINIMATE logotype on canvas ─────────────────────────────────────
// cx = horizontal center, baselineY = text baseline, fontSize in px
function drawLogo(ctx, cx, baselineY, fontSize) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `900 ${fontSize}px 'Bebas Neue', 'Arial Black', sans-serif`;

  const ciniW  = ctx.measureText('CINI').width;
  const mateW  = ctx.measureText('MATE').width;
  const dotR   = Math.round(fontSize * 0.14);
  const dotGap = Math.round(fontSize * 0.1);
  const total  = dotR * 2 + dotGap + ciniW + mateW;
  const startX = cx - total / 2;

  // Gold accent dot
  ctx.beginPath();
  ctx.arc(startX + dotR, baselineY - fontSize * 0.40, dotR, 0, Math.PI * 2);
  ctx.fillStyle = '#e8c547';
  ctx.fill();

  // CINI — white
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('CINI', startX + dotR * 2 + dotGap, baselineY);

  // MATE — gold
  ctx.fillStyle = '#e8c547';
  ctx.fillText('MATE', startX + dotR * 2 + dotGap + ciniW, baselineY);

  ctx.restore();
}

// ─── Core card renderer ───────────────────────────────────────────────────────
async function drawCard(canvas, { posterImg, backdropImg, title, year, score, format, ratingLabels, type, username }) {
  const isStory = format === 'story';
  const W = 720;
  const H = isStory ? 1280 : 720;

  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  const scoreColor = SCORE_COLORS[score] || '#e8c547';

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#07070f';
  ctx.fillRect(0, 0, W, H);

  const bgSrc = backdropImg || posterImg;
  if (bgSrc) {
    const scale = Math.max(W / bgSrc.width, H / bgSrc.height);
    const bw = bgSrc.width * scale;
    const bh = bgSrc.height * scale;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.filter = 'blur(52px)';
    ctx.drawImage(bgSrc, bx, by, bw, bh);
    ctx.filter = 'none';
    ctx.restore();
  }

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,    'rgba(7,7,15,0.60)');
  grad.addColorStop(0.42, 'rgba(7,7,15,0.22)');
  grad.addColorStop(1,    'rgba(7,7,15,0.98)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Poster helper ─────────────────────────────────────────────────────────
  const drawPoster = (x, y, w, h, radius) => {
    if (!posterImg) return;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.72)';
    ctx.shadowBlur  = 44;
    ctx.shadowOffsetY = 18;
    rrPath(ctx, x, y, w, h, radius);
    ctx.fillStyle = '#0e0e1e';
    ctx.fill();
    ctx.restore();
    ctx.save();
    rrPath(ctx, x, y, w, h, radius);
    ctx.clip();
    ctx.drawImage(posterImg, x, y, w, h);
    ctx.restore();
    ctx.save();
    rrPath(ctx, x, y, w, h, radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };

  // ── Score badge ───────────────────────────────────────────────────────────
  const drawBadge = (cx, cy, r) => {
    ctx.save();
    ctx.shadowColor = scoreColor;
    ctx.shadowBlur = 38;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = scoreColor;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a18';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = scoreColor;
    ctx.font = `bold ${Math.round(r * 0.72)}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score), cx, cy - r * 0.10);
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = `600 ${Math.round(r * 0.27)}px 'DM Sans', sans-serif`;
    ctx.fillText('/10', cx, cy + r * 0.44);
    ctx.textBaseline = 'alphabetic';
  };

  // ── Bottom branding strip ─────────────────────────────────────────────────
  // All three elements: @username left | CINIMATE logo center | cinimate.fun right
  // They are positioned independently so they NEVER overlap.
  const drawBranding = (midY) => {
    ctx.save();
    ctx.textBaseline = 'middle';

    if (username) {
      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.font = `500 15px 'DM Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`@${username}`, 52, midY);
    }

    // Logo — always centered regardless of username presence
    drawLogo(ctx, W / 2, midY + 8, 19);

    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.font = `400 14px 'DM Sans', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('cinimate.fun', W - 52, midY);

    ctx.restore();
  };

  const label = scoreLabel(score, ratingLabels);

  if (isStory) {
    // ── STORY (9:16) ──────────────────────────────────────────────────────
    const PAD = 52;
    const PW  = Math.round((W - PAD * 2) * 0.78); // ~20% narrower poster
    const PH  = Math.round(PW * 1.5);
    const PX  = (W - PW) / 2;
    const PY  = 56;

    drawPoster(PX, PY, PW, PH, 20);

    const BR = 46;
    drawBadge(PX + PW - BR + 10, PY + PH - BR + 10, BR);

    const TEXT_TOP = PY + PH + 32;
    let ty = TEXT_TOP;

    if (label) {
      ctx.fillStyle = scoreColor;
      ctx.font = `700 15px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText(label.toUpperCase(), W / 2, ty);
      ctx.letterSpacing = '0px';
      ty += 30;
    }

    const maxTitleW = W - PAD * 2;
    let fontSize = 64;
    ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    while (fontSize > 32 && ctx.measureText(title).width > maxTitleW * 0.88) {
      fontSize -= 2;
      ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    }
    const titleLines = wrapText(ctx, title, maxTitleW);
    const lineH = Math.round(fontSize * 1.16);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    titleLines.slice(0, 3).forEach((line, i) => {
      ctx.globalAlpha = (i === 2 && titleLines.length > 3) ? 0.45 : 1;
      ctx.fillText(line, W / 2, ty + i * lineH);
    });
    ctx.globalAlpha = 1;
    ty += Math.min(titleLines.length, 3) * lineH + 16;

    const meta = [year, type === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ');
    ctx.fillStyle = 'rgba(255,255,255,0.36)';
    ctx.font = `500 20px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(meta, W / 2, ty);

    drawBranding(H - 48);

  } else {
    // ── SQUARE (1:1) ──────────────────────────────────────────────────────
    const PAD = 40;
    const PH  = Math.round((H - PAD * 2) * 0.82); // ~18% shorter poster
    const PW  = Math.round(PH / 1.5);
    const PX  = PAD;
    const PY  = PAD + Math.round((H - PAD * 2 - PH) / 2); // vertically centered

    drawPoster(PX, PY, PW, PH, 16);

    const BR = 44;
    drawBadge(PX + PW - BR + 10, PY + PH - BR + 10, BR);

    const RX = PX + PW + 32;
    const RW = W - RX - PAD;
    let ry   = PY + 12;

    if (label) {
      ctx.fillStyle = scoreColor;
      ctx.font = `700 13px 'DM Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.letterSpacing = '2.5px';
      ctx.fillText(label.toUpperCase(), RX, ry);
      ctx.letterSpacing = '0px';
      ry += 26;
    }

    let fontSize = 44;
    ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    while (fontSize > 22 && ctx.measureText(title).width > RW * 0.95) {
      fontSize -= 2;
      ctx.font = `700 ${fontSize}px 'DM Sans', sans-serif`;
    }
    const titleLines = wrapText(ctx, title, RW);
    const lineH = Math.round(fontSize * 1.20);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    titleLines.slice(0, 4).forEach((line, i) => {
      ctx.globalAlpha = (i === 3 && titleLines.length > 4) ? 0.45 : 1;
      ctx.fillText(line, RX, ry + i * lineH);
    });
    ctx.globalAlpha = 1;
    ry += Math.min(titleLines.length, 4) * lineH + 16;

    const meta = [year, type === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ');
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.font = `500 16px 'DM Sans', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(meta, RX, ry);
    ry += 30;

    for (let i = 1; i <= 10; i++) {
      const dx = RX + (i - 1) * 16;
      ctx.beginPath();
      ctx.arc(dx + 5, ry, 4, 0, Math.PI * 2);
      ctx.fillStyle = i <= score ? scoreColor : 'rgba(255,255,255,0.12)';
      ctx.fill();
    }
    ry += 24;

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(RX, ry);
    ctx.lineTo(RX + RW, ry);
    ctx.stroke();
    ry += 20;

    if (username) {
      ctx.fillStyle = 'rgba(255,255,255,0.52)';
      ctx.font = `500 15px 'DM Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`@${username}`, RX, ry);
    }

    // Logo centered in right column near bottom
    const logoCenterX = RX + RW / 2;
    const logoBaseY   = PY + PH - 18;
    drawLogo(ctx, logoCenterX, logoBaseY, 15);
  }
}


// ─── ShareCard Modal ──────────────────────────────────────────────────────────
export default function ShareCard({ movieId, mediaType, score, onClose }) {
  const { t } = useTranslation();
  const { lang } = useTheme();
  const { profile } = useStore();
  const canvasRef   = useRef(null);
  const [format, setFormat]     = useState('story');
  const [details, setDetails]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sharing, setSharing]   = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const imagesRef = useRef({ poster: null, backdrop: null });

  const langCode = (() => {
    const map = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE', pt:'pt-BR', it:'it-IT', tr:'tr-TR', zh:'zh-CN' };
    return map[lang] || 'en-US';
  })();

  const ratingLabels = t('ratingLabels', { returnObjects: true });

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
          <div className="share-modal__header-logo">
            <span className="share-modal__header-logo-dot" />
            <Wordmark size="sm" />
          </div>
          <button className="share-modal__close" onClick={onClose} aria-label="Close">
            <CloseCircleLinear size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="share-modal__formats">
          <button
            className={'share-modal__fmt-btn' + (isStory ? ' active' : '')}
            onClick={() => setFormat('story')}
          >
            <span className="share-modal__fmt-icon share-modal__fmt-icon--story" />
            {t('shareCard.story')}
          </button>
          <button
            className={'share-modal__fmt-btn' + (!isStory ? ' active' : '')}
            onClick={() => setFormat('square')}
          >
            <span className="share-modal__fmt-icon share-modal__fmt-icon--square" />
            {t('shareCard.square')}
          </button>
        </div>

        <div className={'share-modal__preview' + (isStory ? ' story' : ' square')}>
          {loading && (
            <div className="share-modal__spinner-wrap">
              <div className="share-modal__spinner" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="share-modal__canvas"
            style={{ opacity: loading ? 0 : 1 }}
          />
        </div>

        <div className="share-modal__actions">
          <button className="share-modal__btn share-modal__btn--download" onClick={handleDownload}>
            <DownloadMinimalisticLinear size={15} />
            {downloaded ? t('shareCard.saved') : t('shareCard.download')}
          </button>
          {canShare && (
            <button
              className="share-modal__btn share-modal__btn--share"
              onClick={handleShare}
              disabled={sharing}
            >
              <ShareLinear size={15} />
              {sharing ? t('shareCard.sharing') : t('shareCard.share')}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}