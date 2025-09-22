import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';

export const topicsTable = pgTable('topics', {
  topicId: serial('topic_id').primaryKey(),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
  topicName: varchar('topic_name', { length: 100 }).notNull(),
  orderSequence: integer('order_sequence').default(1),
});
