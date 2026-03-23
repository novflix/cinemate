import { memo } from 'react';
import { Home2Linear, MagicStickLinear, MagniferLinear, UserLinear } from 'solar-icon-set';
import { useTheme, t } from '../theme';
import './BottomNav.css';

const BottomNav = memo(function BottomNav({ active, onChange }) {
  const { lang } = useTheme();
  const tabs = [
    { id: 'home',    label: t(lang,'Главная','Home'),    Icon: Home2Linear },
    { id: 'recs',    label: t(lang,'Для вас','For You'), Icon: MagicStickLinear },
    { id: 'search',  label: t(lang,'Поиск','Search'),    Icon: MagniferLinear },
    { id: 'profile', label: t(lang,'Профиль','Profile'), Icon: UserLinear },
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