CREATE TYPE "public"."topic_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."user_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TABLE "lessons" (
	"lesson_id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"question_id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"question" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" text NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"user_choice" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "quiz_results" (
	"result_id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"score" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"summary" text,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"quiz_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"topic_id" text,
	"subject_id" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "short_question_exams" (
	"exam_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject_id" text,
	"total_questions" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"user_score" integer DEFAULT 0,
	"is_completed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "short_questions" (
	"question_id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"question" text NOT NULL,
	"correct_answer" text NOT NULL,
	"user_answer" text,
	"user_marks" integer DEFAULT 0,
	"max_marks" integer NOT NULL,
	"evaluation" text,
	"is_answered" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"subject_id" text PRIMARY KEY NOT NULL,
	"subject_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"topic_id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"difficulty" "topic_difficulty" DEFAULT 'easy',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"avatar" text,
	"verify_code" text,
	"verify_code_expiry" timestamp,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp,
	CONSTRAINT "tbl_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"level" "user_level" DEFAULT 'beginner',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_quiz_id_quizzes_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_question_exams" ADD CONSTRAINT "short_question_exams_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_question_exams" ADD CONSTRAINT "short_question_exams_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_questions" ADD CONSTRAINT "short_questions_exam_id_short_question_exams_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."short_question_exams"("exam_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;