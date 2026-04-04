import { useState, useEffect } from 'react';
import { ClockCircleLinear } from 'solar-icon-set';
import { useTranslation } from 'react-i18next';

function getCountdownValues(dateStr) {
  if (!dateStr) return null;
  const release = new Date(dateStr);
  const diff = release - new Date();
  if (diff < 0) return null;

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)   return { unit: 'days',    value: days,    urgent: days <= 3 };
  if (hours > 0)  return { unit: 'hours',   value: hours,   urgent: true };
  return           { unit: 'minutes', value: minutes, urgent: true };
}

export default function Countdown({ releaseDate }) {
  const { t } = useTranslation();
  const [cd, setCd] = useState(() => getCountdownValues(releaseDate));

  useEffect(() => {
    if (!releaseDate) return;
    const interval = setInterval(() => setCd(getCountdownValues(releaseDate)), 60000);
    return () => clearInterval(interval);
  }, [releaseDate]);

  if (!cd) return null;

  const labels = {
    days:    t('countdown.days',    { count: cd.value }),
    hours:   t('countdown.hours',   { count: cd.value }),
    minutes: t('countdown.minutes', { count: cd.value }),
  };

  return (
    <div className={"countdown-badge" + (cd.urgent ? " urgent" : "")}>
      <ClockCircleLinear size={9}/>
      <span>{labels[cd.unit]}</span>
    </div>
  );
}
