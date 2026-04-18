import { useState, useEffect } from 'react';

// Module-level cache: same poster URL → same color, no reprocessing
const colorCache = new Map();

export function useDominantColor(imageUrl) {
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!imageUrl) { setColor(null); return; }
    if (colorCache.has(imageUrl)) { setColor(colorCache.get(imageUrl)); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 50; canvas.height = 75;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 75);
        const data = ctx.getImageData(0, 0, 50, 75).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i], pg = data[i+1], pb = data[i+2];
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 30 && brightness < 220) { r += pr; g += pg; b += pb; count++; }
        }
        if (!count) { setColor(null); return; }
        r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count);
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        const sat = max === 0 ? 0 : (max-min)/max;
        if (sat < 0.15) { setColor(null); return; }
        setColor(`${r},${g},${b}`); // return as "r,g,b" for flexible usage
      } catch { setColor(null); }
    };
    img.onerror = () => setColor(null);
    img.src = imageUrl;
  }, [imageUrl]);

  return color;
}