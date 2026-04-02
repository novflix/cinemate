import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home2Linear, MagicStickLinear, MagniferLinear, UserLinear } from 'solar-icon-set';
import { useTheme, t } from '../theme';
import './BottomNav.css';

const TAB_TO_PATH = {
  home:    '/',
  recs:    '/recs',
  search:  '/search',
  profile: '/profile',
};

const PATH_TO_TAB = {
  '/':        'home',
  '/recs':    'recs',
  '/search':  'search',
  '/profile': 'profile',
};

const BottomNav = memo(function BottomNav({ active, onChange }) {
  const { lang } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive from URL if active not passed
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
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={"bottom-nav__tab" + (currentTab === id ? " active" : "")}
            onClick={() => handleClick(id)}
          >
            <span className="bottom-nav__tab-icon">
              <Icon size={22} strokeWidth={currentTab === id ? 2.2 : 1.8}/>
            </span>
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});
export default BottomNav;
