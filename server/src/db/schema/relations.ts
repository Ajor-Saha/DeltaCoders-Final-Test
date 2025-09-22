import { relations } from 'drizzle-orm';
import { lessonsTable } from './tbl-lessons';
import { questionsTable } from './tbl-questions';
import { quizzesTable } from './tbl-quizzes';
import { remedialContentsTable } from './tbl-remedial-contents';
import { remedialQuestionsTable } from './tbl-remedial-questions';
import { subjectsTable } from './tbl-subjects';
import { topicsTable } from './tbl-topics';
import { userTable } from './tbl-user';
import { userQuizProgressTable } from './tbl-user-quiz-progress';

// User Relations - One User has Many User Quiz Progress and Many Remedial Contents
export const userRelations = relations(userTable, ({ many }) => ({
  userQuizProgress: many(userQuizProgressTable),
  remedialContents: many(remedialContentsTable),
}));

// Subjects Relations - One Subject has Many Topics
export const subjectsRelations = relations(subjectsTable, ({ many }) => ({
  topics: many(topicsTable),
}));

// Topics Relations - One Topic belongs to One Subject, One Topic has Many Lessons
export const topicsRelations = relations(topicsTable, ({ one, many }) => ({
  subject: one(subjectsTable, {
    fields: [topicsTable.subjectId],
    references: [subjectsTable.subjectId],
  }),
  lessons: many(lessonsTable),
}));

// Lessons Relations - One Lesson belongs to One Topic, One Lesson has Many Quizzes
export const lessonsRelations = relations(lessonsTable, ({ one, many }) => ({
  topic: one(topicsTable, {
    fields: [lessonsTable.topicId],
    references: [topicsTable.topicId],
  }),
  quizzes: many(quizzesTable),
}));

// Quizzes Relations - One Quiz belongs to One Lesson, One Quiz has Many Questions and Many User Progress
export const quizzesRelations = relations(quizzesTable, ({ one, many }) => ({
  lesson: one(lessonsTable, {
    fields: [quizzesTable.lessonId],
    references: [lessonsTable.lessonId],
  }),
  questions: many(questionsTable),
  userProgress: many(userQuizProgressTable),
}));

// Questions Relations - One Question belongs to One Quiz, One Question has Many Remedial Questions
export const questionsRelations = relations(
  questionsTable,
  ({ one, many }) => ({
    quiz: one(quizzesTable, {
      fields: [questionsTable.quizId],
      references: [quizzesTable.quizId],
    }),
    remedialQuestions: many(remedialQuestionsTable),
  })
);

// User Quiz Progress Relations - User Quiz Progress belongs to One User and One Quiz
export const userQuizProgressRelations = relations(
  userQuizProgressTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [userQuizProgressTable.userId],
      references: [userTable.userId],
    }),
    quiz: one(quizzesTable, {
      fields: [userQuizProgressTable.quizId],
      references: [quizzesTable.quizId],
    }),
  })
);

// Remedial Questions Relations - One Remedial Question belongs to One Question, One Remedial Question has Many Remedial Contents
export const remedialQuestionsRelations = relations(
  remedialQuestionsTable,
  ({ one, many }) => ({
    question: one(questionsTable, {
      fields: [remedialQuestionsTable.questionId],
      references: [questionsTable.questionId],
    }),
    remedialContents: many(remedialContentsTable),
  })
);

// Remedial Contents Relations - One Remedial Content belongs to One User and One Remedial Question
export const remedialContentsRelations = relations(
  remedialContentsTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [remedialContentsTable.userId],
      references: [userTable.userId],
    }),
    remedialQuestion: one(remedialQuestionsTable, {
      fields: [remedialContentsTable.remedialQuestionId],
      references: [remedialQuestionsTable.remedialQuestionId],
    }),
  })
);
