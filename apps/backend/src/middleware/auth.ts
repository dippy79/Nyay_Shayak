import { supabase } from '../config/supabase.js';

export async function verifyJWT(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', code: 'AUTH' });
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'AUTH' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

