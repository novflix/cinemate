import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, memo } from 'react';
import { MagicStickLinear, TVLinear, StarLinear, ShuffleLinear, GlobalLinear, CloudLinear, HeartLinear, ForbiddenCircleLinear, SmileCircleLinear, VideoLibraryLinear, BoltCircleLinear, CheckCircleLinear, AltArrowRightLinear, PlayLinear, Chart2Linear, ClockCircleLinear, LayersLinear, Server2Linear } from 'solar-icon-set';
import './About.css';

/* ─── Hooks ─── */
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

function Counter({ to, suffix = '', duration = 1400 }) {
  const [ref, visible] = useReveal(0.5);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Reusable blocks ─── */
const Tag = ({ children }) => <span className="about-tag">{children}</span>;

const FeatureCard = memo(function FeatureCard({ icon: Icon, title, desc, delay, accent, tag }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-feature" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms`, '--ca': accent }}>
      <div className="about-feature__top">
        <div className="about-feature__icon"><Icon size={20} strokeWidth={1.8}/></div>
        {tag && <Tag>{tag}</Tag>}
      </div>
      <h3 className="about-feature__title">{title}</h3>
      <p className="about-feature__desc">{desc}</p>
    </div>
  );
});

const AlgoCard = memo(function AlgoCard({ item, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-algo__item" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="about-algo__icon" style={{ color: item.color, background: `${item.color}18` }}>
        {item.icon}
      </div>
      <div>
        <p className="about-algo__title" style={{ color: item.color }}>{item.title}</p>
        <p className="about-algo__desc">{item.desc}</p>
      </div>
    </div>
  );
});

const StepCard = memo(function StepCard({ step, i }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-step" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${i * 120}ms` }}>
      <div className="about-step__line">
        <div className="about-step__circle">
          <step.Icon size={18} strokeWidth={1.8}/>
        </div>
        {i < 2 && <div className="about-step__connector"/>}
      </div>
      <div className="about-step__body">
        <p className="about-step__num">0{i + 1}</p>
        <h3 className="about-step__title">{step.title}</h3>
        <p className="about-step__desc">{step.desc}</p>
      </div>
    </div>
  );
});

const TechCard = memo(function TechCard({ tech, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-tech" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="about-tech__icon" style={{ color: tech.color }}>{tech.icon}</div>
      <span className="about-tech__name">{tech.name}</span>
      <span className="about-tech__sub">{tech.sub}</span>
    </div>
  );
});


/* ─── Main ─── */
export default function About() {
  const { t: tr } = useTranslation();
  const [heroRef, heroVisible] = useReveal(0.01);

  const features = [
    { icon: MagicStickLinear, accent: '#e8c547',
      title: tr('about.smartRecs'),     tag: tr('about.smartRecsTag'),
      desc:  tr('about.smartRecsDesc') },
    { icon: StarLinear, accent: '#f97316',
      title: tr('about.ratings'),
      desc:  tr('about.ratingsDesc') },
    { icon: TVLinear, accent: '#3b82f6',
      title: tr('about.seriesTracker'), tag: tr('about.seriesTrackerTag'),
      desc:  tr('about.seriesTrackerDesc') },
    { icon: ShuffleLinear, accent: '#8b5cf6',
      title: tr('about.roulette'),
      desc:  tr('about.rouletteDesc') },
    { icon: ForbiddenCircleLinear, accent: '#ef4444',
      title: tr('about.notInterested'),
      desc:  tr('about.notInterestedDesc') },
    { icon: HeartLinear, accent: '#ec4899',
      title: tr('about.likedActors'),
      desc:  tr('about.likedActorsDesc') },
    { icon: GlobalLinear, accent: '#22c55e',
      title: tr('about.twoLanguages'),
      desc:  tr('about.twoLanguagesDesc') },
    { icon: CloudLinear, accent: '#0ea5e9',
      title: tr('about.cloudSync'),
      desc:  tr('about.cloudSyncDesc') },
    { icon: SmileCircleLinear, accent: '#eab308',
      title: tr('about.moodFilter'),
      desc:  tr('about.moodFilterDesc') },
  ];

  const stats = [
    { n: 900000, suffix: '+', label: tr('about.filmsShows'),  icon: <VideoLibraryLinear size={18}/> },
    { n: 50,     suffix: '+', label: tr('about.perSection'),  icon: <LayersLinear size={18}/> },
    { n: 10,  suffix: '/10',  label: tr('about.ratingScale'), icon: <Chart2Linear size={18}/> },
    { n: 5,  suffix: ' min',  label: tr('about.toFirstRecs'), icon: <ClockCircleLinear size={18}/> },
  ];

  const steps = [
    { Icon: VideoLibraryLinear, title: tr('about.save'),     desc: tr('about.saveDesc') },
    { Icon: StarLinear,         title: tr('about.rate'),     desc: tr('about.rateDesc') },
    { Icon: MagicStickLinear,   title: tr('about.discover'), desc: tr('about.discoverDesc') },
  ];

  const algo = [
    { icon: <StarLinear size={15}/>, color: '#e8c547', title: tr('about.rating910'),        desc: tr('about.rating910Desc') },
    { icon: <StarLinear size={15}/>, color: '#84cc16', title: tr('about.rating58'),         desc: tr('about.rating58Desc') },
    { icon: <StarLinear size={15}/>, color: '#6b7280', title: tr('about.rating13'),         desc: tr('about.rating13Desc') },
    { icon: <HeartLinear size={15}/>, color: '#ec4899', title: tr('about.likedActor'),      desc: tr('about.likedActorDesc') },
    { icon: <BoltCircleLinear size={15}/>, color: '#8b5cf6', title: tr('about.watchlistAlgo'), desc: tr('about.watchlistAlgoDesc') },
    { icon: <ForbiddenCircleLinear size={15}/>, color: '#ef4444', title: tr('about.notInterestedAlgo'), desc: tr('about.notInterestedAlgoDesc') },
  ];

  const tech = [
    { name: 'React 18', icon: <Server2Linear size={18}/>,      color: '#61DAFB', sub: tr('about.uiFramework') },
    { name: 'Supabase', icon: <CloudLinear size={18}/>,         color: '#3ECF8E', sub: tr('about.dbAuth') },
    { name: 'TMDB',     icon: <VideoLibraryLinear size={18}/>,  color: '#01D277', sub: tr('about.titles') },
    { name: 'Vercel',   icon: <BoltCircleLinear size={18}/>,    color: '#aaa',    sub: tr('about.deployment') },
  ];

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <section className="about-hero" ref={heroRef}>
        <div className="about-hero__orbs">
          <div className="about-orb about-orb--1"/>
          <div className="about-orb about-orb--2"/>
          <div className="about-orb about-orb--3"/>
          <div className="about-orb about-orb--4"/>
        </div>
        <div className={"about-hero__content" + (heroVisible ? ' revealed' : '')}>
          <div className="about-hero__pill">
            <span className="about-hero__dot"/>
            {tr('auth.personalCinima')}
          </div>
          <h1 className="about-hero__wordmark">
            CINI<span>MATE</span>
          </h1>
          <p className="about-hero__tagline">
            {tr('about.tagline')}
          </p>
          <div className="about-hero__badges">
            {[
              { icon: <CheckCircleLinear size={13}/>, label: tr('about.free') },
              { icon: <ForbiddenCircleLinear size={13}/>, label: tr('about.noAds') },
              { icon: <CloudLinear size={13}/>, label: tr('about.cloudSync') },
              { icon: <PlayLinear size={13}/>, label: 'PWA' },
            ].map((b, i) => (
              <span key={i} className="about-hero__badge">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
          <div className="about-hero__cta">
            <AltArrowRightLinear size={14}/>
            {tr('about.scrollDown')}
          </div>
        </div>
        <div className="about-hero__scroll-line"/>
      </section>

      {/* ── Stats ── */}
      <section className="about-stats">
        {stats.map((s, i) => (
          <div key={i} className="about-stat">
            <div className="about-stat__icon">{s.icon}</div>
            <div className="about-stat__val"><Counter to={s.n} suffix={s.suffix}/></div>
            <div className="about-stat__label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="about-section">
        <header className="about-section__header">
          <div className="about-pill">✦ {tr('about.featuresLabel')}</div>
          <h2 className="about-h2">
            {tr('about.featuresTitle')}
          </h2>
        </header>
        <div className="about-features-grid">
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 45}/>)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="about-section about-section--alt">
        <div className="about-section-inner">
          <header className="about-section__header">
            <div className="about-pill">✦ {tr('about.howLabel')}</div>
            <h2 className="about-h2">
              {tr('about.howTitle')}
            </h2>
          </header>
          <div className="about-steps">
            {steps.map((s, i) => <StepCard key={i} step={s} i={i}/>)}
          </div>
        </div>
      </section>

      {/* ── Algorithm ── */}
      <section className="about-section">
        <header className="about-section__header">
          <div className="about-pill">✦ {tr('about.algoLabel')}</div>
          <h2 className="about-h2">
            {tr('about.algoTitle')}
          </h2>
          <p className="about-h2-sub">
            {tr('about.algoSub')}
          </p>
        </header>
        <div className="about-algo">
          {algo.map((item, i) => <AlgoCard key={i} item={item} delay={i * 55}/>)}
        </div>
      </section>

      {/* ── Tech ── */}
      <section className="about-section about-section--alt">
        <div className="about-section-inner">
          <header className="about-section__header">
            <div className="about-pill">✦ {tr('about.techLabel')}</div>
            <h2 className="about-h2">{tr('about.techTitle')}</h2>
          </header>
          <div className="about-tech-grid">
            {tech.map((t, i) => <TechCard key={i} tech={t} delay={i * 70}/>)}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="about-footer">
        <p className="about-footer__mark">CINI<span>MATE</span></p>
        <p className="about-footer__sub">{tr('about.footerSub')}</p>
        <p className="about-footer__tmdb">
          {tr('about.footerTmdb')}
        </p>
      </footer>

    </div>
  );
}