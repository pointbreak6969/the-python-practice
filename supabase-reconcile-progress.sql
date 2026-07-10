-- ============================================================
-- Reconcile question_progress after adding language to the PK
--
-- The old primary key was (user_id, question_id), so solves for the
-- same question id in different languages overwrote each other and
-- the language column could be wrong. This script rebuilds progress
-- from the attempts table, which already stores the correct language.
--
-- 1. Back up existing progress (optional but recommended):
--    CREATE TABLE question_progress_backup AS SELECT * FROM question_progress;
--
-- 2. Run this script.
--
-- 3. Verify counts match expectations, then drop the backup table.
-- ============================================================

BEGIN;

-- Remove stale progress rows
TRUNCATE TABLE question_progress;

-- Rebuild progress from attempts
INSERT INTO question_progress (
  user_id,
  question_id,
  language,
  status,
  attempts,
  solved_at,
  updated_at
)
SELECT
  user_id,
  question_id,
  language,
  CASE WHEN bool_or(correct) THEN 'SOLVED'::"ProgressStatus" ELSE 'ATTEMPTED'::"ProgressStatus" END,
  COUNT(*),
  MIN(CASE WHEN correct THEN created_at END),
  NOW()
FROM attempts
WHERE user_id IS NOT NULL
GROUP BY user_id, question_id, language;

COMMIT;
