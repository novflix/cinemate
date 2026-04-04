import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ListLinear, AltArrowLeftLinear } from 'solar-icon-set';
import { supabase } from '../supabase';
import { tmdb } from '../api';
import MovieModal from '../components/MovieModal';
import './PublicListPage.css';

export default function PublicListPage() {
  const { listId }    = useParams();
  const navigate      = useNavigate();
  const { t }         = useTranslation();

  const [list,    setList]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    supabase
      .from('public_lists')
      .select('*')
      .eq('id', listId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError(true); setLoading(false); return; }
        setList(data);
        setLoading(false);
      });
  }, [listId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="plp-loading">
      <div className="plp-spinner"/>
    </div>
  );

  if (error || !list) return (
    <div className="plp-error">
      <ListLinear size={48} strokeWidth={1}/>
      <h2>{t('publiclist.notFound')}</h2>
      <p>{t('publiclist.notFoundDesc')}</p>
      <button className="plp-home-btn" onClick={() => navigate('/')}>
        {t('publiclist.goHome')}
      </button>
    </div>
  );

  const items   = list.items || [];
  const coverPosters = items.slice(0, 4).map(m => tmdb.posterUrl(m.poster_path)).filter(Boolean);

  return (
    <div className="plp-page">
      {/* Header */}
      <div className="plp-header">
        <button className="plp-back" onClick={() => navigate(-1)}>
          <AltArrowLeftLinear size={20}/>
        </button>

        <div className="plp-hero">
          <div className={`plp-cover ${coverPosters.length === 1 ? 'plp-cover--single' : ''}`}>
            {list.image
              ? <img src={list.image} alt=""/>
              : coverPosters.length > 0
                ? coverPosters.map((url, i) => <img key={i} src={url} alt=""/>)
                : <div className="plp-cover--empty"><ListLinear size={36} strokeWidth={1}/></div>
            }
          </div>

          <div className="plp-meta">
            <h1 className="plp-title">{list.name}</h1>
            {list.description && <p className="plp-desc">{list.description}</p>}
            <div className="plp-submeta">
              <span className="plp-author">
                {t('publiclist.by', {name: list.author_name || t('profile.anonymous')})}
              </span>
              <span className="plp-count">· {items.length} {t('publiclist.titles')}</span>
            </div>
          </div>
        </div>

        <button className="plp-share-btn" onClick={handleCopyLink}>
          {copied
            ? (t('publiclist.copied'))
            : (t('publiclist.copyLink'))}
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="plp-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{t('publiclist.listEmpty')}</p>
        </div>
      ) : (
        <div className="plp-grid">
          {items.map(m => {
            const poster = tmdb.posterUrl(m.poster_path);
            const title  = m.title || m.name || m._fallback_title || '';
            return (
              <div key={m.id} className="plp-item" onClick={() => setSelected(m)}>
                <div className="plp-item__poster">
                  {poster
                    ? <img src={poster} alt={title} loading="lazy"/>
                    : <div className="plp-item__no-poster"><ListLinear size={20}/></div>
                  }
                </div>
                <p className="plp-item__title">{title}</p>
              </div>
            );
          })}
        </div>
      )}

      <MovieModal movie={selected} onClose={() => setSelected(null)} onActorClick={() => {}}/>
    </div>
  );
}