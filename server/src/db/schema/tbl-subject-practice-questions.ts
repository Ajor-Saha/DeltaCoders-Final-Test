// import {
//   integer,
//   pgEnum,
//   pgTable,
//   serial,
//   text,
//   timestamp,
// } from 'drizzle-orm/pg-core';
// import { subjectsTable } from './tbl-subjects';

// // Enum for practice question types - focused on practice/learning
// export const practiceQuestionTypeEnum = pgEnum('practice_question_type', [
//   'short_answer',
//   'mcq',
// ]);

// // Enum for difficulty level for practice questions
// export const practiceQuestionDifficultyEnum = pgEnum(
//   'practice_question_difficulty',
//   ['beginner', 'intermediate', 'advanced']
// );

// export const subjectPracticeQuestionsTable = pgTable(
//   'subject_practice_questions',
//   {
//     practiceQuestionId: serial('practice_question_id').primaryKey(),
//     subjectId: integer('subject_id')
//       .notNull()
//       .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
//     questionText: text('question_text').notNull(),
//     questionType:
//       practiceQuestionTypeEnum('question_type').default('short_answer'),
//     difficulty:
//       practiceQuestionDifficultyEnum('difficulty').default('beginner'),
//     sampleAnswer: text('sample_answer'), // Example answer for short answer questions
//     createdAt: timestamp('created_at').defaultNow(),
//   }
// );
