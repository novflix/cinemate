import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme';
import './About.css';

// ─── Intersection observer hook for scroll reveals ─────────────────────────
function useReveal(threshold = 0.15) {
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

// ─── Animated counter ─────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [ref, visible] = useReveal(0.5);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 40);
    const t = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(start);
      if (start >= to) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [visible, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Feature card ─────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={"about-feature" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="about-feature__icon">{icon}</div>
      <h3 className="about-feature__title">{title}</h3>
      <p className="about-feature__desc">{desc}</p>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────
function SectionLabel({ children }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-section-label" + (visible ? ' revealed' : '')}>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

function StepCard({ step, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-step" + (visible ? ' revealed' : '')} style={{ transitionDelay: `${delay}ms` }}>
      <div className="about-step__n">{step.n}</div>
      <div className="about-step__body">
        <h3 className="about-step__title">{step.title}</h3>
        <p className="about-step__desc">{step.desc}</p>
      </div>
    </div>
  );
}

function TechCard({ tech, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-tech" + (visible ? ' revealed' : '')} style={{ transitionDelay: `${delay}ms` }}>
      <span className="about-tech__name">{tech.name}</span>
      <span className="about-tech__sub">{tech.sub}</span>
    </div>
  );
}

export default function About() {
  const { lang } = useTheme();
  const ru = lang === 'ru';

  const features = [
    { icon: '🎬', title: ru ? 'Умные рекомендации' : 'Smart Recommendations',
      desc: ru ? 'Алгоритм учится на твоих оценках и лайках актёров. Чем больше смотришь — тем точнее подборка.' : 'Algorithm learns from your ratings and liked actors. The more you watch, the sharper it gets.' },
    { icon: '⭐', title: ru ? 'Оценки и вкусы' : 'Ratings & Taste Profile',
      desc: ru ? 'Оцени фильм от 1 до 10 — и система сразу поймёт что тебе нравится, а что нет.' : 'Rate films 1–10 and the system instantly maps what you love and what to skip.' },
    { icon: '🎲', title: ru ? 'Рулетка' : 'Watchlist Roulette',
      desc: ru ? 'Не можешь выбрать? Крути рулетку — она выберет фильм из твоего списка за тебя.' : "Can't decide? Spin the wheel and let it pick tonight's movie from your list." },
    { icon: '🌍', title: ru ? 'Два языка' : 'Two Languages',
      desc: ru ? 'Полный русский и английский интерфейс. Постеры, описания и названия — всё на выбранном языке.' : 'Full Russian and English support. Posters, descriptions and titles in your chosen language.' },
    { icon: '☁️', title: ru ? 'Облачный синк' : 'Cloud Sync',
      desc: ru ? 'Войди через email и все твои списки, оценки и настройки будут доступны на любом устройстве.' : 'Sign in with email and your lists, ratings and settings sync across every device.' },
    { icon: '❤️', title: ru ? 'Любимые актёры' : 'Liked Actors',
      desc: ru ? 'Лайкни актёра на его странице — и рекомендации сразу начнут подтягивать его фильмы.' : 'Like an actor on their page and recommendations instantly surface more of their work.' },
    { icon: '🚫', title: ru ? '«Не интересно»' : '"Not Interested"',
      desc: ru ? 'Наведи на карточку в рекомендациях и убери фильм навсегда. Алгоритм запомнит.' : 'Hover a rec card and dismiss it forever. The algorithm remembers.' },
    { icon: '📱', title: ru ? 'Работает на iPhone' : 'iPhone Ready',
      desc: ru ? 'Добавь на главный экран и используй как нативное приложение — без App Store.' : 'Add to home screen and use it like a native app — no App Store needed.' },
    { icon: '🎭', title: ru ? 'Настроение вечера' : 'Mood Filter',
      desc: ru ? 'Фильтр настроения на главной — выбери «Страшно», «Экшен» или «Поплакать» и получи нужную подборку.' : 'Mood filter on home — pick Scary, Action or Drama and get the right picks instantly.' },
  ];

  const stats = [
    { n: 900000, suffix: '+', label: ru ? 'фильмов в базе' : 'films in database' },
    { n: 50, suffix: '+', label: ru ? 'на каждой странице' : 'per section' },
    { n: 8, suffix: '', label: ru ? 'секций на главной' : 'home sections' },
    { n: 10, suffix: '/10', label: ru ? 'система оценок' : 'rating scale' },
  ];

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="about-hero__bg">
          {/* Film grain overlay */}
          <div className="about-hero__grain"/>
          {/* Animated gradient orbs */}
          <div className="about-hero__orb about-hero__orb--1"/>
          <div className="about-hero__orb about-hero__orb--2"/>
          <div className="about-hero__orb about-hero__orb--3"/>
        </div>
        <div className="about-hero__content">
          <div className="about-hero__eyebrow">
            <span className="about-hero__dot"/>
            {ru ? 'ТВОЙ ЛИЧНЫЙ КИНОТЕАТР' : 'YOUR PERSONAL CINEMA'}
          </div>
          <h1 className="about-hero__title">
            CINE<span>MATE</span>
          </h1>
          <p className="about-hero__sub">
            {ru
              ? 'Открывай фильмы. Сохраняй списки. Получай рекомендации которые реально работают.'
              : 'Discover films. Build your lists. Get recommendations that actually work.'}
          </p>
          <div className="about-hero__scroll-hint">
            <div className="about-hero__scroll-arrow"/>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="about-stats">
        {stats.map((s, i) => (
          <div key={i} className="about-stat">
            <div className="about-stat__n">
              <Counter to={s.n} suffix={s.suffix}/>
            </div>
            <div className="about-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <div className="about-section">
        <SectionLabel>{ru ? '✦ ВОЗМОЖНОСТИ' : '✦ FEATURES'}</SectionLabel>
        <h2 className="about-section__title">
          {ru ? 'Всё что нужно для\nидеального киновечера' : 'Everything you need for\nthe perfect movie night'}
        </h2>
        <div className="about-features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 60}/>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="about-section about-section--dark">
        <SectionLabel>{ru ? '✦ КАК ЭТО РАБОТАЕТ' : '✦ HOW IT WORKS'}</SectionLabel>
        <h2 className="about-section__title">
          {ru ? 'Три шага до\nидеальной подборки' : 'Three steps to\nthe perfect queue'}
        </h2>
        <div className="about-steps">
          {[
            { n: '01', title: ru ? 'Сохраняй' : 'Save',
              desc: ru ? 'Добавляй фильмы в «Хочу посмотреть» и отмечай просмотренные' : 'Add films to Watchlist and mark what you\'ve seen' },
            { n: '02', title: ru ? 'Оценивай' : 'Rate',
              desc: ru ? 'Ставь оценки от 1 до 10 — алгоритм учится на каждой' : 'Rate from 1 to 10 — the algorithm learns from each one' },
            { n: '03', title: ru ? 'Получай рекомендации' : 'Get Recs',
              desc: ru ? 'Переходи во вкладку «Для вас» и открывай бесконечную ленту подобранных фильмов' : 'Go to "For You" and scroll through an infinite personalised feed' },
          ].map((step, i) => (
            <StepCard key={i} step={step} delay={i * 120}/>
          ))}
        </div>
      </div>

      {/* ── Tech stack ── */}
      <div className="about-section">
        <SectionLabel>{ru ? '✦ ПОД КАПОТОМ' : '✦ UNDER THE HOOD'}</SectionLabel>
        <div className="about-tech-grid">
          {[
            { name: 'React 18', sub: ru ? 'Интерфейс' : 'UI' },
            { name: 'Supabase', sub: ru ? 'База данных' : 'Database' },
            { name: 'TMDB API', sub: ru ? '900k+ фильмов' : '900k+ films' },
            { name: 'Vercel',   sub: ru ? 'Хостинг' : 'Hosting' },
          ].map((tech, i) => (
            <TechCard key={i} tech={tech} delay={i * 80}/>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="about-footer">
        <p className="about-footer__logo">CINE<span>MATE</span></p>
        <p className="about-footer__copy">
          {ru ? 'Сделано с ❤️ для киноманов' : 'Made with ❤️ for film lovers'}
        </p>
        <p className="about-footer__tmdb">
          {ru
            ? 'Данные предоставлены The Movie Database (TMDB)'
            : 'Movie data provided by The Movie Database (TMDB)'}
        </p>
      </div>

    </div>
  );
}