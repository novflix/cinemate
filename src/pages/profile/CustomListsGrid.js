import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ListLinear, Pen2Linear, AddCircleLinear, TrashBinMinimalistic2Linear,
} from 'solar-icon-set';
import { tmdb } from '../../api';
import { useStore } from '../../store';
import './CustomListsGrid.css';

export default function CustomListsGrid({
  customLists, onOpenList, onEditList, onCreateList, deleteCustomList, lang,
}) {
  const { t } = useTranslation();
  const lists = Object.values(customLists).sort((a, b) => b.createdAt - a.createdAt);
  const [confirmId, setConfirmId] = useState(null);
  const { isWatched } = useStore();

  const handleDeleteClick = (e, list) => {
    e.stopPropagation();
    if (list.items.length > 0) setConfirmId(list.id);
    else deleteCustomList(list.id);
  };

  const confirmList = confirmId ? customLists[confirmId] : null;

  return (
    <div className="custom-lists">
      {/* Delete confirmation dialog */}
      {confirmList && (
        <div className="list-confirm-overlay" onClick={() => setConfirmId(null)}>
          <div className="list-confirm-panel" onClick={e => e.stopPropagation()}>
            <p className="list-confirm-title">{t('profile.deleteList')}</p>
            <p className="list-confirm-body">
              {t('profile.deleteListBody', { name: confirmList.name, count: confirmList.items.length })}
            </p>
            <div className="list-confirm-actions">
              <button className="list-confirm-cancel" onClick={() => setConfirmId(null)}>
                {t('profile.cancel2')}
              </button>
              <button
                className="list-confirm-delete"
                onClick={() => { deleteCustomList(confirmId); setConfirmId(null); }}
              >
                {t('profile.delete')}
              </button>
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
          const posters = list.items.slice(0, 4).map(m => tmdb.posterUrl(m.poster_path)).filter(Boolean);
          const total   = list.items.length;
          const watched = list.items.filter(m => isWatched(m.id)).length;
          const pct     = total > 0 ? Math.round((watched / total) * 100) : 0;
          const isSingle = list.image || list.items.length === 1;

          return (
            <div key={list.id} className="custom-list-card" onClick={() => onOpenList(list.id)}>
              <div className={`custom-list-card__avatar${isSingle ? ' custom-list-card__avatar--single' : ''}`}>
                {list.image ? (
                  <img src={list.image} alt=""/>
                ) : posters.length > 0 ? (
                  posters.map((url, i) => <img key={i} src={url} alt=""/>)
                ) : (
                  <div className="custom-list-card__avatar--empty"><ListLinear size={22} strokeWidth={1}/></div>
                )}
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
                    <div className="custom-list-card__bar-fill" style={{ width: `${pct}%` }}/>
                  </div>
                )}
              </div>
              <div className="custom-list-card__actions">
                <button
                  className="custom-list-card__edit"
                  onClick={e => { e.stopPropagation(); onEditList(list.id); }}
                >
                  <Pen2Linear size={13}/>
                </button>
                <button
                  className="custom-list-card__del"
                  onClick={e => handleDeleteClick(e, list)}
                >
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