import { useState } from 'react';
import { StoreProvider } from './store';
import { ThemeProvider } from './theme';
import BottomNav from './components/BottomNav';
import SideNav from './components/SideNav';
import Particles from './components/Particles';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Recs from './pages/Recs';
import './index.css';

function AppInner() {
  const [tab, setTab] = useState('home');
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
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AppInner/>
      </StoreProvider>
    </ThemeProvider>
  );
}
