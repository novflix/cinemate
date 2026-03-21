import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Film, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../auth';
import { useTheme, t } from '../theme';
import './AuthScreen.css';

export default function AuthScreen({ onSkip }) {
  const { signIn, signUp, loading } = useAuth();
  const { lang } = useTheme();
  const [mode,     setMode]     = useState('welcome'); // welcome | login | register | skip-warn
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError(t(lang,'Заполни все поля','Fill in all fields')); return; }
    if (password.length < 6) { setError(t(lang,'Пароль минимум 6 символов','Password min 6 chars')); return; }

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(t(lang,'Неверный email или пароль','Wrong email or password'));
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setSuccess(t(lang,'Проверь почту для подтверждения','Check your email to confirm'));
    }
  };

  // Welcome screen
  if (mode === 'welcome') return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-content">
        <div className="auth-logo">
          <Film size={40} strokeWidth={1.5}/>
          <h1 className="auth-logo__text">CINE<span>MATE</span></h1>
          <p className="auth-logo__sub">{t(lang,'Твой личный кинотеатр','Your personal cinema')}</p>
        </div>

        <div className="auth-welcome-btns">
          <button className="auth-btn auth-btn--primary" onClick={() => setMode('register')}>
            {t(lang,'Создать аккаунт','Create account')}
          </button>
          <button className="auth-btn auth-btn--outline" onClick={() => setMode('login')}>
            {t(lang,'Войти','Sign in')}
          </button>
          <button className="auth-btn auth-btn--ghost" onClick={() => setMode('skip-warn')}>
            {t(lang,'Пропустить','Skip for now')}
          </button>
        </div>
      </div>
    </div>
  );

  // Skip warning
  if (mode === 'skip-warn') return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-content">
        <div className="auth-warn-card">
          <AlertCircle size={40} strokeWidth={1.5} className="auth-warn-icon"/>
          <h2 className="auth-warn-title">{t(lang,'Данные не сохранятся','Data won\'t be saved')}</h2>
          <p className="auth-warn-text">
            {t(lang,
              'Без аккаунта все твои списки, оценки и настройки хранятся только на этом устройстве. При очистке кэша или переустановке приложения они будут удалены безвозвратно.',
              'Without an account your lists, ratings and settings are stored only on this device. Clearing cache or reinstalling the app will permanently delete them.'
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

  // Login / Register form
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

        <form className="auth-form" onSubmit={handleAuth}>
          <div className="auth-field">
            <Mail size={16} className="auth-field__icon"/>
            <input
              type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="auth-field__input" autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <Lock size={16} className="auth-field__icon"/>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={t(lang,'Пароль','Password')}
              value={password} onChange={e => setPassword(e.target.value)}
              className="auth-field__input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button type="button" className="auth-field__toggle" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>

          {error && (
            <div className="auth-error"><AlertCircle size={14}/> {error}</div>
          )}
          {success && (
            <div className="auth-success"><CheckCircle size={14}/> {success}</div>
          )}

          <button type="submit" className="auth-btn auth-btn--primary auth-btn--full" disabled={loading}>
            {loading ? '...' : mode === 'login' ? t(lang,'Войти','Sign in') : t(lang,'Создать аккаунт','Create account')}
          </button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}>
          {mode === 'login'
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