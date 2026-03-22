import { memo } from 'react';
import { Home, Sparkles, Search, User } from 'lucide-react';
import { useTheme, t } from '../theme';
import './BottomNav.css';

const BottomNav = memo(function BottomNav({ active, onChange }) {
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
          <button key={id} className={"bottom-nav__tab"+(active===id?" active":"")} onClick={()=>onChange(id)}>
            <span className="bottom-nav__tab-icon">
              <Icon size={22} strokeWidth={active===id ? 2.2 : 1.8}/>
            </span>
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});
export default BottomNav;