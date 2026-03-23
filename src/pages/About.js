import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from '../theme';
import { Sparkles, Tv2, Star, Shuffle, Globe, Cloud, Heart, Ban, Smile, Film, Zap, CheckCircle } from 'lucide-react';
import './About.css';

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Counter({ to, suffix = '', duration = 1200 }) {
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

const FeatureCard = memo(function FeatureCard({ icon: Icon, title, desc, delay, accent }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-feature" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms`, '--card-accent': accent }}>
      <div className="about-feature__icon-wrap">
        <Icon size={22} strokeWidth={1.8}/>
      </div>
      <h3 className="about-feature__title">{title}</h3>
      <p className="about-feature__desc">{desc}</p>
    </div>
  );
});

const StepCard = memo(function StepCard({ step, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={"about-step" + (visible ? ' revealed' : '')}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="about-step__num">{step.n}</div>
      <div className="about-step__body">
        <div className="about-step__icon">{step.icon}</div>
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
      <span className="about-tech__name">{tech.name}</span>
      <span className="about-tech__sub">{tech.sub}</span>
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

export default function About() {
  const { lang } = useTheme();
  const ru = lang === 'ru';
  const [heroRef, heroVisible] = useReveal(0.01);

  const features = [
    { icon: Sparkles, accent: '#e8c547',
      title: ru ? 'Умные рекомендации' : 'Smart Recommendations',
      desc:  ru ? 'Алгоритм учится на каждой оценке и лайке актёра. Чем дольше пользуешься — тем точнее подборка.' : 'Learns from every rating and liked actor. The longer you use it, the sharper it gets.' },
    { icon: Star, accent: '#f97316',
      title: ru ? 'Рейтинги 1–10' : 'Ratings 1–10',
      desc:  ru ? 'Оцени фильм и система сразу поймёт что тебе нравится. Оценки влияют на все будущие рекомендации.' : 'Rate a film and the algorithm instantly maps your taste. Every score shapes future picks.' },
    { icon: Tv2, accent: '#3b82f6',
      title: ru ? 'Прогресс сериалов' : 'Series Tracker',
      desc:  ru ? 'Отмечай на каком сезоне и серии остановился. Сериалы в процессе выделяются отдельно в очереди.' : 'Track exactly which season and episode you\'re on. In-progress shows surface at the top of your queue.' },
    { icon: Shuffle, accent: '#8b5cf6',
      title: ru ? 'Рулетка' : 'Watchlist Roulette',
      desc:  ru ? 'Не можешь выбрать? Крути рулетку — выберет фильм из твоего списка за секунду.' : "Can't decide? Spin the wheel and let it pick from your list in one tap." },
    { icon: Ban, accent: '#ef4444',
      title: ru ? '«Не интересно»' : '"Not Interested"',
      desc:  ru ? 'Нажми ✕ на любой карточке в рекомендациях — фильм исчезнет и никогда не появится снова.' : 'Tap ✕ on any rec card — it vanishes and never returns. The algo learns what to skip.' },
    { icon: Heart, accent: '#ec4899',
      title: ru ? 'Любимые актёры' : 'Liked Actors',
      desc:  ru ? 'Лайкни актёра на его странице — рекомендации сразу подтянут больше его фильмов.' : 'Like an actor on their page and recommendations instantly surface more of their work.' },
    { icon: Globe, accent: '#22c55e',
      title: ru ? 'Русский и English' : 'Russian & English',
      desc:  ru ? 'Полная локализация интерфейса. Постеры, описания и названия — на выбранном языке.' : 'Full localisation. Posters, overviews and titles all switch to your chosen language.' },
    { icon: Cloud, accent: '#0ea5e9',
      title: ru ? 'Облачный синк' : 'Cloud Sync',
      desc:  ru ? 'Войди через email — списки, оценки и настройки синхронизируются на всех устройствах.' : 'Sign in with email and everything syncs across all your devices automatically.' },
    { icon: Smile, accent: '#eab308',
      title: ru ? 'Настроение вечера' : 'Mood Filter',
      desc:  ru ? 'Выбери вайб — «Страшно», «Действие», «Поплакать» — и получи нужную подборку мгновенно.' : 'Pick a vibe — Scary, Action, Cry — and get a perfectly tuned feed instantly.' },
  ];

  const stats = [
    { n: 900000, suffix: '+', label: ru ? 'фильмов и сериалов' : 'films & shows' },
    { n: 50,     suffix: '+', label: ru ? 'в каждой секции' : 'per section' },
    { n: 10,     suffix: '/10', label: ru ? 'шкала оценок' : 'rating scale' },
    { n: 8,      suffix: '',  label: ru ? 'секций на главной' : 'home sections' },
  ];

  const steps = [
    { n: '01', icon: <Film size={20}/>,
      title: ru ? 'Сохраняй' : 'Save',
      desc: ru ? 'Добавляй в «Хочу посмотреть» и отмечай просмотренные. Для сериалов — указывай сезон и серию.' : 'Add to Watchlist and mark what you\'ve seen. For shows, track your exact episode.' },
    { n: '02', icon: <Star size={20}/>,
      title: ru ? 'Оценивай' : 'Rate',
      desc: ru ? 'Ставь оценки от 1 до 10. Алгоритм учится на каждой — плохие и хорошие оценки одинаково важны.' : 'Rate from 1 to 10. The algorithm learns from each — bad ratings matter as much as good ones.' },
    { n: '03', icon: <Sparkles size={20}/>,
      title: ru ? 'Открывай' : 'Discover',
      desc: ru ? 'Переходи во вкладку «Для вас» — бесконечная лента фильмов подобранных именно под твой вкус.' : 'Go to "For You" — an infinite personalised feed tuned exactly to your taste.' },
  ];

  const tech = [
    { name: 'React 18',  sub: ru ? 'Интерфейс'     : 'UI Framework' },
    { name: 'Supabase',  sub: ru ? 'БД + Авторизация' : 'DB + Auth' },
    { name: 'TMDB API',  sub: ru ? '900к+ тайтлов' : '900k+ titles' },
    { name: 'Vercel',    sub: ru ? 'Деплой'         : 'Deployment' },
  ];

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <section className="about-hero" ref={heroRef}>
        <div className="about-hero__orbs">
          <div className="about-orb about-orb--1"/>
          <div className="about-orb about-orb--2"/>
          <div className="about-orb about-orb--3"/>
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
          <div className="about-hero__checks">
            {[
              ru ? 'Бесплатно' : 'Free',
              ru ? 'Без рекламы' : 'No ads',
              ru ? 'Облачный синк' : 'Cloud sync',
              ru ? 'iOS-совместимо' : 'iOS-ready',
            ].map((label, i) => (
              <span key={i} className="about-hero__check">
                <CheckCircle size={13}/> {label}
              </span>
            ))}
          </div>
        </div>
        <div className="about-hero__scroll">
          <div className="about-hero__scroll-line"/>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="about-stats">
        {stats.map((s, i) => (
          <div key={i} className="about-stat">
            <div className="about-stat__val"><Counter to={s.n} suffix={s.suffix}/></div>
            <div className="about-stat__label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="about-section">
        <div className="about-section__header">
          <div className="about-pill">✦ {ru ? 'Возможности' : 'Features'}</div>
          <h2 className="about-section__h2">
            {ru ? 'Всё что нужно для\nидеального киновечера' : 'Everything for\nthe perfect movie night'}
          </h2>
        </div>
        <div className="about-features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 50}/>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="about-section about-section--alt">
        <div className="about-section__header">
          <div className="about-pill">✦ {ru ? 'Как это работает' : 'How it works'}</div>
          <h2 className="about-section__h2">
            {ru ? 'Три шага до идеальной подборки' : 'Three steps to a perfect queue'}
          </h2>
        </div>
        <div className="about-steps">
          {steps.map((s, i) => <StepCard key={i} step={s} delay={i * 100}/>)}
        </div>
      </section>

      {/* ── Algo explainer ── */}
      <section className="about-section">
        <div className="about-section__header">
          <div className="about-pill">✦ {ru ? 'Алгоритм' : 'The Algorithm'}</div>
          <h2 className="about-section__h2">
            {ru ? 'Рекомендации которые\nучатся на тебе' : 'Recommendations that\nlearn from you'}
          </h2>
        </div>
        <div className="about-algo">
          {[
            { icon: <Star size={16}/>, color: '#e8c547',
              title: ru ? 'Оценка 9–10' : 'Rating 9–10',
              desc: ru ? 'Сильный сигнал. Алгоритм ищет максимально похожие фильмы через TMDB /recommendations.' : 'Strong signal. Algorithm finds maximally similar films via TMDB /recommendations.' },
            { icon: <Star size={16}/>, color: '#84cc16',
              title: ru ? 'Оценка 5–8' : 'Rating 5–8',
              desc: ru ? 'Мягкий позитивный сигнал. Фильм используется как seed но с меньшим весом.' : 'Soft positive signal. Film is used as a seed but with lower weight.' },
            { icon: <Star size={16}/>, color: '#6b7280',
              title: ru ? 'Оценка 1–3' : 'Rating 1–3',
              desc: ru ? 'Негативный сигнал только на конкретный фильм. Жанр НЕ штрафуется — плохой Железный человек не значит что ты не любишь экшен.' : 'Negative signal for that specific film only. Genre is NOT penalised — disliking one film doesn\'t mean you hate the genre.' },
            { icon: <Heart size={16}/>, color: '#ec4899',
              title: ru ? 'Лайк актёра' : 'Liked actor',
              desc: ru ? 'Фильмография актёра добавляется в кандидаты с высоким приоритетом.' : 'Actor\'s filmography is added to candidates with high priority.' },
            { icon: <Zap size={16}/>, color: '#8b5cf6',
              title: ru ? 'Watchlist' : 'Watchlist',
              desc: ru ? 'Жанры из очереди буcтятся. Пользователь сам выбрал эти фильмы — значит похожее тоже интересно.' : 'Genres from your queue get boosted. You chose these films — similar ones are likely interesting too.' },
            { icon: <Ban size={16}/>, color: '#ef4444',
              title: ru ? '«Не интересно»' : '"Not interested"',
              desc: ru ? 'ID сохраняется в чёрный список. Фильм никогда не появится снова, даже после обновления.' : 'ID is blacklisted permanently. That film will never appear again, even after refresh.' },
          ].map((item, i) => (
            <AlgoCard key={i} item={item} delay={i * 60}/>
          ))}
        </div>
      </section>

      {/* ── Tech ── */}
      <section className="about-section about-section--alt">
        <div className="about-section__header">
          <div className="about-pill">✦ {ru ? 'Под капотом' : 'Under the hood'}</div>
        </div>
        <div className="about-tech-grid">
          {tech.map((t, i) => <TechCard key={i} tech={t} delay={i * 70}/>)}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="about-footer">
        <p className="about-footer__mark">CINE<span>MATE</span></p>
        <p className="about-footer__sub">{ru ? 'Сделано с ❤️ для киноманов' : 'Made with ❤️ for film lovers'}</p>
        <p className="about-footer__tmdb">{ru ? 'Данные — The Movie Database (TMDB)' : 'Data provided by The Movie Database (TMDB)'}</p>
      </footer>

    </div>
  );
}