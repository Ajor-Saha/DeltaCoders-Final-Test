ALTER TABLE "topics" ALTER COLUMN "difficulty" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "difficulty" SET DEFAULT 'Easy'::text;--> statement-breakpoint
DROP TYPE "public"."topic_difficulty";--> statement-breakpoint
CREATE TYPE "public"."topic_difficulty" AS ENUM('Easy', 'Medium', 'Hard');--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "difficulty" SET DEFAULT 'Easy'::"public"."topic_difficulty";--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "difficulty" SET DATA TYPE "public"."topic_difficulty" USING "difficulty"::"public"."topic_difficulty";--> statement-breakpoint
ALTER TABLE "quiz_results" ADD COLUMN "time_taken" integer NOT NULL;