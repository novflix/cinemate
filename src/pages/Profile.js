import { useState, useRef } from 'react';
import { Edit2, Settings, Eye, Bookmark, Moon, Sun, Globe, X, Check, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { useTheme, t } from '../theme';
import { tmdb } from '../api';
import { useLocalizedMovies } from '../useLocalizedMovies';
import Roulette from '../components/Roulette';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Profile.css';

function SettingsModal({ onClose }) {
  const { theme, setTheme, lang, setLang } = useTheme();
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t(lang,'Настройки','Settings')}</h2>
          <button className="settings-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <p className="settings-label">{t(lang,'Тема','Theme')}</p>
            <div className="settings-options">
              <button className={"settings-option"+(theme==='dark'?" active":"")} onClick={()=>setTheme('dark')}>
                <Moon size={15}/> {t(lang,'Тёмная','Dark')}
                {theme==='dark' && <Check size={14} className="settings-check"/>}
              </button>
              <button className={"settings-option"+(theme==='light'?" active":"")} onClick={()=>setTheme('light')}>
                <Sun size={15}/> {t(lang,'Светлая','Light')}
                {theme==='light' && <Check size={14} className="settings-check"/>}
              </button>
            </div>
          </div>
          <div className="settings-section">
            <p className="settings-label">{t(lang,'Язык','Language')}</p>
            <div className="settings-options">
              <button className={"settings-option"+(lang==='ru'?" active":"")} onClick={()=>setLang('ru')}>
                <Globe size={15}/> Русский
                {lang==='ru' && <Check size={14} className="settings-check"/>}
              </button>
              <button className={"settings-option"+(lang==='en'?" active":"")} onClick={()=>setLang('en')}>
                <Globe size={15}/> English
                {lang==='en' && <Check size={14} className="settings-check"/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PosterGrid({ items, onSelect, onRemove, listTab, getRating }) {
  if (!items.length) return null;
  return (
    <div className="poster-grid">
      {items.map(m => {
        const poster = tmdb.posterUrl(m.poster_path);
        const title  = m.title || m.name || m._fallback_title || '';
        return (
          <div key={m.id} className="poster-grid__item" onClick={() => onSelect(m)}>
            <div className="poster-grid__poster">
              {poster
                ? <img src={poster} alt={title} loading="lazy"/>
                : <div className="poster-grid__no-poster"/>
              }
              {listTab==='watched' && getRating(m.id) && (
                <div className="poster-grid__rating"><span>★</span>{getRating(m.id)}</div>
              )}
              <button className="poster-grid__remove" onClick={e=>{e.stopPropagation();onRemove(m.id);}}>
                <Trash2 size={11}/>
              </button>
            </div>
            <p className="poster-grid__title">{title}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function Profile() {
  const { profile, setProfile, watched, watchlist, removeFromWatched, removeFromWatchlist, getRating } = useStore();
  const { lang } = useTheme();
  const [listTab,      setListTab]      = useState('watchlist');
  const [editing,      setEditing]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name,         setName]         = useState(profile.name);
  const [bio,          setBio]          = useState(profile.bio || '');
  const [selected,     setSelected]     = useState(null);
  const [actor,        setActor]        = useState(null);
  const fileRef = useRef();

  // Hydrate lists with localized titles/posters on every lang change
  const localizedWatched   = useLocalizedMovies(watched,   lang);
  const localizedWatchlist = useLocalizedMovies(watchlist, lang);

  const handleSave   = () => { setProfile({...profile, name: name.trim()||'Кинолюб', bio}); setEditing(false); };
  const handleAvatar = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setProfile({...profile, avatar: ev.target.result}); r.readAsDataURL(f);
  };

  const displayItems = listTab === 'watchlist' ? localizedWatchlist : localizedWatched;

  if (actor) return (
    <ActorPage actor={actor} onBack={() => setActor(null)} onMovieClick={m => { setActor(null); setSelected(m); }}/>
  );

  return (
    <div className="page profile-page">
      <div className="profile-topbar">
        <span className="profile-topbar__title">CINE<span>MATE</span></span>
        <div style={{display:'flex',gap:8}}>
          {!editing && <button className="profile-icon-btn" onClick={() => setEditing(true)}><Edit2 size={17}/></button>}
          <button className="profile-icon-btn" onClick={() => setShowSettings(true)}><Settings size={17}/></button>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={() => editing && fileRef.current?.click()}>
          {profile.avatar
            ? <img className="profile-avatar" src={profile.avatar} alt="avatar"/>
            : <div className="profile-avatar profile-avatar--placeholder">{(profile.name||'К')[0].toUpperCase()}</div>
          }
          {editing && <div className="profile-avatar__overlay"><Edit2 size={16}/></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>

        {editing ? (
          <div className="profile-edit">
            <input className="profile-edit__input" value={name} onChange={e=>setName(e.target.value)}
              placeholder={t(lang,'Твоё имя','Your name')} maxLength={30}/>
            <textarea className="profile-edit__bio" value={bio} onChange={e=>setBio(e.target.value)}
              placeholder={t(lang,'О своих вкусах...','About your taste...')} maxLength={120} rows={2}/>
            <div className="profile-edit__actions">
              <button className="profile-edit__cancel" onClick={()=>{setName(profile.name);setBio(profile.bio||'');setEditing(false);}}>
                {t(lang,'Отмена','Cancel')}
              </button>
              <button className="profile-edit__save" onClick={handleSave}>{t(lang,'Сохранить','Save')}</button>
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
        <div className="profile-stat">
          <span className="profile-stat__val">{watched.length}</span>
          <span className="profile-stat__label">{t(lang,'Смотрел','Watched')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__val">{watchlist.length}</span>
          <span className="profile-stat__label">{t(lang,'В очереди','Queued')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__val">{watched.filter(m=>!m.media_type||m.media_type==='movie').length}</span>
          <span className="profile-stat__label">{t(lang,'Фильмов','Movies')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__val">{watched.filter(m=>m.media_type==='tv').length}</span>
          <span className="profile-stat__label">{t(lang,'Сериалов','Series')}</span>
        </div>
      </div>

      <div className="profile-roulette">
        <Roulette onMovieClick={setSelected}/>
      </div>

      <div className="profile-lists">
        <div className="lists-tabs">
          <button className={"lists-tab"+(listTab==='watchlist'?" active":"")} onClick={()=>setListTab('watchlist')}>
            <Bookmark size={14}/> {t(lang,'Хочу смотреть','Watchlist')} <span>{watchlist.length}</span>
          </button>
          <button className={"lists-tab"+(listTab==='watched'?" active":"")} onClick={()=>setListTab('watched')}>
            <Eye size={14}/> {t(lang,'Смотрел','Watched')} <span>{watched.length}</span>
          </button>
        </div>

        {displayItems.length === 0 ? (
          <div className="lists-empty">
            {listTab==='watchlist' ? <Bookmark size={38} strokeWidth={1}/> : <Eye size={38} strokeWidth={1}/>}
            <p>{listTab==='watchlist' ? t(lang,'Список пуст','List is empty') : t(lang,'Пока пусто','Nothing yet')}</p>
          </div>
        ) : (
          <PosterGrid
            items={displayItems}
            onSelect={setSelected}
            onRemove={listTab==='watched' ? removeFromWatched : removeFromWatchlist}
            listTab={listTab}
            getRating={getRating}
          />
        )}
      </div>

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
      {showSettings && <SettingsModal onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}