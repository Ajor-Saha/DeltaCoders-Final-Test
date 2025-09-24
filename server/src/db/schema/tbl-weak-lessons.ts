import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';
import { userTable } from './tbl-user';

export const weakLessonsTable = pgTable('weak_lessons', {
  weakLessonId: text('weak_lesson_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
  lessonContent: text('lesson_content').notNull(), // AI generated lesson content
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
