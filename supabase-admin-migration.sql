-- ============================================================
-- Migration: Multi-Language Question Tables
-- ============================================================
--
-- HOW TO RUN THIS MIGRATION:
--
-- Option A — Supabase Dashboard (easiest):
--   1. Go to https://supabase.com/dashboard → your project
--   2. Left sidebar → SQL Editor
--   3. Paste the entire contents of this file → click Run
--
-- Option B — Supabase CLI (local dev):
--   1. Copy this file into supabase/migrations/ with a timestamp prefix:
--        cp supabase-admin-migration.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_multi_lang_tables.sql
--   2. Run: supabase db push
--      OR:  supabase migration up
--
-- Option C — Supabase CLI (remote only, no local stack):
--   supabase db push --db-url "postgresql://postgres:<password>@<host>:5432/postgres"
--
-- AFTER RUNNING THIS MIGRATION:
--   - Tables are ready to receive data via the admin API
--   - No further steps needed — RLS is enabled and service_role policies are set
-- ============================================================

-- ----------------------------------------------------------------
-- javascript_questions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS javascript_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE javascript_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'javascript_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON javascript_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- pytorch_questions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pytorch_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE pytorch_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pytorch_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON pytorch_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- numpy_questions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS numpy_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE numpy_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'numpy_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON numpy_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- pandas_questions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pandas_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE pandas_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pandas_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON pandas_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- c_questions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS c_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE c_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'c_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON c_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- cpp_questions  (C++)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cpp_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE cpp_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cpp_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON cpp_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- rust_questions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rust_questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  expected_output    text,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE rust_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rust_questions' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON rust_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
