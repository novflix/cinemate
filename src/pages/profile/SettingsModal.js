import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoonLinear, Sun2Linear, CloseCircleLinear, CheckCircleLinear,
  Logout3Linear, UserPlusLinear, CalendarLinear, CloudLinear,
  SettingsMinimalisticLinear,
} from 'solar-icon-set';
import { useTheme } from '../../theme';
import { useAuth } from '../../auth';
import { useAdmin } from '../../admin';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { SEASON_CONFIG } from '../../hooks/useSeason';
import './SettingsModal.css';
import './LangPicker.css';

export default function SettingsModal({ onClose }) {
  const { theme, setTheme, lang, setLang } = useTheme();
  const { t } = useTranslation();
  const { user, signOut, signUp } = useAuth();
  const { isAdmin, overrides, setOverride } = useAdmin();
  const [registerMode, setRegisterMode] = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);
  const [langChanging, setLangChanging] = useState(false);
  const [regEmail,     setRegEmail]     = useState('');
  const [regPass,      setRegPass]      = useState('');
  const [regError,     setRegError]     = useState('');
  const [regOk,        setRegOk]        = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regEmail || !regPass) { setRegError(t('auth.fillAllFields')); return; }
    if (regPass.length < 6)   { setRegError(t('auth.passwordMin6')); return; }
    const { error } = await signUp(regEmail, regPass);
    if (error) { setRegError(error.message); return; }
    setRegOk(true);
    setTimeout(onClose, 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    localStorage.removeItem('auth_skipped');
  };

  const current = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('profile.settings')}</h2>
          <button className="settings-close" onClick={onClose}><CloseCircleLinear size={18}/></button>
        </div>
        <div className="settings-body">

          {/* Theme */}
          <div className="settings-section">
            <p className="settings-label">{t('profile.theme')}</p>
            <div className="settings-options">
              <button className={"settings-option" + (theme === 'dark' ? " active" : "")} onClick={() => setTheme('dark')}>
                <MoonLinear size={15}/> {t('profile.dark')}
                {theme === 'dark' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
              <button className={"settings-option" + (theme === 'light' ? " active" : "")} onClick={() => setTheme('light')}>
                <Sun2Linear size={15}/> {t('profile.light')}
                {theme === 'light' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="settings-section">
            <p className="settings-label">{t('profile.language')}</p>
            <div className={"lang-picker" + (langChanging ? " lang-changing" : "")}>
              <div className="lang-picker__current">
                <span className={`fi fi-${current.countryCode} lang-picker__flag`}/>
                <span className="lang-picker__label">{current.label}</span>
                <button
                  className={"lang-picker__toggle" + (langOpen ? " open" : "")}
                  onClick={() => setLangOpen(v => !v)}
                >
                  {langOpen ? t('profile.langClose') : t('profile.langChange')}
                </button>
              </div>
              {langOpen && (
                <div className="lang-picker__list lang-picker__list--animate">
                  {SUPPORTED_LANGUAGES.map(({ code, label, countryCode }, idx) => {
                    const active = lang === code;
                    return (
                      <button
                        key={code}
                        className={"lang-picker__item" + (active ? " active" : "")}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        onClick={() => {
                          if (lang !== code) {
                            setLangChanging(true);
                            setTimeout(() => {
                              setLang(code);
                              setLangOpen(false);
                              setLangChanging(false);
                            }, 320);
                          } else {
                            setLangOpen(false);
                          }
                        }}
                      >
                        <span className={`fi fi-${countryCode} lang-picker__flag`}/>
                        <span className="lang-picker__label">{label}</span>
                        {active && <CheckCircleLinear size={15} className="lang-picker__check"/>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Admin / Dev Tools */}
          {isAdmin && (
            <div className="settings-section settings-section--admin">
              <p className="settings-label"><SettingsMinimalisticLinear size={14}/> Admin / Dev Tools</p>
              <div className="settings-admin-row">
                <span className="settings-admin-label"><CloudLinear size={13}/> Snow</span>
                <button
                  className={"settings-admin-toggle" + (overrides.snow ? " on" : "")}
                  onClick={() => setOverride('snow', !overrides.snow)}
                >
                  {overrides.snow ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="settings-admin-row">
                <span className="settings-admin-label"><CalendarLinear size={13}/> Season</span>
                <select
                  className="settings-admin-select"
                  value={overrides.season || ''}
                  onChange={e => setOverride('season', e.target.value || null)}
                >
                  <option value="">Auto</option>
                  {Object.keys(SEASON_CONFIG).map(s => (
                    <option key={s} value={s}>{SEASON_CONFIG[s].en}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Account — signed in */}
          {user && (
            <div className="settings-section">
              <p className="settings-label">{t('profile.account')}</p>
              <p className="settings-email">{user.email}</p>
              <button className="settings-signout" onClick={handleSignOut}>
                <Logout3Linear size={14}/> {t('profile.signOut')}
              </button>
            </div>
          )}

          {/* Account — guest */}
          {!user && (
            <div className="settings-section">
              <p className="settings-label">{t('profile.account')}</p>
              {!registerMode && !regOk && (
                <>
                  <p className="settings-email settings-email--guest">{t('profile.guestModeDesc')}</p>
                  <button className="settings-register-btn" onClick={() => setRegisterMode(true)}>
                    <UserPlusLinear size={14}/> {t('profile.createAccountSave')}
                  </button>
                </>
              )}
              {registerMode && !regOk && (
                <form className="settings-register-form" onSubmit={handleRegister}>
                  <p className="settings-register-hint">{t('profile.dataSavedToAccount')}</p>
                  <input
                    className="settings-register-input"
                    type="email"
                    placeholder="Email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                  />
                  <input
                    className="settings-register-input"
                    type="password"
                    placeholder={t('profile.passwordMin6')}
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                  />
                  {regError && <p className="settings-register-error">{regError}</p>}
                  <div className="settings-register-actions">
                    <button type="button" className="settings-register-cancel" onClick={() => setRegisterMode(false)}>
                      {t('profile.cancel')}
                    </button>
                    <button type="submit" className="settings-register-submit">
                      {t('profile.signUp')}
                    </button>
                  </div>
                </form>
              )}
              {regOk && (
                <p className="settings-register-ok">
                  <CheckCircleLinear size={14}/> {t('profile.checkEmailConfirm')}
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}