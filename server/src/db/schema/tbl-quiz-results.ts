import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { quizzesTable } from './tbl-quizzes';

export const quizResultsTable = pgTable('quiz_results', {
  resultId: text('result_id').notNull().primaryKey(),
  quizId: text('quiz_id')
    .notNull()
    .references(() => quizzesTable.quizId, { onDelete: 'cascade' }),
  score: integer('score').notNull(), // How many marks user scored
  totalMarks: integer('total_marks').notNull(), // Total marks possible (number of questions)
  timeTaken: integer('time_taken').notNull(), // Time taken to complete the quiz in seconds
  summary: text('summary'), // Feedback summary for the user
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
