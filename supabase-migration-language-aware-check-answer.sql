-- ============================================================
-- Migration: make check_answer language-aware
--
-- Adds a `language` parameter so the same function can verify
-- answers for python (questions), javascript (javascript_questions)
-- and sql (sql_questions) tables.
-- ============================================================

CREATE OR REPLACE FUNCTION check_answer(
  question_id text,
  user_answer text,
  language text DEFAULT 'python'
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  q_type     text;
  q_expected text;
  q_answer   text;
  q_alt      text;
  norm_user  text;
BEGIN
  IF language = 'javascript' THEN
    SELECT type, expected_output, answer, alternative_answer
    INTO q_type, q_expected, q_answer, q_alt
    FROM javascript_questions
    WHERE id = question_id;
  ELSIF language = 'sql' THEN
    SELECT type, expected_output, answer, alternative_answer
    INTO q_type, q_expected, q_answer, q_alt
    FROM sql_questions
    WHERE id = question_id;
  ELSE
    SELECT type, expected_output, answer, alternative_answer
    INTO q_type, q_expected, q_answer, q_alt
    FROM questions
    WHERE id = question_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found: %', question_id;
  END IF;

  -- fill_in_the_blank: compare the extracted token directly
  IF q_type = 'fill_in_the_blank' THEN
    norm_user := lower(trim(user_answer));
    IF norm_user = lower(trim(q_answer)) THEN RETURN true; END IF;
    IF q_alt IS NOT NULL AND norm_user = lower(trim(q_alt)) THEN RETURN true; END IF;
    RETURN false;
  END IF;

  -- All other checked types: normalised stdout vs expected_output (or answer fallback)
  IF q_expected IS NULL THEN
    q_expected := q_answer;
  END IF;

  IF q_expected IS NULL THEN
    RETURN false;
  END IF;

  norm_user := normalize_python_output(user_answer);

  IF norm_user = normalize_python_output(q_expected) THEN RETURN true; END IF;
  IF q_alt IS NOT NULL AND norm_user = normalize_python_output(q_alt) THEN RETURN true; END IF;
  RETURN false;
END;
$$;
