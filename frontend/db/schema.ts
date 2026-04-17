import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  prompt: text('prompt').notNull(),
  plan: jsonb('plan'), 
  result: jsonb('result'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const executionLogs = pgTable('execution_logs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id).notNull(),
  text: text('text').notNull(),
  status: text('status').notNull(),
  time: text('time').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
