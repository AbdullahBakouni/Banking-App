import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  dateofbirth: varchar({ length: 255 }).notNull(),
  ssn: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull().unique(),
});
