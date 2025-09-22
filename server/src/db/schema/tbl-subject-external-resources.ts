import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { subjectsTable } from './tbl-subjects';

// Enum for resource types
export const resourceTypeEnum = pgEnum('resource_type', [
  'article',
  'video',
  'course',
]);

// Enum for resource difficulty
export const resourceDifficultyEnum = pgEnum('resource_difficulty', [
  'beginner',
  'intermediate',
  'advanced',
  'all_levels',
]);

export const subjectExternalResourcesTable = pgTable(
  'subject_external_resources',
  {
    resourceId: serial('resource_id').primaryKey(),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjectsTable.subjectId, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    resourceUrl: text('resource_url').notNull(),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    difficulty: resourceDifficultyEnum('difficulty').default('all_levels'),
  }
);
