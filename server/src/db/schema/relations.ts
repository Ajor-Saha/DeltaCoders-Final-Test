// import { relations } from 'drizzle-orm';
// import { lessonsTable } from './tbl-lessons';
// import { questionsTable } from './tbl-questions';
// import { quizzesTable } from './tbl-quizzes';
// import { remedialContentsTable } from './tbl-remedial-contents';
// import { subjectExternalResourcesTable } from './tbl-subject-external-resources';
// import { subjectPracticeQuestionsTable } from './tbl-subject-practice-questions';
// import { subjectsTable } from './tbl-subjects';
// import { topicsTable } from './tbl-topics';
// import { userTable } from './tbl-user';
// import { userQuizProgressTable } from './tbl-user-quiz-progress';

// // User Relations - One User has Many User Quiz Progress and Many Remedial Contents
// export const userRelations = relations(userTable, ({ many }) => ({
//   userQuizProgress: many(userQuizProgressTable),
//   remedialContents: many(remedialContentsTable),
// }));

// // Subjects Relations - One Subject has Many Topics, Practice Questions, and External Resources
// export const subjectsRelations = relations(subjectsTable, ({ many }) => ({
//   topics: many(topicsTable),
//   quiz: many(quizzesTable),
//   practiceQuestions: many(subjectPracticeQuestionsTable),
//   externalResources: many(subjectExternalResourcesTable),
// }));

// // Topics Relations - One Topic belongs to One Subject, One Topic has Many Lessons
// export const topicsRelations = relations(topicsTable, ({ one, many }) => ({
//   subject: one(subjectsTable, {
//     fields: [topicsTable.subjectId],
//     references: [subjectsTable.subjectId],
//   }),
//   lessons: many(lessonsTable),
// }));

// // Lessons Relations - One Lesson belongs to One Topic, One Lesson has Many Quizzes
// export const lessonsRelations = relations(lessonsTable, ({ one, many }) => ({
//   topic: one(topicsTable, {
//     fields: [lessonsTable.topicId],
//     references: [topicsTable.topicId],
//   }),
// }));

// // Quizzes Relations - One Quiz belongs to One Lesson, One Quiz has Many Questions and Many User Progress
// export const quizzesRelations = relations(quizzesTable, ({ one, many }) => ({
//   topics: one(topicsTable, {
//     fields: [quizzesTable.topicId],
//     references: [topicsTable.topicId],
//   }),
//   subject: one(subjectsTable, {
//     fields: [quizzesTable.subjectId],
//     references: [subjectsTable.subjectId],
//   }),
//   questions: many(questionsTable),
//   userProgress: many(userQuizProgressTable),
// }));

// // Questions Relations - One Question belongs to One Quiz, One Question has Many Remedial Questions
// export const questionsRelations = relations(questionsTable, ({ one }) => ({
//   quiz: one(quizzesTable, {
//     fields: [questionsTable.quizId],
//     references: [quizzesTable.quizId],
//   }),
// }));

// // User Quiz Progress Relations - User Quiz Progress belongs to One User and One Quiz
// export const userQuizProgressRelations = relations(
//   userQuizProgressTable,
//   ({ one }) => ({
//     user: one(userTable, {
//       fields: [userQuizProgressTable.userId],
//       references: [userTable.userId],
//     }),
//     quiz: one(quizzesTable, {
//       fields: [userQuizProgressTable.quizId],
//       references: [quizzesTable.quizId],
//     }),
//   })
// );

// // Remedial Contents Relations - One Remedial Content belongs to One User and One Remedial Question
// export const remedialContentsRelations = relations(
//   remedialContentsTable,
//   ({ one }) => ({
//     user: one(userTable, {
//       fields: [remedialContentsTable.userId],
//       references: [userTable.userId],
//     }),
//   })
// );

// // Subject Practice Questions Relations - One Practice Question belongs to One Subject
// export const subjectPracticeQuestionsRelations = relations(
//   subjectPracticeQuestionsTable,
//   ({ one }) => ({
//     subject: one(subjectsTable, {
//       fields: [subjectPracticeQuestionsTable.subjectId],
//       references: [subjectsTable.subjectId],
//     }),
//   })
// );

// // Subject External Resources Relations - One External Resource belongs to One Subject
// export const subjectExternalResourcesRelations = relations(
//   subjectExternalResourcesTable,
//   ({ one }) => ({
//     subject: one(subjectsTable, {
//       fields: [subjectExternalResourcesTable.subjectId],
//       references: [subjectsTable.subjectId],
//     }),
//   })
// );
