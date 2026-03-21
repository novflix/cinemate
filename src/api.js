const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWU5ZDhiMjQxNmZkZmMzZThkYTIwOTQ3ZWVmZmIyOSIsIm5iZiI6MTc3MzU3ODA1Ny40NTYsInN1YiI6IjY5YjZhNzQ5NWNiYjJlMDcwMzY3MzkxNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oV8T4jCi78cD-1-y_rGlfaPS55RGvXFshRniaiP93FM';
const BASE = 'https://api.themoviedb.org/3';
const IMG  = 'https://image.tmdb.org/t/p';
export const HEADERS = { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' };

const getLang = () => { try { return localStorage.getItem('lang') === 'en' ? 'en-US' : 'ru-RU'; } catch { return 'ru-RU'; } };

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
  const results = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const data = await get(path, { ...params, page: p });
      results.push(...(data.results || []));
      if (p >= (data.total_pages || 1)) break;
    } catch { break; }
  }
  return results;
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
  movieDetails:  (id) => get(`/movie/${id}`, { append_to_response: 'credits' }),
  tvDetails:     (id) => get(`/tv/${id}`,    { append_to_response: 'credits' }),
  genres:        (type = 'movie') => get(`/genre/${type}/list`),
  discover:      (type = 'movie', params = {}, pages = 1) => pages > 1
    ? getPages(`/discover/${type}`, params, pages).then(results => ({ results }))
    : get(`/discover/${type}`, params),
  watchProviders:(type, id) => get(`/${type}/${id}/watch/providers`),
  similar:       (type, id) => get(`/${type}/${id}/recommendations`),
  posterUrl:     (path, size = 'w500') => path ? `${IMG}/${size}${path}` : null,
  backdropUrl:   (path, size = 'w1280') => path ? `${IMG}/${size}${path}` : null,
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