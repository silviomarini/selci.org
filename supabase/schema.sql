-- Run this in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS waitlist (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast duplicate checks
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (used by the serverless function)
CREATE POLICY "allow_insert" ON waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Block public reads (only accessible via service_role / dashboard)
CREATE POLICY "block_select" ON waitlist
  FOR SELECT TO anon
  USING (false);

-- (Optional) view ordered by signup time
CREATE OR REPLACE VIEW waitlist_ordered AS
  SELECT id, email, created_at
  FROM waitlist
  ORDER BY created_at DESC;
