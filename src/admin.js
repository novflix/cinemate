import { createContext, useContext, useState, useEffect } from 'react';

const ADMIN_EMAIL = 'ildenisov911@gmail.com';

const AdminContext = createContext(null);

// Keys for localStorage admin overrides
const ADMIN_KEY = 'cinemate_admin_overrides';

const defaultOverrides = {
  snow:     false,  // force snow
  season:   null,   // override season: null = auto, or 'halloween'|'newyear'|'summer'|'winter'|'spring'|'autumn'
};

export function AdminProvider({ children, userEmail }) {
  const isAdmin = userEmail === ADMIN_EMAIL;
  const [overrides, setOverrides] = useState(() => {
    if (!isAdmin) return defaultOverrides;
    try {
      const saved = localStorage.getItem(ADMIN_KEY);
      return saved ? { ...defaultOverrides, ...JSON.parse(saved) } : defaultOverrides;
    } catch { return defaultOverrides; }
  });

  useEffect(() => {
    if (!isAdmin) return;
    try { localStorage.setItem(ADMIN_KEY, JSON.stringify(overrides)); } catch {}
  }, [overrides, isAdmin]);

  const setOverride = (key, value) => {
    setOverrides(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminContext.Provider value={{ isAdmin, overrides, setOverride }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);