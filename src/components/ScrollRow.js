import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ScrollRow.css';

export default function ScrollRow({ children, className = '' }) {
  const ref      = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [update, children]);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    // Scroll by ~3 card widths
    el.scrollBy({ left: dir * 480, behavior: 'smooth' });
  };

  return (
    <div className="scroll-row-wrap">
      {canLeft && (
        <button className="scroll-row-arrow scroll-row-arrow--left" onClick={() => scroll(-1)}>
          <ChevronLeft size={20}/>
        </button>
      )}
      <div ref={ref} className={`home-section__scroll ${className}`}>
        {children}
      </div>
      {canRight && (
        <button className="scroll-row-arrow scroll-row-arrow--right" onClick={() => scroll(1)}>
          <ChevronRight size={20}/>
        </button>
      )}
    </div>
  );
}