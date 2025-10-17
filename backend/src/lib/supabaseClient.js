import { createClient } from '@supabase/supabase-js';
// Ensure environment variables are loaded even if this module is imported before index.js runs dotenv
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.join(__dirname, '../../.env') });
} catch (e) {
  // non-fatal
  console.warn('[supabaseClient] dotenv load skipped', e?.message);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseInstance = null;
if (url && serviceKey) {
  try {
    supabaseInstance = createClient(url, serviceKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    });
  } catch (e) {
    console.error('[supabaseClient] failed to create client', e);
  }
} else {
  const missing = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY');
  console.warn('[supabaseClient] missing env vars; supabase disabled =>', missing.join(','));
}

export const supabase = supabaseInstance;
export function requireSupabaseOr500(res) {
  if (!supabase) {
    return res.status(500).json({ ok: false, error: { code: 'SUPABASE_CLIENT', message: 'Supabase client not configured' } });
  }
  return null;
}
