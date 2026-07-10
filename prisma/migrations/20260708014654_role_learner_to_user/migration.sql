-- Rename the LEARNER role value to USER (column default follows the rename).
ALTER TYPE "public"."Role" RENAME VALUE 'LEARNER' TO 'USER';
