import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please add them to your .env file.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Add bypass for row level security during development
export const bypassRLS = async () => {
  if (localStorage.getItem('user')) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await supabase.auth.setAuth(user.id);
      }
    } catch (error) {
      console.error('Error setting auth bypass:', error);
    }
  }
};