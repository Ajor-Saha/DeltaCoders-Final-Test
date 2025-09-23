import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';

export const externalResourcesTable = pgTable('external_resources', {
  resourceId: text('resource_id').notNull().primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
  topicName: varchar('topic_name', { length: 255 }).notNull(),
  description: text('description'),
  resourceTitle: varchar('resource_title', { length: 500 }).notNull(),
  url: text('url').notNull(),
  type: varchar('type', { length: 255 }),
  source: varchar('source', { length: 255 }), // e.g., "YouTube", "Khan Academy", etc.
  difficulty: varchar('difficulty', { length: 50 }), // e.g., "beginner", "intermediate", "advanced"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
