import { integer, pgEnum, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { lessonsTable } from './tbl-lessons';

// Enum for difficulty level
export const difficultyLevelEnum = pgEnum('difficulty_level', [
  'easy',
  'medium',
  'hard',
]);

export const quizzesTable = pgTable('quizzes', {
  quizId: serial('quiz_id').primaryKey(),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessonsTable.lessonId, { onDelete: 'cascade' }),
  quizTitle: varchar('quiz_title', { length: 100 }).notNull(),
  difficultyLevel: difficultyLevelEnum('difficulty_level').default('medium'),
  maxAttempts: integer('max_attempts').default(3),
});
