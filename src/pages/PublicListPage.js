import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ListLinear, AltArrowLeftLinear } from 'solar-icon-set';
import { supabase } from '../supabase';
import { tmdb } from '../api';
import { useTheme } from '../theme';
import MovieModal from '../components/MovieModal';
import './PublicListPage.css';

export default function PublicListPage() {
  const { listId }    = useParams();
  const navigate      = useNavigate();
  const { lang }      = useTheme();
  const ru            = lang === 'ru';

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
      <h2>{ru ? 'Список не найден' : 'List not found'}</h2>
      <p>{ru ? 'Возможно, ссылка устарела или список был удалён.' : 'The link may be outdated or the list was deleted.'}</p>
      <button className="plp-home-btn" onClick={() => navigate('/')}>
        {ru ? 'На главную' : 'Go home'}
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
                {ru ? `Автор: ${list.author_name || 'Аноним'}` : `By ${list.author_name || 'Anonymous'}`}
              </span>
              <span className="plp-count">· {items.length} {ru ? 'проектов' : 'titles'}</span>
            </div>
          </div>
        </div>

        <button className="plp-share-btn" onClick={handleCopyLink}>
          {copied
            ? (ru ? '✓ Скопировано!' : '✓ Copied!')
            : (ru ? 'Скопировать ссылку' : 'Copy link')}
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="plp-empty">
          <ListLinear size={38} strokeWidth={1}/>
          <p>{ru ? 'Список пуст' : 'List is empty'}</p>
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