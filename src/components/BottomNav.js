import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home2Linear, MagicStickLinear, MagniferLinear, UserLinear } from 'solar-icon-set';
import { useTranslation } from 'react-i18next';
import './BottomNav.css';

const TAB_TO_PATH = { home:'/', recs:'/recs', search:'/search', profile:'/profile' };
const PATH_TO_TAB = { '/':'home', '/recs':'recs', '/search':'search', '/profile':'profile' };

const BottomNav = memo(function BottomNav({ active, onChange }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = active || PATH_TO_TAB[location.pathname] || 'home';

  const tabs = [
    { id: 'home',    label: t('nav.home'),    Icon: Home2Linear },
    { id: 'recs',    label: t('nav.recs'),    Icon: MagicStickLinear },
    { id: 'search',  label: t('nav.search'),  Icon: MagniferLinear },
    { id: 'profile', label: t('nav.profile'), Icon: UserLinear },
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
