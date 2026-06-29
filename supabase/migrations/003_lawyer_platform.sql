-- Lawyers profile table
CREATE TABLE lawyers (
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

-- Consultation bookings
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  lawyer_id UUID REFERENCES lawyers(id),
  type TEXT CHECK (type IN ('video', 'chat', 'callback')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  amount_paid INTEGER DEFAULT 0,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  room_url TEXT,
  room_token TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  user_id UUID REFERENCES auth.users(id),
  lawyer_id UUID REFERENCES lawyers(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily legal quotes
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_en TEXT NOT NULL,
  quote_hi TEXT NOT NULL,
  source TEXT,
  category TEXT,
  date DATE UNIQUE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Court orders / updates feed
CREATE TABLE court_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnr TEXT,
  court_name TEXT,
  order_date DATE,
  order_type TEXT,
  order_summary TEXT,
  order_pdf_url TEXT,
  next_hearing_date DATE,
  raw_data JSONB,
  source TEXT DEFAULT 'ecourts',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  consultation_id UUID REFERENCES consultations(id),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lawyers_city ON lawyers(city);
CREATE INDEX idx_lawyers_available ON lawyers(is_available);
CREATE INDEX idx_consultations_user ON consultations(user_id);
CREATE INDEX idx_consultations_lawyer ON consultations(lawyer_id);
CREATE INDEX idx_court_updates_cnr ON court_updates(cnr);
CREATE INDEX idx_daily_quotes_date ON daily_quotes(date);

-- RLS Policies
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers are viewable by everyone" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Users can view own consultations" ON consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consultations" ON consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- Seed 10 sample daily quotes
INSERT INTO daily_quotes (quote_en, quote_hi, source, category) VALUES
('Justice delayed is justice denied.', 'न्याय में देरी, न्याय से इनकार है।', 'William Gladstone', 'justice'),
('The law is reason, free from passion.', 'कानून तर्क है, भावना से मुक्त।', 'Aristotle', 'law'),
('Equal justice under law.', 'कानून के तहत समान न्याय।', 'US Supreme Court', 'equality'),
('The good of the people is the greatest law.', 'जनता का भला सबसे बड़ा कानून है।', 'Cicero', 'people'),
('Laws are spider webs through which the big flies pass.', 'कानून मकड़ी के जाले हैं, बड़े निकल जाते हैं।', 'Honoré de Balzac', 'justice'),
('No man is above the law.', 'कोई भी कानून से ऊपर नहीं है।', 'Theodore Roosevelt', 'equality'),
('Justice is the constant will to give every man his due.', 'न्याय हर व्यक्ति को उसका हक देने की निरंतर इच्छा है।', 'Justinian I', 'justice'),
('The law must be stable, but it must not stand still.', 'कानून स्थिर हो, पर रुके नहीं।', 'Roscoe Pound', 'law'),
('Injustice anywhere is a threat to justice everywhere.', 'कहीं भी अन्याय हर जगह न्याय के लिए खतरा है।', 'Martin Luther King Jr.', 'justice'),
('In law, nothing is certain but the expense.', 'कानून में खर्च के अलावा कुछ भी निश्चित नहीं।', 'Samuel Butler', 'humor');

