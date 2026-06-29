import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  throw new Error(
    '[Legis] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from .env. ' +
      'Add both to F:/Nyay_Shayak/.env and restart the dev server.'
  );
}

export const supabase = createClient(url, key);

