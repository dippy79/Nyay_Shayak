-- Ensure endpoint uniqueness so server upserts onConflict('endpoint') works reliably
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_endpoint_unique
  UNIQUE (endpoint);

