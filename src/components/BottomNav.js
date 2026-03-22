import { memo } from 'react';
import { useTheme, t } from '../theme';
import './BottomNav.css';

// Custom filled/outline icon pairs
function HomeIcon({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"/></svg>
  );
}
function SparkIcon({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
  );
}
function SearchIcon({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled?2.2:1.8}>
      <circle cx="11" cy="11" r="7" fill={filled?"currentColor":"none"} fillOpacity={filled?0.15:0}/>
      <path d="M16.5 16.5L21 21" strokeLinecap="round"/>
    </svg>
  );
}
function ProfileIcon({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20C4 17 7.6 15 12 15C16.4 15 20 17 20 20" strokeLinecap="round"/>
    </svg>
  );
}

const BottomNav = memo(function BottomNav({ active, onChange }) {
  const { lang } = useTheme();
  const tabs = [
    { id: 'home',    label: t(lang,'Главная','Home'),    Icon: HomeIcon },
    { id: 'recs',    label: t(lang,'Для вас','For You'), Icon: SparkIcon },
    { id: 'search',  label: t(lang,'Поиск','Search'),    Icon: SearchIcon },
    { id: 'profile', label: t(lang,'Профиль','Profile'), Icon: ProfileIcon },
  ];
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} className={"bottom-nav__tab"+(active===id?" active":"")} onClick={()=>onChange(id)}>
            <span className="bottom-nav__tab-icon">
              <Icon filled={active===id}/>
            </span>
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
);
export default BottomNav;