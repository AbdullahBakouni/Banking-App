import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  userid: integer().notNull().unique().generatedAlwaysAsIdentity(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  dateofbirth: varchar({ length: 255 }).notNull(),
  postalcode: varchar({ length: 255 }).notNull(),
  ssn: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull().unique(),
  dwollaCustomerUrl: varchar({ length: 255 }),
  dwollaCustomerId: varchar({ length: 255 }),
});
export const banksTable = pgTable("banks", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),

  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  bankId: varchar("bank_id", { length: 255 }).notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  accessToken: varchar("access_token", { length: 255 }).notNull(),
  fundingSourceUrl: varchar("funding_source_url", { length: 500 }),
  shareableId: varchar("shareable_id", { length: 255 }),
});

export const transactionsTable = pgTable("transactions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),

  // relation to bank
  bankId: uuid("bank_id")
    .notNull()
    .references(() => banksTable.id, { onDelete: "cascade" }),

  // optional: if the transfer involves another bank
  senderBankId: uuid("sender_bank_id").references(() => banksTable.id),

  name: varchar("name", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  channel: varchar("channel", { length: 50 }), // ex: "online", "pos"
  category: varchar("category", { length: 100 }), // ex: "shopping", "utilities"

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
