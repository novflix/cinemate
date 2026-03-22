import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ScrollRow.css';

const ScrollRow = memo(function ScrollRow({ children }) {
  const ref      = useRef(null);
  const rafRef   = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  // Throttle scroll updates via rAF
  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      update();
      rafRef.current = null;
    });
  }, [update]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [update, onScroll, children]);

  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 480, behavior: 'smooth' });
  };

  return (
    <div className="scroll-row-wrap">
      {canLeft && (
        <button className="scroll-row-arrow scroll-row-arrow--left" onClick={() => scroll(-1)}>
          <ChevronLeft size={20}/>
        </button>
      )}
      <div ref={ref} className="home-section__scroll">
        {children}
      </div>
      {canRight && (
        <button className="scroll-row-arrow scroll-row-arrow--right" onClick={() => scroll(1)}>
          <ChevronRight size={20}/>
        </button>
      )}
    </div>
  );
});

export default ScrollRow;