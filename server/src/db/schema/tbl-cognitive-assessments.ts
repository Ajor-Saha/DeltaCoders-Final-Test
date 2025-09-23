import { sql } from 'drizzle-orm';
import { decimal, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { quizzesTable } from './tbl-quizzes';

export const cognitiveAssessmentsTable = pgTable('cognitive_assessments', {
  assessmentId: text('assessment_id').notNull().primaryKey(),
  userId: text('user_id').notNull(),
  quizId: text('quiz_id')
    .notNull()
    .references(() => quizzesTable.quizId, { onDelete: 'cascade' }),
  weightedScore: decimal('weighted_score', { precision: 5, scale: 2 }).notNull(), // Weighted score based on difficulty
  stressScore: integer('stress_score').notNull(), // 0-100 scale
  attentionScore: integer('attention_score').notNull(), // 0-100 scale
  cognitiveScore: integer('cognitive_score').notNull(), // 0-100 scale
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
