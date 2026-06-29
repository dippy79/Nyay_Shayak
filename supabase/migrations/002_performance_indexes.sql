-- Text search index for legal directory
CREATE INDEX IF NOT EXISTS idx_legal_dir_search
ON legal_directory USING GIN(
  to_tsvector('simple', name || ' ' || COALESCE(district, '') || ' ' || COALESCE(state, '')));

-- Geospatial index for nearest court/station search
CREATE INDEX IF NOT EXISTS idx_legal_dir_geo
ON legal_directory USING GIST(geometry);

-- Case lookups: Optimization for core query pattern (CNR + Expiry evaluation)
CREATE INDEX IF NOT EXISTS idx_case_lookups_cnr_expiry
ON case_lookups(cnr, expires_at DESC);

-- User documents: Fast lookup for personal legal assets
CREATE INDEX IF NOT EXISTS idx_legal_docs_user
ON legal_documents(user_id, created_at DESC);

