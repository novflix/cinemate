import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MagicStickLinear, TVLinear, StarLinear, ShuffleLinear,
  GlobalLinear, CloudLinear, HeartLinear, ForbiddenCircleLinear,
  SmileCircleLinear, VideoLibraryLinear, CheckCircleLinear, PlayLinear,
  BookmarkLinear, ListLinear, UserLinear, PhoneLinear,
} from 'solar-icon-set';
import './About.css';

/* ─── Reveal hook ─── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Counter ─── */
function Counter({ to, suffix = '', duration = 1600 }) {
  const [ref, visible] = useReveal(0.5);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Canvas Particle Field ─── */
function ParticleField() {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles, raf;
    const COLORS = ['rgba(232,197,71,', 'rgba(255,107,53,', 'rgba(139,92,246,', 'rgba(59,130,246,'];

    const init = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      const count = Math.min(Math.floor((W * H) / 10000), 90);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.6 + 0.08,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(232,197,71,' + (0.07 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener('resize', init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init); };
  }, []);

  return <canvas ref={canvasRef} className="about-particles"/>;
}

/* ─── Floating movie posters ─── */
const POSTERS = [
  '/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg', // Interstellar
  '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', // Oppenheimer
  '/hA2ple9q4qnwxp3hKVNhroipsir.jpg', // La La Land
  '/AiAm0EtDvyHSIGdSsqlab83SMQB.jpg', // Parasite
  '/kuf6dutpsT0vSVehic3EZIqkOBt.jpg', // The Dark Knight
  '/iuFNMS8vlodQgcHc2aHFcep6WBc.jpg', // Blade Runner 2049
  '/fiVW06jE7z9YnO4trhaMEdclSiC.jpg', // Dune
  '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', // Pulp Fiction
  '/rCzpyhYLOver3x3QW8fugge0C0I.jpg', // The Godfather
  '/kBf3g9crrADGMc2AMAMlLBgSm2h.jpg', // Fight Club
  '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', // Inception
  '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',  // 1917
  '/8Gxv8giaFIelhEDznqervkhO4oa.jpg',  // Whiplash
  '/velWPhVMQeQKcxggNEU8YmIo52R.jpg',  // Joker
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',  // The Shawshank Redemption
];

function FloatingPosters() {
  return (
    <div className="about-posters" aria-hidden="true">
      {POSTERS.map((id, i) => (
        <div key={i} className={`about-poster about-poster--${i}`}>
          <img src={`https://image.tmdb.org/t/p/w342${id}`} alt="" loading="lazy"
            onError={e => { e.target.parentElement.style.display = 'none'; }}/>
        </div>
      ))}
    </div>
  );
}

/* ─── Marquee ─── */
function Marquee({ items, reverse }) {
  return (
    <div className={'about-marquee' + (reverse ? ' about-marquee--rev' : '')}>
      <div className="about-marquee__track">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="about-marquee__item">
            <span className="about-marquee__dot"/>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature card ─── */
const FeatureCard = memo(function FeatureCard({ icon: Icon, title, desc, delay, accent, tag }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={'about-feat' + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms`, '--ca': accent }}>
      <div className="about-feat__icon"><Icon size={20}/></div>
      {tag && <span className="about-feat__tag">{tag}</span>}
      <h3 className="about-feat__title">{title}</h3>
      <p className="about-feat__desc">{desc}</p>
      <div className="about-feat__glow"/>
    </div>
  );
});

/* ─── Step card ─── */
const StepCard = memo(function StepCard({ icon: Icon, num, title, desc, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={'about-step' + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="about-step__num">{num}</div>
      <div className="about-step__icon"><Icon size={22}/></div>
      <h3 className="about-step__title">{title}</h3>
      <p className="about-step__desc">{desc}</p>
    </div>
  );
});

/* ─── Stat item ─── */
function StatItem({ n, suffix, label, delay }) {
  const [ref, visible] = useReveal(0.3);
  return (
    <div ref={ref} className={'about-stat' + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="about-stat__val"><Counter to={n} suffix={suffix}/></div>
      <div className="about-stat__label">{label}</div>
    </div>
  );
}

/* ─── Algorithm section ─── */
function AlgoSection() {
  const [ref, visible] = useReveal(0.1);
  const { t } = useTranslation();
  const signals = [
    { label: t('about.signal1Label'), color: '#e8c547', weight: 95, desc: t('about.signal1Desc') },
    { label: t('about.signal2Label'), color: '#ec4899', weight: 80, desc: t('about.signal2Desc') },
    { label: t('about.signal3Label'), color: '#84cc16', weight: 55, desc: t('about.signal3Desc') },
    { label: t('about.signal4Label'), color: '#8b5cf6', weight: 45, desc: t('about.signal4Desc') },
    { label: t('about.signal5Label'), color: '#f97316', weight: 20, desc: t('about.signal5Desc') },
    { label: t('about.signal6Label'), color: '#6b7280', weight:  8, desc: t('about.signal6Desc') },
  ];

  return (
    <section className="about-algo" ref={ref}>
      <div className="about-algo__bg"/>
      <div className="about-algo__inner">
        <div className="about-section__label">✦ {t('about.algoLabel')}</div>
        <h2 className="about-h2" dangerouslySetInnerHTML={{ __html: t('about.algoTitle') }}/>
        <p className="about-algo__sub">{t('about.algoSub')}</p>
        <div className="about-algo__signals">
          {signals.map((s, i) => (
            <div key={i} className="about-signal">
              <div className="about-signal__top">
                <span className="about-signal__label">{s.label}</span>
                <span className="about-signal__desc">{s.desc}</span>
              </div>
              <div className="about-signal__bar">
                <div className="about-signal__fill" style={{
                  width: visible ? `${s.weight}%` : '0%',
                  background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`,
                  transitionDelay: `${0.25 + i * 0.1}s`,
                }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Mood showcase section ─── */
function MoodSection() {
  const { t } = useTranslation();
  const [ref, visible] = useReveal(0.1);
  const moods = [
    { emoji: '😨', label: t('about.moodScary'),   color: '#ef4444', films: ['Hereditary', 'The Shining', 'Midsommar'] },
    { emoji: '💥', label: t('about.moodAction'),  color: '#f97316', films: ['Mad Max', 'John Wick', 'Mission Impossible'] },
    { emoji: '😂', label: t('about.moodComedy'),  color: '#e8c547', films: ['The Grand Budapest Hotel', 'Superbad', 'Game Night'] },
    { emoji: '😢', label: t('about.moodDrama'),   color: '#3b82f6', films: ['Schindler\'s List', 'Marriage Story', 'Atonement'] },
    { emoji: '💘', label: t('about.moodRomance'), color: '#ec4899', films: ['La La Land', 'About Time', 'Before Sunrise'] },
    { emoji: '🤯', label: t('about.moodMindBlown'), color: '#8b5cf6', films: ['Inception', 'Tenet', 'Coherence'] },
  ];
  const [active, setActive] = useState(0);

  return (
    <section className="about-moods" ref={ref}>
      <div className="about-moods__inner">
        <div className="about-section__label">✦ {t('about.moodLabel')}</div>
        <h2 className="about-h2" dangerouslySetInnerHTML={{ __html: t('about.moodTitle') }}/>
        <p className="about-moods__sub">{t('about.moodSub')}</p>
        <div className={'about-moods__grid' + (visible ? ' revealed' : '')}>
          {moods.map((m, i) => (
            <button
              key={i}
              className={'about-mood-pill' + (active === i ? ' active' : '')}
              style={{ '--mc': m.color }}
              onClick={() => setActive(i)}
            >
              <span className="about-mood-pill__emoji">{m.emoji}</span>
              <span className="about-mood-pill__label">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="about-moods__result" style={{ '--mc': moods[active].color }}>
          <div className="about-moods__result-label">{t('about.moodResultLabel')}</div>
          <div className="about-moods__films">
            {moods[active].films.map((f, i) => (
              <div key={i} className="about-moods__film" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="about-moods__film-num">0{i+1}</span>
                <span className="about-moods__film-name">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Watchlist showcase ─── */
function WatchlistSection() {
  const { t } = useTranslation();
  const [ref, visible] = useReveal(0.1);
  const items = [
    { poster: '/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg', title: 'Interstellar',   year: 2014, rating: 9 },
    { poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', title: 'Oppenheimer',    year: 2023, rating: 8 },
    { poster: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg', title: 'La La Land',     year: 2016, rating: 7 },
    { poster: '/fiVW06jE7z9YnO4trhaMEdclSiC.jpg', title: 'Dune',           year: 2021, rating: null },
    { poster: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', title: 'Blade Runner',   year: 2017, rating: null },
  ];

  return (
    <section className="about-watchlist" ref={ref}>
      <div className="about-watchlist__inner">
        <div className="about-watchlist__text">
          <div className="about-section__label">✦ {t('about.watchlistLabel')}</div>
          <h2 className="about-h2" dangerouslySetInnerHTML={{ __html: t('about.watchlistTitle') }}/>
          <p className="about-watchlist__sub">{t('about.watchlistSub')}</p>
          <div className="about-watchlist__perks">
            {[
              { icon: <BookmarkLinear size={16}/>, text: t('about.watchlistPerk1') },
              { icon: <CheckCircleLinear size={16}/>, text: t('about.watchlistPerk2') },
              { icon: <TVLinear size={16}/>, text: t('about.watchlistPerk3') },
              { icon: <CloudLinear size={16}/>, text: t('about.watchlistPerk4') },
            ].map((p, i) => (
              <div key={i} className="about-watchlist__perk">
                <span className="about-watchlist__perk-icon">{p.icon}</span>
                {p.text}
              </div>
            ))}
          </div>
        </div>
        <div className={'about-watchlist__mockup' + (visible ? ' revealed' : '')}>
          <div className="about-mockup">
            <div className="about-mockup__header">
              <span className="about-mockup__title">{t('about.watchlistMockupTitle')}</span>
              <span className="about-mockup__count">{items.length}</span>
            </div>
            <div className="about-mockup__list">
              {items.map((item, i) => (
                <div key={i} className="about-mockup__item" style={{ animationDelay: `${i * 0.07}s` }}>
                  <img className="about-mockup__poster"
                    src={`https://image.tmdb.org/t/p/w92${item.poster}`} alt=""
                    onError={e => { e.target.style.background = 'var(--surface2)'; }}/>
                  <div className="about-mockup__info">
                    <span className="about-mockup__name">{item.title}</span>
                    <span className="about-mockup__year">{item.year}</span>
                  </div>
                  {item.rating
                    ? <span className="about-mockup__rating">{item.rating}/10</span>
                    : <span className="about-mockup__badge">{t('about.watchlistMockupWant')}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA section ─── */
function CtaSection() {
  const { t } = useTranslation();
  const [ref, visible] = useReveal(0.2);
  return (
    <section className="about-cta" ref={ref}>
      <div className="about-cta__orb"/>
      <div className="about-cta__orb2"/>
      <div className={'about-cta__content' + (visible ? ' revealed' : '')}>
        <h2 className="about-cta__title" dangerouslySetInnerHTML={{ __html: t('about.ctaTitle') }}/>
        <p className="about-cta__sub">{t('about.ctaSub')}</p>
        <div className="about-cta__perks">
          {[
            { icon: <CheckCircleLinear size={15}/>, label: t('about.free') },
            { icon: <ForbiddenCircleLinear size={15}/>, label: t('about.noAds') },
            { icon: <CloudLinear size={15}/>, label: t('about.cloudSync') },
            { icon: <PlayLinear size={15}/>, label: t('about.ctaPwa') },
            { icon: <PhoneLinear size={15}/>, label: t('about.ctaMobile') },
          ].map((p, i) => (
            <div key={i} className="about-cta__perk">{p.icon} {p.label}</div>
          ))}
        </div>
        <div className="about-filmstrip">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="about-filmstrip__frame"/>)}
        </div>
      </div>
    </section>
  );
}

/* ─── Main export ─── */
export default function About() {
  const { t } = useTranslation();
  const [heroRef, heroVisible] = useReveal(0.01);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const handleMouse = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, []);

  const features = [
    { icon: MagicStickLinear, accent: '#e8c547', tag: t('about.smartRecsTag'),     title: t('about.smartRecs'),     desc: t('about.smartRecsDesc') },
    { icon: StarLinear,        accent: '#f97316',                                    title: t('about.ratings'),       desc: t('about.ratingsDesc') },
    { icon: TVLinear,          accent: '#3b82f6', tag: t('about.seriesTrackerTag'), title: t('about.seriesTracker'), desc: t('about.seriesTrackerDesc') },
    { icon: ShuffleLinear,     accent: '#8b5cf6',                                    title: t('about.roulette'),      desc: t('about.rouletteDesc') },
    { icon: SmileCircleLinear, accent: '#eab308',                                    title: t('about.moodFilter'),    desc: t('about.moodFilterDesc') },
    { icon: HeartLinear,       accent: '#ec4899',                                    title: t('about.likedActors'),   desc: t('about.likedActorsDesc') },
    { icon: ForbiddenCircleLinear, accent: '#ef4444',                                title: t('about.notInterested'), desc: t('about.notInterestedDesc') },
    { icon: GlobalLinear,      accent: '#22c55e',                                    title: t('about.twoLanguages'),  desc: t('about.twoLanguagesDesc') },
    { icon: CloudLinear,       accent: '#0ea5e9',                                    title: t('about.cloudSync'),     desc: t('about.cloudSyncDesc') },
  ];

  const stats = [
    { n: 900000, suffix: '+',    label: t('about.filmsShows') },
    { n: 50,     suffix: '+',    label: t('about.perSection') },
    { n: 5,      suffix: ' мин', label: t('about.toFirstRecs') },
    { n: 10,     suffix: '/10',  label: t('about.ratingScale') },
  ];

  const steps = [
    { icon: VideoLibraryLinear, title: t('about.save'),     desc: t('about.saveDesc') },
    { icon: StarLinear,         title: t('about.rate'),     desc: t('about.rateDesc') },
    { icon: MagicStickLinear,   title: t('about.discover'), desc: t('about.discoverDesc') },
  ];

  const row1 = t('about.marqueeRow1', { returnObjects: true });
  const row2 = t('about.marqueeRow2', { returnObjects: true });

  return (
    <div className="about-page">

      {/* ── HERO ── */}
      <section className="about-hero" ref={heroRef} onMouseMove={handleMouse}>
        <ParticleField/>
        <FloatingPosters/>
        <div className="about-hero__cursor-glow" style={{ left: `${mouse.x}%`, top: `${mouse.y}%` }}/>
        <div className="about-hero__orbs" aria-hidden="true">
          <div className="about-orb about-orb--1"/>
          <div className="about-orb about-orb--2"/>
          <div className="about-orb about-orb--3"/>
        </div>
        <div className={'about-hero__content' + (heroVisible ? ' revealed' : '')}>
          <div className="about-hero__eyebrow">
            <span className="about-hero__dot"/>
            {t('about.heroEyebrow')}
          </div>
          <h1 className="about-hero__wordmark">CINI<em>MATE</em></h1>
          <p className="about-hero__tagline">{t('about.heroTagline')}</p>
          <div className="about-hero__badges">
            {[
              { icon: <CheckCircleLinear size={13}/>, label: t('about.free') },
              { icon: <ForbiddenCircleLinear size={13}/>, label: t('about.noAds') },
              { icon: <CloudLinear size={13}/>, label: t('about.cloudSync') },
              { icon: <PlayLinear size={13}/>, label: 'PWA' },
            ].map((b, i) => (
              <span key={i} className="about-hero__badge">{b.icon} {b.label}</span>
            ))}
          </div>
          <div className="about-hero__scroll">
            <div className="about-scroll-line"/>
            <span>{t('about.heroScroll')}</span>
            <div className="about-scroll-line"/>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="about-marquees">
        <Marquee items={Array.isArray(row1) ? row1 : []} />
        <Marquee items={Array.isArray(row2) ? row2 : []} reverse />
      </div>

      {/* ── STATS ── */}
      <section className="about-stats-wrap">
        {stats.map((s, i) => <StatItem key={i} {...s} delay={i * 80}/>)}
      </section>

      {/* ── FEATURES ── */}
      <section className="about-section">
        <div className="about-section__label">✦ {t('about.featuresLabel')}</div>
        <h2 className="about-h2" dangerouslySetInnerHTML={{ __html: t('about.featuresTitle') }}/>
        <div className="about-features-grid">
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 45}/>)}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="about-how">
        <div className="about-how__inner">
          <div className="about-how__left">
            <div className="about-section__label">✦ {t('about.howLabel')}</div>
            <h2 className="about-h2" dangerouslySetInnerHTML={{ __html: t('about.howTitle') }}/>
            <p className="about-how__sub">{t('about.howSub')}</p>
          </div>
          <div className="about-how__steps">
            {steps.map((s, i) => <StepCard key={i} {...s} num={`0${i+1}`} delay={i * 130}/>)}
          </div>
        </div>
      </section>

      {/* ── MOOD SECTION ── */}
      <MoodSection/>

      {/* ── WATCHLIST MOCKUP ── */}
      <WatchlistSection/>

      {/* ── ALGORITHM ── */}
      <AlgoSection/>

      {/* ── CTA ── */}
      <CtaSection/>

      {/* ── FOOTER ── */}
      <footer className="about-footer">
        <p className="about-footer__mark">CINI<em>MATE</em></p>
        <p className="about-footer__sub">{t('about.footerSub')}</p>
        <p className="about-footer__tmdb">{t('about.footerTmdb')}</p>
      </footer>

    </div>
  );
}