import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, unique, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - unified shop owners
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  shopName: text("shop_name").notNull(),
  logo: text("logo"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiry: timestamp("reset_password_expiry"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  selectedProducts: text("selected_products").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty Cards feature tables
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  customerQrCode: text("customer_qr_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loyaltyCards = pgTable("loyalty_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  stamps: integer("stamps").notNull().default(0),
  maxStamps: integer("max_stamps").notNull().default(10),
  rewardText: varchar("reward_text", { length: 100 }).default("Free Coffee"),
  isRedeemable: boolean("is_redeemable").notNull().default(false),
  totalRewards: integer("total_rewards").notNull().default(0),
  lastStampAt: timestamp("last_stamp_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserCustomer: unique().on(table.userId, table.customerId),
}));

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loyaltyCardId: varchar("loyalty_card_id").notNull().references(() => loyaltyCards.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull().$type<'stamp' | 'reward'>(),
  amount: integer("amount").default(1),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spin Wheel feature tables
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  winChance: real("win_chance").notNull(),
  isActive: boolean("is_active").default(true),
  timesWon: integer("times_won").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const spinTokens = pgTable("spin_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  customerName: text("customer_name"),
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const spins = pgTable("spins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").references(() => spinTokens.id, { onDelete: "cascade" }),
  rewardId: varchar("reward_id").references(() => rewards.id),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  prizeWon: text("prize_won"),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).$type<'customer' | 'token'>(),
  spunAt: timestamp("spun_at").defaultNow(),
});

// Admin tables
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminSecurity = pgTable("admin_security", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }).unique(),
  consecutiveFailures: integer("consecutive_failures").default(0),
  lockedUntil: timestamp("locked_until"),
  lastFailureIp: text("last_failure_ip"),
  lastFailureAt: timestamp("last_failure_at"),
});

// Sessions
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyCardSchema = createInsertSchema(loyaltyCards).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  userId: true,
  timesWon: true,
  createdAt: true,
});

export const insertSpinTokenSchema = createInsertSchema(spinTokens).omit({
  id: true,
  userId: true,
  isUsed: true,
  usedAt: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type LoyaltyCard = typeof loyaltyCards.$inferSelect;
export type InsertLoyaltyCard = z.infer<typeof insertLoyaltyCardSchema>;

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type SpinToken = typeof spinTokens.$inferSelect;
export type InsertSpinToken = z.infer<typeof insertSpinTokenSchema>;

export type Spin = typeof spins.$inferSelect;

// Validation schemas
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  shopName: z.string().min(1, "Shop name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createRewardSchema = insertRewardSchema.extend({
  winChance: z.number().min(0).max(100),
});

export const createTokenSchema = z.object({
  customerName: z.string().optional(),
  expiryMinutes: z.number().min(1).max(1440).default(30),
});

// Admin schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSecuritySchema = createInsertSchema(adminSecurity).omit({
  id: true,
});

// Admin types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminSecurity = typeof adminSecurity.$inferSelect;
export type InsertAdminSecurity = z.infer<typeof insertAdminSecuritySchema>;

// Admin validation schemas
export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  shopName: z.string().min(1, "Shop name is required"),
  selectedProducts: z.array(z.enum(['loyalty', 'spin'])).default(['loyalty', 'spin']),
});
