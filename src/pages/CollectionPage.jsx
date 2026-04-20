import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AltArrowLeftLinear, StarLinear, VideoLibraryLinear, TVLinear, BuildingsLinear } from 'solar-icon-set';
import { tmdb, HEADERS } from '../api';
import { useTheme } from '../theme';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import './CollectionPage.css';

export default function CollectionPage({ item, onBack }) {
  // item = { type: 'collection'|'company', id, name, logo?, entityType? }
  const [movies, setMovies]   = useState([]);
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { lang } = useTheme();
  const { t } = useTranslation();
  const TMDB_LANG_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR', it: 'it-IT', tr: 'tr-TR', zh: 'zh-CN' };
  const langCode = TMDB_LANG_MAP[lang] || 'en-US';

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setMovies([]);

    if (item.type === 'collection') {
      fetch(`https://api.themoviedb.org/3/collection/${item.id}?language=${langCode}`, { headers: HEADERS })
        .then(r => r.json())
        .then(data => {
          setInfo(data);
          const sorted = (data.parts || [])
            .filter(m => m.poster_path)
            .sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0));
          setMovies(sorted);
          setLoading(false);
        }).catch(() => setLoading(false));
    } else {
      const isNetwork = item.entityType === 'network';

      const fetchPages = (url, pages = 3) =>
        Promise.all(
          Array.from({ length: pages }, (_, i) =>
            fetch(`${url}&page=${i + 1}`, { headers: HEADERS }).then(r => r.json())
          )
        ).then(results => results.flatMap(d => d.results || []));

      const JUNK_GENRES = new Set([10764, 10767, 10763, 10766, 10768]);
      const isQuality = m =>
        m.poster_path &&
        !(m.genre_ids || []).some(g => JUNK_GENRES.has(g)) &&
        (m.vote_count || 0) >= 20;

      const dedupe = (items) => {
        const seen = new Set();
        return items
          .filter(m => isQuality(m) && !seen.has(m.id) && seen.add(m.id))
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      };

      if (isNetwork) {
        fetch(`https://api.themoviedb.org/3/network/${item.id}?language=${langCode}`, { headers: HEADERS })
          .then(r => r.json()).then(setInfo).catch(() => {});

        const tvUrl    = `https://api.themoviedb.org/3/discover/tv?with_networks=${item.id}&sort_by=popularity.desc&language=${langCode}`;
        const movieUrl = `https://api.themoviedb.org/3/discover/movie?with_companies=${item.id}&sort_by=popularity.desc&language=${langCode}`;

        Promise.all([fetchPages(tvUrl, 4), fetchPages(movieUrl, 2)])
          .then(([shows, films]) => {
            const merged = [
              ...shows.map(s => ({ ...s, media_type: 'tv' })),
              ...films.map(m => ({ ...m, media_type: 'movie' })),
            ];
            setMovies(dedupe(merged));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        fetch(`https://api.themoviedb.org/3/company/${item.id}?language=${langCode}`, { headers: HEADERS })
          .then(r => r.json()).then(setInfo).catch(() => {});

        const movieUrl = `https://api.themoviedb.org/3/discover/movie?with_companies=${item.id}&sort_by=popularity.desc&language=${langCode}`;
        const tvUrl    = `https://api.themoviedb.org/3/discover/tv?with_companies=${item.id}&sort_by=popularity.desc&language=${langCode}`;

        Promise.all([fetchPages(movieUrl, 3), fetchPages(tvUrl, 3)])
          .then(([films, shows]) => {
            const merged = [
              ...films.map(m => ({ ...m, media_type: 'movie' })),
              ...shows.map(s => ({ ...s, media_type: 'tv' })),
            ];
            setMovies(dedupe(merged));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [item, langCode]);

  if (!item) return null;

  const backdrop = info?.backdrop_path ? tmdb.backdropUrl(info.backdrop_path) : null;
  const collectionPoster = item.type === 'collection' && info?.poster_path
    ? `https://image.tmdb.org/t/p/w342${info.poster_path}`
    : null;
  const movieCount  = movies.filter(m => !m.media_type || m.media_type === 'movie').length;
  const tvCount     = movies.filter(m => m.media_type === 'tv').length;
  const avgRating   = movies.length
    ? (movies.reduce((s, m) => s + (m.vote_average || 0), 0) / movies.length).toFixed(1)
    : null;

  const typeLabel = item.type === 'collection'
    ? t('collection.collection')
    : item.entityType === 'network'
      ? t('collection.network')
      : t('collection.studio');

  return (
    <div className="collection-page page">

      {/* ── Hero ── */}
      <div
        className="collection-page__hero"
        style={backdrop ? { backgroundImage: `url(${backdrop})` } : {}}
      >
        {backdrop && <div className="collection-page__hero-img-overlay" />}
        <div className="collection-page__hero-fade" />

        <button className="collection-page__back" onClick={onBack}>
          <AltArrowLeftLinear size={20} />
        </button>

        <div className="collection-page__hero-content">
          {/* Logo or collection poster */}
          {collectionPoster ? (
            <img className="collection-page__collection-poster" src={collectionPoster} alt={info?.name || item.name} />
          ) : (
            <div className="collection-page__logo-wrap">
              {item.logo
                ? <img className="collection-page__logo" src={item.logo} alt={item.name} />
                : <BuildingsLinear size={28} className="collection-page__logo-fallback" />}
            </div>
          )}

          <div className="collection-page__title-block">
            <span className="collection-page__type">{typeLabel}</span>
            <h1 className="collection-page__title">{info?.name || item.name}</h1>
            <div className="collection-page__meta">
              {movieCount > 0 && (
                <span>
                  <VideoLibraryLinear size={11} />
                  {movieCount} {t('collection.films')}
                </span>
              )}
              {tvCount > 0 && (
                <span>
                  <TVLinear size={11} />
                  {tvCount} {t('collection.series')}
                </span>
              )}
              {avgRating > 0 && (
                <span className="accent">
                  <StarLinear size={11} fill="currentColor" />
                  {avgRating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overview ── */}
      {info?.overview && info.overview !== 'Placeholder' && (
        <div className="collection-page__overview-wrap">
          <p className="collection-page__overview">{info.overview}</p>
        </div>
      )}

      {/* ── Grid header ── */}
      {!loading && movies.length > 0 && (
        <div className="collection-page__grid-header">
          <span className="collection-page__grid-label">
            {item.type === 'collection' ? t('collection.films') : t('collection.catalog')}
            <span className="collection-page__count-badge">{movies.length}</span>
          </span>
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div className="collection-page__grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ borderRadius: 12, aspectRatio: '2/3' }} />
          ))}
        </div>
      ) : (
        <div className="collection-page__grid">
          {movies.map(m => (
            <div key={m.id}>
              <MovieCard movie={m} onClick={setSelected} />
            </div>
          ))}
        </div>
      )}

      <MovieModal
        movie={selected}
        onClose={() => setSelected(null)}
        onActorClick={a => navigate(`/actor/${a.id}`, { state: { actor: a } })}
        onCrewClick={p => navigate(`/person/${p.id}`, { state: { person: p } })}
        onStudioClick={s => navigate(`/studio/${s.id}`, { state: { studio: s } })}
      />
    </div>
  );
}