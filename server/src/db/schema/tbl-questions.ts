import {
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { quizzesTable } from './tbl-quizzes';

// Enum for question type
export const questionTypeEnum = pgEnum('question_type', [
  'mcq',
  'short_answer',
  'flash_card',
  'true_false',
]);

export const questionsTable = pgTable('questions', {
  questionId: serial('question_id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzesTable.quizId, {
    onDelete: 'cascade',
  }),
  questionText: text('question_text').notNull(),
  questionType: questionTypeEnum('question_type').default('mcq'),
  options: json('options'), // Store options as JSON for MCQ, flash cards, etc.
  correctAnswer: text('correct_answer').notNull(), // For direct answers or correct option reference
  explanation: text('explanation'), // Optional explanation
  points: integer('points').default(1),
});
