import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { topicsTable } from './tbl-topics';

export const lessonsTable = pgTable('lessons', {
  lessonId: serial('lesson_id').primaryKey(),
  topicId: integer('topic_id')
    .notNull()
    .references(() => topicsTable.topicId, { onDelete: 'cascade' }),
  lessonTitle: varchar('lesson_title', { length: 200 }).notNull(),
  content: text('content'),
  orderSequence: integer('order_sequence').default(1), // Changed from serial to integer with default
});
