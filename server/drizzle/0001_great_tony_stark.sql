CREATE TABLE "user_chat_messages" (
	"message_id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_message" text NOT NULL,
	"ai_response" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "user_chats" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "user_chat_messages" ADD CONSTRAINT "user_chat_messages_chat_id_user_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."user_chats"("chat_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chat_messages" ADD CONSTRAINT "user_chat_messages_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chats" ADD CONSTRAINT "user_chats_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;