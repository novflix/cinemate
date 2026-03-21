import { useState } from 'react';
import { StoreProvider, useStore } from './store';
import { ThemeProvider } from './theme';
import { AuthProvider, useAuth } from './auth';
import BottomNav from './components/BottomNav';
import SideNav from './components/SideNav';
import Particles from './components/Particles';
import RatingPrompt from './components/RatingPrompt';
import AuthScreen from './pages/AuthScreen';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Recs from './pages/Recs';
import './index.css';

function AppInner() {
  const [tab, setTab] = useState('home');
  const { pendingRating, setPendingRating } = useStore();

  return (
    <div className="app-shell">
      <Particles/>
      <div className="ambient-glow"/>
      <SideNav active={tab} onChange={setTab}/>
      <div className="app-content" style={{position:'relative',zIndex:1}}>
        {tab === 'home'    && <Home />}
        {tab === 'recs'    && <Recs />}
        {tab === 'search'  && <Search />}
        {tab === 'profile' && <Profile />}
      </div>
      <BottomNav active={tab} onChange={setTab}/>
      {pendingRating && (
        <RatingPrompt movie={pendingRating} onClose={() => setPendingRating(null)}/>
      )}
    </div>
  );
}

// Decides whether to show auth or the app
function Root() {
  const { user } = useAuth();
  const [skipped, setSkipped] = useState(() => localStorage.getItem('auth_skipped') === '1');

  const handleSkip = () => {
    localStorage.setItem('auth_skipped', '1');
    setSkipped(true);
  };

  // Still loading auth state
  if (user === undefined) return (
    <div style={{position:'fixed',inset:0,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,border:'2px solid var(--surface2)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
    </div>
  );

  // Not logged in and hasn't skipped — show auth
  if (!user && !skipped) return <AuthScreen onSkip={handleSkip}/>;

  // Logged in or skipped — show app, pass userId to store for cloud sync
  return (
    <StoreProvider userId={user?.id || null}>
      <AppInner/>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root/>
      </AuthProvider>
    </ThemeProvider>
  );
}