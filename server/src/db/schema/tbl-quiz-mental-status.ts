import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { quizzesTable } from './tbl-quizzes';
import { userTable } from './tbl-user';

export const quizMentalStatusTable = pgTable('tbl_quiz_mental_status', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  quizId: text('quiz_id')
    .notNull()
    .references(() => quizzesTable.quizId, { onDelete: 'cascade' }),
  weightedScore: integer('weighted_score').notNull().default(0),
  attentionScore: integer('attention_score').notNull().default(0),
  stressScore: integer('stress_score').notNull().default(0),
  cognitiveLoadScore: integer('cognitive_load_score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
