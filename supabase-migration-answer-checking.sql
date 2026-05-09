-- ============================================================
-- Migration: fix answer-checking logic
-- 1. Add expected_output column
-- 2. normalize_python_output helper
-- 3. Rewrite check_answer (type-aware, no lowercasing)
-- 4. Populate expected_output for all questions
-- ============================================================

-- 1. Add expected_output column (safe to run repeatedly)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS expected_output text;

-- 2. Output normaliser used by check_answer and by tests
CREATE OR REPLACE FUNCTION normalize_python_output(raw text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  line text;
  lines text[];
  result_lines text[] := '{}';
BEGIN
  IF raw IS NULL THEN RETURN ''; END IF;
  -- Normalize all line-ending variants to LF
  raw := replace(raw, E'\r\n', E'\n');
  raw := replace(raw, E'\r',   E'\n');
  -- Split, right-trim each line, rejoin
  lines := string_to_array(raw, E'\n');
  FOREACH line IN ARRAY lines LOOP
    result_lines := array_append(result_lines, rtrim(line));
  END LOOP;
  raw := array_to_string(result_lines, E'\n');
  -- Strip leading / trailing blank lines then outer whitespace
  raw := btrim(raw, E'\n');
  raw := trim(raw);
  RETURN raw;
END;
$$;

-- 3. Rewritten check_answer
--    fill_in_the_blank  → case-insensitive token match against answer / alternative_answer
--    everything else    → normalised stdout match against expected_output
CREATE OR REPLACE FUNCTION check_answer(question_id text, user_answer text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  q_type     text;
  q_expected text;
  q_answer   text;
  q_alt      text;
  norm_user  text;
BEGIN
  SELECT type, expected_output, answer, alternative_answer
  INTO q_type, q_expected, q_answer, q_alt
  FROM questions
  WHERE id = question_id;

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

  -- All other checked types: normalised stdout vs expected_output
  IF q_expected IS NULL THEN
    RETURN false;
  END IF;

  RETURN normalize_python_output(user_answer) = normalize_python_output(q_expected);
END;
$$;

-- 4a. output_prediction / what_is_the_result:
--     expected_output = answer (the answer already IS the expected text output)
--     Exception: E038 raises an unhandled exception — no stdout, leave NULL.
UPDATE questions
SET    expected_output = answer
WHERE  type IN ('output_prediction', 'what_is_the_result')
AND    id <> 'E038';

-- 4b. write_the_code: expected_output = stdout of the reference solution
--     (computed with PYTHONHASHSEED=0 to match Pyodide's deterministic hashing)
UPDATE questions SET expected_output = '7'                         WHERE id = 'S001';
UPDATE questions SET expected_output = 'PYTHON'                    WHERE id = 'S002';
UPDATE questions SET expected_output = '60'                        WHERE id = 'S003';
UPDATE questions SET expected_output = '3'                         WHERE id = 'S004';
UPDATE questions SET expected_output = 'minor'                     WHERE id = 'S005';
UPDATE questions SET expected_output = $eo$2
4
6
8$eo$                                                               WHERE id = 'S006';
UPDATE questions SET expected_output = 'Earth'                     WHERE id = 'S007';
UPDATE questions SET expected_output = 'hello'                     WHERE id = 'S008';
UPDATE questions SET expected_output = $eo$3
2
1
Go!$eo$                                                             WHERE id = 'S009';
UPDATE questions SET expected_output = $eo$1
9$eo$                                                               WHERE id = 'S010';
UPDATE questions SET expected_output = '3'                         WHERE id = 'S011';
UPDATE questions SET expected_output = $eo$['book', 'pen']$eo$     WHERE id = 'S012';

UPDATE questions SET expected_output = '[4, 16, 36, 64, 100]'     WHERE id = 'I001';
UPDATE questions SET expected_output = $eo${'cat': 3, 'dog': 3, 'elephant': 8}$eo$  WHERE id = 'I002';
UPDATE questions SET expected_output = $eo${'a', 'b'}$eo$          WHERE id = 'I003';
UPDATE questions SET expected_output = $eo$Hello, Alice!
Hi, Bob!$eo$                                                        WHERE id = 'I004';
UPDATE questions SET expected_output = '10'                        WHERE id = 'I005';
UPDATE questions SET expected_output = $eo$name: Alice
age: 30$eo$                                                         WHERE id = 'I006';
UPDATE questions SET expected_output = '3'                         WHERE id = 'I007';
UPDATE questions SET expected_output = '9'                         WHERE id = 'I008';
UPDATE questions SET expected_output = 'The Quick Brown Fox'       WHERE id = 'I009';
UPDATE questions SET expected_output = $eo${'Bob': 85, 'Carol': 95}$eo$ WHERE id = 'I010';
UPDATE questions SET expected_output = $eo$a -> 1
b -> 2
c -> 3$eo$                                                          WHERE id = 'I011';
UPDATE questions SET expected_output = $eo${1, 2, 3, 4, 5, 6}
{3, 4}
{1, 2}$eo$                                                          WHERE id = 'I012';
UPDATE questions SET expected_output = $eo$1 x 1 = 1
1 x 2 = 2
1 x 3 = 3
2 x 1 = 2
2 x 2 = 4
2 x 3 = 6
3 x 1 = 3
3 x 2 = 6
3 x 3 = 9$eo$                                                       WHERE id = 'I013';

UPDATE questions SET expected_output = $eo$Calling add
Done
5$eo$                                                               WHERE id = 'H001';
UPDATE questions SET expected_output = $eo$5
4
3
2
1$eo$                                                               WHERE id = 'H002';
UPDATE questions SET expected_output = $eo$<div>
Hello
</div>$eo$                                                          WHERE id = 'H003';
UPDATE questions SET expected_output = $eo$Operation complete
Cannot divide by zero$eo$                                           WHERE id = 'H004';
UPDATE questions SET expected_output = '60'                        WHERE id = 'H005';
UPDATE questions SET expected_output = 'Woof'                      WHERE id = 'H006';
UPDATE questions SET expected_output = 'Vector(4, 6)'              WHERE id = 'H007';
UPDATE questions SET expected_output = $eo$1
2
3
4
5
6$eo$                                                               WHERE id = 'H008';
UPDATE questions SET expected_output = '14'                        WHERE id = 'H009';
UPDATE questions SET expected_output = '30'                        WHERE id = 'H010';
UPDATE questions SET expected_output = $eo$Hello
Hello
Hello
3$eo$                                                               WHERE id = 'H011';
UPDATE questions SET expected_output = $eo$1
9
25
49
81$eo$                                                              WHERE id = 'H012';
UPDATE questions SET expected_output = 'Cannot take square root of negative number' WHERE id = 'H013';
UPDATE questions SET expected_output = $eo$3
Stack([1, 2, 3])$eo$                                               WHERE id = 'H014';

UPDATE questions SET expected_output = '25'                        WHERE id = 'E001';
UPDATE questions SET expected_output = '3 4'                       WHERE id = 'E002';
UPDATE questions SET expected_output = $eo$True
False$eo$                                                           WHERE id = 'E003';
UPDATE questions SET expected_output = $eo$Product(name='Widget', price=9.99, quantity=1)$eo$ WHERE id = 'E004';
UPDATE questions SET expected_output = '28.27'                     WHERE id = 'E005';
UPDATE questions SET expected_output = '5.0'                       WHERE id = 'E006';
UPDATE questions SET expected_output = $eo$Hi
Hi
Hi$eo$                                                              WHERE id = 'E007';
UPDATE questions SET expected_output = $eo$Hello, Alice
Hello, Bob
2$eo$                                                               WHERE id = 'E008';
UPDATE questions SET expected_output = $eo$10
30
35$eo$                                                              WHERE id = 'E009';
UPDATE questions SET expected_output = $eo$1
2
3
4
5$eo$                                                               WHERE id = 'E010';
UPDATE questions SET expected_output = $eo$Fetching users...
users: done$eo$                                                     WHERE id = 'E011';
UPDATE questions SET expected_output = $eo$20
28.27$eo$                                                           WHERE id = 'E012';
UPDATE questions SET expected_output = $eo$Flying
I am a duck that can: Flying$eo$                                    WHERE id = 'E013';
UPDATE questions SET expected_output = $eo${'a': 1, 'b': 5, 'c': 4}$eo$ WHERE id = 'E014';
UPDATE questions SET expected_output = $eo$True
1.0$eo$                                                             WHERE id = 'E015';

-- 4c. fill_in_the_blank, spot_the_bug, and E038 (exception what_is_the_result):
--     expected_output stays NULL — graded by direct answer comparison or not graded.
--     (No UPDATE needed; column defaults to NULL.)
