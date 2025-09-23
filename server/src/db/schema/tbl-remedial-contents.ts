// import {
//   integer,
//   pgEnum,
//   pgTable,
//   serial,
//   text,
//   timestamp,
// } from 'drizzle-orm/pg-core';
// import { subjectsTable } from './tbl-subjects';
// import { userTable } from './tbl-user';

// // Enum for content type
// export const contentTypeEnum = pgEnum('content_type', [
//   'video',
//   'article',
//   'exercise',
// ]);

// export const remedialContentsTable = pgTable('remedial_contents', {
//   contentId: serial('content_id').primaryKey(),
//   userId: text('user_id')
//     .notNull()
//     .references(() => userTable.userId, { onDelete: 'cascade' }),
//   subjectId: integer('subject_id')
//     .notNull()
//     .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
//   weaknessTopic: text('weakness_topic').notNull(), // topic of weakness
//   content: text('content').notNull(), //generated remedial content
//   createdAt: timestamp('created_at').defaultNow(),
// });
