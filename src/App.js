import { useState } from 'react';
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
import { SnowEffect } from './components/Effects';
import Confetti from './components/Confetti';
import './index.css';

function AppInner() {
  const [tab, setTab] = useState('home');
  const { pendingRating, setPendingRating, showConfetti } = useStore();
  const { overrides } = useAdmin();

  // Snow: show if Dec/Jan naturally, OR admin forced it on
  const month = new Date().getMonth() + 1;
  const showSnow = overrides.snow || month === 12 || month === 1;

  return (
    <div className="app-shell">
      <Particles/>
      {showSnow && <SnowEffect/>}
      <div className="ambient-glow"/>
      <SideNav active={tab} onChange={setTab}/>
      <div className="app-content" style={{position:'relative',zIndex:1}}>
        {tab === 'home'    && <Home/>}
        {tab === 'recs'    && <Recs/>}
        {tab === 'search'  && <Search/>}
        {tab === 'profile' && <Profile/>}
      </div>
      <BottomNav active={tab} onChange={setTab}/>
      {pendingRating && (
        <RatingPrompt movie={pendingRating} onClose={() => setPendingRating(null)}/>
      )}
      <Confetti active={showConfetti} color="#22c55e"/>
    </div>
  );
}

function Root() {
  const { user } = useAuth();
  const [skipped, setSkipped] = useState(() => localStorage.getItem('auth_skipped') === '1');

  const handleSkip = () => { localStorage.setItem('auth_skipped','1'); setSkipped(true); };

  if (user === undefined) return (
    <div style={{position:'fixed',inset:0,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,border:'2px solid var(--surface2)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
    </div>
  );

  if (!user && !skipped) return <AuthScreen onSkip={handleSkip}/>;

  return (
    <StoreProvider userId={user?.id || null}>
      <AdminProvider userEmail={user?.email || null}>
        <AppInner/>
      </AdminProvider>
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