import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LetterLinear, LockLinear, EyeLinear, EyeClosedLinear, VideoLibraryLinear, DangerCircleLinear, CheckCircleLinear } from 'solar-icon-set';
import { useAuth } from '../auth';
import './AuthScreen.css';


export default function AuthScreen({ onSkip, initialMode, onBack }) {
  const { signIn, signUp, loading } = useAuth();
  const { t } = useTranslation();
  const [mode,     setMode]     = useState(initialMode || 'welcome');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);
  const [success,  setSuccess]  = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError(t('auth.fillAllFields')); return; }
    if (password.length < 6) { setError(t('auth.passwordMin6')); return; }
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) { setError(t('auth.wrongCredentials')); setShake(true); setTimeout(()=>setShake(false),600); }
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setSuccess(t('auth.checkEmail'));
    }
  };

  if (mode === 'welcome') return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-content">
        {onBack && (
          <button className="auth-back" onClick={onBack}>
            ← {t('auth.back')}
          </button>
        )}
        <div className="auth-logo">
          <VideoLibraryLinear size={40} strokeWidth={1.5}/>
          <h1 className="auth-logo__text">CINI<span>MATE</span></h1>
          <p className="auth-logo__sub">{t('auth.personalCinima')}</p>
        </div>

        <div className="auth-welcome-btns">
          <button className="auth-btn auth-btn--primary" onClick={() => setMode('register')}>
            {t('auth.signUpEmail')}
          </button>
          <button className="auth-btn auth-btn--outline" onClick={() => setMode('login')}>
            {t('auth.signInEmail')}
          </button>
          <button className="auth-btn auth-btn--ghost" onClick={() => setMode('skip-warn')}>
            {t('auth.skipForNow')}
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
          <h2 className="auth-warn-title">{t('auth.dataWontBeSaved')}</h2>
          <p className="auth-warn-text">
            {t('auth.dataWontBeSavedDesc')}
          </p>
          <div className="auth-warn-btns">
            <button className="auth-btn auth-btn--primary" onClick={() => setMode('register')}>
              {t('auth.createAccount')}
            </button>
            <button className="auth-btn auth-btn--ghost" onClick={onSkip}>
              {t('auth.continueAnyway')}
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
        <button className="auth-back" onClick={() => {
          setError(''); setSuccess('');
          if (initialMode && onBack) onBack();
          else setMode('welcome');
        }}>
          ← {t('auth.back')}
        </button>
        <div className="auth-logo auth-logo--small">
          <h1 className="auth-logo__text">CINI<span>MATE</span></h1>
        </div>
        <h2 className="auth-form-title">
          {mode === 'login' ? t('auth.signIn') : t('auth.register')}
        </h2>
        <div className="auth-divider" style={{marginBottom:12}}>
          <span>{t('auth.orWithEmail')}</span>
        </div>

        <form className={"auth-form"+(shake?" auth-form--shake":"")} onSubmit={handleAuth}>
          <div className="auth-field">
            <LetterLinear size={16} className="auth-field__icon"/>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} className="auth-field__input" autoComplete="email"/>
          </div>
          <div className="auth-field">
            <LockLinear size={16} className="auth-field__icon"/>
            <input type={showPass?'text':'password'} placeholder={t('auth.password')}
              value={password} onChange={e => setPassword(e.target.value)} className="auth-field__input"
              autoComplete={mode==='login'?'current-password':'new-password'}/>
            <button type="button" className="auth-field__toggle" onClick={() => setShowPass(s=>!s)}>
              {showPass ? <EyeClosedLinear size={15}/> : <EyeLinear size={15}/>}
            </button>
          </div>

          {error   && <div className="auth-error"><DangerCircleLinear size={14}/> {error}</div>}
          {success && <div className="auth-success"><CheckCircleLinear size={14}/> {success}</div>}

          <button type="submit" className="auth-btn auth-btn--primary auth-btn--full" disabled={loading}>
            {loading ? '...' : mode==='login' ? t('auth.signInBtn') : t('auth.createAccount')}
          </button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); setSuccess(''); }}>
          {mode==='login'
            ? t('auth.noAccount')
            : t('auth.haveAccount')}
        </button>
        <button className="auth-btn auth-btn--ghost auth-skip-link" onClick={() => setMode('skip-warn')}>
          {t('auth.skip')}
        </button>
      </div>
    </div>
  );
}