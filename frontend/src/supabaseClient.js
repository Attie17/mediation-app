import { createClient } from '@supabase/supabase-js';
import { singleton } from './utils/singleton';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create and export Supabase client (idempotent). We log once in dev to verify singular init.
export const supabase = singleton('supabase', () => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[supabase] initializing client');
  }
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
});

export default supabase;