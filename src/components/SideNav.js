import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home2Linear, MagicStickLinear, MagniferLinear, UserLinear, InfoCircleLinear } from 'solar-icon-set';
import { useTheme, t } from '../theme';
import './SideNav.css';

const TAB_TO_PATH = {
  home:    '/',
  recs:    '/recs',
  search:  '/search',
  profile: '/profile',
  about:   '/about',
};
const PATH_TO_TAB = {
  '/':        'home',
  '/recs':    'recs',
  '/search':  'search',
  '/profile': 'profile',
  '/about':   'about',
};

const SideNav = memo(function SideNav({ active, onChange }) {
  const { lang } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = active || PATH_TO_TAB[location.pathname] || 'home';

  const tabs = [
    { id: 'home',    label: t(lang,'Главная','Home'),    Icon: Home2Linear },
    { id: 'recs',    label: t(lang,'Для вас','For You'), Icon: MagicStickLinear },
    { id: 'search',  label: t(lang,'Поиск','Search'),    Icon: MagniferLinear },
    { id: 'profile', label: t(lang,'Профиль','Profile'), Icon: UserLinear },
  ];

  const handleClick = (id) => {
    if (onChange) onChange(id);
    else navigate(TAB_TO_PATH[id] || '/');
  };

  return (
    <aside className="side-nav">
      <div className="side-nav__logo">
        <span className="side-nav__logo-text">CINI<span>MATE</span></span>
      </div>
      <nav className="side-nav__links">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={"side-nav__item" + (currentTab === id ? " active" : "")}
            onClick={() => handleClick(id)}
          >
            <Icon size={20} strokeWidth={currentTab === id ? 2.2 : 1.8}/>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="side-nav__bottom">
        <button
          className={"side-nav__item side-nav__item--about" + (currentTab === 'about' ? " active" : "")}
          onClick={() => handleClick('about')}
        >
          <InfoCircleLinear size={20} strokeWidth={currentTab === 'about' ? 2.2 : 1.8}/>
          <span>{t(lang,'О приложении','About')}</span>
        </button>
      </div>
    </aside>
  );
});
export default SideNav;
