import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { ThemeProvider } from './theme';
import { AuthProvider, useAuth } from './auth';
import { AdminProvider, useAdmin } from './admin';
import BottomNav from './components/BottomNav';
import SideNav from './components/SideNav';
import Particles from './components/Particles';
import RatingPrompt from './components/RatingPrompt';
import AuthScreen from './pages/AuthScreen';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Recs from './pages/Recs';
import About from './pages/About';
import ActorPageRoute from './pages/ActorPageRoute';
import PublicListPage from './pages/PublicListPage';
import Confetti from './components/Confetti';
import { SnowEffect } from './components/Effects';
import './index.css';

const BUILD_DATE = new Date().toISOString().slice(0,10).replace(/-/g,'');

function VersionBadge() {
  const pkg = require('../package.json');
  return <div className="version-badge">v{pkg.version} · {BUILD_DATE}</div>;
}

const PATH_TO_TAB = {
  '/':        'home',
  '/recs':    'recs',
  '/search':  'search',
  '/profile': 'profile',
  '/about':   'about',
};
const TAB_TO_PATH = {
  home:    '/',
  recs:    '/recs',
  search:  '/search',
  profile: '/profile',
  about:   '/about',
};

function AppInner() {
  const { pendingRating, setPendingRating, showConfetti } = useStore();
  const { overrides } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const month = new Date().getMonth() + 1;
  const showSnow = overrides.snow || month === 12 || month === 1;

  const activeTab = PATH_TO_TAB[location.pathname] || 'home';

  const handleTabChange = (tab) => {
    navigate(TAB_TO_PATH[tab] || '/');
  };

  return (
    <div className="app-shell">
      <Particles/>
      {showSnow && <SnowEffect/>}
      <div className="ambient-glow"/>
      <SideNav active={activeTab} onChange={handleTabChange}/>
      <div className="app-content" style={{position:'relative',zIndex:1}}>
        <Routes>
          <Route path="/"              element={<Home/>}/>
          <Route path="/recs"          element={<Recs/>}/>
          <Route path="/search"        element={<Search/>}/>
          <Route path="/profile"       element={<Profile/>}/>
          <Route path="/about"         element={<About/>}/>
          <Route path="/actor/:actorId" element={<ActorPageRoute/>}/>
          <Route path="/list/:listId"   element={<PublicListPage/>}/>
          <Route path="*"              element={<Navigate to="/" replace/>}/>
        </Routes>
      </div>
      <BottomNav active={activeTab} onChange={handleTabChange}/>
      {pendingRating && (
        <RatingPrompt movie={pendingRating} onClose={() => setPendingRating(null)}/>
      )}
      <Confetti active={showConfetti} color="#22c55e"/>
      <VersionBadge/>
    </div>
  );
}

function Root() {
  const { user } = useAuth();
  const [skipped, setSkipped] = useState(() => localStorage.getItem('auth_skipped') === '1');
  const location = useLocation();

  const handleSkip = () => { localStorage.setItem('auth_skipped','1'); setSkipped(true); };

  // Public list pages are accessible without auth
  const isPublicRoute = location.pathname.startsWith('/list/');

  if (user === undefined && !isPublicRoute) return (
    <div style={{position:'fixed',inset:0,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,border:'2px solid var(--surface2)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
    </div>
  );

  if (!user && !skipped && !isPublicRoute) return <AuthScreen onSkip={handleSkip}/>;

  if (isPublicRoute) {
    return (
      <StoreProvider userId={user?.id || null}>
        <AdminProvider userId={user?.id || null}>
          <div className="app-shell">
            <div className="app-content" style={{position:'relative',zIndex:1}}>
              <Routes>
                <Route path="/list/:listId" element={<PublicListPage/>}/>
              </Routes>
            </div>
          </div>
        </AdminProvider>
      </StoreProvider>
    );
  }

  return (
    <StoreProvider userId={user?.id || null}>
      <AdminProvider userId={user?.id || null}>
        <AppInner/>
      </AdminProvider>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Root/>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
