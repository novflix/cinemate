import { memo } from 'react';
import { Home2Linear, MagicStickLinear, MagniferLinear, UserLinear, InfoCircleLinear } from 'solar-icon-set';
import { useTheme, t } from '../theme';
import './SideNav.css';

const SideNav = memo(function SideNav({ active, onChange }) {
  const { lang } = useTheme();
  const tabs = [
    { id: 'home',    label: t(lang,'Главная','Home'),    Icon: Home2Linear },
    { id: 'recs',    label: t(lang,'Для вас','For You'), Icon: MagicStickLinear },
    { id: 'search',  label: t(lang,'Поиск','Search'),    Icon: MagniferLinear },
    { id: 'profile', label: t(lang,'Профиль','Profile'), Icon: UserLinear },
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
      <div className="side-nav__bottom">
        <button className={"side-nav__item side-nav__item--about"+(active==='about'?" active":"")} onClick={() => onChange('about')}>
          <InfoCircleLinear size={20} strokeWidth={active==='about'?2.2:1.8}/>
          <span>{t(lang,'О приложении','About')}</span>
        </button>
      </div>
    </aside>
  );
});
export default SideNav;