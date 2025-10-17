import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing auth token' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.error('Supabase JWT error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
