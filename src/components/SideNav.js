import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home2Linear, MagicStickLinear, MagniferLinear, UserLinear, InfoCircleLinear } from 'solar-icon-set';
import { useTranslation } from 'react-i18next';
import './SideNav.css';

const TAB_TO_PATH = { home:'/', recs:'/recs', search:'/search', profile:'/profile', about:'/about' };
const PATH_TO_TAB = { '/':'home', '/recs':'recs', '/search':'search', '/profile':'profile', '/about':'about' };

const SideNav = memo(function SideNav({ active, onChange }) {
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
          <span>{t('nav.about')}</span>
        </button>
      </div>
    </aside>
  );
});
export default SideNav;
