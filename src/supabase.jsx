import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY env vars. Auth and cloud sync will not work.');
}

export const supabase = createClient(
  SUPABASE_URL  || 'http://localhost',
  SUPABASE_KEY  || 'missing-key'
);