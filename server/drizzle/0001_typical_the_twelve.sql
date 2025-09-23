CREATE TABLE "cognitive_assessments" (
	"assessment_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"weighted_score" numeric(5, 2) NOT NULL,
	"stress_score" integer NOT NULL,
	"attention_score" integer NOT NULL,
	"cognitive_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "cognitive_assessments" ADD CONSTRAINT "cognitive_assessments_quiz_id_quizzes_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("quiz_id") ON DELETE cascade ON UPDATE no action;