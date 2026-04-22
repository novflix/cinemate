import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { clearLocalStore } from './store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    return { data, error };
  };

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { data, error };
  };

  // Fix #18: clear all local data on sign-out so next user starts fresh
  const signOut = async () => {
    await supabase.auth.signOut();
    clearLocalStore();
    localStorage.removeItem('auth_skipped');
  };

  // Delete account: remove all user data from known tables, then delete auth user
  const deleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const uid = currentUser.id;

      // Delete user data from known tables (best-effort, ignore individual errors)
      const tables = ['watchlist', 'ratings', 'lists', 'list_items', 'profiles', 'user_settings'];
      for (const table of tables) {
        await supabase.from(table).delete().eq('user_id', uid);
      }

      // Delete the auth user via Edge Function or RPC (requires service role on server)
      // Try calling a Supabase RPC that wraps admin.deleteUser if available
      const rpcResult = await supabase.rpc('delete_user');
      if (rpcResult.error) {
        // Fallback: sign out only (account data already cleared above)
        console.warn('[deleteAccount] RPC delete_user failed:', rpcResult.error.message);
      }

      // Clear local state regardless
      clearLocalStore();
      localStorage.removeItem('auth_skipped');
      await supabase.auth.signOut();
    } catch (err) {
      setLoading(false);
      return { error: err };
    }
    setLoading(false);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);