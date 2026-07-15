import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (id is the Firebase Auth UID)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  balance: doublePrecision('balance').default(0).notNull(),
  totalProfit: doublePrecision('total_profit').default(0).notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Investment Plans Table
export const investmentPlans = pgTable('investment_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: doublePrecision('amount').notNull(),
  returnAmount: doublePrecision('return_amount').notNull(),
  durationHours: integer('duration_hours').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'inactive'
});

// 3. Investments Table
export const investments = pgTable('investments', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: text('plan_id').references(() => investmentPlans.id, { onDelete: 'restrict' }).notNull(),
  amount: doublePrecision('amount').notNull(),
  expectedReturn: doublePrecision('expected_return').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'completed'
});

// 4. Agent Accounts Table
export const agentAccounts = pgTable('agent_accounts', {
  id: text('id').primaryKey(),
  agentName: text('agent_name').notNull(),
  agentNumber: text('agent_number').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Deposits Table
export const deposits = pgTable('deposits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: doublePrecision('amount').notNull(),
  transactionId: text('transaction_id').notNull(),
  screenshotUrl: text('screenshot_url').notNull(),
  agentAccountId: text('agent_account_id').references(() => agentAccounts.id, { onDelete: 'set null' }),
  agentAccountInfo: text('agent_account_info'),
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Withdrawals Table
export const withdrawals = pgTable('withdrawals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: doublePrecision('amount').notNull(),
  telebirrNumber: text('telebirr_number').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Transactions Table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'bonus'
  amount: doublePrecision('amount').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Announcements Table
export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  investments: many(investments),
  deposits: many(deposits),
  withdrawals: many(withdrawals),
  transactions: many(transactions),
}));

export const investmentPlansRelations = relations(investmentPlans, ({ many }) => ({
  investments: many(investments),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id],
  }),
  plan: one(investmentPlans, {
    fields: [investments.planId],
    references: [investmentPlans.id],
  }),
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  user: one(users, {
    fields: [deposits.userId],
    references: [users.id],
  }),
  agentAccount: one(agentAccounts, {
    fields: [deposits.agentAccountId],
    references: [agentAccounts.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
