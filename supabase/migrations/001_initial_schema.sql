-- Enable UUID extension for Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: legal_documents (user-scanned docs with AI analysis)
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cnr TEXT,
    image_url TEXT NOT NULL,
    analysis JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: legal_directory (courts/police stations with geospatial location)
CREATE TABLE IF NOT EXISTS legal_directory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Supreme Court', 'High Court', 'District Court', 'Police Station', 'Legal Aid')),
    address TEXT,
    phone TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: case_lookups (scraped case status cache)
CREATE TABLE IF NOT EXISTS case_lookups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cnr TEXT UNIQUE NOT NULL,
    status JSONB,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_lookups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own documents" ON legal_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own documents" ON legal_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON legal_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read legal_directory" ON legal_directory
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert directory" ON legal_directory
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read case_lookups" ON case_lookups
    FOR SELECT USING (true);

CREATE POLICY "Users can insert case lookups" ON case_lookups
    FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_legal_documents_user ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_cnr ON legal_documents(cnr);
CREATE INDEX idx_case_lookups_cnr ON case_lookups(cnr);
CREATE INDEX idx_legal_directory_geom ON legal_directory USING GIST(geom);

-- Seed Data: 5 Major Indian Courts
INSERT INTO legal_directory (name, type, address, phone, lat, lng, geom) VALUES
-- Supreme Court of India
('Supreme Court of India', 'Supreme Court', 'Tilak Marg, New Delhi, Delhi 110001', '011-23388922', 28.597413, 77.249058, ST_SetSRID(ST_MakePoint(77.249058, 28.597413), 4326)),
-- Delhi High Court
('Delhi High Court', 'High Court', 'Sher Shah Road, Aliganj, New Delhi, Delhi 110003', '011-23386437', 28.5655, 77.2400, ST_SetSRID(ST_MakePoint(77.2400, 28.5655), 4326)),
-- Bombay High Court
('Bombay High Court', 'High Court', 'Fort, Mumbai, Maharashtra 400032', '022-22713067', 18.9333, 72.8333, ST_SetSRID(ST_MakePoint(72.8333, 18.9333), 4326)),
-- Madras High Court
('Madras High Court', 'High Court', 'Chennai, Tamil Nadu 600104', '044-25341339', 13.0845, 80.2707, ST_SetSRID(ST_MakePoint(80.2707, 13.0845), 4326)),
-- Calcutta High Court
('Calcutta High Court', 'High Court', 'Kolkata, West Bengal 700001', '033-22535401', 22.5726, 88.3639, ST_SetSRID(ST_MakePoint(88.3639, 22.5726), 4326))
ON CONFLICT (id) DO NOTHING;

-- Update geom for seeds if inserted
UPDATE legal_directory SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE geom IS NULL;

-- Storage Bucket for legal-documents (run in Supabase dashboard: Storage > New bucket 'legal-documents')
-- Bucket Policy (SQL equivalent - apply in dashboard):
-- CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'legal-documents');
-- CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'legal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON legal_documents
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE legal_documents IS 'User-uploaded legal documents with Gemini AI analysis';
COMMENT ON TABLE legal_directory IS 'Geospatial directory of courts/police/legal aid with PostGIS';
COMMENT ON TABLE case_lookups IS 'Cached eCourts scraper results with TTL';

