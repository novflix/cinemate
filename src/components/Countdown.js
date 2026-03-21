import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function getCountdown(dateStr) {
  if (!dateStr) return null;
  const release = new Date(dateStr);
  const now = new Date();
  const diff = release - now;
  if (diff < 0) return null; // already released

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)   return { label: `через ${days} д`, en: `in ${days}d`, urgent: days <= 3 };
  if (hours > 0)  return { label: `через ${hours} ч`, en: `in ${hours}h`, urgent: true };
  return { label: `через ${minutes} мин`, en: `in ${minutes}m`, urgent: true };
}

export default function Countdown({ releaseDate, lang }) {
  const [cd, setCd] = useState(() => getCountdown(releaseDate));

  useEffect(() => {
    if (!releaseDate) return;
    const interval = setInterval(() => setCd(getCountdown(releaseDate)), 60000);
    return () => clearInterval(interval);
  }, [releaseDate]);

  if (!cd) return null;

  return (
    <div className={"countdown-badge" + (cd.urgent ? " urgent" : "")}>
      <Clock size={9}/>
      <span>{lang === 'ru' ? cd.label : cd.en}</span>
    </div>
  );
}