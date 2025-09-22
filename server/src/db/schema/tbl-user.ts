import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";


export const userTable = pgTable("tbl_user", {
  userId: text("user_id").notNull().primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  verifyCode: text("verify_code"),
  verifyCodeExpiry: timestamp("verify_code_expiry"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`current_timestamp`).$onUpdate(() => new Date()),
});

