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
  menuBannerImage: text("menu_banner_image"),
  cardBackgroundColor: text("card_background_color").default("#4285F4"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiry: timestamp("reset_password_expiry"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  selectedProducts: text("selected_products").array().default(sql`ARRAY[]::text[]`),
  shiftAccessPin: text("shift_access_pin"),
  customPrice: integer("custom_price"),
  chargeFree: boolean("charge_free").default(false),
  additionalStores: integer("additional_stores").default(0),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stores table - one user can have multiple stores
export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  shopName: text("shop_name").notNull().unique(),
  displayName: text("display_name").notNull(),
  logo: text("logo"),
  menuBannerImage: text("menu_banner_image"),
  cardBackgroundColor: text("card_background_color").default("#4285F4"),
  shiftAccessPin: text("shift_access_pin"),
  selectedProducts: text("selected_products").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subusers table - team members with limited permissions
export const subusers = pgTable("subusers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`),
  storeIds: text("store_ids").array(), // null = access to all stores; array = restricted to listed stores
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty Cards feature tables
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  customerQrCode: text("customer_qr_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loyaltyCards = pgTable("loyalty_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
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
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull().$type<'stamp' | 'reward'>(),
  amount: integer("amount").default(1),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spin Wheel feature tables
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
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
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
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
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
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
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiry: timestamp("reset_password_expiry"),
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

// Messages table - notification history
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  header: text("header"),
  body: text("body").notNull(),
  displayStartTime: timestamp("display_start_time").notNull(),
  displayEndTime: timestamp("display_end_time").notNull(),
  messageType: text("message_type").default("TEXT_AND_NOTIFY").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  recipientCount: integer("recipient_count").default(0),
});

// Menu Builder feature tables
export const menuCategories = pgTable("menu_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => menuCategories.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // euro cents (e.g. €9.99 -> 999)
  imageUrl: text("image_url"),
  imageStorageKey: text("image_storage_key"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shift Manager feature tables
export const crewMembers = pgTable("crew_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  employeeName: text("employee_name").notNull(),
  employeeRole: text("employee_role"),
  shiftDate: text("shift_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeframePresets = pgTable("timeframe_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  chargeFree: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertSubuserSchema = createInsertSchema(subusers).omit({
  id: true,
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
  storeId: true,
  timesWon: true,
  createdAt: true,
});

export const insertSpinTokenSchema = createInsertSchema(spinTokens).omit({
  id: true,
  userId: true,
  storeId: true,
  isUsed: true,
  usedAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({
  id: true,
  userId: true,
  storeId: true,
  createdAt: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems, {
  price: z.number().int().min(0), // price is euro cents, never a float
}).omit({
  id: true,
  userId: true,
  storeId: true,
  createdAt: true,
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).omit({
  id: true,
  userId: true,
  storeId: true,
  createdAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  userId: true,
  storeId: true,
  createdAt: true,
});

export const insertTimeframePresetSchema = createInsertSchema(timeframePresets).omit({
  id: true,
  userId: true,
  storeId: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Subuser = typeof subusers.$inferSelect;
export type InsertSubuser = z.infer<typeof insertSubuserSchema>;

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

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type TimeframePreset = typeof timeframePresets.$inferSelect;
export type InsertTimeframePreset = z.infer<typeof insertTimeframePresetSchema>;

// Apple Wallet PassKit device registrations
export const appleWalletDevices = pgTable('apple_wallet_devices', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  deviceLibraryIdentifier: text('device_library_identifier').notNull(),
  pushToken: text('push_token').notNull(),
  serialNumber: text('serial_number').notNull(),
  passTypeIdentifier: text('pass_type_identifier').notNull(),
  customerId: varchar('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  storeId: varchar('store_id').references(() => stores.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniq: unique().on(table.deviceLibraryIdentifier, table.serialNumber, table.passTypeIdentifier),
}));

export type AppleWalletDevice = typeof appleWalletDevices.$inferSelect;

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

export const createStoreSchema = z.object({
  shopName: z.string().min(1, "Shop URL slug is required").max(60).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  displayName: z.string().min(1, "Display name is required").max(100),
  cardBackgroundColor: z.string().optional(),
  shiftAccessPin: z.string().optional(),
  selectedProducts: z.array(z.enum(["loyalty", "spin", "menu", "shift"])).optional(),
});

// NOTE: `selectedProducts` IS updatable here, but product changes must always
// run through the owner store PATCH route so it can recompute the billing mirror
// via syncBillingFromStores when the PRIMARY store's products change. The route
// — not this schema — owns that billing-sync logic; never write
// stores.selectedProducts on the primary store without calling
// syncBillingFromStores afterwards or it will drift from users.selectedProducts.
export const updateStoreSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  logo: z.string().optional().nullable(),
  menuBannerImage: z.string().optional().nullable(),
  cardBackgroundColor: z.string().optional(),
  shiftAccessPin: z.string().optional().nullable(),
  selectedProducts: z.array(z.enum(["loyalty", "spin", "menu", "shift"])).min(1, "Select at least one product").optional(),
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
  selectedProducts: z.array(z.enum(['loyalty', 'spin', 'menu', 'shift'])).default(['loyalty', 'spin']),
});
