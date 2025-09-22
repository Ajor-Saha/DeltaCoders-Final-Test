CREATE TYPE "public"."question_type" AS ENUM('mcq', 'true_false');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."quiz_scope" AS ENUM('topic', 'subject');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('video', 'article', 'exercise');--> statement-breakpoint
CREATE TYPE "public"."resource_difficulty" AS ENUM('beginner', 'intermediate', 'advanced', 'all_levels');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('article', 'video', 'course');--> statement-breakpoint
CREATE TYPE "public"."practice_question_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."practice_question_type" AS ENUM('short_answer', 'mcq');--> statement-breakpoint
CREATE TABLE "lessons" (
	"lesson_id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"lesson_title" varchar(200) NOT NULL,
	"content" text,
	"order_sequence" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer,
	"question_text" text NOT NULL,
	"question_type" "question_type" DEFAULT 'mcq',
	"options" json,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"difficulty_level" "difficulty_level" DEFAULT 'easy',
	"topic_focus" text
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"quiz_id" serial PRIMARY KEY NOT NULL,
	"scope" "quiz_scope" DEFAULT 'topic',
	"topic_id" integer,
	"subject_id" integer,
	"quiz_title" varchar(100) NOT NULL,
	"difficulty_level" "difficulty_level" DEFAULT 'medium',
	"max_attempts" integer DEFAULT 3
);
--> statement-breakpoint
CREATE TABLE "remedial_contents" (
	"content_id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject_id" integer NOT NULL,
	"weakness_topic" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_external_resources" (
	"resource_id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"resource_url" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"difficulty" "resource_difficulty" DEFAULT 'all_levels'
);
--> statement-breakpoint
CREATE TABLE "subject_practice_questions" (
	"practice_question_id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "practice_question_type" DEFAULT 'short_answer',
	"difficulty" "practice_question_difficulty" DEFAULT 'beginner',
	"sample_answer" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"subject_id" serial PRIMARY KEY NOT NULL,
	"subject_name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"topic_id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"topic_name" varchar(100) NOT NULL,
	"order_sequence" integer DEFAULT 1
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
CREATE TABLE "user_quiz_progress" (
	"progress_id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" integer NOT NULL,
	"score" numeric(5, 2) DEFAULT '0',
	"attempts" integer DEFAULT 0,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_quizzes_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remedial_contents" ADD CONSTRAINT "remedial_contents_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remedial_contents" ADD CONSTRAINT "remedial_contents_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_external_resources" ADD CONSTRAINT "subject_external_resources_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_practice_questions" ADD CONSTRAINT "subject_practice_questions_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_quiz_id_quizzes_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_quiz" ON "user_quiz_progress" USING btree ("user_id","quiz_id");