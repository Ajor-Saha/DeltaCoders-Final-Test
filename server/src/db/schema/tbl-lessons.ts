import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { topicsTable } from './tbl-topics';

export const lessonsTable = pgTable('lessons', {
  lessonId: text('lesson_id').notNull().primaryKey(),
  topicId: text('topic_id')
    .notNull()
    .references(() => topicsTable.topicId, { onDelete: 'cascade' }),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
