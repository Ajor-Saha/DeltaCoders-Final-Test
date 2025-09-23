import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';
import { userTable } from './tbl-user';

export const LevelEnum = pgEnum('user_level', [
  'beginner',
  'intermediate',
  'advanced',
]);

export const userSubjectsTable = pgTable('user_subjects', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
  level: LevelEnum('level').default('beginner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

// Define relations
// export const userSubjectsRelations = relations(
//   userSubjectsTable,
//   ({ one }) => ({
//     user: one(userTable, {
//       fields: [userSubjectsTable.userId],
//       references: [userTable.userId],
//     }),
//     subject: one(subjectsTable, {
//       fields: [userSubjectsTable.subjectId],
//       references: [subjectsTable.subjectId],
//     }),
//   })
// );

// // Add relations to existing tables
// export const userRelations = relations(userTable, ({ many }) => ({
//   userSubjects: many(userSubjectsTable),
// }));

// export const subjectsRelations = relations(subjectsTable, ({ many }) => ({
//   userSubjects: many(userSubjectsTable),
// }));
