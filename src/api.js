const TMDB_TOKEN = process.env.REACT_APP_TMDB_TOKEN;
const BASE = 'https://api.themoviedb.org/3';
const IMG  = 'https://image.tmdb.org/t/p';
export const HEADERS = { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' };

// ─── TV genre IDs that indicate non-movie/non-scripted content ────────────────
const SHOW_GENRE_IDS = new Set([
  10763, // News
  10764, // Reality
  10767, // Talk Show
]);

// Keywords in titles that indicate awards shows, talk shows, live events
const SHOW_TITLE_PATTERNS = [
  /\bawards?\b/i,
  /\boscars?\b/i,
  /\bgolden globe/i,
  /\bgrammy/i,
  /\bemmy/i,
  /\bbafta/i,
  /\bvma\b/i,
  /\bmtv movie/i,
  /\btalk show/i,
  /\blive!\s*with\b/i,
  /\bkimmel\b/i,
  /\bfallonb?\b/i,
  /\bconan\b/i,
  /\blate (night|show|late)/i,
  /\btonight show\b/i,
  /\bdaily show\b/i,
  /\bcolbert\b/i,
  /\bjimmy\b.*\bshow\b/i,
  /\boprah\b/i,
  /\bellen\b.*\bshow\b/i,
  /\bkelly clarkson\b/i,
  /\bview\b.*\bshow\b/i,
  /\bgood morning\b/i,
  /\btoday show\b/i,
  /\bnightline\b/i,
  /\b20\/20\b/i,
  /\bdateline\b/i,
  /\binside edition\b/i,
  /\bextra\b.*\bshow\b/i,
  /\bentertainment tonight\b/i,
  /\baccess (hollywood|daily)\b/i,
  /\bpeople's choice\b/i,
  /\bteen choice\b/i,
  /\bradio disney\b/i,
  /\bkids' choice\b/i,
  /\bimpact x\b/i,
  /\bspecial edition\b/i,
  /\bchampionship\b/i,
  /\bsuper bowl\b/i,
];

/**
 * Returns true if the item is a talk show, award ceremony, reality/news show,
 * or any other non-movie/non-scripted TV content that should be hidden.
 */
export function isShowOrAward(item) {
  const genres = item.genre_ids || [];
  if (genres.some(id => SHOW_GENRE_IDS.has(id))) return true;
  const title = item.name || item.title || item.original_name || item.original_title || '';
  if (SHOW_TITLE_PATTERNS.some(re => re.test(title))) return true;
  // episode_count exists on TV cast entries — if it's extremely high (>100) and
  // it's a talk/reality type, bail out.  Most scripted shows top out around 100.
  if (item.media_type === 'tv' && (item.episode_count || 0) > 200) return true;
  return false;
}

// Maps app language codes to TMDB language codes.
// To add a new language: add its code here and create the corresponding locale file.
const TMDB_LANG_MAP = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  it: 'it-IT',
  tr: 'tr-TR',
  zh: 'zh-CN',
};
const getLang = () => {
  try {
    const code = localStorage.getItem('lang') || 'en';
    return TMDB_LANG_MAP[code] || 'en-US';
  } catch { return 'en-US'; }
};

// ─── Session-level details cache (fix #9) ────────────────────────────────────
const _detailsCache = new Map();

const get = async (path, params = {}) => {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('language', getLang());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
};

// Fetch multiple pages and merge results (TMDB returns 20 per page)
const getPages = async (path, params = {}, pages = 3) => {
  try {
    const first = await get(path, { ...params, page: 1 });
    const total = Math.min(pages, first.total_pages || 1);
    const results = [...(first.results || [])];
    if (total > 1) {
      const rest = await Promise.all(
        Array.from({ length: total - 1 }, (_, i) =>
          get(path, { ...params, page: i + 2 }).catch(() => ({ results: [] }))
        )
      );
      rest.forEach(d => results.push(...(d.results || [])));
    }
    return results;
  } catch { return []; }
};

export const tmdb = {
  trending:      (type = 'all', window = 'week') => get(`/trending/${type}/${window}`),
  popular:       (type = 'movie', pages = 1) => pages > 1
    ? getPages(`/${type}/popular`, {}, pages).then(results => ({ results }))
    : get(`/${type}/popular`),
  topRated:      (type = 'movie', pages = 1) => pages > 1
    ? getPages(`/${type}/top_rated`, {}, pages).then(results => ({ results }))
    : get(`/${type}/top_rated`),
  nowPlaying:    (pages = 1) => pages > 1
    ? getPages('/movie/now_playing', {}, pages).then(results => ({ results }))
    : get('/movie/now_playing'),
  upcoming:      (pages = 1) => pages > 1
    ? getPages('/movie/upcoming', {}, pages).then(results => ({ results }))
    : get('/movie/upcoming'),
  search:        (query) => get('/search/multi', { query }),
  // Fix #9: cache movieDetails / tvDetails for session, also fetch videos
  movieDetails:  async (id) => {
    const key = `movie_${id}_${getLang()}`;
    if (_detailsCache.has(key)) return _detailsCache.get(key);
    const data = await get(`/movie/${id}`, { append_to_response: 'credits,videos,release_dates,production_companies' });
    _detailsCache.set(key, data);
    return data;
  },
  tvDetails:     async (id) => {
    const key = `tv_${id}_${getLang()}`;
    if (_detailsCache.has(key)) return _detailsCache.get(key);
    const data = await get(`/tv/${id}`, { append_to_response: 'credits,videos,content_ratings,production_companies' });
    _detailsCache.set(key, data);
    return data;
  },
  genres:        (type = 'movie') => get(`/genre/${type}/list`),
  discover:      (type = 'movie', params = {}, pages = 1) => pages > 1
    ? getPages(`/discover/${type}`, params, pages).then(results => ({ results }))
    : get(`/discover/${type}`, params),
  watchProviders:(type, id) => get(`/${type}/${id}/watch/providers`),
  similar:       (type, id) => get(`/${type}/${id}/recommendations`),
  // Fix #11: default poster size w342 instead of w500 — ~40% less traffic on cards
  posterUrl:     (path, size = 'w342') => path ? `${IMG}/${size}${path}` : null,
  // Large poster for modal (w780) — called explicitly
  posterUrlLarge:(path) => path ? `${IMG}/w780${path}` : null,
  backdropUrl:   (path, size = 'w1280') => path ? `${IMG}/${size}${path}` : null,
  // Small actor thumbnails (w185)
  actorUrl:      (path, size = 'w185') => path ? `${IMG}/${size}${path}` : null,
};

export const STREAMING_LINKS = {
  8:   { name: 'Netflix',      url: 'https://www.netflix.com/search?q=' },
  9:   { name: 'Amazon Prime', url: 'https://www.amazon.com/s?k=' },
  337: { name: 'Disney+',      url: 'https://www.disneyplus.com/search/' },
  350: { name: 'Apple TV+',    url: 'https://tv.apple.com/search/' },
  384: { name: 'HBO Max',      url: 'https://play.max.com/search/' },
  1899:{ name: 'Max',          url: 'https://play.max.com/search/' },
  15:  { name: 'Hulu',         url: 'https://www.hulu.com/search?q=' },
  531: { name: 'Paramount+',   url: 'https://www.paramountplus.com/search/' },
  283: { name: 'Crunchyroll',  url: 'https://www.crunchyroll.com/search?q=' },
  2:   { name: 'Apple iTunes', url: 'https://tv.apple.com/search/' },
  3:   { name: 'Google Play',  url: 'https://play.google.com/store/search?q=' },
  192: { name: 'YouTube',      url: 'https://www.youtube.com/results?search_query=' },
  555: { name: 'Okko',         url: 'https://okko.tv/search?query=' },
  505: { name: 'IVI',          url: 'https://www.ivi.ru/search/?q=' },
  635: { name: 'Kinopoisk',    url: 'https://www.kinopoisk.ru/index.php?kp_query=' },
};