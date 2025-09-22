import { integer, pgEnum, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';
import { topicsTable } from './tbl-topics';

// Enum for difficulty level
export const difficultyLevelEnum = pgEnum('difficulty_level', [
  'easy',
  'medium',
  'hard',
]);

export const quizScopeEnum = pgEnum('quiz_scope', ['topic', 'subject']);

export const quizzesTable = pgTable('quizzes', {
  quizId: serial('quiz_id').primaryKey(),
  scope: quizScopeEnum('scope').default('topic'),
  topicId: integer('topic_id').references(() => topicsTable.topicId, {
    onDelete: 'cascade',
  }),
  subjectId: integer('subject_id').references(() => subjectsTable.subjectId, {
    onDelete: 'cascade',
  }),
  quizTitle: varchar('quiz_title', { length: 100 }).notNull(),
  difficultyLevel: difficultyLevelEnum('difficulty_level').default('medium'),
  maxAttempts: integer('max_attempts').default(3),
});
