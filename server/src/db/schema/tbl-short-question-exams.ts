import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';
import { userTable } from './tbl-user';

export const shortQuestionExamsTable = pgTable('short_question_exams', {
  examId: text('exam_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjectsTable.subjectId, {
    onDelete: 'cascade',
  }),
  totalQuestions: integer('total_questions').notNull(), // Number of questions in this exam
  totalMarks: integer('total_marks').notNull(), // Total possible marks
  userScore: integer('user_score').default(0), // User's total score (initially 0)
  isCompleted: integer('is_completed').default(0), // 0 = in progress, 1 = completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // When exam was completed
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
