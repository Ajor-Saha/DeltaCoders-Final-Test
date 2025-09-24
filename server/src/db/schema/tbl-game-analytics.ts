import { sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { userTable } from './tbl-user';

export const gameAnalyticsTable = pgTable('tbl_game_analytics', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  gameName: varchar('game_name', { length: 50 }).notNull(), // 'bug-smash', 'color-match', 'maze-escape'
  duration: integer('duration').notNull(), // seconds played
  score: integer('score').notNull(), // final score
  totalActions: integer('total_actions').notNull(), // total clicks/moves
  errors: integer('errors').notNull(), // mistakes made
  cognitiveLoad: integer('cognitive_load').notNull(), // 0-100 scale
  focus: integer('focus').notNull(), // 0-100 scale
  attention: integer('attention').notNull(), // 0-100 scale
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

export type GameAnalytics = typeof gameAnalyticsTable.$inferSelect;
export type NewGameAnalytics = typeof gameAnalyticsTable.$inferInsert;
