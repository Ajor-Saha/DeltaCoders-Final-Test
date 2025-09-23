CREATE TABLE "tbl_game_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"game_name" varchar(50) NOT NULL,
	"duration" integer NOT NULL,
	"score" integer NOT NULL,
	"total_actions" integer NOT NULL,
	"errors" integer NOT NULL,
	"cognitive_load" integer NOT NULL,
	"focus" integer NOT NULL,
	"attention" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_game_analytics" ADD CONSTRAINT "tbl_game_analytics_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;