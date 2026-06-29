-- Add city column to courts (may already exist in some deployments)
ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS city text;

-- Backfill city from district where missing
UPDATE public.courts SET city = district WHERE city IS NULL AND district IS NOT NULL;

-- pg_trgm provides gin_trgm_ops (Supabase: enable in Dashboard → Database → Extensions, or run below)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Search indexes for court directory filters (always safe)
CREATE INDEX IF NOT EXISTS idx_courts_state ON public.courts (state);
CREATE INDEX IF NOT EXISTS idx_courts_district ON public.courts (district);
CREATE INDEX IF NOT EXISTS idx_courts_type ON public.courts (type);
CREATE INDEX IF NOT EXISTS idx_courts_city ON public.courts (city);
CREATE INDEX IF NOT EXISTS idx_courts_name ON public.courts (name);

-- Trigram index for ILIKE name search — only when pg_trgm operator class exists
DO $$
DECLARE
  trgm_schema text;
BEGIN
  SELECT n.nspname INTO trgm_schema
  FROM pg_opclass opc
  JOIN pg_namespace n ON n.oid = opc.opcnamespace
  JOIN pg_am am ON am.oid = opc.opcmethod
  WHERE opc.opcname = 'gin_trgm_ops' AND am.amname = 'gin'
  LIMIT 1;

  IF trgm_schema IS NOT NULL THEN
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_courts_name_trgm ON public.courts USING gin (name %I.gin_trgm_ops)',
      trgm_schema
    );
  ELSE
    RAISE NOTICE 'pg_trgm not installed — skipping trigram index (idx_courts_name btree is sufficient for small tables)';
  END IF;
END $$;

-- Full-text search index for combined court fields (built-in, no pg_trgm required)
CREATE INDEX IF NOT EXISTS idx_courts_search ON public.courts USING gin (
  to_tsvector(
    'simple',
    coalesce(name, '') || ' ' ||
    coalesce(district, '') || ' ' ||
    coalesce(state, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(address, '')
  )
);
