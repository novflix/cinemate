import { useEffect, useRef } from 'react';
import './Effects.css';

// Feature 20: Fire particles near trending badge
export function FireParticles() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const sparks = [];
    const addSpark = () => {
      if (sparks.length > 30) return;
      sparks.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2 + 1.5),
        r: Math.random() * 2.5 + 1,
        life: 1,
        decay: Math.random() * 0.025 + 0.018,
        hue: Math.random() * 40,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() > 0.4) addSpark();
      sparks.forEach((s, i) => {
        s.x += s.vx; s.y += s.vy;
        s.vy -= 0.04;
        s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); return; }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = `hsl(${s.hue}, 100%, ${40 + s.life * 30}%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="fire-canvas"/>;
}

// Feature 21: Snow effect (shown Dec-Jan or via admin override)
export function SnowEffect() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const flakes = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3.5 + 1.0,
      vx: (Math.random() - 0.5) * 0.6,
      vy: Math.random() * 1.4 + 0.6,
      opacity: Math.random() * 0.55 + 0.35,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
    }));

    let last = 0;
    let paused = false;
    const onVis = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    const draw = (ts) => {
      raf = requestAnimationFrame(draw);
      if (paused || ts - last < 25) return;
      last = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flakes.forEach(f => {
        f.wobble += f.wobbleSpeed;
        f.x += f.vx + Math.sin(f.wobble) * 0.5;
        f.y += f.vy;
        if (f.y > canvas.height) { f.y = -8; f.x = Math.random() * canvas.width; }
        if (f.x > canvas.width)  f.x = 0;
        if (f.x < 0) f.x = canvas.width;
        ctx.globalAlpha = f.opacity;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="snow-canvas"/>;
}

// Feature 22: Gold sparks burst on rating 10
export function SparkBurst({ active, onDone }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cx = canvas.width / 2, cy = canvas.height / 2;

    const sparks = Array.from({ length: 60 }, (_, i) => {
      const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.3;
      const speed = Math.random() * 8 + 4;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#e8c547' : Math.random() > 0.5 ? '#ff6b35' : '#fff',
        life: 1, decay: Math.random() * 0.02 + 0.015,
      };
    });

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      sparks.forEach(s => {
        if (s.life <= 0) return;
        alive = true;
        s.x += s.vx; s.y += s.vy; s.vy += 0.3;
        s.life -= s.decay;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(draw);
      else if (onDone) onDone();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, onDone]);

  return <canvas ref={canvasRef} className="spark-burst-canvas"/>;
}