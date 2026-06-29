import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// FATAL: never log service role keys. Fail fast at startup if missing.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length === 0) {
  throw new Error('FATAL: Missing SUPABASE_SERVICE_ROLE_KEY — check .env file');
}
if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.trim().length === 0) {
  throw new Error('FATAL: Missing SUPABASE_URL — check .env file');
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);


