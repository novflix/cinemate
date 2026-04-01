import { useState, useEffect, useRef } from 'react';
import { TVLinear, Pen2Linear, SettingsMinimalisticLinear, EyeLinear, BookmarkLinear, MoonLinear, Sun2Linear, GlobalLinear, CloseCircleLinear, CheckCircleLinear, TrashBinMinimalistic2Linear, Logout3Linear, UserPlusLinear, ListLinear, AddCircleLinear } from 'solar-icon-set';
import { useStore } from '../store';
import { useAuth } from '../auth';
import { useAdmin } from '../admin';
import { SEASON_CONFIG } from '../hooks/useSeason';
import { useTheme, t } from '../theme';
import { tmdb, HEADERS } from '../api';
import { useLocalizedMovies } from '../useLocalizedMovies';
import Roulette from '../components/Roulette';
import MovieModal from '../components/MovieModal';
import ActorPage from './ActorPage';
import './Profile.css';

function SettingsModal({ onClose }) {
  const { theme, setTheme, lang, setLang } = useTheme();
  const { user, signOut, signUp } = useAuth();
  const { isAdmin, overrides, setOverride } = useAdmin();
  // Store data auto-migrates to cloud when user registers (onAuthStateChange triggers StoreProvider reload)
  const [registerMode, setRegisterMode] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPass,  setRegPass]  = useState('');
  const [regError, setRegError] = useState('');
  const [regOk,    setRegOk]    = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regEmail || !regPass) { setRegError(t(lang,'Заполни все поля','Fill in all fields')); return; }
    if (regPass.length < 6)   { setRegError(t(lang,'Пароль минимум 6 символов','Password min 6 chars')); return; }
    const { error } = await signUp(regEmail, regPass);
    if (error) { setRegError(error.message); return; }
    // Data will sync automatically when userId arrives via onAuthStateChange → StoreProvider
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
          <h2>{t(lang,'Настройки','Settings')}</h2>
          <button className="settings-close" onClick={onClose}><CloseCircleLinear size={18}/></button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <p className="settings-label">{t(lang,'Тема','Theme')}</p>
            <div className="settings-options">
              <button className={"settings-option"+(theme==='dark'?" active":"")} onClick={()=>setTheme('dark')}>
                <MoonLinear size={15}/> {t(lang,'Тёмная','Dark')}
                {theme==='dark' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
              <button className={"settings-option"+(theme==='light'?" active":"")} onClick={()=>setTheme('light')}>
                <Sun2Linear size={15}/> {t(lang,'Светлая','Light')}
                {theme==='light' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
            </div>
          </div>
          <div className="settings-section">
            <p className="settings-label">{t(lang,'Язык','Language')}</p>
            <div className="settings-options">
              <button className={"settings-option"+(lang==='ru'?" active":"")} onClick={()=>setLang('ru')}>
                <GlobalLinear size={15}/> Русский
                {lang==='ru' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
              <button className={"settings-option"+(lang==='en'?" active":"")} onClick={()=>setLang('en')}>
                <GlobalLinear size={15}/> English
                {lang==='en' && <CheckCircleLinear size={14} className="settings-check"/>}
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="settings-section settings-section--admin">
              <p className="settings-label">⚙️ Admin / Dev Tools</p>
              <div className="settings-admin-row">
                <span className="settings-admin-label">❄️ Snow</span>
                <button
                  className={"settings-admin-toggle" + (overrides.snow ? " on" : "")}
                  onClick={() => setOverride('snow', !overrides.snow)}
                >
                  {overrides.snow ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="settings-admin-row">
                <span className="settings-admin-label">🗓 Season</span>
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

          {user && (
            <div className="settings-section">
              <p className="settings-label">{t(lang,'Аккаунт','Account')}</p>
              <p className="settings-email">{user.email}</p>
              <button className="settings-signout" onClick={handleSignOut}>
                <Logout3Linear size={14}/> {t(lang,'Выйти из аккаунта','Sign out')}
              </button>
            </div>
          )}
          {!user && (
            <div className="settings-section">
              <p className="settings-label">{t(lang,'Аккаунт','Account')}</p>
              {!registerMode && !regOk && (
                <>
                  <p className="settings-email settings-email--guest">
                    {t(lang,'Гостевой режим — данные только на этом устройстве','Guest mode — data stored on this device only')}
                  </p>
                  <button className="settings-register-btn" onClick={() => setRegisterMode(true)}>
                    <UserPlusLinear size={14}/>
                    {t(lang,'Создать аккаунт и сохранить данные','Create account & save my data')}
                  </button>
                </>
              )}
              {registerMode && !regOk && (
                <form className="settings-register-form" onSubmit={handleRegister}>
                  <p className="settings-register-hint">
                    {t(lang,
                      'Все твои списки, оценки и прогресс сериалов сохранятся в аккаунт.',
                      'Your lists, ratings and series progress will be saved to your account.'
                    )}
                  </p>
                  <input
                    className="settings-register-input"
                    type="email" placeholder="Email"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  />
                  <input
                    className="settings-register-input"
                    type="password" placeholder={t(lang,'Пароль (мин. 6 символов)','Password (min 6 chars)')}
                    value={regPass} onChange={e => setRegPass(e.target.value)}
                  />
                  {regError && <p className="settings-register-error">{regError}</p>}
                  <div className="settings-register-actions">
                    <button type="button" className="settings-register-cancel" onClick={() => setRegisterMode(false)}>
                      {t(lang,'Отмена','Cancel')}
                    </button>
                    <button type="submit" className="settings-register-submit">
                      {t(lang,'Зарегистрироваться','Sign up')}
                    </button>
                  </div>
                </form>
              )}
              {regOk && (
                <p className="settings-register-ok">
                  ✅ {t(lang,'Проверь почту для подтверждения аккаунта!','Check your email to confirm your account!')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PosterGrid({ items, onSelect, onRemove, listTab, getRating, getTvProgress }) {
  if (!items.length) return null;
  return (
    <div className="poster-grid">
      {items.map(m => {
        const poster = tmdb.posterUrl(m.poster_path);
        const title  = m.title || m.name || m._fallback_title || '';
        const rating = getRating(m.id);
        return (
          <div key={m.id} className="poster-grid__item" onClick={() => onSelect(m)}>
            <div className="poster-grid__poster">
              {poster
                ? <img src={poster} alt={title} loading="lazy"/>
                : <div className="poster-grid__no-poster"/>
              }
              {listTab === 'watched' && rating && (
                <div className="poster-grid__rating"><span>★</span>{rating}</div>
              )}
              {listTab === 'watchlist' && getTvProgress?.(m.id) && (() => {
                const p = getTvProgress(m.id);
                return (
                  <div className="poster-grid__progress">
                    <span>S{p.season}·E{p.episode}</span>
                    <div className="poster-grid__progress-bar">
                      <div className="poster-grid__progress-fill"
                        style={{width:`${Math.min(100,((p.season-1)/Math.max(p.totalSeasons||1,1))*100+100/Math.max(p.totalSeasons||1,1))}%`}}/>
                    </div>
                  </div>
                );
              })()}
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


function WatchlistContent({ listTab, displayItems, localizedWatchlist, onSelect, removeFromWatched, removeFromWatchlist, getRating, getTvProgress, lang }) {
  if (listTab === 'watched') {
    return <PosterGrid items={displayItems} onSelect={onSelect} onRemove={removeFromWatched} listTab="watched" getRating={getRating}/>;
  }
  const watching = localizedWatchlist.filter(m =>
    (m.media_type === 'tv' || (!m.title && m.name)) && getTvProgress(m.id)
  );
  const queued = localizedWatchlist.filter(m => !watching.find(w => w.id === m.id));
  return (
    <>
      {watching.length > 0 && (
        <>
          <p className="profile-watching-label"><TVLinear size={13}/> {t(lang,'Смотрю сейчас','Currently watching')}</p>
          <PosterGrid items={watching} onSelect={onSelect} onRemove={removeFromWatchlist} listTab="watchlist" getRating={getRating} getTvProgress={getTvProgress}/>
          {queued.length > 0 && <div className="profile-watching-divider" data-label={lang==='ru'?'В очереди':'Up next'}/>}
        </>
      )}
      {queued.length > 0 && (
        <PosterGrid items={queued} onSelect={onSelect} onRemove={removeFromWatchlist} listTab="watchlist" getRating={getRating} getTvProgress={getTvProgress}/>
      )}
    </>
  );
}

// ─── Full-screen: view contents of one list ───────────────────────────────────
function ListDetailPage({ list, listId, onBack, onSelect, removeFromCustomList, updateCustomList, lang }) {
  const ru = lang === 'ru';
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="page list-detail-page">
      <div className="list-detail__header">
        <button className="list-detail__back" onClick={onBack}>
          <CloseCircleLinear size={20}/>
        </button>
        <div className="list-detail__header-info">
          {/* Always show square avatar */}
          <div className={`custom-list-card__avatar${(list.image || list.items.length === 1) ? ' custom-list-card__avatar--single' : ''}`}
               style={{width:72,height:72,borderRadius:12,flexShrink:0}}>
            {list.image
              ? <img src={list.image} alt=""/>
              : list.items.slice(0, 4).map(m => tmdb.posterUrl(m.poster_path)).filter(Boolean).length > 0
                ? list.items.slice(0, 4).map(m => tmdb.posterUrl(m.poster_path)).filter(Boolean).map((url, i) => <img key={i} src={url} alt=""/>)
                : <div className="custom-list-card__avatar--empty"><ListLinear size={28} strokeWidth={1}/></div>
            }
          </div>
          <div>
            <h1 className="list-detail__title">{list.name}</h1>
            {list.description && <p className="list-detail__desc">{list.description}</p>}
            <p className="list-detail__count">{list.items.length} {ru ? 'проектов' : 'titles'}</p>
          </div>
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="lists-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{ru ? 'Список пуст' : 'List is empty'}</p>
          <p style={{fontSize:12,color:'var(--text3)',marginTop:4}}>{ru ? 'Открой любой фильм и добавь через ⋯' : 'Open any title and add via ⋯'}</p>
        </div>
      ) : (
        <div className="poster-grid" style={{padding:'0 16px'}}>
          {list.items.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || m._fallback_title || '';
            return (
              <div key={m.id} className="poster-grid__item" onClick={() => onSelect(m)}>
                <div className="poster-grid__poster">
                  {poster ? <img src={poster} alt={title} loading="lazy"/> : <div className="poster-grid__no-poster"/>}
                  <button className="poster-grid__remove" onClick={e => { e.stopPropagation(); removeFromCustomList(listId, m.id); }}>
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
          <AddCircleLinear size={16}/> {ru ? 'Добавить тайтлы' : 'Add titles'}
        </button>
      </div>

      {showPicker && (
        <TitlePickerModal
          listItems={list.items}
          onAdd={m => updateCustomList(listId, m)}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}
    </div>
  );
}

// ─── Title picker modal — searches TMDB + shows saved titles ──────────────────
function TitlePickerModal({ listItems, onAdd, onClose, lang }) {
  const ru = lang === 'ru';
  const langCode = lang === 'en' ? 'en-US' : 'ru-RU';
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
          fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
        ]);
        const combined = [
          ...(movies.results || []).filter(m => m.poster_path).map(m => ({ ...m, media_type: 'movie' })),
          ...(tv.results    || []).filter(m => m.poster_path).map(m => ({ ...m, media_type: 'tv' })),
        ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 30);
        setResults(combined);
      } catch {}
      setLoading(false);
    }, 350);
  }, [query, langCode]);

  const displayed = results;

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-panel" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <h3>{ru ? 'Добавить тайтлы' : 'Add titles'}</h3>
          <button onClick={onClose}><CloseCircleLinear size={20}/></button>
        </div>
        <div className="picker-search">
          <input
            autoFocus
            className="picker-search__input"
            placeholder={ru ? 'Поиск фильмов и сериалов...' : 'Search movies & series...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="picker-grid">
          {loading && (
            <div style={{gridColumn:'1/-1',padding:'32px 0',textAlign:'center'}}>
              <div className="search-loading__spinner"/>
            </div>
          )}
          {!loading && displayed.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || '';
            const inList = inListIds.has(m.id);
            return (
              <div
                key={`${m.id}-${m.media_type}`}
                className={"picker-item" + (inList ? ' picker-item--in' : '')}
                onClick={() => { if (!inList) { onAdd(m); } }}
              >
                <div className="picker-item__poster">
                  {poster
                    ? <img src={poster} alt={title} loading="lazy"/>
                    : <div style={{position:'absolute',inset:0,background:'var(--surface2)'}}/>
                  }
                  {inList && <div className="picker-item__check">✓</div>}
                </div>
                <p className="picker-item__title">{title}</p>
              </div>
            );
          })}
          {!loading && !displayed.length && query.trim() && (
            <div style={{gridColumn:'1/-1',padding:'32px 0',textAlign:'center',color:'var(--text3)',fontSize:13}}>
              {ru ? 'Ничего не найдено' : 'Nothing found'}
            </div>
          )}
          {!loading && !query.trim() && (
            <div style={{gridColumn:'1/-1',padding:'32px 0',textAlign:'center',color:'var(--text3)',fontSize:13}}>
              {ru ? 'Начни вводить название...' : 'Start typing to search...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Full-screen: create / edit a list ────────────────────────────────────────
function ListEditPage({ listId, customLists, createCustomList, updateListMeta, onBack, onSaved, addToCustomList, lang }) {
  const ru       = lang === 'ru';
  const existing = listId ? customLists[listId] : null;
  const [name,      setName]      = useState(existing?.name        || '');
  const [desc,      setDesc]      = useState(existing?.description || '');
  const [image,     setImage]     = useState(existing?.image       || null);
  const [currentId, setCurrentId] = useState(listId || null);
  const [showPicker, setShowPicker] = useState(false);
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
    let id = currentId;
    if (id) {
      updateListMeta(id, { name: name.trim(), description: desc.trim(), image });
    } else {
      id = createCustomList(name.trim(), desc.trim(), image);
      setCurrentId(id);
    }
    // Navigate to the detail page of this list
    onSaved(id);
  };

  return (
    <div className="page list-edit-page">
      <div className="list-edit__topbar">
        <button className="list-detail__back" onClick={onBack}><CloseCircleLinear size={20}/></button>
        <h2 className="list-edit__heading">{ru ? (currentId ? 'Редактировать список' : 'Новый список') : (currentId ? 'Edit list' : 'New list')}</h2>
        <button className="list-edit__save-btn" onClick={handleSave} disabled={!name.trim()}>
          {ru ? 'Сохранить' : 'Save'}
        </button>
      </div>

      {/* Cover image */}
      <div className="list-edit__cover-wrap" onClick={() => fileRef.current?.click()}>
        {image
          ? <img className="list-edit__cover-img" src={image} alt="cover"/>
          : <div className="list-edit__cover-placeholder">
              <ListLinear size={28} strokeWidth={1}/>
              <span>{ru ? 'Обложка' : 'Cover image'}</span>
            </div>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImage}/>

      <div className="list-edit__fields">
        <input
          className="list-edit__input"
          placeholder={ru ? 'Название *' : 'Title *'}
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
        />
        <textarea
          className="list-edit__textarea"
          placeholder={ru ? 'Описание (необязательно)' : 'Description (optional)'}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          maxLength={300}
          rows={3}
        />
      </div>

      {/* Add titles always visible */}
      <div style={{padding:'0 16px 12px'}}>
        <button className="custom-lists__new" onClick={() => setShowPicker(true)}>
          <AddCircleLinear size={16}/> {ru ? 'Добавить тайтлы' : 'Add titles'}
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
              const id = createCustomList(name.trim() || (ru ? 'Новый список' : 'New list'), desc.trim(), image);
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

// ─── Lists grid shown in profile ──────────────────────────────────────────────
function CustomListsGrid({ customLists, onOpenList, onCreateList, deleteCustomList, lang }) {
  const ru    = lang === 'ru';
  const lists = Object.values(customLists).sort((a, b) => b.createdAt - a.createdAt);
  const [confirmId, setConfirmId] = useState(null);

  const handleDeleteClick = (e, list) => {
    e.stopPropagation();
    if (list.items.length > 0) {
      setConfirmId(list.id);
    } else {
      deleteCustomList(list.id);
    }
  };

  const confirmList = confirmId ? customLists[confirmId] : null;

  return (
    <div className="custom-lists">
      {/* Confirm delete dialog */}
      {confirmList && (
        <div className="list-confirm-overlay" onClick={() => setConfirmId(null)}>
          <div className="list-confirm-panel" onClick={e => e.stopPropagation()}>
            <p className="list-confirm-title">
              {ru ? 'Удалить список?' : 'Delete list?'}
            </p>
            <p className="list-confirm-body">
              {ru
                ? `«${confirmList.name}» содержит ${confirmList.items.length} проектов. Это нельзя отменить.`
                : `"${confirmList.name}" has ${confirmList.items.length} title${confirmList.items.length !== 1 ? 's' : ''}. This cannot be undone.`
              }
            </p>
            <div className="list-confirm-actions">
              <button className="list-confirm-cancel" onClick={() => setConfirmId(null)}>
                {ru ? 'Отмена' : 'Cancel'}
              </button>
              <button className="list-confirm-delete" onClick={() => { deleteCustomList(confirmId); setConfirmId(null); }}>
                {ru ? 'Удалить' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lists.length === 0 && (
        <div className="lists-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{ru ? 'Нет кастомных списков' : 'No custom lists yet'}</p>
        </div>
      )}
      <div className="custom-lists__grid">
        {lists.map(list => {
          const posters = list.items.slice(0, 4).map(m => tmdb.posterUrl(m.poster_path)).filter(Boolean);
          return (
            <div key={list.id} className="custom-list-card" onClick={() => onOpenList(list.id)}>
              <div className="custom-list-card__avatar">
                {list.image
                  ? <img src={list.image} alt=""/>
                  : posters.length > 0
                    ? posters.map((url, i) => <img key={i} src={url} alt=""/>)
                    : <div className="custom-list-card__avatar--empty"><ListLinear size={22} strokeWidth={1}/></div>
                }
              </div>
              <div className="custom-list-card__info">
                <span className="custom-list-card__name">{list.name}</span>
                <div className="custom-list-card__meta">
                  <span>{list.items.length} {ru ? 'проектов' : 'items'}</span>
                  <button className="custom-list-card__del" onClick={e => handleDeleteClick(e, list)}>
                    <TrashBinMinimalistic2Linear size={13}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="custom-lists__new" onClick={onCreateList}>
        <AddCircleLinear size={16}/> {ru ? 'Новый список' : 'New list'}
      </button>
    </div>
  );
}

export default function Profile() {
  const { profile, setProfile, watched, watchlist, removeFromWatched, removeFromWatchlist, getRating, syncing, getTvProgress, customLists, createCustomList, deleteCustomList, addToCustomList, removeFromCustomList, updateListMeta } = useStore();
  const { user } = useAuth();
  const { lang } = useTheme();
  const [listTab,      setListTab]      = useState('watchlist');
  const [editing,      setEditing]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name,         setName]         = useState(profile.name);
  const [bio,          setBio]          = useState(profile.bio || '');
  const [selected,     setSelected]     = useState(null);
  const [actor,        setActor]        = useState(null);
  // null = profile; { view:'detail', id } or { view:'edit', id } = full-screen list pages
  const [listView,     setListView]     = useState(null);
  const fileRef = useRef();

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

  // Full-screen: list detail page
  if (listView?.view === 'detail') {
    const list = customLists[listView.id];
    if (!list) { setListView(null); return null; }
    return (
      <>
        <ListDetailPage
          list={list}
          listId={listView.id}
          onBack={() => setListView(null)}
          onSelect={setSelected}
          removeFromCustomList={removeFromCustomList}
          updateCustomList={addToCustomList}
          lang={lang}
        />
        <MovieModal movie={selected} onClose={() => setSelected(null)} onActorClick={a => { setSelected(null); setActor(a); }}/>
      </>
    );
  }

  // Full-screen: create/edit list page
  if (listView?.view === 'edit') {
    return (
      <ListEditPage
        listId={listView.id || null}
        customLists={customLists}
        createCustomList={createCustomList}
        updateListMeta={updateListMeta}
        onBack={() => setListView(null)}
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
          <span className="profile-topbar__title">CINE<span>MATE</span></span>
          {user
            ? <p className="profile-topbar__email">{user.email}</p>
            : <p className="profile-topbar__email">{t(lang,'Гостевой режим','Guest mode')}</p>
          }
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {syncing && <span className="profile-sync-dot" title="Syncing..."/>}
          {!editing && <button className="profile-icon-btn" onClick={() => setEditing(true)}><Pen2Linear size={17}/></button>}
          <button className="profile-icon-btn" onClick={() => setShowSettings(true)}><SettingsMinimalisticLinear size={17}/></button>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={() => editing && fileRef.current?.click()}>
          {profile.avatar
            ? <img className="profile-avatar" src={profile.avatar} alt="avatar"/>
            : <div className="profile-avatar profile-avatar--placeholder">{(profile.name||'К')[0].toUpperCase()}</div>
          }
          {editing && <div className="profile-avatar__overlay"><Pen2Linear size={16}/></div>}
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
            <BookmarkLinear size={14}/> {t(lang,'Хочу смотреть','Watchlist')} <span>{watchlist.length}</span>
          </button>
          <button className={"lists-tab"+(listTab==='watched'?" active":"")} onClick={()=>setListTab('watched')}>
            <EyeLinear size={14}/> {t(lang,'Смотрел','Watched')} <span>{watched.length}</span>
          </button>
          <button className={"lists-tab lists-tab--small"+(listTab==='lists'?" active":"")} onClick={()=>setListTab('lists')}>
            <ListLinear size={13}/> {t(lang,'Списки','Lists')} <span>{Object.keys(customLists).length}</span>
          </button>
        </div>

        {listTab === 'lists' ? (
          <CustomListsGrid
            customLists={customLists}
            onOpenList={id => setListView({ view: 'detail', id })}
            onCreateList={() => setListView({ view: 'edit', id: null })}
            deleteCustomList={deleteCustomList}
            lang={lang}
          />
        ) : displayItems.length === 0 ? (
          <div className="lists-empty">
            {listTab==='watchlist' ? <BookmarkLinear size={38} strokeWidth={1}/> : <EyeLinear size={38} strokeWidth={1}/>}
            <p>{listTab==='watchlist' ? t(lang,'Список пуст','List is empty') : t(lang,'Пока пусто','Nothing yet')}</p>
          </div>
        ) : (
          <WatchlistContent
            listTab={listTab}
            displayItems={displayItems}
            localizedWatchlist={localizedWatchlist}
            onSelect={setSelected}
            removeFromWatched={removeFromWatched}
            removeFromWatchlist={removeFromWatchlist}
            getRating={getRating}
            getTvProgress={getTvProgress}
            lang={lang}
          />
        )}
      </div>

      <MovieModal movie={selected} onClose={()=>setSelected(null)} onActorClick={a=>{setSelected(null);setActor(a);}}/>
      {showSettings && <SettingsModal onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}