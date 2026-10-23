import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('karmalak_supabase_url') || '' : '';
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('karmalak_supabase_key') || '' : '';

export const supabaseUrl = savedUrl || envUrl || 'https://placeholder-project.supabase.co';
export const supabaseAnonKey = savedKey || envKey || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  const url = savedUrl || envUrl;
  const key = savedKey || envKey;
  return Boolean(url && key && !url.includes('placeholder-project') && !key.includes('placeholder-anon'));
};

export const saveSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('karmalak_supabase_url', url.trim());
    localStorage.setItem('karmalak_supabase_key', key.trim());
    window.location.reload();
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('karmalak_supabase_url');
    localStorage.removeItem('karmalak_supabase_key');
    window.location.reload();
  }
};

// Safe client creation
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
