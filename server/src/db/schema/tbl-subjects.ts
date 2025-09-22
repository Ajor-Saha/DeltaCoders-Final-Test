import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const subjectsTable = pgTable('subjects', {
  subjectId: serial('subject_id').primaryKey(),
  subjectName: varchar('subject_name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
