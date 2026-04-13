import { useNavigate } from 'react-router-dom';
import { useMovieModal } from '../hooks/useMovieModal';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pen2Linear, SettingsMinimalisticLinear, EyeLinear, BookmarkLinear,
  ListLinear, HeartLinear, TrashBinMinimalistic2Linear,
} from 'solar-icon-set';
import { useStore } from '../store';
import { useAuth } from '../auth';
import { useTheme } from '../theme';
import { useLocalizedMovies } from '../useLocalizedMovies';
import { uploadToCloudinary } from './profile/Cloudinary';
import SettingsModal from './profile/SettingsModal';
import DonateModal from './profile/DonateModal';
import { WatchlistContent } from './profile/PosterGrid';
import CustomListsGrid from './profile/CustomListsGrid';
import ListDetailPage from './profile/ListDetailPage';
import ListEditPage from './profile/ListEditPage';
import Roulette from '../components/Roulette';
import MovieModal from '../components/MovieModal';
import './Profile.css';

export default function Profile() {
  const {
    profile, setProfile, watched, watchlist, sortedWatchlist,
    removeFromWatched, removeFromWatchlist, getRating, syncing,
    getTvProgress, customLists, createCustomList, deleteCustomList,
    addToCustomList, removeFromCustomList, updateListMeta,
    pinnedIds, pinWatchlistItem, unpinWatchlistItem,
  } = useStore();
  const { user }  = useAuth();
  const { lang }  = useTheme();
  const { t }     = useTranslation();
  const navigate  = useNavigate();

  const [listTab,       setListTab]       = useState('watchlist');
  const [editing,       setEditing]       = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [showDonate,    setShowDonate]    = useState(false);
  const [listView,      setListView]      = useState(null);
  const [name,          setName]          = useState(profile.name);
  const [bio,           setBio]           = useState(profile.bio || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef();

  const { selected, openMovie, closeMovie } = useMovieModal();
  const handleActorClick = (actor) => navigate(`/actor/${actor.id}`, { state: { actor } });

  const localizedWatched   = useLocalizedMovies(watched,         lang);
  const localizedWatchlist = useLocalizedMovies(sortedWatchlist, lang);
  const displayItems = listTab === 'watchlist' ? localizedWatchlist : localizedWatched;

  // ─── Profile save ──────────────────────────────────────────────────────────
  const handleSave = () => {
    setProfile({ ...profile, name: name.trim().slice(0, 30) || 'Кинолюб', bio: bio.trim().slice(0, 120) });
    setEditing(false);
  };

  // ─── Avatar ────────────────────────────────────────────────────────────────
  const handleAvatar = async (e) => {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > 5 * 1024 * 1024) { alert(t('profile.imageTooLarge', 'Image must be under 5MB')); return; }
    setAvatarUploading(true);
    try {
      const url = await uploadToCloudinary(f);
      setProfile(p => ({ ...p, avatar: url }));
    } catch {
      alert(t('profile.uploadFailed', 'Upload failed, please try again'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarDelete = () => setProfile({ ...profile, avatar: null });

  // ─── Auto-migrate base64 avatar → Cloudinary ──────────────────────────────
  useEffect(() => {
    const avatar = profile?.avatar;
    if (!avatar || !avatar.startsWith('data:image')) return;
    let cancelled = false;
    (async () => {
      try {
        const blob = await (await fetch(avatar)).blob();
        const file = new File([blob], 'avatar.jpg', { type: blob.type });
        const url  = await uploadToCloudinary(file);
        if (!cancelled) setProfile(p => ({ ...p, avatar: url }));
      } catch (err) {
        console.warn('[avatar] auto-migration failed:', err.message);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.avatar?.startsWith?.('data:image')]);

  // ─── Sub-page: list detail ─────────────────────────────────────────────────
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
        <MovieModal
          movie={selected}
          onClose={closeMovie}
          onActorClick={a => handleActorClick(a)}
          onCrewClick={p => navigate(`/person/${p.id}`, { state: { person: p } })}
          onStudioClick={s => navigate(`/studio/${s.id}`, { state: { studio: s } })}
        />
      </>
    );
  }

  // ─── Sub-page: list edit / create ─────────────────────────────────────────
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

  // ─── Main profile page ─────────────────────────────────────────────────────
  return (
    <div className="page profile-page">
      {/* Top bar */}
      <div className="profile-topbar">
        <div>
          <span className="profile-topbar__title">CINI<span>MATE</span></span>
          {user
            ? <p className="profile-topbar__email">{user.email}</p>
            : <p className="profile-topbar__email">{t('profile.guestMode')}</p>
          }
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {syncing && <span className="profile-sync-dot" title="Syncing..."/>}
          {!editing && (
            <button className="profile-icon-btn" onClick={() => setEditing(true)}>
              <Pen2Linear size={17}/>
            </button>
          )}
          <button
            className="profile-icon-btn profile-icon-btn--donate"
            onClick={() => setShowDonate(true)}
            title={t('profile.donateBtnTitle')}
          >
            <HeartLinear size={17}/>
          </button>
          <button className="profile-icon-btn" onClick={() => setShowSettings(true)}>
            <SettingsMinimalisticLinear size={17}/>
          </button>
        </div>
      </div>

      {/* Avatar + profile card */}
      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={() => editing && fileRef.current?.click()}>
          {profile.avatar
            ? <img className="profile-avatar" src={profile.avatar} alt="avatar" crossOrigin="anonymous" referrerPolicy="no-referrer"/>
            : <div className="profile-avatar profile-avatar--placeholder">{(profile.name || 'К')[0].toUpperCase()}</div>
          }
          {editing && (
            <div className="profile-avatar__overlay">
              {avatarUploading ? <span style={{ fontSize: 11 }}>...</span> : <Pen2Linear size={16}/>}
            </div>
          )}
        </div>
        {editing && profile.avatar && (
          <button className="profile-avatar__delete-btn" onClick={handleAvatarDelete} title={t('profile.removeAvatar', 'Remove avatar')}>
            <TrashBinMinimalistic2Linear size={13}/>
            {t('profile.removeAvatar', 'Remove avatar')}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar}/>

        {editing ? (
          <div className="profile-edit">
            <input
              className="profile-edit__input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('profile.yourName')}
              maxLength={30}
            />
            <textarea
              className="profile-edit__bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={t('profile.aboutTaste')}
              maxLength={120}
              rows={2}
            />
            <div className="profile-edit__actions">
              <button className="profile-edit__cancel" onClick={() => { setName(profile.name); setBio(profile.bio || ''); setEditing(false); }}>
                {t('profile.cancel')}
              </button>
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

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat__val">{watched.length}</span>
          <span className="profile-stat__label">{t('profile.watched')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__val">{watchlist.length}</span>
          <span className="profile-stat__label">{t('profile.queued')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__val">{watched.filter(m => !m.media_type || m.media_type === 'movie').length}</span>
          <span className="profile-stat__label">{t('profile.movies')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__val">{watched.filter(m => m.media_type === 'tv').length}</span>
          <span className="profile-stat__label">{t('profile.series')}</span>
        </div>
      </div>

      {/* Roulette */}
      <div className="profile-roulette"><Roulette onMovieClick={openMovie}/></div>

      {/* Lists tabs */}
      <div className="profile-lists">
        <div className="lists-tabs">
          <button className={"lists-tab" + (listTab === 'watchlist' ? " active" : "")} onClick={() => setListTab('watchlist')}>
            <BookmarkLinear size={14}/> {t('profile.watchlist')} <span>{watchlist.length}</span>
          </button>
          <button className={"lists-tab" + (listTab === 'watched' ? " active" : "")} onClick={() => setListTab('watched')}>
            <EyeLinear size={14}/> {t('profile.watched')} <span>{watched.length}</span>
          </button>
          <button className={"lists-tab lists-tab--small" + (listTab === 'lists' ? " active" : "")} onClick={() => setListTab('lists')}>
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
            {listTab === 'watchlist'
              ? <BookmarkLinear size={38} strokeWidth={1}/>
              : <EyeLinear size={38} strokeWidth={1}/>
            }
            <p>{listTab === 'watchlist' ? t('profile.listEmpty') : t('home.nothingYet')}</p>
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

      <MovieModal
        movie={selected}
        onClose={closeMovie}
        onActorClick={a => handleActorClick(a)}
        onCrewClick={p => navigate(`/person/${p.id}`, { state: { person: p } })}
        onStudioClick={s => navigate(`/studio/${s.id}`, { state: { studio: s } })}
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)}/>}
      {showDonate   && <DonateModal   onClose={() => setShowDonate(false)}/>}
    </div>
  );
}