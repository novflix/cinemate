const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1OWU5ZDhiMjQxNmZkZmMzZThkYTIwOTQ3ZWVmZmIyOSIsIm5iZiI6MTc3MzU3ODA1Ny40NTYsInN1YiI6IjY5YjZhNzQ5NWNiYjJlMDcwMzY3MzkxNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oV8T4jCi78cD-1-y_rGlfaPS55RGvXFshRniaiP93FM';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
export const HEADERS = { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' };

// Lang is read dynamically from localStorage so all calls respect current setting
const getLang = () => {
  try { return localStorage.getItem('lang') === 'en' ? 'en-US' : 'ru-RU'; } catch { return 'ru-RU'; }
};

const get = async (path, params = {}) => {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('language', getLang());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
};

export const tmdb = {
  trending: (type = 'all', window = 'week') => get(`/trending/${type}/${window}`),
  popular: (type = 'movie') => get(`/${type}/popular`),
  topRated: (type = 'movie') => get(`/${type}/top_rated`),
  nowPlaying: () => get('/movie/now_playing'),
  upcoming: () => get('/movie/upcoming'),
  search: (query) => get('/search/multi', { query }),
  movieDetails: (id) => get(`/movie/${id}`, { append_to_response: 'credits,videos' }),
  tvDetails: (id) => get(`/tv/${id}`, { append_to_response: 'credits,videos' }),
  genres: (type = 'movie') => get(`/genre/${type}/list`),
  discover: (type = 'movie', params = {}) => get(`/discover/${type}`, params),
  watchProviders: (type, id) => get(`/${type}/${id}/watch/providers`),
  posterUrl: (path, size = 'w342') => path ? `${IMG}/${size}${path}` : null,
  backdropUrl: (path, size = 'w780') => path ? `${IMG}/${size}${path}` : null,
};

// Direct streaming service URLs (best effort deep links)
export const STREAMING_LINKS = {
  8:   { name: 'Netflix',             url: 'https://www.netflix.com/search?q=' },
  9:   { name: 'Amazon Prime',        url: 'https://www.amazon.com/s?k=' },
  337: { name: 'Disney+',             url: 'https://www.disneyplus.com/search/' },
  350: { name: 'Apple TV+',           url: 'https://tv.apple.com/search/' },
  384: { name: 'HBO Max',             url: 'https://play.max.com/search/' },
  1899:{ name: 'Max',                 url: 'https://play.max.com/search/' },
  15:  { name: 'Hulu',                url: 'https://www.hulu.com/search?q=' },
  531: { name: 'Paramount+',          url: 'https://www.paramountplus.com/search/' },
  283: { name: 'Crunchyroll',         url: 'https://www.crunchyroll.com/search?q=' },
  2:   { name: 'Apple iTunes',        url: 'https://tv.apple.com/search/' },
  3:   { name: 'Google Play',         url: 'https://play.google.com/store/search?q=' },
  192: { name: 'YouTube',             url: 'https://www.youtube.com/results?search_query=' },
  // RU services
  555: { name: 'Okko',                url: 'https://okko.tv/search?query=' },
  505: { name: 'IVI',                 url: 'https://www.ivi.ru/search/?q=' },
  635: { name: 'Kinopoisk',           url: 'https://www.kinopoisk.ru/index.php?kp_query=' },
};