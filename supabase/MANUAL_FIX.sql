-- ================================================================
-- NYAY SHAYAK — MANUAL DATABASE FIX
-- Run each STEP in Supabase SQL Editor ONE AT A TIME.
-- Verify each step succeeds before running the next.
-- ================================================================

-- ── STEP 1: Verify current tables ────────────────────────────────
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: should NOT contain 'lawyers' yet

-- ── STEP 2: Grant permissions to all existing tables ─────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ── STEP 3: Reload PostgREST schema cache ────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── STEP 4: Enable RLS on core tables (one at a time) ────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_directory ENABLE ROW LEVEL SECURITY;

-- ── STEP 5: Create RLS read policies (safe, idempotent) ──────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='allow_public_read_profiles'
  ) THEN
    CREATE POLICY "allow_public_read_profiles"
      ON public.profiles FOR SELECT
      TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='courts' AND policyname='allow_public_read_courts'
  ) THEN
    CREATE POLICY "allow_public_read_courts"
      ON public.courts FOR SELECT
      TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='legal_directory' AND policyname='allow_public_read_legal_directory'
  ) THEN
    CREATE POLICY "allow_public_read_legal_directory"
      ON public.legal_directory FOR SELECT
      TO anon, authenticated USING (true);
  END IF;
END $$;

-- ── STEP 6: Create lawyers table ─────────────────────────────────
-- [PASTE EXACT DDL FROM 003_lawyer_platform.sql HERE]
-- If that file doesn't define lawyers table, use this fallback:

CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bar_council_number TEXT UNIQUE NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{"Hindi", "English"}',
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT false,
  profile_photo_url TEXT,
  bio TEXT,
  city TEXT,
  state TEXT,
  consultation_fee_video INTEGER DEFAULT 500,
  consultation_fee_chat INTEGER DEFAULT 200,
  free_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── STEP 7: Grant on lawyers table ───────────────────────────────
GRANT SELECT ON public.lawyers TO anon, authenticated;
GRANT ALL ON public.lawyers TO service_role;

-- ── STEP 8: Enable RLS on lawyers ────────────────────────────────
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_lawyers"
  ON public.lawyers FOR SELECT
  TO anon, authenticated USING (true);

-- ── STEP 9: Owner-based write policy for lawyers ─────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='lawyers' AND policyname='allow_own_profile_update'
  ) THEN
    CREATE POLICY "allow_own_profile_update"
      ON public.lawyers FOR UPDATE
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;
END $$;

-- ── STEP 10: Final cache reload ───────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── STEP 11: Verify lawyers table is now accessible ───────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'lawyers';
-- Expected: one row with table_name = 'lawyers'

-- ── STEP 12: Verify RLS is enabled ───────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: rowsecurity = true for all key tables

