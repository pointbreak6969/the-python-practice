-- Add language to the question_progress primary key so that progress for the
-- same question id is tracked independently per language (python/javascript/sql).

ALTER TABLE "question_progress" DROP CONSTRAINT "question_progress_pkey";

ALTER TABLE "question_progress" ADD CONSTRAINT "question_progress_pkey" PRIMARY KEY ("user_id", "question_id", "language");
