import { useState } from 'react';
import { LetterLinear, LockLinear, EyeLinear, EyeClosedLinear, VideoLibraryLinear, DangerCircleLinear, CheckCircleLinear } from 'solar-icon-set';
import { useAuth } from '../auth';
import { useTheme, t } from '../theme';
import './AuthScreen.css';


export default function AuthScreen({ onSkip }) {
  const { signIn, signUp, loading } = useAuth();
  const { lang } = useTheme();
  const [mode,     setMode]     = useState('welcome');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);
  const [success,  setSuccess]  = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError(t(lang,'Заполни все поля','Fill in all fields')); return; }
    if (password.length < 6) { setError(t(lang,'Пароль минимум 6 символов','Password min 6 chars')); return; }
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) { setError(t(lang,'Неверный email или пароль','Wrong email or password')); setShake(true); setTimeout(()=>setShake(false),600); }
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setSuccess(t(lang,'Проверь почту для подтверждения','Check your email to confirm'));
    }
  };

  if (mode === 'welcome') return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-content">
        <div className="auth-logo">
          <VideoLibraryLinear size={40} strokeWidth={1.5}/>
          <h1 className="auth-logo__text">CINE<span>MATE</span></h1>
          <p className="auth-logo__sub">{t(lang,'Твой личный кинотеатр','Your personal cinema')}</p>
        </div>

        <div className="auth-welcome-btns">
          <button className="auth-btn auth-btn--primary" onClick={() => setMode('register')}>
            {t(lang,'Создать аккаунт по email','Sign up with email')}
          </button>
          <button className="auth-btn auth-btn--outline" onClick={() => setMode('login')}>
            {t(lang,'Войти по email','Sign in with email')}
          </button>
          <button className="auth-btn auth-btn--ghost" onClick={() => setMode('skip-warn')}>
            {t(lang,'Пропустить','Skip for now')}
          </button>
        </div>
      </div>
    </div>
  );

  if (mode === 'skip-warn') return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-content">
        <div className="auth-warn-card">
          <DangerCircleLinear size={40} strokeWidth={1.5} className="auth-warn-icon"/>
          <h2 className="auth-warn-title">{t(lang,'Данные не сохранятся','Data won\'t be saved')}</h2>
          <p className="auth-warn-text">
            {t(lang,
              'Без аккаунта все твои списки, оценки и настройки хранятся только на этом устройстве. При очистке кэша или переустановке приложения они будут удалены безвозвратно.',
              'Without an account your lists, ratings and settings are stored only on this device. Clearing cache or reinstalling will permanently delete them.'
            )}
          </p>
          <div className="auth-warn-btns">
            <button className="auth-btn auth-btn--primary" onClick={() => setMode('register')}>
              {t(lang,'Создать аккаунт','Create account')}
            </button>
            <button className="auth-btn auth-btn--ghost" onClick={onSkip}>
              {t(lang,'Всё равно продолжить','Continue anyway')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-content">
        <button className="auth-back" onClick={() => { setMode('welcome'); setError(''); setSuccess(''); }}>
          ← {t(lang,'Назад','Back')}
        </button>
        <div className="auth-logo auth-logo--small">
          <h1 className="auth-logo__text">CINE<span>MATE</span></h1>
        </div>
        <h2 className="auth-form-title">
          {mode === 'login' ? t(lang,'Вход','Sign in') : t(lang,'Регистрация','Create account')}
        </h2>
        <div className="auth-divider" style={{marginBottom:12}}>
          <span>{t(lang,'или через email','or with email')}</span>
        </div>

        <form className={"auth-form"+(shake?" auth-form--shake":"")} onSubmit={handleAuth}>
          <div className="auth-field">
            <LetterLinear size={16} className="auth-field__icon"/>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} className="auth-field__input" autoComplete="email"/>
          </div>
          <div className="auth-field">
            <LockLinear size={16} className="auth-field__icon"/>
            <input type={showPass?'text':'password'} placeholder={t(lang,'Пароль','Password')}
              value={password} onChange={e => setPassword(e.target.value)} className="auth-field__input"
              autoComplete={mode==='login'?'current-password':'new-password'}/>
            <button type="button" className="auth-field__toggle" onClick={() => setShowPass(s=>!s)}>
              {showPass ? <EyeClosedLinear size={15}/> : <EyeLinear size={15}/>}
            </button>
          </div>

          {error   && <div className="auth-error"><DangerCircleLinear size={14}/> {error}</div>}
          {success && <div className="auth-success"><CheckCircleLinear size={14}/> {success}</div>}

          <button type="submit" className="auth-btn auth-btn--primary auth-btn--full" disabled={loading}>
            {loading ? '...' : mode==='login' ? t(lang,'Войти','Sign in') : t(lang,'Создать аккаунт','Create account')}
          </button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); setSuccess(''); }}>
          {mode==='login'
            ? t(lang,'Нет аккаунта? Зарегистрироваться','No account? Sign up')
            : t(lang,'Уже есть аккаунт? Войти','Already have account? Sign in')}
        </button>
        <button className="auth-btn auth-btn--ghost auth-skip-link" onClick={() => setMode('skip-warn')}>
          {t(lang,'Пропустить','Skip')}
        </button>
      </div>
    </div>
  );
}