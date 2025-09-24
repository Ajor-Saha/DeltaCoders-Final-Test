import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { userTable } from './tbl-user';
import { userChatsTable } from './tbl-user-chats';

export const userChatMessagesTable = pgTable('user_chat_messages', {
  messageId: text('message_id').notNull().primaryKey(),
  chatId: text('chat_id')
    .notNull()
    .references(() => userChatsTable.chatId, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  userMessage: text('user_message').notNull(),
  aiResponse: text('ai_response').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
