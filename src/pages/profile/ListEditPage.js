import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CloseCircleLinear, ListLinear, AddCircleLinear,
  Chart2Linear, CalendarLinear,
} from 'solar-icon-set';
import { tmdb } from '../../api';
import { uploadToCloudinary } from './Cloudinary';
import TitlePickerModal from './TitlePickerModal';
import './ListEditPage.css';

/* ─── ToggleRow ─────────────────────────────────────────────────────────── */
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

/* ─── ListEditPage ───────────────────────────────────────────────────────── */
export default function ListEditPage({
  listId, customLists, createCustomList, updateListMeta,
  onBack, onSaved, addToCustomList, lang,
}) {
  const { t }     = useTranslation();
  const existing  = listId ? customLists[listId] : null;
  const [name,         setName]         = useState(existing?.name         || '');
  const [desc,         setDesc]         = useState(existing?.description  || '');
  const [image,        setImage]        = useState(existing?.image        || null);
  const [showProgress, setShowProgress] = useState(existing?.showProgress !== undefined ? existing.showProgress : true);
  const [deadline,     setDeadline]     = useState(existing?.deadline     || '');
  const [currentId,    setCurrentId]    = useState(listId || null);
  const [showPicker,   setShowPicker]   = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef();

  const listItems = (currentId && customLists[currentId]?.items) || [];

  const handleImage = async (e) => {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > 5 * 1024 * 1024) { alert(t('profile.imageTooLarge', 'Image must be under 5MB')); return; }
    setImageUploading(true);
    try {
      const url = await uploadToCloudinary(f);
      setImage(url);
    } catch (err) {
      console.error('List image upload failed:', err);
    } finally {
      setImageUploading(false);
    }
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

  const handleAddTitle = (m) => {
    if (!currentId) {
      const id = createCustomList(
        name.trim() || t('profile.newList'),
        desc.trim(),
        image,
        { showProgress, deadline: deadline || null }
      );
      setCurrentId(id);
      addToCustomList(id, m);
    } else {
      addToCustomList(currentId, m);
    }
  };

  return (
    <div className="page list-edit-page">
      <div className="list-edit__topbar">
        <button className="list-detail__back" onClick={onBack}><CloseCircleLinear size={20}/></button>
        <h2 className="list-edit__heading">
          {currentId ? t('listeditor.editList') : t('listeditor.newList')}
        </h2>
        <button className="list-edit__save-btn" onClick={handleSave} disabled={!name.trim()}>
          {t('listeditor.save')}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage}/>

      {/* Cover + fields */}
      <div className="list-edit__form-row">
        <div className="list-edit__cover-wrap" onClick={() => !imageUploading && fileRef.current?.click()}>
          {imageUploading ? (
            <div className="list-edit__cover-placeholder"><span style={{ fontSize: 12, opacity: 0.6 }}>...</span></div>
          ) : image ? (
            <img className="list-edit__cover-img" src={image} alt="cover" crossOrigin="anonymous" referrerPolicy="no-referrer"/>
          ) : (
            <div className="list-edit__cover-placeholder">
              <ListLinear size={26} strokeWidth={1}/>
              <span>{t('listeditor.cover')}</span>
            </div>
          )}
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
      <div style={{ padding: '0 16px 12px' }}>
        <button className="custom-lists__new" onClick={() => setShowPicker(true)}>
          <AddCircleLinear size={16}/> {t('listeditor.addTitles')}
        </button>
      </div>

      {listItems.length > 0 && (
        <div className="poster-grid" style={{ padding: '0 16px' }}>
          {listItems.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || m._fallback_title || '';
            return (
              <div key={m.id} className="poster-grid__item">
                <div className="poster-grid__poster">
                  {poster
                    ? <img src={poster} alt={title} loading="lazy"/>
                    : <div className="poster-grid__no-poster"/>
                  }
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
          onAdd={handleAddTitle}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}
    </div>
  );
}