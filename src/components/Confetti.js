import { useEffect, useRef } from 'react';

export default function Confetti({ active, color = '#22c55e' }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;

    const SHAPES = ['★', '', '✦', '●'];
    const particles = Array.from({ length: 28 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size: Math.random() * 12 + 8,
        color: Math.random() > 0.5 ? color : '#fff',
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
      };
    });

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.25;
        p.life -= p.decay;
        p.rot += p.rotV;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px sans-serif`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillText(p.shape, -p.size/2, p.size/2);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, color]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 600,
      }}
    />
  );
}