import {
  decimal,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { quizzesTable } from './tbl-quizzes';
import { userTable } from './tbl-user';

export const userQuizProgressTable = pgTable(
  'user_quiz_progress',
  {
    progressId: serial('progress_id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.userId, { onDelete: 'cascade' }),
    quizId: integer('quiz_id')
      .notNull()
      .references(() => quizzesTable.quizId, { onDelete: 'cascade' }),
    score: decimal('score', { precision: 5, scale: 2 }).default('0'),
    attempts: integer('attempts').default(0),
    completedAt: timestamp('completed_at'),
  },
  table => {
    return {
      uniqueUserQuiz: uniqueIndex('unique_user_quiz').on(
        table.userId,
        table.quizId
      ),
    };
  }
);
