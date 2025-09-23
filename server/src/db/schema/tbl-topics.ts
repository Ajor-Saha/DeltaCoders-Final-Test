import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';

export const difficultyEnum = pgEnum('topic_difficulty', [
  'Easy',
  'Medium',
  'Hard',
]);

export const topicsTable = pgTable('topics', {
  topicId: text('topic_id').notNull().primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  difficulty: difficultyEnum('difficulty').default('Easy'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
