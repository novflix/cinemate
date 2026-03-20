import { Home, Search, User, Sparkles } from 'lucide-react';
import { useTheme, t } from '../theme';
import './SideNav.css';

export default function SideNav({ active, onChange }) {
  const { lang } = useTheme();
  const tabs = [
    { id: 'home',    label: t(lang,'Главная','Home'),    Icon: Home },
    { id: 'recs',    label: t(lang,'Для вас','For You'), Icon: Sparkles },
    { id: 'search',  label: t(lang,'Поиск','Search'),    Icon: Search },
    { id: 'profile', label: t(lang,'Профиль','Profile'), Icon: User },
  ];
  return (
    <aside className="side-nav">
      <div className="side-nav__logo">
        <span className="side-nav__logo-text">CINE<span>MATE</span></span>
      </div>
      <nav className="side-nav__links">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} className={"side-nav__item"+(active===id?" active":"")} onClick={() => onChange(id)}>
            <Icon size={20} strokeWidth={active===id?2.2:1.8}/>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
