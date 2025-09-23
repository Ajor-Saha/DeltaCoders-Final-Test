import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { quizzesTable } from './tbl-quizzes';

export const quizQuestionsTable = pgTable('quiz_questions', {
  questionId: text('question_id').notNull().primaryKey(),
  quizId: text('quiz_id')
    .notNull()
    .references(() => quizzesTable.quizId, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(), // e.g., "C) 3(4x)^2"
  optionD: text('option_d').notNull(),
  correctAnswer: text('correct_answer').notNull(), // e.g., "B) 12x(2x^2 + 3)^2"
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // "easy", "medium", "hard"
  userChoice: text('user_choice'), // Initially null, filled when user answers with full option text
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
