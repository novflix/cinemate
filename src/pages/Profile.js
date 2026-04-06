import { useNavigate } from 'react-router-dom';
import { useMovieModal } from '../hooks/useMovieModal';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import {
  TVLinear, Pen2Linear, SettingsMinimalisticLinear, EyeLinear, BookmarkLinear, PinLinear,
  ShareLinear,
  MoonLinear, Sun2Linear, CloseCircleLinear, CheckCircleLinear,
  TrashBinMinimalistic2Linear, Logout3Linear, UserPlusLinear, ListLinear,
  AddCircleLinear, CalendarLinear, Chart2Linear, EyeClosedLinear, BookmarkOpenedLinear,
  HeartLinear,
} from 'solar-icon-set';
import { useStore } from '../store';
import { useAuth } from '../auth';
import { useAdmin } from '../admin';
import { SEASON_CONFIG } from '../hooks/useSeason';
import { useTheme } from '../theme';
import { tmdb, HEADERS } from '../api';
import { useLocalizedMovies } from '../useLocalizedMovies';
import Roulette from '../components/Roulette';
import MovieModal from '../components/MovieModal';
import Countdown from '../components/Countdown';
import './Profile.css';
import { supabase } from '../supabase';

/* ─── Donate Modal ─── */
const WALLETS = [
  {
    label: 'USDC',
    network: 'Polygon',
    address: '0x9e9C10d3A526cb39B62b88DecC55f04F8f63fdE3',
    color: '#2775CA',
    gradient: 'linear-gradient(135deg, rgba(39,117,202,0.18) 0%, rgba(39,117,202,0.05) 100%)',
    border: 'rgba(39,117,202,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#2775CA"/>
        <path d="M20.022 18.124c0-2.124-1.277-2.852-3.831-3.155-1.832-.243-2.193-.728-2.193-1.578s.603-1.396 1.832-1.396c1.107 0 1.71.364 2.013 1.275a.27.27 0 00.255.182h1.155a.247.247 0 00.247-.254v-.061a3.076 3.076 0 00-2.75-2.51V9.382a.274.274 0 00-.272-.272H15.3a.274.274 0 00-.272.272v1.214c-1.71.243-2.813 1.396-2.813 2.852 0 2.002 1.217 2.791 3.77 3.094 1.71.303 2.254.667 2.254 1.638s-.845 1.638-2.013 1.638c-1.578 0-2.133-.667-2.315-1.578a.267.267 0 00-.255-.212h-1.217a.247.247 0 00-.248.254v.061c.243 1.578 1.277 2.73 3.034 3.034v1.214c0 .151.12.272.272.272h1.155c.151 0 .272-.12.272-.272v-1.214c1.71-.272 2.874-1.517 2.874-3.033z" fill="white"/>
        <path d="M13.16 23.542c-4.125-1.457-6.278-6.036-4.76-10.1a7.76 7.76 0 014.76-4.76.272.272 0 00.181-.255V7.25a.255.255 0 00-.333-.242c-5.006 1.578-7.764 6.917-6.157 11.923a9.388 9.388 0 006.157 6.157.255.255 0 00.333-.243v-1.096a.303.303 0 00-.181-.247zM19.172 7.008a.255.255 0 00-.333.243v1.126c0 .12.061.22.181.247 4.125 1.457 6.278 6.036 4.76 10.1a7.76 7.76 0 01-4.76 4.76.272.272 0 00-.181.255v1.126c0 .151.182.242.333.181 5.006-1.578 7.764-6.917 6.157-11.923a9.422 9.422 0 00-6.157-6.115z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'USDT',
    network: 'TRC-20',
    address: 'TVMMVRhbTJutmjkwFC6x5g4cm2S4P5nbqy',
    color: '#26A17B',
    gradient: 'linear-gradient(135deg, rgba(38,161,123,0.18) 0%, rgba(38,161,123,0.05) 100%)',
    border: 'rgba(38,161,123,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.661v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.175 6.775.852 6.775 1.66 0 .807-2.895 1.484-6.775 1.656zm0-3.59v-2.366h5.414V8H8.595v3.427h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.128 0 1.053 3.309 1.924 7.709 2.127v7.632h3.913v-7.635c4.393-.202 7.694-1.073 7.694-2.124 0-1.052-3.301-1.923-7.694-2.127z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'TON',
    network: 'TON',
    address: 'UQAdiUvmlLJ088bQkbv6AGs_sp7rO0jHcmdzR6oWglq5Isk2',
    color: '#0098EA',
    gradient: 'linear-gradient(135deg, rgba(0,152,234,0.18) 0%, rgba(0,152,234,0.05) 100%)',
    border: 'rgba(0,152,234,0.35)',
    icon: (
      /* Official TON coin logo */
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#0098EA"/>
        <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm4.93 6.5h-2.645l-2.287 7.04-2.285-7.04H11.07l3.864 9.0a1.13 1.13 0 001.065.75 1.13 1.13 0 001.064-.75L20.93 12.5z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'SOL',
    network: 'Solana',
    address: 'Wv29H2iUF4vQLfqgGjvbSiobThxJAfSpeFNBanoWvKw',
    color: '#9945FF',
    gradient: 'linear-gradient(135deg, rgba(153,69,255,0.18) 0%, rgba(153,69,255,0.05) 100%)',
    border: 'rgba(153,69,255,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#9945FF"/>
        <path d="M10.03 19.782a.53.53 0 01.373-.154h13.075c.235 0 .353.284.187.45l-2.588 2.588a.53.53 0 01-.373.154H7.629c-.235 0-.353-.284-.187-.45l2.588-2.588zM10.03 9.334A.53.53 0 0110.403 9.18h13.075c.235 0 .353.284.187.45l-2.588 2.588a.53.53 0 01-.373.154H7.629c-.235 0-.353-.284-.187-.45L10.03 9.334zM21.077 14.558a.53.53 0 00-.373-.154H7.629c-.235 0-.353.284-.187.45l2.588 2.588a.53.53 0 00.373.154h13.075c.235 0 .353-.284.187-.45l-2.588-2.588z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'LTC',
    network: 'Litecoin',
    address: 'ltc1qff5xug04kp4tm03zrx9n9tah6zhtf3kzk5cp30',
    color: '#A0A0A0',
    gradient: 'linear-gradient(135deg, rgba(160,160,160,0.18) 0%, rgba(160,160,160,0.05) 100%)',
    border: 'rgba(160,160,160,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#A0A0A0"/>
        <path d="M16 5C9.925 5 5 9.925 5 16s4.925 11 11 11 11-4.925 11-11S22.075 5 16 5zm-1.14 14.696l.465-1.741-1.07.393.318-1.187 1.074-.393 1.626-6.067H19l-1.625 6.067 1.07-.393-.317 1.187-1.073.393-.465 1.741H13.86z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'ARB',
    network: 'Arbitrum',
    address: '0x9e9C10d3A526cb39B62b88DecC55f04F8f63fdE3',
    color: '#2D374B',
    gradient: 'linear-gradient(135deg, rgba(100,140,255,0.18) 0%, rgba(100,140,255,0.05) 100%)',
    border: 'rgba(100,140,255,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#2D374B"/>
        <path d="M16 5.5L7 10.75v10.5L16 26.5l9-5.25V10.75L16 5.5z" fill="#2D374B" stroke="#648CFF" strokeWidth="0.5"/>
        <path d="M13.06 20.5l-1.56-.9 4.3-7.44.78 2.33-3.52 6.01zM15.6 14.56l-.78-2.34h2.35l3.83 8.28-1.56.9-3.84-6.84z" fill="#648CFF"/>
        <path d="M11 19.82v1.68l5 2.92 5-2.92v-1.68l-4.22 7.3-.78-.45V25.3l3.44-5.95 1.56-.9-5-2.9-5 2.9 1.56.9 3.44 5.95v1.37l-.78.45L11 19.82z" fill="white" opacity="0.7"/>
      </svg>
    ),
  },
];

function DonateModal({ onClose }) {
  const { t } = useTranslation();
  const [copiedAddr, setCopiedAddr] = useState(null);

  const handleCopy = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(address);
      setTimeout(() => setCopiedAddr(null), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedAddr(address);
      setTimeout(() => setCopiedAddr(null), 2500);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal donate-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('profile.donateTitle')}</h2>
          <button className="settings-close" onClick={onClose}><CloseCircleLinear size={18}/></button>
        </div>
        <div className="settings-body">
          <p className="donate-desc">{t('profile.donateDesc')}</p>
          <div className="donate-wallets">
            {WALLETS.map(({ label, network, address, color, gradient, border, icon }) => {
              const copied = copiedAddr === address;
              return (
                <div
                  key={label + network}
                  className={`donate-wallet${copied ? ' donate-wallet--copied' : ''}`}
                  onClick={() => handleCopy(address)}
                  style={{ background: copied ? 'rgba(34,197,94,0.07)' : gradient, borderColor: copied ? '#22c55e' : border }}
                >
                  <div className="donate-wallet__icon">{icon}</div>
                  <div className="donate-wallet__info">
                    <div className="donate-wallet__top">
                      <div className="donate-wallet__name">
                        <span className="donate-wallet__label" style={{ color: copied ? '#22c55e' : color }}>{label}</span>
                        <span className="donate-wallet__network" style={{ borderColor: copied ? 'rgba(34,197,94,0.4)' : `${color}55`, color: copied ? '#22c55e' : color }}>{network}</span>
                      </div>
                      <span className="donate-wallet__action">
                        {copied
                          ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{verticalAlign:'middle',marginRight:3}}><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('profile.donateCopied')}</>
                          : t('profile.donateTap')
                        }
                      </span>
                    </div>
                    <span className="donate-wallet__addr">{address}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings Modal ─── */
function SettingsModal({ onClose }) {
  const { theme, setTheme, lang, setLang } = useTheme();
  const { t } = useTranslation();
  const { user, signOut, signUp } = useAuth();
  const { isAdmin, overrides, setOverride } = useAdmin();
  const [registerMode, setRegisterMode] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langChanging, setLangChanging] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPass,  setRegPass]  = useState('');
  const [regError, setRegError] = useState('');
  const [regOk,    setRegOk]    = useState(false);

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

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('profile.settings')}</h2>
          <button className="settings-close" onClick={onClose}><CloseCircleLinear size={18}/></button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <p className="settings-label">{t('profile.theme')}</p>
            <div className="settings-options">
              <button className={"settings-option"+(theme==='dark'?" active":"")} onClick={()=>setTheme('dark')}>
                <MoonLinear size={15}/> {t('profile.dark')}
                {theme==='dark' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
              <button className={"settings-option"+(theme==='light'?" active":"")} onClick={()=>setTheme('light')}>
                <Sun2Linear size={15}/> {t('profile.light')}
                {theme==='light' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
            </div>
          </div>
          <div className="settings-section">
            <p className="settings-label">{t('profile.language')}</p>
            <div className={"lang-picker" + (langChanging ? " lang-changing" : "")}>
              {/* Collapsed: show current lang + change button */}
              {(() => {
                const current = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];
                return (
                  <div className="lang-picker__current">
                    <span className={`fi fi-${current.countryCode} lang-picker__flag`}></span>
                    <span className="lang-picker__label">{current.label}</span>
                    <button
                      className={"lang-picker__toggle" + (langOpen ? " open" : "")}
                      onClick={() => setLangOpen(v => !v)}
                    >
                      {langOpen ? t('profile.langClose') : t('profile.langChange')}
                    </button>
                  </div>
                );
              })()}
              {/* Expanded list */}
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
                        <span className={`fi fi-${countryCode} lang-picker__flag`}></span>
                        <span className="lang-picker__label">{label}</span>
                        {active && <CheckCircleLinear size={15} className="lang-picker__check"/>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="settings-section settings-section--admin">
              <p className="settings-label">⚙️ Admin / Dev Tools</p>
              <div className="settings-admin-row">
                <span className="settings-admin-label">❄️ Snow</span>
                <button className={"settings-admin-toggle"+(overrides.snow?" on":"")} onClick={()=>setOverride('snow',!overrides.snow)}>
                  {overrides.snow?'ON':'OFF'}
                </button>
              </div>
              <div className="settings-admin-row">
                <span className="settings-admin-label">🗓 Season</span>
                <select className="settings-admin-select" value={overrides.season||''} onChange={e=>setOverride('season',e.target.value||null)}>
                  <option value="">Auto</option>
                  {Object.keys(SEASON_CONFIG).map(s=>(
                    <option key={s} value={s}>{SEASON_CONFIG[s].en}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {user && (
            <div className="settings-section">
              <p className="settings-label">{t('profile.account')}</p>
              <p className="settings-email">{user.email}</p>
              <button className="settings-signout" onClick={handleSignOut}>
                <Logout3Linear size={14}/> {t('profile.signOut')}
              </button>
            </div>
          )}
          {!user && (
            <div className="settings-section">
              <p className="settings-label">{t('profile.account')}</p>
              {!registerMode && !regOk && (
                <>
                  <p className="settings-email settings-email--guest">
                    {t('profile.guestModeDesc')}
                  </p>
                  <button className="settings-register-btn" onClick={()=>setRegisterMode(true)}>
                    <UserPlusLinear size={14}/>
                    {t('profile.createAccountSave')}
                  </button>
                </>
              )}
              {registerMode && !regOk && (
                <form className="settings-register-form" onSubmit={handleRegister}>
                  <p className="settings-register-hint">
                    {t('profile.dataSavedToAccount')}
                  </p>
                  <input className="settings-register-input" type="email" placeholder="Email" value={regEmail} onChange={e=>setRegEmail(e.target.value)}/>
                  <input className="settings-register-input" type="password" placeholder={t('profile.passwordMin6')} value={regPass} onChange={e=>setRegPass(e.target.value)}/>
                  {regError && <p className="settings-register-error">{regError}</p>}
                  <div className="settings-register-actions">
                    <button type="button" className="settings-register-cancel" onClick={()=>setRegisterMode(false)}>{t('profile.cancel')}</button>
                    <button type="submit" className="settings-register-submit">{t('profile.signUp')}</button>
                  </div>
                </form>
              )}
              {regOk && <p className="settings-register-ok">✅ {t('profile.checkEmailConfirm')}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Poster Grid ─── */
function PosterGrid({ items, onSelect, onRemove, listTab, getRating, getTvProgress, pinnedIds, pinItem, unpinItem, lang }) {
  const { t } = useTranslation();
  const [pinAnim, setPinAnim] = useState(null);

  const handlePin = (e, id) => {
    e.stopPropagation();
    const isPinned = pinnedIds && pinnedIds.includes(id);
    setPinAnim(id);
    setTimeout(() => setPinAnim(null), 700);
    if (isPinned) unpinItem(id);
    else pinItem(id);
  };

  if (!items.length) return null;
  return (
    <div className="poster-grid">
      {items.map(m => {
        const poster   = tmdb.posterUrl(m.poster_path);
        const title    = m.title || m.name || m._fallback_title || '';
        const rating   = getRating(m.id);
        const isPinned = pinnedIds && pinnedIds.includes(m.id);
        const isAnim   = pinAnim === m.id;
        return (
          <div key={m.id} className={`poster-grid__item${isPinned ? ' poster-grid__item--pinned' : ''}`} onClick={() => onSelect(m)}>
            <div className="poster-grid__poster">
              {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="poster-grid__no-poster"/>}
              {isPinned && <div className="poster-grid__pin-glow"/>}
              {(() => {
                const rd = m.release_date || m.first_air_date;
                const today = new Date().toISOString().slice(0, 10);
                const isUnreleased = !rd || rd > today;
                if (!isUnreleased) return null;
                return rd ? <Countdown releaseDate={rd}/> : <Countdown noDate={true}/>;
              })()}
              {listTab === 'watched' && rating && (
                <div className="poster-grid__rating"><span>★</span>{rating}</div>
              )}
              {listTab === 'watchlist' && getTvProgress?.(m.id) && (() => {
                const p = getTvProgress(m.id);
                return (
                  <div className="poster-grid__progress">
                    <span>S{p.season}·E{p.episode}</span>
                    <div className="poster-grid__progress-bar">
                      <div className="poster-grid__progress-fill" style={{width:`${(()=>{const ts=Math.max(p.totalSeasons||1,1);const eps=p.episodesInSeason||null;const slot=100/ts;const base=(p.season-1)*slot;const frac=(eps&&eps>1)?((p.episode-1)/(eps-1)):0;return Math.min(100,Math.max(0,base+slot*frac));})()}%`}}/>
                    </div>
                  </div>
                );
              })()}
              {listTab === 'watchlist' && (
                <button
                  className={`poster-grid__pin${isPinned ? ' poster-grid__pin--active' : ''}${isAnim ? ' poster-grid__pin--burst' : ''}`}
                  onClick={e => handlePin(e, m.id)}
                  title={isPinned ? t('profile.unpin') : t('profile.pinToTop')}
                >
                  <PinLinear size={12}/>
                </button>
              )}
              <button className="poster-grid__remove" onClick={e=>{e.stopPropagation();onRemove(m.id);}}>
                <TrashBinMinimalistic2Linear size={11}/>
              </button>
            </div>
            <p className="poster-grid__title">{title}</p>
          </div>
        );
      })}
    </div>
  );
}
function WatchlistContent({ listTab, displayItems, localizedWatchlist, onSelect, removeFromWatched, removeFromWatchlist, getRating, getTvProgress, lang, pinnedIds, pinItem, unpinItem }) {
  const { t } = useTranslation();
  if (listTab === 'watched') {
    return <PosterGrid items={displayItems} onSelect={onSelect} onRemove={removeFromWatched} listTab="watched" getRating={getRating} lang={lang}/>;
  }
  const watching = localizedWatchlist.filter(m => (m.media_type==='tv'||(!m.title&&m.name)) && getTvProgress(m.id));
  const queued   = localizedWatchlist.filter(m => !watching.find(w => w.id===m.id));
  return (
    <>
      {watching.length > 0 && (
        <>
          <p className="profile-watching-label"><TVLinear size={13}/> {t('profile.currentlyWatching')}</p>
          <PosterGrid items={watching} onSelect={onSelect} onRemove={removeFromWatchlist} listTab="watchlist" getRating={getRating} getTvProgress={getTvProgress} pinnedIds={pinnedIds} pinItem={pinItem} unpinItem={unpinItem} lang={lang}/>
          {queued.length > 0 && <div className="profile-watching-divider" data-label={t('profile.upNext')}/>}
        </>
      )}
      {queued.length > 0 && (
        <PosterGrid items={queued} onSelect={onSelect} onRemove={removeFromWatchlist} listTab="watchlist" getRating={getRating} getTvProgress={getTvProgress} pinnedIds={pinnedIds} pinItem={pinItem} unpinItem={unpinItem} lang={lang}/>
      )}
    </>
  );
}

/* ─── Title Picker Modal ─── */
function TitlePickerModal({ listItems, onAdd, onClose, lang }) {
  const { t } = useTranslation();
  const TMDB_LANG_MAP = { ru:'ru-RU', en:'en-US', es:'es-ES', fr:'fr-FR', de:'de-DE' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';
  const inListIds = new Set(listItems.map(m => m.id));
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const [movies, tv] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=${langCode}`,{headers:HEADERS}).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=${langCode}`,{headers:HEADERS}).then(r=>r.json()),
        ]);
        const combined = [
          ...(movies.results||[]).filter(m=>m.poster_path).map(m=>({...m,media_type:'movie'})),
          ...(tv.results||[]).filter(m=>m.poster_path).map(m=>({...m,media_type:'tv'})),
        ].sort((a,b)=>(b.popularity||0)-(a.popularity||0)).slice(0,30);
        setResults(combined);
      } catch {}
      setLoading(false);
    }, 350);
  }, [query, langCode]);

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-panel" onClick={e=>e.stopPropagation()}>
        <div className="picker-header">
          <h3>{t('listeditor.addTitles')}</h3>
          <button onClick={onClose}><CloseCircleLinear size={20}/></button>
        </div>
        <div className="picker-search">
          <input autoFocus className="picker-search__input"
            placeholder={t('listeditor.searchPlaceholder')}
            value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <div className="picker-grid">
          {loading && <div style={{gridColumn:'1/-1',padding:'32px 0',textAlign:'center'}}><div className="search-loading__spinner"/></div>}
          {!loading && results.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || '';
            const inList = inListIds.has(m.id);
            return (
              <div key={`${m.id}-${m.media_type}`} className={"picker-item"+(inList?' picker-item--in':'')} onClick={()=>{ if(!inList) onAdd(m); }}>
                <div className="picker-item__poster">
                  {poster ? <img src={poster} alt={title} loading="lazy"/> : <div style={{position:'absolute',inset:0,background:'var(--surface2)'}}/>}
                  {inList && <div className="picker-item__check">✓</div>}
                </div>
                <p className="picker-item__title">{title}</p>
              </div>
            );
          })}
          {!loading && !results.length && query.trim() && (
            <div style={{gridColumn:'1/-1',padding:'32px 0',textAlign:'center',color:'var(--text3)',fontSize:13}}>
              {t('listeditor.nothingFound')}
            </div>
          )}
          {!loading && !query.trim() && (
            <div style={{gridColumn:'1/-1',padding:'32px 0',textAlign:'center',color:'var(--text3)',fontSize:13}}>
              {t('listeditor.startTyping')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Toggle row ─── */
function ToggleRow({ icon, label, hint, value, onChange }) {
  return (
    <div className="le-toggle-row" onClick={() => onChange(!value)}>
      <div className="le-toggle-row__left">
        <div className="le-toggle-row__icon">{icon}</div>
        <div>
          <p className="le-toggle-row__label">{label}</p>
          {hint && <p className="le-toggle-row__hint">{hint}</p>}
        </div>
      </div>
      <div className={"le-toggle" + (value ? ' on' : '')}>
        <div className="le-toggle__thumb"/>
      </div>
    </div>
  );
}

/* ─── List Edit Page (create & edit) ─── */
function ListEditPage({ listId, customLists, createCustomList, updateListMeta, onBack, onSaved, addToCustomList, lang }) {
  const { t } = useTranslation();
  const existing = listId ? customLists[listId] : null;
  const [name,         setName]         = useState(existing?.name         || '');
  const [desc,         setDesc]         = useState(existing?.description  || '');
  const [image,        setImage]        = useState(existing?.image        || null);
  const [showProgress, setShowProgress] = useState(existing?.showProgress !== undefined ? existing.showProgress : true);
  const [deadline,     setDeadline]     = useState(existing?.deadline     || '');
  const [currentId,    setCurrentId]    = useState(listId || null);
  const [showPicker,   setShowPicker]   = useState(false);
  const fileRef = useRef();

  const listItems = (currentId && customLists[currentId]?.items) || [];

  const handleImage = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setImage(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const meta = {
      name: name.trim(),
      description: desc.trim(),
      image,
      showProgress,
      deadline: deadline || null,
    };
    let id = currentId;
    if (id) {
      updateListMeta(id, meta);
    } else {
      id = createCustomList(name.trim(), desc.trim(), image, { showProgress, deadline: deadline || null });
      setCurrentId(id);
    }
    onSaved(id);
  };

  return (
    <div className="page list-edit-page">
      <div className="list-edit__topbar">
        <button className="list-detail__back" onClick={onBack}><CloseCircleLinear size={20}/></button>
        <h2 className="list-edit__heading">{currentId ? t('listeditor.editList') : t('listeditor.newList')}</h2>
        <button className="list-edit__save-btn" onClick={handleSave} disabled={!name.trim()}>
          {t('listeditor.save')}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImage}/>

      {/* Cover + fields side by side */}
      <div className="list-edit__form-row">
        <div className="list-edit__cover-wrap" onClick={() => fileRef.current?.click()}>
          {image
            ? <img className="list-edit__cover-img" src={image} alt="cover"/>
            : <div className="list-edit__cover-placeholder">
                <ListLinear size={26} strokeWidth={1}/>
                <span>{t('listeditor.cover')}</span>
              </div>
          }
        </div>
        <div className="list-edit__fields">
          <input
            className="list-edit__input"
            placeholder={t('listeditor.titlePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
          />
          <textarea
            className="list-edit__textarea"
            placeholder={t('listeditor.descPlaceholder')}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={300}
            rows={3}
          />
        </div>
      </div>

      {/* Options */}
      <div className="list-edit__options">
        <ToggleRow
          icon={<Chart2Linear size={16}/>}
          label={t('listeditor.watchProgress')}
          hint={t('listeditor.watchProgressHint')}
          value={showProgress}
          onChange={setShowProgress}
        />

        <div className="le-deadline-row">
          <div className="le-toggle-row__left">
            <div className="le-toggle-row__icon"><CalendarLinear size={16}/></div>
            <div>
              <p className="le-toggle-row__label">{t('listeditor.deadline')}</p>
              <p className="le-toggle-row__hint">{t('listeditor.deadlineHint')}</p>
            </div>
          </div>
          <input
            type="date"
            className="le-deadline-input"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Add titles */}
      <div style={{padding:'0 16px 12px'}}>
        <button className="custom-lists__new" onClick={() => setShowPicker(true)}>
          <AddCircleLinear size={16}/> {t('listeditor.addTitles')}
        </button>
      </div>

      {listItems.length > 0 && (
        <div className="poster-grid" style={{padding:'0 16px'}}>
          {listItems.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || m._fallback_title || '';
            return (
              <div key={m.id} className="poster-grid__item">
                <div className="poster-grid__poster">
                  {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="poster-grid__no-poster"/>}
                </div>
                <p className="poster-grid__title">{title}</p>
              </div>
            );
          })}
        </div>
      )}

      {showPicker && (
        <TitlePickerModal
          listItems={listItems}
          onAdd={m => {
            if (!currentId) {
              const id = createCustomList(name.trim()||t('profile.newList'), desc.trim(), image, { showProgress, deadline: deadline||null });
              setCurrentId(id);
              addToCustomList(id, m);
            } else {
              addToCustomList(currentId, m);
            }
          }}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}
    </div>
  );
}

/* ─── List Detail Page ─── */
function ListDetailPage({ list, listId, onBack, onSelect, onEdit, removeFromCustomList, addToCustomList, lang }) {
  const { t } = useTranslation();
  const [showPicker,  setShowPicker]  = useState(false);
  const [sharing,     setSharing]     = useState(false);
  const [shareLabel,  setShareLabel]  = useState(null); // null | 'copying' | 'copied' | 'error'
  const { addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist, isWatched, isInWatchlist } = useStore();
  const { profile } = useStore();

  const handleShare = async () => {
    setSharing(true);
    setShareLabel('copying');
    try {
      // Upsert the list snapshot to public_lists table
      const payload = {
        id:          listId,
        name:        list.name,
        description: list.description || '',
        image:       list.image || null,
        items:       list.items,
        author_name: profile?.name || (t('profile.anonymous')),
        updated_at:  new Date().toISOString(),
      };
      const { error } = await supabase.from('public_lists').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      const url = `${window.location.origin}/list/${listId}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShareLabel('copied');
      setTimeout(() => setShareLabel(null), 2500);
    } catch (e) {
      console.error(e);
      setShareLabel('error');
      setTimeout(() => setShareLabel(null), 2500);
    }
    setSharing(false);
  };

  // Progress calculation
  const total     = list.items.length;
  const watchedCount = list.items.filter(m => isWatched(m.id)).length;
  const pct       = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

  return (
    <div className="page list-detail-page">
      <div className="list-detail__header">
        <button className="list-detail__back" onClick={onBack}>
          <CloseCircleLinear size={20}/>
        </button>
        <div className="list-detail__header-info">
          <div className={`custom-list-card__avatar${(list.image||list.items.length===1)?' custom-list-card__avatar--single':''}`}
               style={{width:72,height:72,borderRadius:12,flexShrink:0}}>
            {list.image
              ? <img src={list.image} alt=""/>
              : list.items.slice(0,4).map(m=>tmdb.posterUrl(m.poster_path)).filter(Boolean).length>0
                ? list.items.slice(0,4).map(m=>tmdb.posterUrl(m.poster_path)).filter(Boolean).map((url,i)=><img key={i} src={url} alt=""/>)
                : <div className="custom-list-card__avatar--empty"><ListLinear size={28} strokeWidth={1}/></div>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <h1 className="list-detail__title">{list.name}</h1>
              <button className="list-detail__edit-btn" onClick={onEdit} title={t('profile.editList')}>
                <Pen2Linear size={15}/>
              </button>
              <button
                className={"list-detail__share-btn" + (shareLabel === 'copied' ? ' copied' : shareLabel === 'error' ? ' error' : '')}
                onClick={handleShare}
                disabled={sharing}
                title={t('profile.share')}
              >
                <ShareLinear size={15}/>
                <span>{shareLabel === 'copied' ? t('profile.copied') : shareLabel === 'error' ? t('profile.error') : t('profile.share')}</span>
              </button>
            </div>
            {list.description && <p className="list-detail__desc">{list.description}</p>}
            <p className="list-detail__count">{total} {t('profile.titles')}</p>

            {/* Progress bar */}
            {list.showProgress !== false && total > 0 && (
              <div className="list-detail__progress">
                <div className="list-detail__progress-bar">
                  <div className="list-detail__progress-fill" style={{width:`${pct}%`}}/>
                </div>
                <span className="list-detail__progress-label">{watchedCount}/{total} · {pct}%</span>
              </div>
            )}

            {/* Deadline */}
            {list.deadline && (
              <div className="list-detail__deadline">
                <CalendarLinear size={12}/>
                {t('profile.deadline')}
                {new Date(list.deadline).toLocaleDateString(lang, {day:'numeric',month:'long',year:'numeric'})}
              </div>
            )}
          </div>
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="lists-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{t('profile.listIsEmpty')}</p>
          <p style={{fontSize:12,color:'var(--text3)',marginTop:4}}>{t('profile.addViaMenu')}</p>
        </div>
      ) : (
        <div className="poster-grid" style={{padding:'0 16px'}}>
          {list.items.map(m => {
            const poster  = tmdb.posterUrl(m.poster_path);
            const title   = m.title || m.name || m._fallback_title || '';
            const watched = isWatched(m.id);
            const inWl    = isInWatchlist(m.id);
            return (
              <div key={m.id} className="poster-grid__item" onClick={() => onSelect(m)}>
                <div className="poster-grid__poster">
                  {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="poster-grid__no-poster"/>}

                  {watched && <div className="movie-card__badge watched"><EyeLinear size={10}/></div>}
                  {!watched && inWl && <div className="movie-card__badge watchlist"><BookmarkLinear size={10}/></div>}

                  {/* Action buttons — identical to MovieCard */}
                  <div className="ldp-overlay" onClick={e => e.stopPropagation()}>
                    <button
                      className={"movie-card__btn" + (watched ? ' g' : '')}
                      onClick={e => { e.stopPropagation(); watched ? removeFromWatched(m.id) : addToWatched(m); }}
                    >
                      {watched ? <EyeClosedLinear size={14}/> : <EyeLinear size={14}/>}
                    </button>
                    <button
                      className={"movie-card__btn" + (inWl && !watched ? ' y' : '')}
                      onClick={e => { e.stopPropagation(); if (!watched) { inWl ? removeFromWatchlist(m.id) : addToWatchlist(m); } }}
                      disabled={watched}
                    >
                      {inWl && !watched ? <BookmarkOpenedLinear size={14}/> : <BookmarkLinear size={14}/>}
                    </button>
                  </div>

                  <button className="poster-grid__remove" onClick={e=>{e.stopPropagation();removeFromCustomList(listId,m.id);}}>
                    <TrashBinMinimalistic2Linear size={11}/>
                  </button>
                </div>
                <p className="poster-grid__title">{title}</p>
              </div>
            );
          })}
        </div>
      )}

      <div style={{padding:'16px 16px 0'}}>
        <button className="custom-lists__new" onClick={() => setShowPicker(true)}>
          <AddCircleLinear size={16}/> {t('listeditor.addTitles')}
        </button>
      </div>

      {showPicker && (
        <TitlePickerModal
          listItems={list.items}
          onAdd={m => addToCustomList(listId, m)}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}
    </div>
  );
}

/* ─── Custom Lists Grid ─── */
function CustomListsGrid({ customLists, onOpenList, onEditList, onCreateList, deleteCustomList, lang }) {
  const { t } = useTranslation();
  const lists = Object.values(customLists).sort((a,b) => b.createdAt - a.createdAt);
  const [confirmId, setConfirmId] = useState(null);
  const { isWatched } = useStore();

  const handleDeleteClick = (e, list) => {
    e.stopPropagation();
    if (list.items.length > 0) { setConfirmId(list.id); } else { deleteCustomList(list.id); }
  };

  const confirmList = confirmId ? customLists[confirmId] : null;

  return (
    <div className="custom-lists">
      {confirmList && (
        <div className="list-confirm-overlay" onClick={()=>setConfirmId(null)}>
          <div className="list-confirm-panel" onClick={e=>e.stopPropagation()}>
            <p className="list-confirm-title">{t('profile.deleteList')}</p>
            <p className="list-confirm-body">
              {t('profile.deleteListBody', {name: confirmList.name, count: confirmList.items.length})}
            </p>
            <div className="list-confirm-actions">
              <button className="list-confirm-cancel" onClick={()=>setConfirmId(null)}>{t('profile.cancel2')}</button>
              <button className="list-confirm-delete" onClick={()=>{deleteCustomList(confirmId);setConfirmId(null);}}>{t('profile.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {lists.length === 0 && (
        <div className="lists-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{t('profile.noCustomLists')}</p>
        </div>
      )}
      <div className="custom-lists__grid">
        {lists.map(list => {
          const posters = list.items.slice(0,4).map(m=>tmdb.posterUrl(m.poster_path)).filter(Boolean);
          const total   = list.items.length;
          const watched = list.items.filter(m => isWatched(m.id)).length;
          const pct     = total > 0 ? Math.round((watched/total)*100) : 0;
          return (
            <div key={list.id} className="custom-list-card" onClick={()=>onOpenList(list.id)}>
              <div className="custom-list-card__avatar">
                {list.image
                  ? <img src={list.image} alt=""/>
                  : posters.length > 0
                    ? posters.map((url,i)=><img key={i} src={url} alt=""/>)
                    : <div className="custom-list-card__avatar--empty"><ListLinear size={22} strokeWidth={1}/></div>
                }
              </div>
              <div className="custom-list-card__info">
                <span className="custom-list-card__name">{list.name}</span>
                <div className="custom-list-card__meta">
                  <span>{total} {t('profile.titles')}</span>
                  {list.showProgress !== false && total > 0 && (
                    <span className="custom-list-card__pct">{pct}%</span>
                  )}
                </div>
                {list.showProgress !== false && total > 0 && (
                  <div className="custom-list-card__bar">
                    <div className="custom-list-card__bar-fill" style={{width:`${pct}%`}}/>
                  </div>
                )}
              </div>
              <div className="custom-list-card__actions">
                <button className="custom-list-card__edit" onClick={e=>{e.stopPropagation();onEditList(list.id);}}>
                  <Pen2Linear size={13}/>
                </button>
                <button className="custom-list-card__del" onClick={e=>handleDeleteClick(e,list)}>
                  <TrashBinMinimalistic2Linear size={13}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button className="custom-lists__new" onClick={onCreateList}>
        <AddCircleLinear size={16}/> {t('profile.newList')}
      </button>
    </div>
  );
}

/* ─── Main Profile ─── */
export default function Profile() {
  const {
    profile, setProfile, watched, watchlist, sortedWatchlist,
    removeFromWatched, removeFromWatchlist, getRating, syncing,
    getTvProgress, customLists, createCustomList, deleteCustomList,
    addToCustomList, removeFromCustomList, updateListMeta,
    pinnedIds, pinWatchlistItem, unpinWatchlistItem,
  } = useStore();
  const { user } = useAuth();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const [listTab,      setListTab]      = useState('watchlist');
  const [editing,      setEditing]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name,         setName]         = useState(profile.name);
  const [bio,          setBio]          = useState(profile.bio || '');
  const { selected, openMovie, closeMovie } = useMovieModal();
  const navigate = useNavigate();
  const handleActorClick = (actor) => navigate(`/actor/${actor.id}`, { state: { actor } });
  const [showDonate,   setShowDonate]   = useState(false);
  const [listView,     setListView]     = useState(null);
  const fileRef = useRef();


  const localizedWatched   = useLocalizedMovies(watched,        lang);
  const localizedWatchlist = useLocalizedMovies(sortedWatchlist, lang);

  const handleSave   = () => { setProfile({...profile, name: name.trim()||'Кинолюб', bio}); setEditing(false); };
  const handleAvatar = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setProfile({...profile, avatar: ev.target.result});
    r.readAsDataURL(f);
  };

  const displayItems = listTab === 'watchlist' ? localizedWatchlist : localizedWatched;



  // List detail
  if (listView?.view === 'detail') {
    const list = customLists[listView.id];
    if (!list) { setListView(null); return null; }
    return (
      <>
        <ListDetailPage
          list={list}
          listId={listView.id}
          onBack={() => setListView(null)}
          onSelect={openMovie}
          onEdit={() => setListView({ view: 'edit', id: listView.id })}
          removeFromCustomList={removeFromCustomList}
          addToCustomList={addToCustomList}
          lang={lang}
        />
        <MovieModal movie={selected} onClose={closeMovie} onActorClick={a=>{closeMovie();handleActorClick(a);}}/>
      </>
    );
  }

  // List edit/create
  if (listView?.view === 'edit') {
    return (
      <ListEditPage
        listId={listView.id || null}
        customLists={customLists}
        createCustomList={createCustomList}
        updateListMeta={updateListMeta}
        onBack={() => setListView(prev => prev.id ? { view: 'detail', id: prev.id } : null)}
        onSaved={id => setListView({ view: 'detail', id })}
        addToCustomList={addToCustomList}
        lang={lang}
      />
    );
  }

  return (
    <div className="page profile-page">
      <div className="profile-topbar">
        <div>
          <span className="profile-topbar__title">CINI<span>MATE</span></span>
          {user
            ? <p className="profile-topbar__email">{user.email}</p>
            : <p className="profile-topbar__email">{t('profile.guestMode')}</p>
          }
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {syncing && <span className="profile-sync-dot" title="Syncing..."/>}
          {!editing && <button className="profile-icon-btn" onClick={()=>setEditing(true)}><Pen2Linear size={17}/></button>}
          <button className="profile-icon-btn profile-icon-btn--donate" onClick={()=>setShowDonate(true)} title={t('profile.donateBtnTitle')}><HeartLinear size={17}/></button>
          <button className="profile-icon-btn" onClick={()=>setShowSettings(true)}><SettingsMinimalisticLinear size={17}/></button>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={()=>editing&&fileRef.current?.click()}>
          {profile.avatar
            ? <img className="profile-avatar" src={profile.avatar} alt="avatar"/>
            : <div className="profile-avatar profile-avatar--placeholder">{(profile.name||'К')[0].toUpperCase()}</div>
          }
          {editing && <div className="profile-avatar__overlay"><Pen2Linear size={16}/></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>

        {editing ? (
          <div className="profile-edit">
            <input className="profile-edit__input" value={name} onChange={e=>setName(e.target.value)} placeholder={t('profile.yourName')} maxLength={30}/>
            <textarea className="profile-edit__bio" value={bio} onChange={e=>setBio(e.target.value)} placeholder={t('profile.aboutTaste')} maxLength={120} rows={2}/>
            <div className="profile-edit__actions">
              <button className="profile-edit__cancel" onClick={()=>{setName(profile.name);setBio(profile.bio||'');setEditing(false);}}>{t('profile.cancel')}</button>
              <button className="profile-edit__save" onClick={handleSave}>{t('profile.save')}</button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            <h2 className="profile-name">{profile.name}</h2>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          </div>
        )}
      </div>

      <div className="profile-stats">
        <div className="profile-stat"><span className="profile-stat__val">{watched.length}</span><span className="profile-stat__label">{t('profile.watched')}</span></div>
        <div className="profile-stat"><span className="profile-stat__val">{watchlist.length}</span><span className="profile-stat__label">{t('profile.queued')}</span></div>
        <div className="profile-stat"><span className="profile-stat__val">{watched.filter(m=>!m.media_type||m.media_type==='movie').length}</span><span className="profile-stat__label">{t('profile.movies')}</span></div>
        <div className="profile-stat"><span className="profile-stat__val">{watched.filter(m=>m.media_type==='tv').length}</span><span className="profile-stat__label">{t('profile.series')}</span></div>

      </div>

      <div className="profile-roulette"><Roulette onMovieClick={openMovie}/></div>

      <div className="profile-lists">
        <div className="lists-tabs">
          <button className={"lists-tab"+(listTab==='watchlist'?" active":"")} onClick={()=>setListTab('watchlist')}>
            <BookmarkLinear size={14}/> {t('profile.watchlist')} <span>{watchlist.length}</span>
          </button>
          <button className={"lists-tab"+(listTab==='watched'?" active":"")} onClick={()=>setListTab('watched')}>
            <EyeLinear size={14}/> {t('profile.watched')} <span>{watched.length}</span>
          </button>
          <button className={"lists-tab lists-tab--small"+(listTab==='lists'?" active":"")} onClick={()=>setListTab('lists')}>
            <ListLinear size={13}/> {t('profile.lists')} <span>{Object.keys(customLists).length}</span>
          </button>
        </div>

        {listTab === 'lists' ? (
          <CustomListsGrid
            customLists={customLists}
            onOpenList={id => setListView({ view: 'detail', id })}
            onEditList={id => setListView({ view: 'edit', id })}
            onCreateList={() => setListView({ view: 'edit', id: null })}
            deleteCustomList={deleteCustomList}
            lang={lang}
          />
        ) : displayItems.length === 0 ? (
          <div className="lists-empty">
            {listTab==='watchlist' ? <BookmarkLinear size={38} strokeWidth={1}/> : <EyeLinear size={38} strokeWidth={1}/>}
            <p>{listTab==='watchlist' ? t('profile.listEmpty') : t('home.nothingYet')}</p>
          </div>
        ) : (
          <WatchlistContent
            listTab={listTab}
            displayItems={displayItems}
            localizedWatchlist={localizedWatchlist}
            onSelect={openMovie}
            removeFromWatched={removeFromWatched}
            removeFromWatchlist={removeFromWatchlist}
            getRating={getRating}
            getTvProgress={getTvProgress}
            lang={lang}
            pinnedIds={pinnedIds}
            pinItem={pinWatchlistItem}
            unpinItem={unpinWatchlistItem}
          />
        )}
      </div>

      <MovieModal movie={selected} onClose={closeMovie} onActorClick={a=>{closeMovie();handleActorClick(a);}}/>
      {showSettings && <SettingsModal onClose={()=>setShowSettings(false)}/>}
      {showDonate && <DonateModal onClose={()=>setShowDonate(false)}/>}
    </div>
  );
}