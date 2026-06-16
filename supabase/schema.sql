-- Run this in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS waitlist (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast duplicate checks
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);

-- (Optional) view ordered by signup time
CREATE OR REPLACE VIEW waitlist_ordered AS
  SELECT id, email, created_at
  FROM waitlist
  ORDER BY created_at DESC;
