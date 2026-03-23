import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from '../theme';
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
  const { lang } = useTheme();
  const ru = lang === 'ru';
  const [heroRef, heroVisible] = useReveal(0.01);

  const features = [
    { icon: MagicStickLinear, accent: '#e8c547',
      title: ru ? 'Умные рекомендации' : 'Smart Recommendations',
      tag:   ru ? 'Главное' : 'Core',
      desc:  ru ? 'Алгоритм строит твой вкусовой профиль из оценок, лайков актёров и списков. Чем больше смотришь — тем точнее.' : 'Algorithm builds a taste profile from ratings, liked actors and lists. The more you use it, the sharper it gets.' },
    { icon: StarLinear, accent: '#f97316',
      title: ru ? 'Рейтинги 1–10' : 'Ratings 1–10',
      desc:  ru ? 'Оценивай после просмотра. 9–10 = сильный сигнал для похожих фильмов. 1–3 = только этот фильм плохой, не жанр.' : 'Rate after watching. 9–10 = strong signal for similar films. 1–3 = just this film, not the whole genre.' },
    { icon: TVLinear, accent: '#3b82f6',
      title: ru ? 'Трекер сериалов' : 'Series Tracker',
      tag:   ru ? 'Новое' : 'New',
      desc:  ru ? 'Отмечай на каком сезоне и серии. Сериалы в процессе выделяются отдельно в очереди.' : 'Track which season and episode you\'re on. In-progress shows appear at the top of your queue.' },
    { icon: ShuffleLinear, accent: '#8b5cf6',
      title: ru ? 'Рулетка' : 'Roulette',
      desc:  ru ? 'Крути рулетку — она выберет фильм из очереди. Полезно когда не можешь решить.' : 'Spin the wheel to pick from your queue. Perfect when you can\'t decide.' },
    { icon: ForbiddenCircleLinear, accent: '#ef4444',
      title: ru ? '«Не интересно»' : '"Not Interested"',
      desc:  ru ? 'Нажми ✕ на карточке — фильм исчезнет навсегда. Алгоритм запомнит и не покажет снова.' : 'Tap ✕ on a card — it vanishes forever. The algorithm learns and never shows it again.' },
    { icon: HeartLinear, accent: '#ec4899',
      title: ru ? 'Любимые актёры' : 'Liked Actors',
      desc:  ru ? 'Лайкни актёра — его фильмография сразу подтягивается в рекомендации с высоким приоритетом.' : 'Like an actor and their filmography gets high-priority placement in your recs.' },
    { icon: GlobalLinear, accent: '#22c55e',
      title: ru ? 'Два языка' : 'Two Languages',
      desc:  ru ? 'Полная локализация: постеры, описания, названия — на выбранном языке.' : 'Full localisation: posters, overviews and titles switch to your chosen language.' },
    { icon: CloudLinear, accent: '#0ea5e9',
      title: ru ? 'Облачный синк' : 'Cloud Sync',
      desc:  ru ? 'Войди через email — все данные доступны на любом устройстве.' : 'Sign in with email and everything syncs across every device.' },
    { icon: SmileCircleLinear, accent: '#eab308',
      title: ru ? 'Фильтр настроения' : 'Mood Filter',
      desc:  ru ? 'Выбери вайб — «Страшно», «Экшен», «Поплакать» — получи нужную подборку мгновенно.' : 'Pick a vibe — Scary, Action, Drama — and get a tuned feed instantly.' },
  ];

  const stats = [
    { n: 900000, suffix: '+', label: ru ? 'фильмов и сериалов' : 'films & shows', icon: <VideoLibraryLinear size={18}/> },
    { n: 50,     suffix: '+', label: ru ? 'в каждой секции'   : 'per section',   icon: <LayersLinear size={18}/> },
    { n: 10,     suffix: '/10', label: ru ? 'шкала оценок'    : 'rating scale',  icon: <Chart2Linear size={18}/> },
    { n: 5,      suffix: ' min', label: ru ? 'до первых рекомендаций' : 'to first recs', icon: <ClockCircleLinear size={18}/> },
  ];

  const steps = [
    { Icon: VideoLibraryLinear,
      title: ru ? 'Сохраняй' : 'Save',
      desc:  ru ? 'Добавляй в «Хочу посмотреть» и отмечай просмотренные. Для сериалов — указывай сезон.' : 'Add to Watchlist and mark what you\'ve seen. For shows, track your exact episode.' },
    { Icon: StarLinear,
      title: ru ? 'Оценивай' : 'Rate',
      desc:  ru ? 'Ставь оценки 1–10 после просмотра. Каждая оценка точнее настраивает алгоритм.' : 'Rate 1–10 after watching. Every rating fine-tunes the algorithm further.' },
    { Icon: MagicStickLinear,
      title: ru ? 'Открывай' : 'Discover',
      desc:  ru ? 'Вкладка «Для вас» — бесконечная лента подобранных именно под тебя фильмов.' : 'The "For You" tab is an infinite feed tuned precisely to your taste.' },
  ];

  const algo = [
    { icon: <StarLinear size={15}/>, color: '#e8c547',
      title: ru ? 'Оценка 9–10' : 'Rating 9–10',
      desc:  ru ? 'Сильнейший seed. Через TMDB /recommendations ищем максимально похожие фильмы.' : 'Strongest seed. TMDB /recommendations finds the most similar films.' },
    { icon: <StarLinear size={15}/>, color: '#84cc16',
      title: ru ? 'Оценка 5–8' : 'Rating 5–8',
      desc:  ru ? 'Мягкий позитивный сигнал. Фильм используется как seed с меньшим весом.' : 'Soft positive signal. Film is used as a seed with lower weight.' },
    { icon: <StarLinear size={15}/>, color: '#6b7280',
      title: ru ? 'Оценка 1–3' : 'Rating 1–3',
      desc:  ru ? 'Штрафуется только этот фильм. Жанр не страдает — плохой Железный человек ≠ ненавижу экшен.' : 'Only this film is penalised. Genre is untouched — one bad film ≠ hate the genre.' },
    { icon: <HeartLinear size={15}/>, color: '#ec4899',
      title: ru ? 'Лайк актёра' : 'Liked actor',
      desc:  ru ? 'Фильмография добавляется в кандидаты с весом 3× — выше чем просто жанровый discover.' : 'Filmography added as candidates with 3× weight — higher than genre discover.' },
    { icon: <BoltCircleLinear size={15}/>, color: '#8b5cf6',
      title: ru ? 'Очередь' : 'Watchlist',
      desc:  ru ? 'Жанры очереди буcтятся. Пользователь сам выбрал — значит похожее тоже зайдёт.' : 'Queue genres get boosted. You chose these — similar content likely fits too.' },
    { icon: <ForbiddenCircleLinear size={15}/>, color: '#ef4444',
      title: ru ? '«Не интересно»' : 'Not interested',
      desc:  ru ? 'ID в чёрный список навсегда. Синхронизируется в облако, работает после переустановки.' : 'ID blacklisted permanently. Syncs to cloud — survives reinstalls.' },
  ];

  const tech = [
    { name: 'React 18',  icon: <Server2Linear size={18}/>,      color: '#61DAFB', sub: ru ? 'Интерфейс'       : 'UI Framework' },
    { name: 'Supabase',  icon: <CloudLinear size={18}/>,     color: '#3ECF8E', sub: ru ? 'БД + Авторизация' : 'DB + Auth' },
    { name: 'TMDB',      icon: <VideoLibraryLinear size={18}/>,      color: '#01D277', sub: ru ? '900k+ тайтлов'   : '900k+ titles' },
    { name: 'Vercel',    icon: <BoltCircleLinear size={18}/>,       color: '#aaa',    sub: ru ? 'Деплой'           : 'Deployment' },
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
            {ru ? 'Персональный кинотеатр' : 'Your personal cinema'}
          </div>
          <h1 className="about-hero__wordmark">
            CINE<span>MATE</span>
          </h1>
          <p className="about-hero__tagline">
            {ru
              ? 'Открывай фильмы. Строй списки.\nПолучай рекомендации которые реально работают.'
              : 'Discover films. Build your lists.\nGet recommendations that actually work.'}
          </p>
          <div className="about-hero__badges">
            {[
              { icon: <CheckCircleLinear size={13}/>, label: ru ? 'Бесплатно'     : 'Free' },
              { icon: <ForbiddenCircleLinear         size={13}/>, label: ru ? 'Без рекламы'   : 'No ads' },
              { icon: <CloudLinear       size={13}/>, label: ru ? 'Облачный синк' : 'Cloud sync' },
              { icon: <PlayLinear        size={13}/>, label: 'PWA' },
            ].map((b, i) => (
              <span key={i} className="about-hero__badge">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
          <div className="about-hero__cta">
            <AltArrowRightLinear size={14}/>
            {ru ? 'Прокрути вниз чтобы узнать больше' : 'Scroll down to learn more'}
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
          <div className="about-pill">✦ {ru ? 'Возможности' : 'Features'}</div>
          <h2 className="about-h2">
            {ru ? 'Всё что нужно для\nидеального киновечера' : 'Everything for\nthe perfect movie night'}
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
            <div className="about-pill">✦ {ru ? 'Как это работает' : 'How it works'}</div>
            <h2 className="about-h2">
              {ru ? 'Три шага до\nидеальной подборки' : 'Three steps to\na perfect queue'}
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
          <div className="about-pill">✦ {ru ? 'Алгоритм' : 'The Algorithm'}</div>
          <h2 className="about-h2">
            {ru ? 'Рекомендации которые\nучатся на тебе' : 'Recommendations that\nlearn from you'}
          </h2>
          <p className="about-h2-sub">
            {ru
              ? 'Каждое действие в приложении влияет на следующую подборку'
              : 'Every action in the app shapes the next recommendation'}
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
            <div className="about-pill">✦ {ru ? 'Под капотом' : 'Under the hood'}</div>
            <h2 className="about-h2">{ru ? 'Технологии' : 'Tech stack'}</h2>
          </header>
          <div className="about-tech-grid">
            {tech.map((t, i) => <TechCard key={i} tech={t} delay={i * 70}/>)}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="about-footer">
        <p className="about-footer__mark">CINE<span>MATE</span></p>
        <p className="about-footer__sub">{ru ? 'Сделано с ❤️ для киноманов' : 'Made with ❤️ for film lovers'}</p>
        <p className="about-footer__tmdb">
          {ru ? 'Данные предоставлены The Movie Database (TMDB)' : 'Movie data provided by The Movie Database (TMDB)'}
        </p>
      </footer>

    </div>
  );
}