-- LAWYERS table
-- Anyone can view verified lawyers (public directory)
-- Only the lawyer themselves can update their own profile
CREATE POLICY "Public can view verified lawyers"
  ON lawyers FOR SELECT USING (is_verified = true);

CREATE POLICY "Lawyer can update own profile"
  ON lawyers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Lawyer can insert own profile"
  ON lawyers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CONSULTATIONS table
-- Users can only see their own consultations
-- Lawyers can see consultations assigned to them
-- Users can only create consultations for themselves
CREATE POLICY "Users see own consultations"
  ON consultations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM lawyers WHERE id = lawyer_id
  ));

CREATE POLICY "Users create own consultations"
  ON consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lawyer or user can update consultation"
  ON consultations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM lawyers WHERE id = lawyer_id
  ));

-- REVIEWS table
-- Anyone can read reviews (public trust signal)
-- Only consultation owner can write review
-- Cannot review twice (one review per consultation)
CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "User can write own review"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.consultation_id = consultation_id
      AND r.user_id = auth.uid()
    )
  );

-- PAYMENTS table
-- Users can only see their own payments
-- Only backend service role can insert/update payments
CREATE POLICY "Users see own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- DAILY_QUOTES table
-- Everyone can read (public content)
-- Only service role can insert/update quotes
CREATE POLICY "Public can read quotes"
  ON daily_quotes FOR SELECT USING (true);

CREATE POLICY "Service role manages quotes"
  ON daily_quotes FOR ALL
  USING (auth.role() = 'service_role');

-- COURT_UPDATES table
-- Everyone can read court updates (public data)
-- Only service role can insert/update (scraper uses service role)
CREATE POLICY "Public can read court updates"
  ON court_updates FOR SELECT USING (true);

CREATE POLICY "Service role manages court updates"
  ON court_updates FOR ALL
  USING (auth.role() = 'service_role');

