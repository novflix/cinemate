import { useEffect, useRef } from 'react';
import './Particles.css';

export default function Particles() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let raf;
    let paused = false;

    // Reduced from 55 → 28 particles
    const COUNT = 28;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const particles = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 1.0 + 0.3,
      vx:    (Math.random() - 0.5) * 0.12,   // slower: was 0.18
      vy:    (Math.random() - 0.5) * 0.12,
      alpha: Math.random() * 0.35 + 0.05,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Pause animation when tab is not visible — saves GPU/CPU
    const onVisibility = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    // Throttle to ~30fps instead of 60fps (sufficient for slow particles)
    let last = 0;
    const draw = (ts) => {
      raf = requestAnimationFrame(draw);
      if (paused) return;
      if (ts - last < 33) return;  // ~30fps cap
      last = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(232,197,71,1)'; // set once
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.008;
        if (p.x < 0)              p.x = canvas.width;
        if (p.x > canvas.width)   p.x = 0;
        if (p.y < 0)              p.y = canvas.height;
        if (p.y > canvas.height)  p.y = 0;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas"/>;
}