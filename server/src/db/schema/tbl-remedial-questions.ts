import { integer, pgEnum, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { questionsTable } from './tbl-questions';

// Enum for remedial difficulty level (easy and medium only)
export const remedialDifficultyLevelEnum = pgEnum('remedial_difficulty_level', [
  'easy',
  'medium',
]);

export const remedialQuestionsTable = pgTable('remedial_questions', {
  remedialQuestionId: serial('remedial_question_id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => questionsTable.questionId, { onDelete: 'cascade' }),
  weakConcept: varchar('weak_concept', { length: 100 }).notNull(),
  difficultyLevel:
    remedialDifficultyLevelEnum('difficulty_level').default('easy'),
});
