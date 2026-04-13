import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseCircleLinear, CheckCircleLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../../api';
import './TitlePickerModal.css';

const TMDB_LANG_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };

export default function TitlePickerModal({ listItems, onAdd, onClose, lang }) {
  const { t }      = useTranslation();
  const langCode   = TMDB_LANG_MAP[lang] || 'en-US';
  const inListIds  = new Set(listItems.map(m => m.id));
  const [query,    setQuery]   = useState('');
  const [results,  setResults] = useState([]);
  const [loading,  setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const [movies, tv] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=${langCode}`, { headers: HEADERS }).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=${langCode}`,    { headers: HEADERS }).then(r => r.json()),
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

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-panel" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <h3>{t('listeditor.addTitles')}</h3>
          <button onClick={onClose}><CloseCircleLinear size={20}/></button>
        </div>
        <div className="picker-search">
          <input
            autoFocus
            className="picker-search__input"
            placeholder={t('listeditor.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="picker-grid">
          {loading && (
            <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center' }}>
              <div className="search-loading__spinner"/>
            </div>
          )}
          {!loading && results.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || '';
            const inList = inListIds.has(m.id);
            return (
              <div
                key={`${m.id}-${m.media_type}`}
                className={"picker-item" + (inList ? ' picker-item--in' : '')}
                onClick={() => { if (!inList) onAdd(m); }}
              >
                <div className="picker-item__poster">
                  {poster
                    ? <img src={poster} alt={title} loading="lazy"/>
                    : <div style={{ position: 'absolute', inset: 0, background: 'var(--surface2)' }}/>
                  }
                  {inList && <div className="picker-item__check"><CheckCircleLinear size={16}/></div>}
                </div>
                <p className="picker-item__title">{title}</p>
              </div>
            );
          })}
          {!loading && !results.length && query.trim() && (
            <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              {t('listeditor.nothingFound')}
            </div>
          )}
          {!loading && !query.trim() && (
            <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              {t('listeditor.startTyping')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}