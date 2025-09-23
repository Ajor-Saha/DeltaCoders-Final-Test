import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { shortQuestionExamsTable } from './tbl-short-question-exams';

export const shortQuestionsTable = pgTable('short_questions', {
  questionId: text('question_id').notNull().primaryKey(),
  examId: text('exam_id')
    .notNull()
    .references(() => shortQuestionExamsTable.examId, { onDelete: 'cascade' }),
  question: text('question').notNull(), // The short question text
  correctAnswer: text('correct_answer').notNull(), // Expected/correct answer
  userAnswer: text('user_answer'), // User's answer (initially null)
  userMarks: integer('user_marks').default(0), // Marks awarded to user (0-based)
  maxMarks: integer('max_marks').notNull(), // Maximum marks for this question
  evaluation: text('evaluation'), // General feedback for this question after exam completion
  isAnswered: integer('is_answered').default(0), // 0 = not answered, 1 = answered
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
