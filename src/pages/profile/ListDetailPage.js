import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CloseCircleLinear, Pen2Linear, ShareLinear, ListLinear,
  EyeLinear, EyeClosedLinear, BookmarkLinear, BookmarkOpenedLinear,
  AddCircleLinear, CalendarLinear, TrashBinMinimalistic2Linear,
} from 'solar-icon-set';
import { tmdb } from '../../api';
import { useStore } from '../../store';
import { useAuth } from '../../auth';
import { supabase } from '../../supabase';
import TitlePickerModal from './TitlePickerModal';
import './ListDetailPage.css';

export default function ListDetailPage({
  list, listId, onBack, onSelect, onEdit,
  removeFromCustomList, addToCustomList, lang,
}) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker]  = useState(false);
  const [sharing,    setSharing]     = useState(false);
  const [shareLabel, setShareLabel]  = useState(null); // null | 'copying' | 'copied' | 'error'

  const { addToWatched, addToWatchlist, removeFromWatched, removeFromWatchlist, isWatched, isInWatchlist, profile } = useStore();
  const { user } = useAuth();

  const handleShare = async () => {
    setSharing(true);
    setShareLabel('copying');
    try {
      const payload = {
        id:          listId,
        user_id:     user?.id || null,
        name:        list.name.slice(0, 100),
        description: (list.description || '').slice(0, 500),
        image:       list.image || null,
        items:       list.items,
        author_name: (profile?.name || t('profile.anonymous')).slice(0, 50),
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

  const total        = list.items.length;
  const watchedCount = list.items.filter(m => isWatched(m.id)).length;
  const pct          = total > 0 ? Math.round((watchedCount / total) * 100) : 0;
  const coverPosters = list.items.slice(0, 4).map(m => tmdb.posterUrl(m.poster_path)).filter(Boolean);

  return (
    <div className="page list-detail-page">
      <div className="list-detail__header">
        <button className="list-detail__back" onClick={onBack}>
          <CloseCircleLinear size={20}/>
        </button>
        <div
          className={`custom-list-card__avatar${(list.image || list.items.length === 1) ? ' custom-list-card__avatar--single' : ''}`}
          style={{ width: 72, height: 72, borderRadius: 12, flexShrink: 0 }}
        >
          {list.image ? (
            <img src={list.image} alt=""/>
          ) : coverPosters.length > 0 ? (
            coverPosters.map((url, i) => <img key={i} src={url} alt=""/>)
          ) : (
            <div className="custom-list-card__avatar--empty"><ListLinear size={28} strokeWidth={1}/></div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <span>
                {shareLabel === 'copied' ? t('profile.copied')
                  : shareLabel === 'error' ? t('profile.error')
                  : t('profile.share')}
              </span>
            </button>
          </div>
          {list.description && <p className="list-detail__desc">{list.description}</p>}
          <p className="list-detail__count">{total} {t('profile.titles')}</p>

          {list.showProgress !== false && total > 0 && (
            <div className="list-detail__progress">
              <div className="list-detail__progress-bar">
                <div className="list-detail__progress-fill" style={{ width: `${pct}%` }}/>
              </div>
              <span className="list-detail__progress-label">{watchedCount}/{total} · {pct}%</span>
            </div>
          )}

          {list.deadline && (
            <div className="list-detail__deadline">
              <CalendarLinear size={12}/>
              {t('profile.deadline')}
              {new Date(list.deadline).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="lists-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{t('profile.listIsEmpty')}</p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{t('profile.addViaMenu')}</p>
        </div>
      ) : (
        <div className="poster-grid" style={{ padding: '0 16px' }}>
          {list.items.map(m => {
            const poster  = tmdb.posterUrl(m.poster_path);
            const title   = m.title || m.name || m._fallback_title || '';
            const watched = isWatched(m.id);
            const inWl    = isInWatchlist(m.id);
            return (
              <div key={m.id} className="poster-grid__item" onClick={() => onSelect(m)}>
                <div className="poster-grid__poster">
                  {poster
                    ? <img src={poster} alt={title} loading="lazy"/>
                    : <div className="poster-grid__no-poster"/>
                  }
                  {watched  && <div className="movie-card__badge watched"><EyeLinear size={10}/></div>}
                  {!watched && inWl && <div className="movie-card__badge watchlist"><BookmarkLinear size={10}/></div>}

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

                  <button
                    className="poster-grid__remove"
                    onClick={e => { e.stopPropagation(); removeFromCustomList(listId, m.id); }}
                  >
                    <TrashBinMinimalistic2Linear size={11}/>
                  </button>
                </div>
                <p className="poster-grid__title">{title}</p>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
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