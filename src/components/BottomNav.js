import { Home, Search, User, Sparkles } from 'lucide-react';
import { useTheme, t } from '../theme';
import './BottomNav.css';

export default function BottomNav({ active, onChange }) {
  const { lang } = useTheme();
  const tabs = [
    { id: 'home',    label: t(lang,'Главная','Home'),    Icon: Home },
    { id: 'recs',    label: t(lang,'Для вас','For You'), Icon: Sparkles },
    { id: 'search',  label: t(lang,'Поиск','Search'),    Icon: Search },
    { id: 'profile', label: t(lang,'Профиль','Profile'), Icon: User },
  ];
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} className={"bottom-nav__tab" + (active===id?" active":"")} onClick={() => onChange(id)}>
            <Icon size={21} strokeWidth={active===id?2.2:1.8}/>
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
