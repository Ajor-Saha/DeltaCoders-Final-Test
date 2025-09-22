import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { remedialQuestionsTable } from './tbl-remedial-questions';
import { userTable } from './tbl-user';

// Enum for content type
export const contentTypeEnum = pgEnum('content_type', [
  'video',
  'article',
  'exercise',
]);

export const remedialContentsTable = pgTable('remedial_contents', {
  contentId: serial('content_id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  remedialQuestionId: integer('remedial_question_id')
    .notNull()
    .references(() => remedialQuestionsTable.remedialQuestionId, {
      onDelete: 'cascade',
    }),
  contentType: contentTypeEnum('content_type').notNull(),
  contentUrl: text('content_url').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  duration: integer('duration'), // in minutes
  assignedAt: timestamp('assigned_at').defaultNow(),
});
