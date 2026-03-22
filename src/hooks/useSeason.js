export function getCurrentSeason(override = null) {
  if (override) return override;

  const month = new Date().getMonth() + 1;
  const day   = new Date().getDate();

  if (month === 10 && day >= 20) return 'halloween';
  if (month === 11 && day >= 25) return 'newyear';
  if (month === 12)               return 'newyear';
  if (month === 1  && day <= 14)  return 'newyear';
  if (month >= 6 && month <= 8)   return 'summer';
  if (month >= 12 || month <= 2)  return 'winter';
  if (month >= 3  && month <= 5)  return 'spring';
  return 'autumn';
}

export const SEASON_CONFIG = {
  halloween: {
    ru: '🎃 На Хэллоуин',   en: '🎃 Halloween',
    genres: [27, 53, 9648],
    sort: 'popularity.desc',
  },
  newyear: {
    ru: '🎄 На Новый год',  en: '🎄 New Year',
    genres: [35, 10751, 18],
    sort: 'vote_average.desc',
  },
  summer: {
    ru: '☀️ Летний вайб',   en: '☀️ Summer vibes',
    genres: [28, 12, 35],
    sort: 'popularity.desc',
  },
  winter: {
    ru: '❄️ Зимний вечер',  en: '❄️ Winter evening',
    genres: [18, 10749, 14],
    sort: 'vote_average.desc',
  },
  spring: {
    ru: '🌸 Весеннее кино', en: '🌸 Spring picks',
    genres: [35, 10749, 12],
    sort: 'popularity.desc',
  },
  autumn: {
    ru: '🍂 Осенние вечера',en: '🍂 Autumn evenings',
    genres: [18, 9648, 53],
    sort: 'vote_average.desc',
  },
};