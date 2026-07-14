import type { Express, Request, Response } from "express";
import { db } from "./db";
import { seedDemoAccount, reseedDemoAccount } from "./demoSeed";
import { 
  users, 
  customers, 
  loyaltyCards, 
  loyaltyTransactions,
  rewards,
  spinTokens,
  spins,
  adminUsers,
  adminSecurity,
  messages,
  menuCategories,
  menuItems,
  crewMembers,
  shifts,
  timeframePresets,
  subusers,
  signupSchema,
  loginSchema,
  createRewardSchema,
  createTokenSchema,
  adminLoginSchema,
  adminCreateUserSchema,
  insertMessageSchema,
  insertMenuCategorySchema,
  insertMenuItemSchema,
  insertCrewMemberSchema,
  insertShiftSchema,
  insertTimeframePresetSchema,
  insertSubuserSchema,
  appleWalletDevices,
  stores,
  createStoreSchema,
  updateStoreSchema,
  loyaltySettingsSchema,
} from "@shared/schema";
import { eq, and, desc, asc, gt, gte, lt, lte, sql } from "drizzle-orm";
import { hashPassword, generateToken, comparePasswords } from "./auth";
import passport from "passport";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import QRCode from "qrcode";
import crypto from "crypto";
import { GoogleWalletService, LoyaltyClassNotFoundError, type LoyaltyPassData } from "./googleWallet";
import { AppleWalletService, isAppleWalletConfigured, generatePassAuthToken, notifyAppleWalletDevices, notifyAppleWalletDevicesForStore, type AppleLoyaltyPassData } from "./appleWallet";
import { renderStampStrip, loadBannerBuffer } from "./walletStrip";
import { validateGoogleBackgroundColor } from "./googleWallet";
import { sendVerificationEmail, sendPasswordResetEmail, sendSubuserInvitationEmail } from "./email";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { requirePermission, ownerOnly } from "./permissions";
import { calculateProductPrice, getProductDescription, syncBillingFromStores as syncBillingFromStoresImpl, reconcileBilling, applyStoreUpdate, applyCustomPrice, applyStatusChange, cancelStripeSubscription, hasAccessGrantingSubscription } from "./billing";
import { startReconciliationService } from "./reconcile";
import { registerSupportRoutes, startSupportSweepService } from "./support";

// Use test keys in development, production keys in production
const stripeSecretKey = process.env.NODE_ENV === 'development' 
  ? process.env.TESTING_STRIPE_SECRET_KEY!
  : process.env.STRIPE_SECRET_KEY!;

// Debug: Log which Stripe mode we're using
const stripeMode = stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 
                   stripeSecretKey?.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN';
console.log(`[Stripe] Using ${stripeMode} mode (NODE_ENV: ${process.env.NODE_ENV})`);

if (process.env.NODE_ENV === 'development' && stripeMode === 'LIVE') {
  console.error('[Stripe] WARNING: Using LIVE key in development! Check TESTING_STRIPE_SECRET_KEY environment variable.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
});

// Billing math (calculateProductPrice, getProductDescription) and the
// store-driven subscription recompute live in ./billing so they can be unit
// tested in isolation with a Stripe spy. This thin wrapper injects the real,
// module-level Stripe client so existing call sites keep their signature.
function syncBillingFromStores(
  userId: string,
  opts: { syncStripe?: boolean; prorationBehavior?: 'create_prorations' | 'none' } = {},
): Promise<typeof users.$inferSelect> {
  return syncBillingFromStoresImpl(stripe, userId, opts);
}

let googleWalletService: GoogleWalletService | null = null;
try {
  googleWalletService = new GoogleWalletService();
} catch (error) {
  console.warn('Google Wallet service not initialized:', error);
}

// Later of two nullable dates (null when both are null). Used to compute a pass's
// effective "last updated" time from stamp activity and branding changes.
function maxDate(a: Date | null | undefined, b: Date | null | undefined): Date | null {
  if (a && b) return a > b ? a : b;
  return a ?? b ?? null;
}

// The Google Wallet loyalty class is per-store. Reward text is configured at the
// store level (stores.rewardText) when the merchant saves loyalty settings, and
// falls back to the most common non-empty rewardText across the store's cards
// (e.g. legacy stores that never saved settings) so the class copy always
// reflects what merchants actually configured.
async function deriveStoreRewardText(storeId: string): Promise<string | undefined> {
  const [store] = await db
    .select({ rewardText: stores.rewardText })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  if (store?.rewardText && store.rewardText.trim() !== "") {
    return store.rewardText;
  }

  const rows = await db
    .select({
      rewardText: loyaltyCards.rewardText,
      count: sql<number>`count(*)`,
    })
    .from(loyaltyCards)
    .where(
      and(
        eq(loyaltyCards.storeId, storeId),
        sql`${loyaltyCards.rewardText} IS NOT NULL AND ${loyaltyCards.rewardText} <> ''`,
      ),
    )
    .groupBy(loyaltyCards.rewardText)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  return rows[0]?.rewardText ?? undefined;
}

// Fire-and-forget: after a store's branding is saved, propagate it to both
// wallets. Patches the existing Google loyalty class (no-op if no pass saved)
// and pushes every Apple device for the store. Never blocks or fails the caller.
function propagateStoreBranding(storeId: string): void {
  db.select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1)
    .then(async ([store]) => {
      if (!store) return;
      if (googleWalletService) {
        const rewardText = await deriveStoreRewardText(storeId);
        googleWalletService
          .updateClassBranding(
            storeId,
            store.shopName,
            store.logo,
            store.cardBackgroundColor,
            rewardText,
            store.displayName,
          )
          .catch((err) => console.error('[Google Wallet] Branding patch failed (non-blocking):', err));
      }
      notifyAppleWalletDevicesForStore(storeId);
    })
    .catch((err) => console.error('[Wallet] Branding propagation lookup failed (non-blocking):', err));
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

function requireEmailVerification(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user!.emailVerified) {
    return next();
  }
  res.status(403).json({ error: "Email verification required" });
}

function requireSubscription(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user!.emailVerified) {
    return res.status(403).json({ error: "Authentication required" });
  }

  const isChargeFree = req.user!.chargeFree === true;
  const hasActiveSubscription = hasAccessGrantingSubscription(req.user!.subscriptionStatus);
  const hasActiveTrial = req.user!.trialEndsAt && new Date(req.user!.trialEndsAt) > new Date();

  if (isChargeFree || hasActiveSubscription || hasActiveTrial) {
    return next();
  }

  res.status(403).json({ error: "Active subscription or trial required" });
}

async function resolveActiveStore(req: Request, res: Response, next: Function) {
  if (req.storeId) return next();
  try {
    const isSubuser = req.session?.isSubuser === true;
    // storeIds null means access to all stores; an array restricts access
    const subuserStoreIds: string[] | null = req.session?.subuserStoreIds ?? null;

    const storeIdHeader = req.headers['x-store-id'] as string | undefined;
    if (storeIdHeader) {
      const [store] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.id, storeIdHeader), eq(stores.userId, req.user!.id)))
        .limit(1);
      if (store) {
        // For subusers with restricted store access, validate the store is in their list
        if (isSubuser && subuserStoreIds !== null && !subuserStoreIds.includes(store.id)) {
          return res.status(403).json({ error: "You do not have access to this store" });
        }
        req.storeId = store.id;
        return next();
      }
      return res.status(403).json({ error: "Store not found or access denied" });
    }
    // For subusers with restricted access, only pick from their allowed stores
    const baseCondition = eq(stores.userId, req.user!.id);
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(baseCondition)
      .orderBy(asc(stores.createdAt))
      .limit(1);
    // Pick the first allowed store for subusers (filter client-side since we already fetched)
    let resolvedStoreId: string | undefined;
    if (isSubuser && subuserStoreIds !== null) {
      if (store && subuserStoreIds.includes(store.id)) {
        resolvedStoreId = store.id;
      } else {
        // Fetch all stores and find first accessible one
        const allStores = await db
          .select({ id: stores.id })
          .from(stores)
          .where(baseCondition)
          .orderBy(asc(stores.createdAt));
        const accessible = allStores.find(s => subuserStoreIds.includes(s.id));
        resolvedStoreId = accessible?.id;
      }
    } else {
      resolvedStoreId = store?.id;
    }

    if (resolvedStoreId) {
      req.storeId = resolvedStoreId;
    } else if (!isSubuser) {
      // Auto-provision a default store for owners who went through without one
      // (handles migration edge cases and new-account flows)
      const user = req.user as any;
      const [newStore] = await db.insert(stores).values({
        userId: user.id,
        shopName: user.shopName || `store-${user.id.slice(0, 8)}`,
        displayName: user.shopName || 'My Store',
        selectedProducts: user.selectedProducts || [],
      }).returning();
      req.storeId = newStore.id;
      console.log(`[resolveActiveStore] Auto-provisioned store ${newStore.id} for user ${user.id}`);
    } else {
      // Subuser has no accessible stores — let the request proceed without a storeId;
      // individual routes will fail gracefully when they require one.
      console.warn(`[resolveActiveStore] Subuser ${req.session.subuserId} has no accessible stores`);
    }
  } catch (err) {
    console.error('[resolveActiveStore] DB error resolving store:', err);
    return res.status(500).json({ error: "Failed to resolve active store" });
  }
  next();
}

// Rate limiter for signup endpoint - prevents spam registrations
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 signup requests per windowMs
  message: { error: "Too many signup attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful signups (only count failed attempts)
  skipSuccessfulRequests: true,
});

// Rate limiter for login endpoint - throttles credential-stuffing / brute-force
// password guessing. Successful logins are not counted, so a legitimate merchant
// logging in normally is never blocked; only repeated failed attempts add up.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 failed login attempts per windowMs
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Only count failed logins toward the limit.
  skipSuccessfulRequests: true,
});

// Rate limiter for PIN validation endpoint - prevents brute-force attacks
const pinValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 PIN attempts per window
  message: { error: "Too many PIN attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts
});

// Admin authentication middleware
function requireAdminAuth(req: Request, res: Response, next: Function) {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.status(401).json({ error: "Admin authentication required" });
}

// Verify Turnstile token with Cloudflare
async function verifyTurnstile(token: string, remoteip?: string): Promise<boolean> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

// Message validation schema
const sendMessageSchema = z.object({
  header: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
  displayStartTime: z.coerce.date(),
  displayEndTime: z.coerce.date(),
});

export function registerRoutes(app: Express) {
  // Safety net for best-effort Stripe price sync: a daily job re-checks every
  // billable account's live Stripe price against the price its stores justify
  // and corrects any drift left behind by a failed sync.
  startReconciliationService(stripe);

  // Live support chat bridged to Telegram (dashboard bubble <-> operator's chat).
  registerSupportRoutes(app, requireAuth);
  startSupportSweepService();

  // Resolve active store for authenticated API requests (runs before all API routes)
  app.use('/api', (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) return next();
    // Skip store resolution for store management endpoints so users can always
    // create/view stores even before any store is resolved.
    if (req.path === '/stores' || req.path.startsWith('/stores/')) return next();
    resolveActiveStore(req, res, next);
  });

  // Object Storage - Serve menu item images (public access for customers viewing menus)
  // Reference: blueprint:javascript_object_storage
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving menu image:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/auth/signup", signupLimiter, async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Verify Turnstile CAPTCHA token
      const turnstileToken = req.body.turnstileToken;
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (!turnstileToken && !isDevelopment) {
        // Production requires CAPTCHA token
        return res.status(400).json({ error: "CAPTCHA verification required" });
      }
      
      if (turnstileToken) {
        const isValidCaptcha = await verifyTurnstile(turnstileToken, req.ip);
        if (!isValidCaptcha) {
          return res.status(400).json({ error: "CAPTCHA verification failed. Please try again." });
        }
      } else if (isDevelopment) {
        console.log('[DEV] Signup proceeding without CAPTCHA token (development mode)');
      }
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = await hashPassword(validatedData.password);
      const verificationToken = generateToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          passwordHash,
          shopName: validatedData.shopName,
          emailVerified: false,
          verificationToken,
          verificationTokenExpiry,
        })
        .returning();

      await sendVerificationEmail(newUser.email, newUser.shopName, verificationToken);

      res.json({ 
        success: true,
        message: "Registration successful! Please check your email to verify your account." 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", loginLimiter, (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    passport.authenticate("local", (err: any, authUser: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!authUser) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      // Extract subuser info before login
      const isSubuser = authUser.__isSubuser || false;
      const subuserId = authUser.__subuserId;
      const permissions = authUser.__permissions || [];
      const storeIds = authUser.__storeIds ?? null; // null = all stores

      // Clean the user object (remove temporary flags)
      const { __isOwner, __isSubuser, __subuserId, __permissions, __storeIds, ...cleanUser } = authUser;

      req.login(cleanUser, { keepSessionInfo: true, session: true }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }

        // Set session data AFTER login completes
        if (isSubuser) {
          req.session.isSubuser = true;
          req.session.subuserId = subuserId;
          req.session.permissions = permissions;
          req.session.subuserStoreIds = storeIds; // null = all stores
        } else {
          req.session.isSubuser = false;
          req.session.subuserId = undefined;
          req.session.permissions = undefined;
          req.session.subuserStoreIds = undefined;

          // Track last login for owner accounts only (best-effort, non-blocking).
          db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, cleanUser.id))
            .catch((e) => console.error("[Login] Failed to update lastLoginAt:", e));
        }

        // Explicitly save session to persist data
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Session save failed" });
          }
          res.json({ user: cleanUser });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    // keepSessionInfo: true stops Passport from regenerating/clearing the whole
    // session on logout. An admin and a merchant can be signed in from the same
    // browser (they can even share an email); without this, logging out of the
    // merchant dashboard wipes req.session.adminId and breaks every admin action.
    req.logout({ keepSessionInfo: true }, (err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      // Remove only merchant/subuser state; leave any admin session intact.
      req.session.isSubuser = undefined;
      req.session.subuserId = undefined;
      req.session.permissions = undefined;
      req.session.subuserStoreIds = undefined;
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        user: req.user,
        isSubuser: req.session.isSubuser || false,
        subuserId: req.session.subuserId,
        permissions: req.session.permissions || [],
        subuserStoreIds: req.session.subuserStoreIds ?? null,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        return res.status(400).json({ error: "Verification token has expired" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.shopName,
      });

      // Set trial to expire 3 days from now
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const [updatedUser] = await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          stripeCustomerId: stripeCustomer.id,
          trialEndsAt: trialEndsAt,
        })
        .where(eq(users.id, user.id))
        .returning();

      // Automatically log the user in after verification
      // Auto-create a store for the user if one doesn't exist yet
      const existingStore = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.userId, user.id))
        .limit(1);
      if (existingStore.length === 0) {
        await db.insert(stores).values({
          userId: user.id,
          shopName: user.shopName,
          displayName: user.shopName,
          selectedProducts: user.selectedProducts || [],
        });
      }

      req.login(updatedUser, { keepSessionInfo: true, session: true }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Verification successful but login failed" });
        }
        res.json({ 
          success: true, 
          message: "Email verified successfully! You are now logged in.",
          user: updatedUser
        });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Email verification failed" });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      const verificationToken = generateToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db
        .update(users)
        .set({
          verificationToken,
          verificationTokenExpiry,
        })
        .where(eq(users.id, user.id));

      await sendVerificationEmail(user.email, user.shopName, verificationToken);

      res.json({ success: true, message: "Verification email sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to resend verification email" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.json({ success: true, message: "If that email exists, a password reset link has been sent" });
      }

      const resetPasswordToken = generateToken();
      const resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({
          resetPasswordToken,
          resetPasswordExpiry,
        })
        .where(eq(users.id, user.id));

      await sendPasswordResetEmail(user.email, user.shopName, resetPasswordToken);

      res.json({ success: true, message: "If that email exists, a password reset link has been sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Password reset request failed" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetPasswordToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ error: "Invalid reset token" });
      }

      if (user.resetPasswordExpiry && user.resetPasswordExpiry < new Date()) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      const passwordHash = await hashPassword(newPassword);

      await db
        .update(users)
        .set({
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Password reset failed" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, validatedData.email))
        .limit(1);

      if (!admin) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const [security] = await db
        .select()
        .from(adminSecurity)
        .where(eq(adminSecurity.adminId, admin.id))
        .limit(1);

      if (security) {
        if (security.lockedUntil && security.lockedUntil > new Date()) {
          const remainingTime = Math.ceil((security.lockedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
          return res.status(403).json({ 
            error: `Account locked due to too many failed attempts. Please try again in ${remainingTime} hours.`,
            lockedUntil: security.lockedUntil
          });
        }
      }

      const isValid = await comparePasswords(validatedData.password, admin.passwordHash);

      if (!isValid) {
        const currentFailures = (security?.consecutiveFailures || 0) + 1;
        const now = new Date();
        const lockoutDuration = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
        const lockedUntil = currentFailures >= 3 ? new Date(now.getTime() + lockoutDuration) : null;

        if (security) {
          await db
            .update(adminSecurity)
            .set({
              consecutiveFailures: currentFailures,
              lockedUntil,
              lastFailureIp: clientIp,
              lastFailureAt: now,
            })
            .where(eq(adminSecurity.adminId, admin.id));
        } else {
          await db
            .insert(adminSecurity)
            .values({
              adminId: admin.id,
              consecutiveFailures: currentFailures,
              lockedUntil,
              lastFailureIp: clientIp,
              lastFailureAt: now,
            });
        }

        if (currentFailures >= 3) {
          return res.status(403).json({ 
            error: `Too many failed attempts. Account locked for 2 days.`,
            lockedUntil
          });
        }

        return res.status(401).json({ 
          error: "Invalid email or password",
          attemptsRemaining: 3 - currentFailures
        });
      }

      if (security) {
        await db
          .update(adminSecurity)
          .set({
            consecutiveFailures: 0,
            lockedUntil: null,
          })
          .where(eq(adminSecurity.adminId, admin.id));
      } else {
        await db
          .insert(adminSecurity)
          .values({
            adminId: admin.id,
            consecutiveFailures: 0,
            lockedUntil: null,
            lastFailureIp: clientIp,
            lastFailureAt: new Date(),
          });
      }

      req.session.adminId = admin.id;
      res.json({ 
        success: true,
        admin: {
          id: admin.id,
          email: admin.email
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  app.get("/api/admin/me", (req, res) => {
    if (req.session && req.session.adminId) {
      db.select()
        .from(adminUsers)
        .where(eq(adminUsers.id, req.session.adminId))
        .limit(1)
        .then(([admin]) => {
          if (admin) {
            res.json({ 
              admin: {
                id: admin.id,
                email: admin.email
              }
            });
          } else {
            res.status(401).json({ error: "Not authenticated" });
          }
        });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    if (req.session) {
      req.session.adminId = undefined;
    }
    res.json({ success: true });
  });

  app.post("/api/admin/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1);

      if (!admin) {
        return res.json({ success: true, message: "If that email exists, a password reset link has been sent" });
      }

      const resetPasswordToken = generateToken();
      const resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(adminUsers)
        .set({
          resetPasswordToken,
          resetPasswordExpiry,
        })
        .where(eq(adminUsers.id, admin.id));

      await sendPasswordResetEmail(admin.email, "Admin", resetPasswordToken, true);

      res.json({ success: true, message: "If that email exists, a password reset link has been sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Password reset request failed" });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.resetPasswordToken, token))
        .limit(1);

      if (!admin) {
        return res.status(400).json({ error: "Invalid reset token" });
      }

      if (admin.resetPasswordExpiry && admin.resetPasswordExpiry < new Date()) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      const passwordHash = await hashPassword(newPassword);

      await db
        .update(adminUsers)
        .set({
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        })
        .where(eq(adminUsers.id, admin.id));

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Password reset failed" });
    }
  });

  // Admin: Create fully-activated user (bypasses email verification and subscription)
  app.post("/api/admin/users", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = adminCreateUserSchema.parse(req.body);
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = await hashPassword(validatedData.password);
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          passwordHash,
          shopName: validatedData.shopName,
          emailVerified: true,
          subscriptionStatus: 'active',
          selectedProducts: validatedData.selectedProducts,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .returning();

      // Auto-create a default store for the admin-created user.
      // The first store mirrors the chosen products so it drives the base price.
      await db.insert(stores).values({
        userId: newUser.id,
        shopName: newUser.shopName,
        displayName: newUser.shopName,
        selectedProducts: newUser.selectedProducts || [],
      }).onConflictDoNothing();

      res.json({ 
        success: true,
        message: "User created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          shopName: newUser.shopName,
          selectedProducts: newUser.selectedProducts,
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "User creation failed" });
    }
  });

  // Admin: Seed demo account with full dummy data
  app.post("/api/admin/seed-demo", requireAdminAuth, async (req, res) => {
    try {
      const result = await seedDemoAccount();
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Demo seed failed" });
    }
  });

  // Admin: Re-seed demo account (wipe + repopulate with fresh data)
  app.post("/api/admin/reseed-demo", requireAdminAuth, async (req, res) => {
    try {
      const result = await reseedDemoAccount();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Demo reseed failed" });
    }
  });

  // Admin: List all merchants with customer counts
  app.get("/api/admin/merchants", requireAdminAuth, async (req, res) => {
    try {
      const allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));

      const merchants = await Promise.all(
        allUsers.map(async (u) => {
          const customerRows = await db
            .select({ id: customers.id, storeId: customers.storeId })
            .from(customers)
            .where(eq(customers.userId, u.id));
          const storeRows = await db
            .select({
              id: stores.id,
              shopName: stores.shopName,
              displayName: stores.displayName,
              selectedProducts: stores.selectedProducts,
              shiftAccessPin: stores.shiftAccessPin,
              createdAt: stores.createdAt,
            })
            .from(stores)
            .where(eq(stores.userId, u.id))
            .orderBy(asc(stores.createdAt));
          const additionalStores = u.additionalStores ?? 0;
          const selectedProducts = u.selectedProducts || [];
          const expectedPrice = u.customPrice ?? calculateProductPrice(selectedProducts, additionalStores);
          // Per-store details for the account-first admin UI. The primary store
          // (oldest) drives the base price; no pricing is exposed per store.
          const storeDetails = storeRows.map((s, idx) => ({
            id: s.id,
            shopName: s.shopName,
            displayName: s.displayName,
            selectedProducts: s.selectedProducts || [],
            hasPin: !!s.shiftAccessPin,
            isPrimary: idx === 0,
            customerCount: customerRows.filter(c => c.storeId === s.id).length,
            createdAt: s.createdAt,
          }));
          return {
            id: u.id,
            email: u.email,
            shopName: u.shopName,
            subscriptionStatus: u.subscriptionStatus,
            selectedProducts,
            customPrice: u.customPrice,
            chargeFree: !!u.chargeFree,
            customerCount: customerRows.length,
            storeCount: storeRows.length,
            storeNames: storeRows.map(s => s.displayName || s.shopName),
            stores: storeDetails,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
            additionalStores,
            expectedPrice,
          };
        })
      );

      res.json({ merchants });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load merchants" });
    }
  });

  // Admin: Detect (and optionally correct) billing drift. Compares each billable
  // account's live Stripe subscription price against the price its stores justify
  // and reports any mismatch. Pass `{ dryRun: true }` to only surface drift for
  // review without changing anything in Stripe; default corrects it.
  app.post("/api/admin/billing/reconcile", requireAdminAuth, async (req, res) => {
    try {
      const dryRun = req.body?.dryRun === true;
      const result = await reconcileBilling(stripe, { dryRun });
      res.json({ dryRun, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Billing reconciliation failed" });
    }
  });

  // Admin: Delete a merchant and all their data
  app.delete("/api/admin/merchants/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      // Collect object-storage keys for the merchant's menu images BEFORE deleting
      // the rows, so we can clean up the orphaned files after the DB deletion.
      const menuImageRows = await db
        .select({ imageStorageKey: menuItems.imageStorageKey })
        .from(menuItems)
        .where(eq(menuItems.userId, id));
      const imageStorageKeys = menuImageRows
        .map((row) => row.imageStorageKey)
        .filter((key): key is string => !!key);

      // Delete feature data — child tables before parents to respect FK constraints.
      // Wrapped in a single transaction so a failure at any step rolls back the
      // entire deletion, preventing a half-deleted merchant.
      await db.transaction(async (tx) => {
        // spins.rewardId references rewards WITHOUT cascade, so spins must go first.
        await tx.delete(spins).where(eq(spins.userId, id));
        await tx.delete(spinTokens).where(eq(spinTokens.userId, id));
        await tx.delete(rewards).where(eq(rewards.userId, id));
        // loyaltyTransactions cascade from loyaltyCards; appleWalletDevices cascade from customers
        await tx.delete(loyaltyCards).where(eq(loyaltyCards.userId, id));
        await tx.delete(customers).where(eq(customers.userId, id));
        await tx.delete(menuItems).where(eq(menuItems.userId, id));
        await tx.delete(menuCategories).where(eq(menuCategories.userId, id));
        await tx.delete(shifts).where(eq(shifts.userId, id));
        await tx.delete(crewMembers).where(eq(crewMembers.userId, id));
        await tx.delete(timeframePresets).where(eq(timeframePresets.userId, id));
        await tx.delete(messages).where(eq(messages.userId, id));
        await tx.delete(subusers).where(eq(subusers.ownerId, id));
        // Finally delete the merchant
        await tx.delete(users).where(eq(users.id, id));
      });

      // External resource cleanup runs AFTER the DB transaction commits. These
      // calls cannot live inside the transaction, and a failure here must not
      // resurrect the merchant — so each is wrapped to log and continue.

      // 1. Cancel the merchant's Stripe subscription so they stop being billed.
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (stripeError: any) {
          // `resource_missing` means it was already canceled/deleted — fine.
          if (stripeError?.code !== "resource_missing") {
            console.error(
              `[DeleteMerchant] Failed to cancel subscription ${user.stripeSubscriptionId} for ${user.email}:`,
              stripeError?.message || stripeError
            );
          }
        }
      }

      // 2. Delete the Stripe customer so no further invoices/charges accrue.
      if (user.stripeCustomerId) {
        try {
          await stripe.customers.del(user.stripeCustomerId);
        } catch (stripeError: any) {
          if (stripeError?.code !== "resource_missing") {
            console.error(
              `[DeleteMerchant] Failed to delete customer ${user.stripeCustomerId} for ${user.email}:`,
              stripeError?.message || stripeError
            );
          }
        }
      }

      // 3. Remove orphaned menu images from object storage.
      if (imageStorageKeys.length > 0) {
        const objectStorageService = new ObjectStorageService();
        for (const key of imageStorageKeys) {
          try {
            await objectStorageService.deleteObjectEntity(key);
          } catch (storageError: any) {
            console.error(
              `[DeleteMerchant] Failed to delete object ${key} for ${user.email}:`,
              storageError?.message || storageError
            );
          }
        }
      }

      res.json({ success: true, message: `Merchant ${user.email} deleted` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete merchant" });
    }
  });

  // Admin: Set or clear a merchant's custom price (cents)
  app.patch("/api/admin/merchants/:id/price", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const priceSchema = z.object({
        customPrice: z.number().int().min(0).nullable(),
      });
      const parsed = priceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "customPrice must be a non-negative integer (cents) or null" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      // Update the DB AND immediately reprice the live Stripe subscription for
      // billable accounts (best-effort; reconcile is the safety net). Trial /
      // charge-free / no-active-sub accounts are a no-op.
      await applyCustomPrice(stripe, id, parsed.data.customPrice);

      res.json({ success: true, message: "Custom price updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update custom price" });
    }
  });

  // Admin: Send a password reset email on behalf of a merchant
  app.post("/api/admin/merchants/:id/password-reset", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      const resetPasswordToken = generateToken();
      const resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({ resetPasswordToken, resetPasswordExpiry })
        .where(eq(users.id, id));

      await sendPasswordResetEmail(user.email, user.shopName, resetPasswordToken);

      res.json({ success: true, message: `Password reset email sent to ${user.email}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to send password reset email" });
    }
  });

  // Admin: Set a merchant's subscription status directly
  app.patch("/api/admin/merchants/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { subscriptionStatus } = req.body;

      const allowedStatuses = ["active", "inactive", "trialing"] as const;
      if (!allowedStatuses.includes(subscriptionStatus)) {
        return res.status(400).json({ error: "Invalid subscription status" });
      }

      // Keep Stripe consistent with the override: cancel a live subscription when
      // moving to a non-billing status, and refuse "active" when there is no
      // subscription to make that status true. Never silently desync.
      const result = await applyStatusChange(stripe, id, subscriptionStatus);

      if (result.notFound) {
        return res.status(404).json({ error: "Merchant not found" });
      }
      if (result.badRequest) {
        return res.status(400).json({ error: result.badRequest });
      }
      if (result.stripeError) {
        console.error(`[Status] Failed to cancel Stripe subscription for ${id}:`, result.stripeError);
        return res.status(502).json({
          error:
            "Could not cancel the merchant's Stripe subscription. No changes were made — please try again.",
        });
      }

      res.json({ success: true, message: `Status set to ${subscriptionStatus}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });

  // Admin: Enable or disable charge-free status for a merchant
  app.patch("/api/admin/merchants/:id/charge-free", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const chargeFreeSchema = z.object({ chargeFree: z.boolean() });
      const parsed = chargeFreeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "chargeFree must be a boolean" });
      }
      const { chargeFree } = parsed.data;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      if (chargeFree) {
        // Cancel any active Stripe subscription so the merchant is no longer billed.
        // We MUST confirm cancellation before clearing billing fields — otherwise a
        // transient Stripe failure could leave a live subscription billing a merchant
        // we report as "charge-free". Only treat an already-gone subscription as success.
        if (user.stripeSubscriptionId) {
          try {
            await cancelStripeSubscription(stripe, user.stripeSubscriptionId);
          } catch (stripeError: any) {
            console.error(
              `[ChargeFree] Failed to cancel subscription ${user.stripeSubscriptionId}:`,
              stripeError?.message || stripeError
            );
            return res.status(502).json({
              error:
                "Could not cancel the merchant's Stripe subscription. No changes were made — please try again.",
            });
          }
        }

        // Only reaches here once Stripe billing is confirmed canceled (or never existed).
        await db
          .update(users)
          .set({
            chargeFree: true,
            stripeSubscriptionId: null,
            subscriptionStatus: "inactive",
            subscriptionEndsAt: null,
          })
          .where(eq(users.id, id));

        return res.json({
          success: true,
          message: `${user.shopName} is now charge-free`,
        });
      }

      // Disabling charge-free returns the merchant to normal billing rules.
      // Enabling charge-free cancels and clears their Stripe subscription, so
      // there is nothing to "resume" — access now depends on an active
      // subscription or trial again. We only flip the flag: no Stripe action, so
      // there is no silent wrong charge and no silent "billing nothing" state.
      // The merchant must re-subscribe (checkout) to be billed again.
      await db
        .update(users)
        .set({ chargeFree: false })
        .where(eq(users.id, id));

      const needsResubscribe = !user.stripeSubscriptionId;
      return res.json({
        success: true,
        message: needsResubscribe
          ? `${user.shopName} returned to normal billing — they'll need to re-subscribe to be charged again.`
          : `${user.shopName} returned to normal billing`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update charge-free status" });
    }
  });

  // ── Admin: Per-store management ────────────────────────────────────────────
  // Product access and shift PIN live on individual stores. The PRIMARY (oldest)
  // store drives the account's base price; additional stores add a flat €5/mo
  // regardless of products. No pricing is exposed or set in these endpoints.

  // Admin: List a merchant's stores
  app.get("/api/admin/merchants/:id/stores", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      const storeRows = await db
        .select({
          id: stores.id,
          shopName: stores.shopName,
          displayName: stores.displayName,
          selectedProducts: stores.selectedProducts,
          shiftAccessPin: stores.shiftAccessPin,
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(eq(stores.userId, id))
        .orderBy(asc(stores.createdAt));

      const result = await Promise.all(
        storeRows.map(async (s, idx) => {
          const customerRows = await db
            .select({ id: customers.id })
            .from(customers)
            .where(eq(customers.storeId, s.id));
          return {
            id: s.id,
            shopName: s.shopName,
            displayName: s.displayName,
            selectedProducts: s.selectedProducts || [],
            hasPin: !!s.shiftAccessPin,
            isPrimary: idx === 0,
            customerCount: customerRows.length,
            createdAt: s.createdAt,
          };
        })
      );

      res.json({ stores: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load stores" });
    }
  });

  // Admin: Create a store for a merchant
  app.post("/api/admin/merchants/:id/stores", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      const validatedData = createStoreSchema.parse(req.body);

      // Globally-unique slug check (used in public URLs) — friendly message.
      const [slugTaken] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.shopName, validatedData.shopName))
        .limit(1);
      if (slugTaken) {
        return res.status(409).json({ error: "That store URL is already taken. Please choose a different one." });
      }

      // New store inherits the primary store's products unless products were
      // explicitly provided, so it is immediately usable.
      const existingStores = await db
        .select({ id: stores.id, selectedProducts: stores.selectedProducts })
        .from(stores)
        .where(eq(stores.userId, id))
        .orderBy(asc(stores.createdAt));
      const products = validatedData.selectedProducts ?? existingStores[0]?.selectedProducts ?? [];
      const hashedPin = validatedData.shiftAccessPin
        ? await hashPassword(validatedData.shiftAccessPin)
        : null;

      let newStore: typeof stores.$inferSelect;
      try {
        [newStore] = await db
          .insert(stores)
          .values({
            userId: id,
            shopName: validatedData.shopName,
            displayName: validatedData.displayName || validatedData.shopName,
            selectedProducts: products,
            shiftAccessPin: hashedPin,
          })
          .returning();
        if (!newStore) throw new Error("Store insert returned no row");
      } catch (insertErr: any) {
        const isDuplicateSlug =
          insertErr?.code === "23505" ||
          (typeof insertErr?.message === "string" && insertErr.message.includes("stores_shop_name_unique"));
        if (isDuplicateSlug) {
          return res.status(409).json({ error: "That store URL is already taken. Please choose a different one." });
        }
        throw insertErr;
      }

      // Recompute billing: +€5 for the extra store (primary products unchanged).
      await syncBillingFromStores(id);

      res.json({ success: true, store: { id: newStore.id }, message: "Store created" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create store" });
    }
  });

  // Admin: Update a store (rename, products, PIN). No pricing fields.
  app.patch("/api/admin/merchants/:id/stores/:storeId", requireAdminAuth, async (req, res) => {
    try {
      const { id, storeId } = req.params;

      const schema = z.object({
        displayName: z.string().min(1).max(100).optional(),
        shopName: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed").optional(),
        selectedProducts: z.array(z.enum(["loyalty", "spin", "menu", "shift"])).optional(),
        pin: z.union([z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"), z.null()]).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid store update" });
      }

      const storeRows = await db
        .select()
        .from(stores)
        .where(eq(stores.userId, id))
        .orderBy(asc(stores.createdAt));
      const target = storeRows.find(s => s.id === storeId);
      if (!target) {
        return res.status(404).json({ error: "Store not found" });
      }
      const isPrimary = storeRows[0]?.id === storeId;

      const updates: Partial<typeof stores.$inferInsert> = {};
      if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
      if (parsed.data.selectedProducts !== undefined) updates.selectedProducts = parsed.data.selectedProducts;
      if (parsed.data.pin !== undefined) {
        updates.shiftAccessPin = parsed.data.pin === null ? null : await hashPassword(parsed.data.pin);
      }
      if (parsed.data.shopName !== undefined && parsed.data.shopName !== target.shopName) {
        const [slugTaken] = await db
          .select({ id: stores.id })
          .from(stores)
          .where(eq(stores.shopName, parsed.data.shopName))
          .limit(1);
        if (slugTaken) {
          return res.status(409).json({ error: "That store URL is already taken. Please choose a different one." });
        }
        updates.shopName = parsed.data.shopName;
      }

      // Wallet-relevant branding changed (display name or shop name). PIN and
      // product selection are unrelated to wallet passes.
      const brandingChanged = updates.displayName !== undefined || updates.shopName !== undefined;
      if (brandingChanged) {
        updates.brandingUpdatedAt = new Date();
      }

      if (Object.keys(updates).length > 0) {
        try {
          await db
            .update(stores)
            .set(updates)
            .where(and(eq(stores.id, storeId), eq(stores.userId, id)));
        } catch (updateErr: any) {
          const isDuplicateSlug =
            updateErr?.code === "23505" ||
            (typeof updateErr?.message === "string" && updateErr.message.includes("stores_shop_name_unique"));
          if (isDuplicateSlug) {
            return res.status(409).json({ error: "That store URL is already taken. Please choose a different one." });
          }
          throw updateErr;
        }
      }

      // If the primary store's products changed, mirror them onto the account and
      // reprice the active Stripe subscription — the base price follows the
      // primary store's products (no-op for trial/charge-free or accounts without
      // an active subscription). Non-primary product changes never affect billing.
      if (isPrimary && parsed.data.selectedProducts !== undefined) {
        await syncBillingFromStores(id);
      }

      // Fire-and-forget: propagate branding to Google/Apple wallets.
      if (brandingChanged) {
        propagateStoreBranding(storeId);
      }

      res.json({ success: true, message: "Store updated" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update store" });
    }
  });

  // Admin: Delete a store. Can't delete the account's only store.
  app.delete("/api/admin/merchants/:id/stores/:storeId", requireAdminAuth, async (req, res) => {
    try {
      const { id, storeId } = req.params;

      const storeRows = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.userId, id))
        .orderBy(asc(stores.createdAt));
      if (storeRows.length === 0) {
        return res.status(404).json({ error: "Merchant not found or has no stores" });
      }
      if (storeRows.length <= 1) {
        return res.status(400).json({ error: "Cannot delete the account's only store" });
      }
      if (!storeRows.some(s => s.id === storeId)) {
        return res.status(404).json({ error: "Store not found" });
      }

      const [deleted] = await db
        .delete(stores)
        .where(and(eq(stores.id, storeId), eq(stores.userId, id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Store not found" });

      // Recompute billing. If the primary was deleted, the next-oldest becomes
      // primary and now drives the base price.
      await syncBillingFromStores(id, { prorationBehavior: 'none' });

      res.json({ success: true, message: "Store deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete store" });
    }
  });

  // Save selected products (must be authenticated and email verified)
  app.post("/api/user/select-products", requireEmailVerification, async (req, res) => {
    try {
      const { products } = req.body;
      
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Please select at least one product" });
      }

      const validProducts = ['loyalty', 'spin', 'menu', 'shift'];
      const invalidProducts = products.filter(p => !validProducts.includes(p));
      
      if (invalidProducts.length > 0) {
        return res.status(400).json({ error: "Invalid product selection" });
      }

      // This flow sets the merchant's MAIN subscription products, which belong to
      // the PRIMARY (oldest) store. Write the primary store's products first, then
      // mirror them onto the user so existing billing/checkout code keeps working.
      const userStores = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.userId, req.user!.id))
        .orderBy(asc(stores.createdAt));
      if (userStores[0]) {
        await db
          .update(stores)
          .set({ selectedProducts: products })
          .where(eq(stores.id, userStores[0].id));

        // Recompute billing from stores: mirrors the primary store's products
        // onto the account and reprices the active Stripe subscription so the
        // base price follows the primary store's products (no-op during
        // trial/charge-free or when there's no active subscription).
        const updatedUser = await syncBillingFromStores(req.user!.id);
        return res.json({
          success: true,
          selectedProducts: updatedUser.selectedProducts,
          price: updatedUser.customPrice ?? calculateProductPrice(updatedUser.selectedProducts ?? [], updatedUser.additionalStores ?? 0),
        });
      }

      // Fallback (no store yet): update the user mirror directly.
      const [updatedUser] = await db
        .update(users)
        .set({
          selectedProducts: products,
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json({
        success: true,
        selectedProducts: updatedUser.selectedProducts,
        price: updatedUser.customPrice ?? calculateProductPrice(products, updatedUser.additionalStores ?? 0),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/user/profile", requireSubscription, async (req, res) => {
    try {
      const { shopName, logo, menuBannerImage, cardBackgroundColor } = req.body;
      
      if (cardBackgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(cardBackgroundColor)) {
        return res.status(400).json({ error: "Invalid color format. Please use hex format (e.g., #4285F4)" });
      }
      
      // Validate menuBannerImage if provided
      if (menuBannerImage !== undefined && menuBannerImage !== null && menuBannerImage !== "") {
        const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
        if (!dataUrlRegex.test(menuBannerImage)) {
          return res.status(400).json({ error: "Invalid banner image format. Must be a valid image data URL (PNG, JPG, GIF, or WebP)" });
        }
        const base64Data = menuBannerImage.split(',')[1];
        if (!base64Data) return res.status(400).json({ error: "Invalid banner image data" });
        try {
          const buffer = Buffer.from(base64Data, 'base64');
          if (buffer.length === 0) return res.status(400).json({ error: "Invalid banner image: empty data" });
          if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: "Banner image too large. Maximum size is 5MB" });
        } catch {
          return res.status(400).json({ error: "Invalid banner image: failed to decode base64 data" });
        }
      }

      // In multi-store mode: branding (logo/banner/color) is stored on the active store.
      // shopName on users is kept in sync as the legacy fallback.
      const storeUpdateData: any = {};
      const userUpdateData: any = {};

      if (shopName) {
        userUpdateData.shopName = shopName;
        // Don't rename store shopName slug (that's immutable); only update displayName
        storeUpdateData.displayName = shopName;
      }
      if (logo !== undefined) {
        storeUpdateData.logo = logo || null;
        userUpdateData.logo = logo || null; // keep legacy field in sync
      }
      if (menuBannerImage !== undefined) {
        storeUpdateData.menuBannerImage = menuBannerImage || null;
        userUpdateData.menuBannerImage = menuBannerImage || null;
      }
      if (cardBackgroundColor) {
        storeUpdateData.cardBackgroundColor = cardBackgroundColor;
        userUpdateData.cardBackgroundColor = cardBackgroundColor;
      }

      // Wallet-relevant branding changed (display name via shopName, logo, or
      // card color) — not menu banner, which is unrelated to wallet passes.
      const brandingChanged = !!shopName || logo !== undefined || !!cardBackgroundColor;
      if (brandingChanged) {
        storeUpdateData.brandingUpdatedAt = new Date();
      }

      // Update active store branding if storeId is resolved
      let updatedStore = null;
      if (req.storeId && Object.keys(storeUpdateData).length > 0) {
        [updatedStore] = await db
          .update(stores)
          .set(storeUpdateData)
          .where(and(eq(stores.id, req.storeId), eq(stores.userId, req.user!.id)))
          .returning();

        // Fire-and-forget: propagate branding to Google/Apple wallets.
        if (updatedStore && brandingChanged) {
          propagateStoreBranding(req.storeId);
        }
      }

      // Also update users table for backward compat
      const [updatedUser] = await db
        .update(users)
        .set({ ...userUpdateData, shopName: userUpdateData.shopName || req.user!.shopName })
        .where(eq(users.id, req.user!.id))
        .returning();

      // Return merged view
      res.json(updatedStore ? { ...updatedUser, ...updatedStore } : updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Store Management Routes
  app.get("/api/stores", requireAuth, async (req, res) => {
    try {
      const allUserStores = await db
        .select()
        .from(stores)
        .where(eq(stores.userId, req.user!.id))
        .orderBy(asc(stores.createdAt));

      // Subusers with a restricted store list only see their assigned stores
      const isSubuser = req.session?.isSubuser === true;
      const subuserStoreIds: string[] | null = req.session?.subuserStoreIds ?? null;
      if (isSubuser && subuserStoreIds !== null) {
        const filtered = allUserStores.filter(s => subuserStoreIds.includes(s.id));
        return res.json(filtered);
      }

      res.json(allUserStores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stores", requireAuth, async (req, res) => {
    try {
      const validatedData = createStoreSchema.parse(req.body);

      // The shop URL slug is globally unique (used in public URLs). Check up-front so
      // we can return a clear, friendly message instead of a raw DB constraint error.
      const [slugTaken] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.shopName, validatedData.shopName))
        .limit(1);
      if (slugTaken) {
        return res.status(409).json({ error: "That store URL is already taken. Please choose a different one." });
      }

      // Determine the account's existing stores. A new store inherits the
      // primary (oldest) store's products so it is immediately usable; billing
      // is then recomputed from all stores by syncBillingFromStores.
      const existingStores = await db
        .select({ id: stores.id, selectedProducts: stores.selectedProducts })
        .from(stores)
        .where(eq(stores.userId, req.user!.id))
        .orderBy(asc(stores.createdAt));
      const primaryProducts = existingStores[0]?.selectedProducts ?? [];

      // 1. Persist the store (DB write first — catches unique-constraint violations
      //    before any billing action is taken).
      let newStore: typeof stores.$inferSelect;
      try {
        [newStore] = await db
          .insert(stores)
          .values({
            userId: req.user!.id,
            shopName: validatedData.shopName,
            displayName: validatedData.displayName || validatedData.shopName,
            selectedProducts: primaryProducts,
          })
          .returning();
        if (!newStore) throw new Error("Store insert returned no row");
      } catch (insertErr: any) {
        // Fallback for a race between the check above and the insert.
        // 23505 = Postgres unique_violation.
        const isDuplicateSlug =
          insertErr?.code === "23505" ||
          (typeof insertErr?.message === "string" && insertErr.message.includes("stores_shop_name_unique"));
        if (isDuplicateSlug) {
          return res.status(409).json({ error: "That store URL is already taken. Please choose a different one." });
        }
        throw insertErr;
      }

      // 2. Recompute billing from the (now updated) store set: primary products
      //    drive the base price, +€5 per extra store. Stripe synced best-effort.
      await syncBillingFromStores(req.user!.id);

      res.json(newStore);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/stores/:storeId", requireAuth, async (req, res) => {
    try {
      const validatedData = updateStoreSchema.parse(req.body);

      // Wallet-relevant branding changed (display name, logo, or card color).
      const brandingChanged =
        validatedData.displayName !== undefined ||
        validatedData.logo !== undefined ||
        validatedData.cardBackgroundColor !== undefined;
      const update = brandingChanged
        ? { ...validatedData, brandingUpdatedAt: new Date() }
        : validatedData;

      // The billing routing decision (primary product change -> reprice;
      // non-primary or non-product edit -> leave the bill alone) lives in
      // applyStoreUpdate so it can be unit tested with a Stripe spy.
      const result = await applyStoreUpdate(stripe, req.user!.id, req.params.storeId, update);
      if (result.notFound) return res.status(404).json({ error: "Store not found" });

      // Fire-and-forget: propagate branding to Google/Apple wallets.
      if (brandingChanged) {
        propagateStoreBranding(req.params.storeId);
      }

      res.json(result.store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/stores/:storeId", requireAuth, async (req, res) => {
    try {
      const allStores = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.userId, req.user!.id));
      if (allStores.length <= 1) {
        return res.status(400).json({ error: "Cannot delete your only store" });
      }

      // 1. Delete the store from DB (DB write first). `.returning()` gives us the
      //    full row so we can restore it if billing compensation is needed.
      const [deleted] = await db
        .delete(stores)
        .where(and(eq(stores.id, req.params.storeId), eq(stores.userId, req.user!.id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Store not found" });

      // 2. Recompute billing from the remaining stores. If the primary store was
      //    deleted, the next-oldest store becomes primary and now drives the base
      //    price. Stripe synced best-effort (deletion already persisted).
      await syncBillingFromStores(req.user!.id, { prorationBehavior: 'none' });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers", requireSubscription, requirePermission('customers'), async (req, res) => {
    try {
      const customerList = await db
        .select()
        .from(customers)
        .where(eq(customers.storeId, req.storeId!))
        .orderBy(desc(customers.createdAt));
      res.json(customerList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shop-qr-code", requireSubscription, async (req, res) => {
    try {
      const protocol = req.protocol;
      const host = req.get("host");
      // Look up store shopName for slug-based URL
      const [activeStore] = await db.select({ shopName: stores.shopName })
        .from(stores).where(eq(stores.id, req.storeId!)).limit(1);
      const shopUrl = activeStore
        ? `${protocol}://${host}/${activeStore.shopName}/join`
        : `${protocol}://${host}/join/${req.storeId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
      });
      res.json({ qrCode: qrCodeDataUrl, url: shopUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Per-store shop QR code — owner can fetch the join QR for any of their stores
  app.get("/api/stores/:storeId/shop-qr-code", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.params;
      // Verify the store belongs to this user
      const [store] = await db
        .select({ id: stores.id, shopName: stores.shopName, userId: stores.userId })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      if (!store) return res.status(404).json({ error: "Store not found" });
      if (store.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

      const protocol = req.protocol;
      const host = req.get("host");
      const shopUrl = `${protocol}://${host}/${store.shopName}/join`;
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
      });
      res.json({ qrCode: qrCodeDataUrl, url: shopUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/menu-qr-code", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const protocol = req.protocol;
      const host = req.get("host");
      // Look up store shopName for slug-based URL
      const [activeStore] = await db.select({ shopName: stores.shopName })
        .from(stores).where(eq(stores.id, req.storeId!)).limit(1);
      const menuUrl = activeStore
        ? `${protocol}://${host}/${activeStore.shopName}/menu`
        : `${protocol}://${host}/menu/${req.storeId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
      });
      res.json({ qrCode: qrCodeDataUrl, url: menuUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customers/join", async (req, res) => {
    try {
      const { userId, storeId: bodyStoreId, name, email, phone } = req.body;

      if (!userId && !bodyStoreId) {
        return res.status(400).json({ error: "User ID or Store ID is required" });
      }

      // Look up the store — prefer storeId, fall back to userId's first store
      let targetStoreId: string;
      let targetUserId: string;

      if (bodyStoreId) {
        // Try to look up as a storeId first (new QR codes)
        const [storeById] = await db
          .select()
          .from(stores)
          .where(eq(stores.id, bodyStoreId))
          .limit(1);
        if (storeById) {
          targetStoreId = storeById.id;
          targetUserId = storeById.userId;
        } else {
          // Second fallback: userId (legacy QR codes embedded userId)
          const [storeByUser] = await db
            .select()
            .from(stores)
            .where(eq(stores.userId, bodyStoreId))
            .orderBy(asc(stores.createdAt))
            .limit(1);
          if (storeByUser) {
            targetStoreId = storeByUser.id;
            targetUserId = storeByUser.userId;
          } else {
            // Third fallback: shopName slug (e.g. /:shopName/join)
            const [storeBySlug] = await db
              .select()
              .from(stores)
              .where(eq(stores.shopName, bodyStoreId))
              .limit(1);
            if (!storeBySlug) return res.status(404).json({ error: "Store not found" });
            targetStoreId = storeBySlug.id;
            targetUserId = storeBySlug.userId;
          }
        }
      } else {
        const [store] = await db
          .select()
          .from(stores)
          .where(eq(stores.userId, userId))
          .orderBy(asc(stores.createdAt))
          .limit(1);
        if (!store) return res.status(404).json({ error: "Store not found" });
        targetStoreId = store.id;
        targetUserId = store.userId;
      }

      const customerQrCode = nanoid(12);

      // New cards inherit the store's configured loyalty settings (reward wording
      // and stamps required) so the wallet pass shows the merchant's wording.
      const [storeSettings] = await db
        .select({ rewardText: stores.rewardText, maxStamps: stores.maxStamps })
        .from(stores)
        .where(eq(stores.id, targetStoreId))
        .limit(1);

      const [newCustomer] = await db
        .insert(customers)
        .values({
          storeId: targetStoreId,
          userId: targetUserId,
          name: name || null,
          email: email || null,
          phone: phone || null,
          customerQrCode,
        })
        .returning();

      const [loyaltyCard] = await db
        .insert(loyaltyCards)
        .values({
          storeId: targetStoreId,
          userId: targetUserId,
          customerId: newCustomer.id,
          stamps: 0,
          maxStamps: storeSettings?.maxStamps ?? 10,
          rewardText: storeSettings?.rewardText ?? "Free Reward",
        })
        .returning();

      res.json({ customer: newCustomer, loyaltyCard });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customers", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const customerQrCode = nanoid(12);

      // Fall back to the store's configured loyalty settings when the request
      // doesn't specify per-card values, so new cards use the merchant's wording.
      const [storeSettings] = await db
        .select({ rewardText: stores.rewardText, maxStamps: stores.maxStamps })
        .from(stores)
        .where(eq(stores.id, req.storeId!))
        .limit(1);

      const [newCustomer] = await db
        .insert(customers)
        .values({
          storeId: req.storeId!,
          userId: req.user!.id,
          name: req.body.name || null,
          email: req.body.email || null,
          phone: req.body.phone || null,
          customerQrCode,
        })
        .returning();

      const [loyaltyCard] = await db
        .insert(loyaltyCards)
        .values({
          storeId: req.storeId!,
          userId: req.user!.id,
          customerId: newCustomer.id,
          stamps: 0,
          maxStamps: req.body.maxStamps || storeSettings?.maxStamps || 10,
          rewardText: req.body.rewardText || storeSettings?.rewardText || "Free Reward",
        })
        .returning();

      res.json({ customer: newCustomer, loyaltyCard });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Loyalty settings (reward wording + stamps required) are configured per store
  // and applied to new cards at creation time. GET returns the active store's
  // current values so the settings form can pre-fill them.
  app.get("/api/loyalty-settings", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const [store] = await db
        .select({ rewardText: stores.rewardText, maxStamps: stores.maxStamps })
        .from(stores)
        .where(eq(stores.id, req.storeId!))
        .limit(1);
      if (!store) return res.status(404).json({ error: "Store not found" });

      res.json({
        rewardText: store.rewardText ?? "Free Coffee",
        maxStamps: store.maxStamps ?? 10,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Persist the store's loyalty settings, apply them to every existing card for
  // the store (so pass display and dashboard stay consistent), and propagate the
  // reward wording to Google/Apple wallet passes.
  app.patch("/api/loyalty-settings", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const parsed = loyaltySettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid settings" });
      }
      const { rewardText, maxStamps } = parsed.data;

      const [updatedStore] = await db
        .update(stores)
        .set({ rewardText, maxStamps })
        .where(and(eq(stores.id, req.storeId!), eq(stores.userId, req.user!.id)))
        .returning({ id: stores.id });
      if (!updatedStore) return res.status(404).json({ error: "Store not found" });

      // Apply the new wording and stamp goal to every existing card, recomputing
      // redeemability against the new goal so a raised/lowered threshold takes
      // effect immediately.
      await db
        .update(loyaltyCards)
        .set({
          rewardText,
          maxStamps,
          isRedeemable: sql`${loyaltyCards.stamps} >= ${maxStamps}`,
        })
        .where(eq(loyaltyCards.storeId, req.storeId!));

      // Fire-and-forget: refresh wallet passes with the new reward wording.
      propagateStoreBranding(req.storeId!);

      res.json({ rewardText, maxStamps });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty-cards", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const cards = await db
        .select({
          card: loyaltyCards,
          customer: customers,
        })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .where(eq(loyaltyCards.storeId, req.storeId!))
        .orderBy(desc(loyaltyCards.lastStampAt));

      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty-transactions", requireSubscription, async (req, res) => {
    try {
      const transactions = await db
        .select({
          transaction: loyaltyTransactions,
          card: loyaltyCards,
          customer: customers,
        })
        .from(loyaltyTransactions)
        .leftJoin(loyaltyCards, eq(loyaltyTransactions.loyaltyCardId, loyaltyCards.id))
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .where(eq(loyaltyCards.storeId, req.storeId!))
        .orderBy(desc(loyaltyTransactions.createdAt));

      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty-card/customer/:customerId", async (req, res) => {
    try {
      const [card] = await db
        .select({
          card: loyaltyCards,
          customer: customers,
          user: users,
        })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .leftJoin(users, eq(loyaltyCards.userId, users.id))
        .where(eq(customers.id, req.params.customerId))
        .limit(1);

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      res.json(card);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customer-qr/:customerId", async (req, res) => {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, req.params.customerId))
        .limit(1);

      if (!customer || !customer.customerQrCode) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const qrCodeDataUrl = await QRCode.toDataURL(customer.customerQrCode, {
        width: 300,
        margin: 2,
      });

      res.json({ qrCode: qrCodeDataUrl, qrCodeValue: customer.customerQrCode });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Store-scoped logo endpoint (used by Google Wallet for data-URI logos)
  app.get("/api/logo/store/:storeId", async (req, res) => {
    try {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, req.params.storeId))
        .limit(1);

      if (!store || !store.logo) {
        return res.status(404).send("Logo not found");
      }

      if (store.logo.startsWith('data:')) {
        const matches = store.logo.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          res.send(buffer);
        } else {
          res.status(400).send("Invalid logo format");
        }
      } else {
        res.redirect(store.logo);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public stamp-strip PNG for Google Wallet heroImage. Same exposure model as
  // /api/logo/store/:storeId: no auth, customerId is an unguessable UUID, and
  // the response is only the composed image (no customer data). The `?v=` query
  // param is purely a client-side cache buster and is ignored here.
  app.get("/api/wallet-strip/:customerId", async (req, res) => {
    try {
      const [result] = await db
        .select({ card: loyaltyCards, customer: customers, store: stores, user: users })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .leftJoin(stores, eq(customers.storeId, stores.id))
        .leftJoin(users, eq(loyaltyCards.userId, users.id))
        .where(eq(customers.id, req.params.customerId))
        .limit(1);

      if (!result || !result.customer || !result.user) {
        return res.status(404).send("Not found");
      }

      const banner = await loadBannerBuffer(result.store?.menuBannerImage || result.user.menuBannerImage);
      const png = await renderStampStrip({
        bannerImage: banner,
        brandColorHex: validateGoogleBackgroundColor(result.store?.cardBackgroundColor || result.user.cardBackgroundColor),
        stamps: result.card.stamps,
        maxStamps: result.card.maxStamps,
        width: 1032,
        height: 336,
      });

      res.setHeader("Content-Type", "image/png");
      // Long-lived cache is correct: stamp changes bust via the ?v= param.
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(png);
    } catch (error: any) {
      console.error("[Wallet Strip] Render failed:", error);
      res.status(500).send("Strip render failed");
    }
  });

  app.get("/api/logo/:userId", async (req, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.params.userId))
        .limit(1);

      if (!user || !user.logo) {
        return res.status(404).send("Logo not found");
      }

      if (user.logo.startsWith('data:')) {
        const matches = user.logo.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          res.send(buffer);
        } else {
          res.status(400).send("Invalid logo format");
        }
      } else {
        res.redirect(user.logo);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty-cards/scan-stamp", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        return res.status(400).json({ error: "QR code is required" });
      }

      const [customer] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.customerQrCode, qrCode),
            eq(customers.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const [card] = await db
        .select()
        .from(loyaltyCards)
        .where(
          and(
            eq(loyaltyCards.customerId, customer.id),
            eq(loyaltyCards.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!card) {
        return res.status(404).json({ error: "Loyalty card not found" });
      }

      // Check if customer already has max stamps (reward eligible)
      const wasRewardEligible = card.stamps >= card.maxStamps;
      
      let newStamps: number;
      let isRedeemable: boolean;
      let totalRewards = card.totalRewards;
      let message: string;
      let rewardGranted = false;

      if (wasRewardEligible) {
        // Customer had 10/10 stamps - reset to 0 and count as reward
        newStamps = 0;
        isRedeemable = false;
        totalRewards = card.totalRewards + 1;
        message = `Reward granted! Card reset to 0/${card.maxStamps}`;
        rewardGranted = true;
      } else {
        // Normal stamp addition
        newStamps = card.stamps + 1;
        isRedeemable = newStamps >= card.maxStamps;
        message = isRedeemable 
          ? `Card complete! Customer eligible for reward (${newStamps}/${card.maxStamps})`
          : `Stamp added! ${newStamps}/${card.maxStamps}`;
      }

      const [updatedCard] = await db
        .update(loyaltyCards)
        .set({
          stamps: newStamps,
          isRedeemable,
          totalRewards,
          lastStampAt: new Date(),
        })
        .where(eq(loyaltyCards.id, card.id))
        .returning();

      // Create transaction record
      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        storeId: card.storeId || undefined,
        type: rewardGranted ? "reward" : "stamp",
        amount: rewardGranted ? -card.maxStamps : 1,
        description: rewardGranted ? "Reward granted - auto reset" : "Stamp added via QR scan",
      });

      if (googleWalletService) {
        try {
          await googleWalletService.updateLoyaltyPoints(
            customer.id,
            newStamps,
            card.maxStamps
          );
        } catch (walletError) {
          console.error('Google Wallet update failed (non-blocking):', walletError);
        }
      }

      // Apple Wallet PassKit push (non-blocking, fire-and-forget)
      notifyAppleWalletDevices(customer.id);

      res.json({ 
        success: true, 
        card: updatedCard, 
        customer,
        message,
        rewardGranted
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty-cards/:cardId/stamp", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const [card] = await db
        .select()
        .from(loyaltyCards)
        .where(
          and(
            eq(loyaltyCards.id, req.params.cardId),
            eq(loyaltyCards.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      const newStamps = Math.min(card.stamps + 1, card.maxStamps);
      const isRedeemable = newStamps >= card.maxStamps;

      const [updatedCard] = await db
        .update(loyaltyCards)
        .set({
          stamps: newStamps,
          isRedeemable,
          lastStampAt: new Date(),
        })
        .where(eq(loyaltyCards.id, req.params.cardId))
        .returning();

      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        storeId: card.storeId || undefined,
        type: "stamp",
        amount: 1,
        description: "Stamp added",
      });

      if (googleWalletService) {
        try {
          await googleWalletService.updateLoyaltyPoints(
            card.customerId,
            newStamps,
            card.maxStamps
          );
        } catch (walletError) {
          console.error('Google Wallet update failed (non-blocking):', walletError);
        }
      }

      // Apple Wallet PassKit push (non-blocking, fire-and-forget)
      notifyAppleWalletDevices(card.customerId);

      res.json(updatedCard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty-cards/:cardId/redeem", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const [card] = await db
        .select()
        .from(loyaltyCards)
        .where(
          and(
            eq(loyaltyCards.id, req.params.cardId),
            eq(loyaltyCards.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      if (!card.isRedeemable) {
        return res.status(400).json({ error: "Card not redeemable yet" });
      }

      const [updatedCard] = await db
        .update(loyaltyCards)
        .set({
          stamps: 0,
          isRedeemable: false,
          totalRewards: card.totalRewards + 1,
          lastStampAt: new Date(),
        })
        .where(eq(loyaltyCards.id, req.params.cardId))
        .returning();

      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        storeId: card.storeId || undefined,
        type: "reward",
        description: "Reward redeemed",
      });

      if (googleWalletService) {
        try {
          await googleWalletService.updateLoyaltyPoints(
            card.customerId,
            0,
            card.maxStamps
          );
        } catch (walletError) {
          console.error('Google Wallet update failed (non-blocking):', walletError);
        }
      }

      // Apple Wallet PassKit push (non-blocking, fire-and-forget)
      notifyAppleWalletDevices(card.customerId);

      res.json(updatedCard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rewards", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const rewardList = await db
        .select()
        .from(rewards)
        .where(eq(rewards.storeId, req.storeId!))
        .orderBy(desc(rewards.createdAt));
      res.json(rewardList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rewards/public/:storeRef", async (req, res) => {
    try {
      const { storeRef } = req.params;
      // Try direct storeId lookup first; fall back to userId's first store for legacy QR codes
      let resolvedStoreId = storeRef;
      const directMatch = await db.select({ id: rewards.id }).from(rewards).where(eq(rewards.storeId, storeRef)).limit(1);
      if (directMatch.length === 0) {
        // Try resolving as userId
        const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.userId, storeRef)).orderBy(asc(stores.createdAt)).limit(1);
        if (store) resolvedStoreId = store.id;
      }
      const rewardList = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.storeId, resolvedStoreId),
            eq(rewards.isActive, true)
          )
        );
      res.json(rewardList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rewards", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const validatedData = createRewardSchema.parse(req.body);
      
      const [newReward] = await db
        .insert(rewards)
        .values({
          storeId: req.storeId!,
          userId: req.user!.id,
          name: validatedData.name,
          description: validatedData.description || null,
          winChance: validatedData.winChance,
          isActive: validatedData.isActive ?? true,
        })
        .returning();

      res.json(newReward);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/rewards/:rewardId", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const [updatedReward] = await db
        .update(rewards)
        .set({
          name: req.body.name,
          description: req.body.description,
          winChance: req.body.winChance,
          isActive: req.body.isActive,
        })
        .where(
          and(
            eq(rewards.id, req.params.rewardId),
            eq(rewards.storeId, req.storeId!)
          )
        )
        .returning();

      if (!updatedReward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      res.json(updatedReward);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/rewards/:rewardId", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const [deletedReward] = await db
        .delete(rewards)
        .where(
          and(
            eq(rewards.id, req.params.rewardId),
            eq(rewards.storeId, req.storeId!)
          )
        )
        .returning();

      if (!deletedReward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      res.json({ success: true, deletedReward });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/spins", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const allSpins = await db
        .select({
          spin: spins,
          customer: customers,
        })
        .from(spins)
        .leftJoin(customers, eq(spins.customerId, customers.id))
        .where(
          and(
            eq(spins.storeId, req.storeId!),
            eq(spins.type, 'customer')
          )
        )
        .orderBy(desc(spins.spunAt));
      res.json(allSpins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/spin-tokens", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const tokens = await db
        .select()
        .from(spinTokens)
        .where(eq(spinTokens.storeId, req.storeId!))
        .orderBy(desc(spinTokens.createdAt))
        .limit(100);
      res.json(tokens);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/spin-tokens", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const validatedData = createTokenSchema.parse(req.body);
      const token = nanoid(8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + validatedData.expiryMinutes);

      const [newToken] = await db
        .insert(spinTokens)
        .values({
          storeId: req.storeId!,
          userId: req.user!.id,
          token,
          customerName: validatedData.customerName || null,
          expiresAt,
        })
        .returning();

      res.json(newToken);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });


  app.post("/api/spin", async (req, res) => {
    try {
      const { token: tokenString } = req.body;

      if (!tokenString) {
        return res.status(400).json({ error: "Token is required" });
      }

      const [token] = await db
        .select()
        .from(spinTokens)
        .where(eq(spinTokens.token, tokenString))
        .limit(1);

      if (!token) {
        return res.status(404).json({ error: "Invalid token" });
      }

      if (token.isUsed) {
        return res.status(400).json({ error: "Token already used" });
      }

      if (new Date() > token.expiresAt) {
        return res.status(400).json({ error: "Token expired" });
      }

      // Resolve storeId from token — must scope rewards to the token's store
      const tokenStoreId = token.storeId;
      let rewardFilter;
      if (tokenStoreId) {
        // New tokens: filter strictly by storeId
        rewardFilter = and(eq(rewards.storeId, tokenStoreId), eq(rewards.isActive, true));
      } else {
        // Legacy tokens without storeId: fall back to userId filter
        rewardFilter = and(eq(rewards.userId, token.userId), eq(rewards.isActive, true));
      }

      const activeRewards = await db
        .select()
        .from(rewards)
        .where(rewardFilter);

      if (activeRewards.length === 0) {
        return res.status(400).json({ error: "No active rewards configured" });
      }

      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedReward = activeRewards[activeRewards.length - 1];

      for (const reward of activeRewards) {
        cumulative += reward.winChance;
        if (random <= cumulative) {
          selectedReward = reward;
          break;
        }
      }

      await db
        .update(spinTokens)
        .set({
          isUsed: true,
          usedAt: new Date(),
        })
        .where(eq(spinTokens.id, token.id));

      await db
        .update(rewards)
        .set({
          timesWon: (selectedReward.timesWon || 0) + 1,
        })
        .where(eq(rewards.id, selectedReward.id));

      await db.insert(spins).values({
        storeId: tokenStoreId || selectedReward.storeId || undefined,
        tokenId: token.id,
        rewardId: selectedReward.id,
        userId: token.userId,
        prizeWon: selectedReward.name,
        type: 'token',
      });

      res.json({ reward: selectedReward });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/spin-in-store/:storeRef", async (req, res) => {
    try {
      const { storeRef } = req.params;
      // Resolve storeRef to storeId — try direct storeId, then fall back to userId
      let resolvedStoreId = storeRef;
      const [storeCheck] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeRef)).limit(1);
      if (!storeCheck) {
        const [storeByUser] = await db.select({ id: stores.id }).from(stores).where(eq(stores.userId, storeRef)).orderBy(asc(stores.createdAt)).limit(1);
        if (storeByUser) resolvedStoreId = storeByUser.id;
      }

      const activeRewards = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.storeId, resolvedStoreId),
            eq(rewards.isActive, true)
          )
        );

      if (activeRewards.length === 0) {
        return res.status(400).json({ error: "No active rewards configured" });
      }

      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedReward = activeRewards[activeRewards.length - 1];

      for (const reward of activeRewards) {
        cumulative += reward.winChance;
        if (random <= cumulative) {
          selectedReward = reward;
          break;
        }
      }

      await db
        .update(rewards)
        .set({
          timesWon: (selectedReward.timesWon || 0) + 1,
        })
        .where(eq(rewards.id, selectedReward.id));

      res.json({ reward: selectedReward });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customer-spin/:storeRef", async (req, res) => {
    try {
      const { storeRef } = req.params;
      // Resolve storeRef to storeId — try direct storeId, then fall back to userId
      let resolvedStoreId = storeRef;
      let resolvedUserId: string | undefined;
      const [storeCheck] = await db.select({ id: stores.id, userId: stores.userId }).from(stores).where(eq(stores.id, storeRef)).limit(1);
      if (storeCheck) {
        resolvedStoreId = storeCheck.id;
        resolvedUserId = storeCheck.userId;
      } else {
        const [storeByUser] = await db.select({ id: stores.id, userId: stores.userId }).from(stores).where(eq(stores.userId, storeRef)).orderBy(asc(stores.createdAt)).limit(1);
        if (storeByUser) {
          resolvedStoreId = storeByUser.id;
          resolvedUserId = storeByUser.userId;
        }
      }

      const activeRewards = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.storeId, resolvedStoreId),
            eq(rewards.isActive, true)
          )
        );

      if (activeRewards.length === 0) {
        return res.status(400).json({ error: "No active rewards configured" });
      }

      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedReward = activeRewards[activeRewards.length - 1];

      for (const reward of activeRewards) {
        cumulative += reward.winChance;
        if (random <= cumulative) {
          selectedReward = reward;
          break;
        }
      }

      await db
        .update(rewards)
        .set({
          timesWon: (selectedReward.timesWon || 0) + 1,
        })
        .where(eq(rewards.id, selectedReward.id));

      await db.insert(spins).values({
        storeId: resolvedStoreId,
        rewardId: selectedReward.id,
        userId: resolvedUserId || selectedReward.userId,
        prizeWon: selectedReward.name,
        type: 'customer',
      });

      res.json({ reward: selectedReward });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/spin-token/:tokenId/qr", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const [token] = await db
        .select()
        .from(spinTokens)
        .where(
          and(
            eq(spinTokens.id, req.params.tokenId),
            eq(spinTokens.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }

      const protocol = req.protocol;
      const host = req.get("host");
      const spinUrl = `${protocol}://${host}/spin/${token.token}`;
      const qrCodeDataUrl = await QRCode.toDataURL(spinUrl, {
        width: 300,
        margin: 2,
      });

      res.json({ qrCode: qrCodeDataUrl, url: spinUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/spin-in-store-qr", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      const protocol = req.protocol;
      const host = req.get("host");
      const spinUrl = `${protocol}://${host}/spin-in-store/${req.storeId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(spinUrl, {
        width: 300,
        margin: 2,
      });

      res.json({ qrCode: qrCodeDataUrl, url: spinUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe/create-checkout-session", requireAuth, ownerOnly, async (req, res) => {
    try {
      // Get user's selected products
      const selectedProducts = req.user!.selectedProducts || [];
      
      if (selectedProducts.length === 0) {
        return res.status(400).json({ error: "Please select products before subscribing" });
      }

      const price = req.user!.customPrice ?? calculateProductPrice(selectedProducts, req.user!.additionalStores ?? 0);
      const description = getProductDescription(selectedProducts);

      // Create Stripe customer if one doesn't exist
      let customerId = req.user!.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          metadata: {
            userId: req.user!.id,
          },
        });
        customerId = customer.id;
        
        // Update user with new Stripe customer ID
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, req.user!.id));
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "uniHub Subscription",
                description: description,
              },
              unit_amount: price,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/payment-processing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/select-products`,
        metadata: {
          userId: req.user!.id,
          selectedProducts: JSON.stringify(selectedProducts),
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stripe/verify-session/:sessionId", requireAuth, ownerOnly, async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      
      if (session.payment_status === "paid" && session.subscription) {
        await db
          .update(users)
          .set({
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          })
          .where(eq(users.id, req.user!.id));
        
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, req.user!.id))
          .limit(1);
        
        return res.json({ 
          success: true, 
          subscriptionStatus: "active",
          user: updatedUser 
        });
      }
      
      res.json({ 
        success: false, 
        subscriptionStatus: req.user!.subscriptionStatus,
        paymentStatus: session.payment_status 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe/create-portal-session", requireAuth, ownerOnly, async (req, res) => {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: req.user!.stripeCustomerId!,
        return_url: `${req.headers.origin}/dashboard/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/wallet/google/:customerId", async (req, res) => {
    try {
      if (!googleWalletService) {
        return res.status(501).send(`
          <html>
            <head><title>Google Wallet Setup Required</title></head>
            <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
              <h1>🔧 Google Wallet Setup Required</h1>
              <p>To enable Google Wallet passes, you need to:</p>
              <ol>
                <li>Create a Google Cloud project</li>
                <li>Enable the Google Wallet API</li>
                <li>Create a service account and download credentials</li>
                <li>Register for Google Wallet API access</li>
                <li>Set environment variable <code>GOOGLE_WALLET_ISSUER_ID</code></li>
                <li>Set environment variable <code>GOOGLE_WALLET_SERVICE_ACCOUNT_JSON</code></li>
              </ol>
              <p><a href="https://developers.google.com/wallet/retail/loyalty-cards">View Google Wallet Documentation →</a></p>
            </body>
          </html>
        `);
      }

      const [result] = await db
        .select({
          card: loyaltyCards,
          customer: customers,
          store: stores,
          user: users,
        })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .leftJoin(stores, eq(customers.storeId, stores.id))
        .leftJoin(users, eq(loyaltyCards.userId, users.id))
        .where(eq(customers.id, req.params.customerId))
        .limit(1);

      if (!result || !result.customer || !result.user) {
        return res.status(404).send("Loyalty card not found");
      }

      const passData: LoyaltyPassData = {
        customerId: result.customer.id,
        customerName: result.customer.name!,
        shopName: result.store?.shopName || result.user.shopName,
        stamps: result.card.stamps,
        maxStamps: result.card.maxStamps,
        rewardText: result.card.rewardText || 'Loyalty Reward',
        customerQrCode: result.customer.customerQrCode || result.customer.id,
      };

      const saveUrl = await googleWalletService.createLoyaltyPass(
        passData,
        result.store?.id || result.user.id,
        result.store?.logo || result.user.logo,
        result.store?.cardBackgroundColor || result.user.cardBackgroundColor
      );

      res.redirect(saveUrl);
    } catch (error: any) {
      console.error('Google Wallet error:', error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>❌ Error Generating Pass</h1>
            <p>There was an error creating your Google Wallet pass. Please try again later.</p>
            <p><strong>Error:</strong> ${error.message}</p>
          </body>
        </html>
      `);
    }
  });

  app.get("/api/wallet/apple/:customerId", async (req, res) => {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isMacOS = /Macintosh|Mac OS X/i.test(userAgent) && /Safari/i.test(userAgent);
      const isAppleDevice = isIOS || isMacOS;

      if (!isAppleWalletConfigured()) {
        return res.status(503).send(`
          <html>
            <head>
              <title>Apple Wallet — Coming Soon</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px 20px; max-width: 500px; margin: 0 auto; background: #f5f5f7; color: #1d1d1f; }
                .card { background: white; border-radius: 18px; padding: 36px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); text-align: center; }
                h1 { font-size: 22px; font-weight: 600; margin-bottom: 12px; }
                p { color: #6e6e73; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="card">
                <div style="font-size:48px; margin-bottom: 16px;">&#128179;</div>
                <h1>Apple Wallet — Almost Ready</h1>
                <p>Apple Wallet integration is being set up. Please check back soon — your loyalty card will be available to add shortly.</p>
              </div>
            </body>
          </html>
        `);
      }

      if (!isAppleDevice) {
        return res.status(200).send(`
          <html>
            <head>
              <title>Apple Wallet — iPhone Required</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px 20px; max-width: 500px; margin: 0 auto; background: #f5f5f7; color: #1d1d1f; }
                .card { background: white; border-radius: 18px; padding: 36px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); text-align: center; }
                h1 { font-size: 22px; font-weight: 600; margin-bottom: 12px; }
                p { color: #6e6e73; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="card">
                <div style="font-size:48px; margin-bottom: 16px;">&#128241;</div>
                <h1>Open on your iPhone</h1>
                <p>Apple Wallet passes can only be added from an iPhone, iPad, or Mac with Safari. Please open this link on your Apple device.</p>
              </div>
            </body>
          </html>
        `);
      }

      const [result] = await db
        .select({
          card: loyaltyCards,
          customer: customers,
          store: stores,
          user: users,
        })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .leftJoin(stores, eq(customers.storeId, stores.id))
        .leftJoin(users, eq(loyaltyCards.userId, users.id))
        .where(eq(customers.id, req.params.customerId))
        .limit(1);

      if (!result || !result.customer || !result.user) {
        return res.status(404).send("Loyalty card not found");
      }

      const effectiveShopName = result.store?.shopName || result.user.shopName;
      const passData: AppleLoyaltyPassData = {
        customerId: result.customer.id,
        customerName: result.customer.name!,
        shopName: effectiveShopName,
        stamps: result.card.stamps,
        maxStamps: result.card.maxStamps,
        rewardText: result.card.rewardText || 'Loyalty Reward',
        customerQrCode: result.customer.customerQrCode || result.customer.id,
        cardBackgroundColor: result.store?.cardBackgroundColor || result.user.cardBackgroundColor,
        logo: result.store?.logo || result.user.logo,
        bannerImage: result.store?.menuBannerImage || result.user.menuBannerImage,
      };

      const appleWalletService = new AppleWalletService();
      const passBuffer = await appleWalletService.generatePass(passData);

      const filename = `${effectiveShopName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-loyalty.pkpass`;
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', passBuffer.length.toString());
      res.send(passBuffer);
    } catch (error: any) {
      console.error('Apple Wallet error:', error);
      res.status(500).send(`
        <html>
          <head>
            <title>Error</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px 20px; max-width: 500px; margin: 0 auto; background: #f5f5f7; color: #1d1d1f; }
              .card { background: white; border-radius: 18px; padding: 36px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); text-align: center; }
            </style>
          </head>
          <body>
            <div class="card">
              <div style="font-size:48px; margin-bottom: 16px;">&#10060;</div>
              <h1 style="font-size:22px;">Error generating pass</h1>
              <p style="color:#6e6e73;">Please try again later. If the issue persists, contact support.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // === Apple PassKit Web Service ===
  // These endpoints are called by iOS when managing Apple Wallet passes.

  function validateApplePassAuth(req: Request, serialNumber: string): boolean {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('ApplePass ')) return false;
    const token = authHeader.slice('ApplePass '.length).trim();
    const customerId = serialNumber.substring(0, 36);
    const expected = generatePassAuthToken(customerId);
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expected);
    // timingSafeEqual throws on unequal lengths — guard first; unequal = invalid.
    if (tokenBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  }

  // Register a device to receive push notifications for a pass
  app.post('/api/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', async (req, res) => {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    const { pushToken } = req.body;

    if (!validateApplePassAuth(req, serialNumber)) {
      console.warn(`[PassKit] 401 on device register for serial ${serialNumber} (stale/invalid auth token)`);
      return res.status(401).send();
    }
    if (!pushToken) return res.status(400).send();

    const customerId = serialNumber.substring(0, 36);

    try {
      const existing = await db.select().from(appleWalletDevices).where(and(
        eq(appleWalletDevices.deviceLibraryIdentifier, deviceLibraryIdentifier),
        eq(appleWalletDevices.serialNumber, serialNumber),
        eq(appleWalletDevices.passTypeIdentifier, passTypeIdentifier),
      )).limit(1);

      if (existing.length > 0) {
        if (existing[0].pushToken !== pushToken) {
          await db.update(appleWalletDevices).set({ pushToken }).where(eq(appleWalletDevices.id, existing[0].id));
        }
        return res.status(200).send();
      }

      const [customerRow] = await db.select({ storeId: customers.storeId }).from(customers).where(eq(customers.id, customerId)).limit(1);
      await db.insert(appleWalletDevices).values({ deviceLibraryIdentifier, pushToken, serialNumber, passTypeIdentifier, customerId, storeId: customerRow?.storeId || undefined });
      console.log(`[PassKit] Device registered for serial ${serialNumber}`);
      return res.status(201).send();
    } catch (err) {
      console.error('[PassKit] Register device error:', err);
      return res.status(500).send();
    }
  });

  // Unregister a device
  app.delete('/api/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', async (req, res) => {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;

    if (!validateApplePassAuth(req, serialNumber)) {
      console.warn(`[PassKit] 401 on device unregister for serial ${serialNumber} (stale/invalid auth token)`);
      return res.status(401).send();
    }

    try {
      await db.delete(appleWalletDevices).where(and(
        eq(appleWalletDevices.deviceLibraryIdentifier, deviceLibraryIdentifier),
        eq(appleWalletDevices.serialNumber, serialNumber),
        eq(appleWalletDevices.passTypeIdentifier, passTypeIdentifier),
      ));
      console.log(`[PassKit] Device unregistered for serial ${serialNumber}`);
      return res.status(200).send();
    } catch (err) {
      console.error('[PassKit] Unregister device error:', err);
      return res.status(500).send();
    }
  });

  // Get serial numbers of passes that have been updated since a given tag
  app.get('/api/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier', async (req, res) => {
    const { deviceLibraryIdentifier, passTypeIdentifier } = req.params;
    const passesUpdatedSince = req.query.passesUpdatedSince as string | undefined;

    try {
      const devices = await db.select().from(appleWalletDevices).where(and(
        eq(appleWalletDevices.deviceLibraryIdentifier, deviceLibraryIdentifier),
        eq(appleWalletDevices.passTypeIdentifier, passTypeIdentifier),
      ));

      if (!devices.length) return res.status(204).send();

      const serialNumbers: string[] = [];
      const now = new Date();
      const since = passesUpdatedSince ? new Date(passesUpdatedSince) : null;
      // Cache each store's branding timestamp so we look it up once per store,
      // not once per device.
      const brandingByStore = new Map<string, Date | null>();

      for (const device of devices) {
        if (since) {
          // Resolve the store either from the device's own storeId or, for legacy
          // registrations with a null storeId, from the customer's store.
          const [card] = await db.select({
            lastStampAt: loyaltyCards.lastStampAt,
            storeId: customers.storeId,
          })
            .from(loyaltyCards)
            .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
            .where(eq(loyaltyCards.customerId, device.customerId))
            .limit(1);

          const storeId = device.storeId ?? card?.storeId ?? null;
          let branding: Date | null = null;
          if (storeId) {
            if (brandingByStore.has(storeId)) {
              branding = brandingByStore.get(storeId)!;
            } else {
              const [store] = await db.select({ brandingUpdatedAt: stores.brandingUpdatedAt })
                .from(stores)
                .where(eq(stores.id, storeId))
                .limit(1);
              branding = store?.brandingUpdatedAt ?? null;
              brandingByStore.set(storeId, branding);
            }
          }

          const effective = maxDate(card?.lastStampAt, branding);
          if (effective && effective > since) {
            serialNumbers.push(device.serialNumber);
          }
        } else {
          serialNumbers.push(device.serialNumber);
        }
      }

      if (!serialNumbers.length) return res.status(204).send();

      return res.json({ lastUpdated: now.toISOString(), serialNumbers });
    } catch (err) {
      console.error('[PassKit] Get serial numbers error:', err);
      return res.status(500).send();
    }
  });

  // Return an updated pass for a given serial number
  app.get('/api/apple-wallet/v1/passes/:passTypeIdentifier/:serialNumber', async (req, res) => {
    const { passTypeIdentifier, serialNumber } = req.params;

    if (!validateApplePassAuth(req, serialNumber)) {
      console.warn(`[PassKit] 401 on pass fetch for serial ${serialNumber} (stale/invalid auth token)`);
      return res.status(401).send();
    }

    const customerId = serialNumber.substring(0, 36);

    try {
      const [result] = await db
        .select({ card: loyaltyCards, customer: customers, store: stores, user: users })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .leftJoin(stores, eq(customers.storeId, stores.id))
        .leftJoin(users, eq(loyaltyCards.userId, users.id))
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!result || !result.customer || !result.user) return res.status(404).send();

      // Effective "pass last updated" = latest of stamp activity and branding change.
      const lastModified = maxDate(result.card.lastStampAt, result.store?.brandingUpdatedAt) || new Date();

      // Honor iOS's conditional fetch: HTTP dates have second precision, so
      // compare truncated to seconds and 304 when nothing is newer.
      const ims = req.headers['if-modified-since'];
      if (typeof ims === 'string') {
        const since = new Date(ims);
        if (!Number.isNaN(since.getTime()) &&
            Math.floor(lastModified.getTime() / 1000) <= Math.floor(since.getTime() / 1000)) {
          res.setHeader('Last-Modified', lastModified.toUTCString());
          return res.status(304).send();
        }
      }

      const passData: AppleLoyaltyPassData = {
        customerId: result.customer.id,
        customerName: result.customer.name!,
        shopName: result.store?.shopName || result.user.shopName,
        stamps: result.card.stamps,
        maxStamps: result.card.maxStamps,
        rewardText: result.card.rewardText || 'Loyalty Reward',
        customerQrCode: result.customer.customerQrCode || result.customer.id,
        cardBackgroundColor: result.store?.cardBackgroundColor || result.user.cardBackgroundColor,
        logo: result.store?.logo || result.user.logo,
        bannerImage: result.store?.menuBannerImage || result.user.menuBannerImage,
      };

      const appleWalletService = new AppleWalletService();
      const passBuffer = await appleWalletService.generatePass(passData);

      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Last-Modified', lastModified.toUTCString());
      console.log(`[PassKit] Serving updated pass for customer ${customerId}, stamps: ${result.card.stamps}`);
      return res.send(passBuffer);
    } catch (err) {
      console.error('[PassKit] Get updated pass error:', err);
      return res.status(500).send();
    }
  });

  // Receive error logs from Apple Wallet
  app.post('/api/apple-wallet/v1/log', (req, res) => {
    console.log('[PassKit] Device log:', JSON.stringify(req.body));
    return res.status(200).send();
  });

  app.post("/api/messages", requireAuth, requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const validatedData = sendMessageSchema.parse(req.body);
      const user = req.user!;

      if (!req.storeId) {
        return res.status(400).json({ error: "No store selected" });
      }

      const customerList = await db
        .select()
        .from(customers)
        .where(eq(customers.storeId, req.storeId));

      if (googleWalletService) {
        // classId must come from the same source of truth used to create the
        // class, otherwise the message silently targets a non-existent class.
        const classId = googleWalletService.getClassId(req.storeId);
        await googleWalletService.sendMessage(
          classId,
          validatedData.header || null,
          validatedData.body,
          validatedData.displayStartTime,
          validatedData.displayEndTime
        );
      }

      const [message] = await db
        .insert(messages)
        .values({
          storeId: req.storeId,
          userId: user.id,
          header: validatedData.header || null,
          body: validatedData.body,
          displayStartTime: validatedData.displayStartTime,
          displayEndTime: validatedData.displayEndTime,
          messageType: "TEXT_AND_NOTIFY",
          // TODO: this counts ALL store customers, not just Google Wallet pass
          // holders who actually receive the push, so it overstates reach.
          recipientCount: customerList.length,
        })
        .returning();

      res.json({ success: true, message });
    } catch (error: any) {
      if (error instanceof LoyaltyClassNotFoundError) {
        return res.status(400).json({ error: "No customers have added your loyalty card to Google Wallet yet, so there is no one to notify." });
      }
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  // Menu Categories Routes
  app.get("/api/menu-categories", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.storeId, req.storeId!))
        .orderBy(asc(menuCategories.displayOrder));
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/menu-categories", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const validatedData = insertMenuCategorySchema.parse(req.body);
      
      const [newCategory] = await db
        .insert(menuCategories)
        .values({
          storeId: req.storeId!,
          userId: req.user!.id,
          name: validatedData.name,
          displayOrder: validatedData.displayOrder ?? 0,
        })
        .returning();

      res.json(newCategory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/menu-categories/:id", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const validatedData = insertMenuCategorySchema.parse(req.body);
      
      const updateData: any = {
        name: validatedData.name,
      };
      
      if (validatedData.displayOrder !== undefined) {
        updateData.displayOrder = validatedData.displayOrder;
      }
      
      const [updatedCategory] = await db
        .update(menuCategories)
        .set(updateData)
        .where(
          and(
            eq(menuCategories.id, req.params.id),
            eq(menuCategories.storeId, req.storeId!)
          )
        )
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(updatedCategory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/menu-categories/:id", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const [deletedCategory] = await db
        .delete(menuCategories)
        .where(
          and(
            eq(menuCategories.id, req.params.id),
            eq(menuCategories.storeId, req.storeId!)
          )
        )
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ success: true, deletedCategory });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Menu Items Routes
  app.get("/api/menu-items", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.storeId, req.storeId!))
        .orderBy(asc(menuItems.categoryId), asc(menuItems.displayOrder));
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/menu-items/category/:categoryId", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const [category] = await db
        .select()
        .from(menuCategories)
        .where(
          and(
            eq(menuCategories.id, req.params.categoryId),
            eq(menuCategories.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.categoryId, req.params.categoryId))
        .orderBy(asc(menuItems.displayOrder));

      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/menu-items", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);

      const [category] = await db
        .select()
        .from(menuCategories)
        .where(
          and(
            eq(menuCategories.id, validatedData.categoryId),
            eq(menuCategories.storeId, req.storeId!)
          )
        )
        .limit(1);

      if (!category) {
        return res.status(403).json({ error: "Category not found or unauthorized" });
      }
      
      const [newItem] = await db
        .insert(menuItems)
        .values({
          storeId: req.storeId!,
          userId: req.user!.id,
          categoryId: validatedData.categoryId,
          name: validatedData.name,
          description: validatedData.description || null,
          price: validatedData.price,
          imageUrl: validatedData.imageUrl || null,
          displayOrder: validatedData.displayOrder ?? 0,
        })
        .returning();

      // Handle image upload ACL — scope by storeId for store-level isolation
      if (validatedData.imageUrl && validatedData.imageUrl.startsWith("https://storage.googleapis.com/")) {
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          validatedData.imageUrl,
          {
            owner: req.storeId || req.user!.id,
            visibility: "public", // Menu images are public for customers
          }
        );
        // Update the item with the normalized path
        await db.update(menuItems).set({ imageStorageKey: objectPath }).where(eq(menuItems.id, newItem.id));
      }

      res.json(newItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/menu-items/:id", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);

      if (validatedData.categoryId) {
        const [category] = await db
          .select()
          .from(menuCategories)
          .where(
            and(
              eq(menuCategories.id, validatedData.categoryId),
              eq(menuCategories.storeId, req.storeId!)
            )
          )
          .limit(1);

        if (!category) {
          return res.status(403).json({ error: "Category not found or unauthorized" });
        }
      }
      
      const updateData: any = {
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl || null,
      };
      
      if (validatedData.displayOrder !== undefined) {
        updateData.displayOrder = validatedData.displayOrder;
      }
      
      const [updatedItem] = await db
        .update(menuItems)
        .set(updateData)
        .where(
          and(
            eq(menuItems.id, req.params.id),
            eq(menuItems.storeId, req.storeId!)
          )
        )
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Handle image upload ACL — scope by storeId for store-level isolation
      if (validatedData.imageUrl && validatedData.imageUrl.startsWith("https://storage.googleapis.com/")) {
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          validatedData.imageUrl,
          {
            owner: req.storeId || req.user!.id,
            visibility: "public", // Menu images are public for customers
          }
        );
        // Update the item with the normalized path
        await db.update(menuItems).set({ imageStorageKey: objectPath }).where(eq(menuItems.id, updatedItem.id));
      }

      res.json(updatedItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/menu-items/:id", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const [deletedItem] = await db
        .delete(menuItems)
        .where(
          and(
            eq(menuItems.id, req.params.id),
            eq(menuItems.storeId, req.storeId!)
          )
        )
        .returning();

      if (!deletedItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      res.json({ success: true, deletedItem });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reorder menu items
  app.post("/api/menu-items/reorder", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const updates = req.body.updates as { id: string; displayOrder: number }[];
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }

      // Update each item's display order
      for (const update of updates) {
        await db
          .update(menuItems)
          .set({ displayOrder: update.displayOrder })
          .where(
            and(
              eq(menuItems.id, update.id),
              eq(menuItems.storeId, req.storeId!)
            )
          );
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Menu Image Upload URL (protected, requires authentication)
  // Reference: blueprint:javascript_object_storage
  app.post("/api/menu-images/upload", requireAuth, requireSubscription, requirePermission('menu'), async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Public Menu Route
  app.get("/api/menu/:storeId", async (req, res) => {
    try {
      // Try storeId first, then fall back to userId for backward compatibility
      let targetStoreId: string | null = null;
      let merchant: { shopName: string; logo: string | null; cardBackgroundColor: string | null; menuBannerImage: string | null } | null = null;

      const [storeResult] = await db
        .select({
          id: stores.id,
          shopName: stores.shopName,
          logo: stores.logo,
          cardBackgroundColor: stores.cardBackgroundColor,
          menuBannerImage: stores.menuBannerImage,
        })
        .from(stores)
        .where(eq(stores.id, req.params.storeId))
        .limit(1);

      if (storeResult) {
        targetStoreId = storeResult.id;
        merchant = storeResult;
      } else {
        // Second fallback: look up by userId (legacy QR codes embedded userId)
        const [userStore] = await db
          .select({
            id: stores.id,
            shopName: stores.shopName,
            logo: stores.logo,
            cardBackgroundColor: stores.cardBackgroundColor,
            menuBannerImage: stores.menuBannerImage,
          })
          .from(stores)
          .where(eq(stores.userId, req.params.storeId))
          .orderBy(asc(stores.createdAt))
          .limit(1);
        if (userStore) {
          targetStoreId = userStore.id;
          merchant = userStore;
        } else {
          // Third fallback: resolve by shopName slug (e.g. /:shopName/menu)
          const [slugStore] = await db
            .select({
              id: stores.id,
              shopName: stores.shopName,
              logo: stores.logo,
              cardBackgroundColor: stores.cardBackgroundColor,
              menuBannerImage: stores.menuBannerImage,
            })
            .from(stores)
            .where(eq(stores.shopName, req.params.storeId))
            .limit(1);
          if (slugStore) {
            targetStoreId = slugStore.id;
            merchant = slugStore;
          }
        }
      }

      if (!merchant || !targetStoreId) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      const categories = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.storeId, targetStoreId))
        .orderBy(asc(menuCategories.displayOrder));

      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.storeId, targetStoreId))
        .orderBy(asc(menuItems.categoryId), asc(menuItems.displayOrder));

      const menu = categories.map(category => ({
        ...category,
        items: items.filter(item => item.categoryId === category.id),
      }));

      res.json({
        merchant,
        categories: menu,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Crew Members Routes
  app.get("/api/crew-members", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const members = await db
        .select()
        .from(crewMembers)
        .where(eq(crewMembers.storeId, req.storeId!))
        .orderBy(asc(crewMembers.name));

      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crew-members", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const validatedData = insertCrewMemberSchema.parse(req.body);
      
      const [member] = await db
        .insert(crewMembers)
        .values({
          ...validatedData,
          storeId: req.storeId!,
          userId: req.user!.id,
        })
        .returning();

      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/crew-members/:id", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const validatedData = insertCrewMemberSchema.parse(req.body);

      const [member] = await db
        .update(crewMembers)
        .set(validatedData)
        .where(
          and(
            eq(crewMembers.id, req.params.id),
            eq(crewMembers.storeId, req.storeId!)
          )
        )
        .returning();

      if (!member) {
        return res.status(404).json({ error: "Crew member not found" });
      }

      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/crew-members/:id", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      await db
        .delete(crewMembers)
        .where(
          and(
            eq(crewMembers.id, req.params.id),
            eq(crewMembers.storeId, req.storeId!)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard & Analytics read-only aggregate summaries (Round 6)
  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  app.get("/api/dashboard/summary", requireAuth, requireSubscription, requirePermission('dashboard'), async (req, res) => {
    try {
      const storeId = req.storeId!;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6);
      const prevWeekStart = new Date(todayStart); prevWeekStart.setDate(prevWeekStart.getDate() - 13);
      const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);

      const [store] = await db
        .select({ selectedProducts: stores.selectedProducts })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      const hasShiftProduct = (store?.selectedProducts ?? []).includes('shift');

      const [
        todayCounts,
        weekCounts,
        newMembersToday,
        cardCounts,
        trendRows,
        recentTx,
        recentSpins,
      ] = await Promise.all([
        db.select({
          stamps: sql<number>`count(*) filter (where ${loyaltyTransactions.type} = 'stamp')`.mapWith(Number),
        }).from(loyaltyTransactions)
          .where(and(eq(loyaltyTransactions.storeId, storeId), gte(loyaltyTransactions.createdAt, todayStart)))
          .then(async ([r]) => {
            const [s] = await db.select({ spins: sql<number>`count(*)`.mapWith(Number) })
              .from(spins)
              .where(and(eq(spins.storeId, storeId), gte(spins.spunAt, todayStart)));
            return { stamps: r?.stamps ?? 0, spins: s?.spins ?? 0 };
          }),
        db.select({
          stamps: sql<number>`count(*) filter (where ${loyaltyTransactions.createdAt} >= ${weekStart})`.mapWith(Number),
          stampsPrevWeek: sql<number>`count(*) filter (where ${loyaltyTransactions.createdAt} >= ${prevWeekStart} and ${loyaltyTransactions.createdAt} < ${weekStart})`.mapWith(Number),
        }).from(loyaltyTransactions)
          .where(and(
            eq(loyaltyTransactions.storeId, storeId),
            eq(loyaltyTransactions.type, 'stamp'),
            gte(loyaltyTransactions.createdAt, prevWeekStart),
          )),
        db.select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(customers)
          .where(and(eq(customers.storeId, storeId), gte(customers.createdAt, todayStart))),
        db.select({
          readyToRedeem: sql<number>`count(*) filter (where ${loyaltyCards.isRedeemable} = true)`.mapWith(Number),
          nearReward: sql<number>`count(*) filter (where ${loyaltyCards.stamps} = ${loyaltyCards.maxStamps} - 1)`.mapWith(Number),
          inactive30d: sql<number>`count(*) filter (where ${loyaltyCards.lastStampAt} < ${days30Ago} and ${loyaltyCards.stamps} > 0)`.mapWith(Number),
        }).from(loyaltyCards)
          .where(eq(loyaltyCards.storeId, storeId)),
        db.execute(sql`
          select date_trunc('day', ts)::date as day, count(*)::int as count
          from (
            select ${loyaltyTransactions.createdAt} as ts
            from ${loyaltyTransactions}
            where ${loyaltyTransactions.storeId} = ${storeId}
              and ${loyaltyTransactions.type} = 'stamp'
              and ${loyaltyTransactions.createdAt} >= ${weekStart}
            union all
            select ${spins.spunAt} as ts
            from ${spins}
            where ${spins.storeId} = ${storeId}
              and ${spins.spunAt} >= ${weekStart}
          ) t
          group by 1
        `),
        db.select({
          id: loyaltyTransactions.id,
          type: loyaltyTransactions.type,
          createdAt: loyaltyTransactions.createdAt,
          customerName: customers.name,
        }).from(loyaltyTransactions)
          .innerJoin(loyaltyCards, eq(loyaltyTransactions.loyaltyCardId, loyaltyCards.id))
          .innerJoin(customers, eq(loyaltyCards.customerId, customers.id))
          .where(eq(loyaltyTransactions.storeId, storeId))
          .orderBy(desc(loyaltyTransactions.createdAt))
          .limit(8),
        db.select({
          id: spins.id,
          prizeWon: spins.prizeWon,
          spunAt: spins.spunAt,
          customerName: customers.name,
        }).from(spins)
          .leftJoin(customers, eq(spins.customerId, customers.id))
          .where(eq(spins.storeId, storeId))
          .orderBy(desc(spins.spunAt))
          .limit(8),
      ]);

      const trendByDay = new Map<string, number>();
      for (const row of (trendRows as any).rows ?? []) {
        const key = typeof row.day === 'string' ? row.day.slice(0, 10) : toDateStr(new Date(row.day));
        trendByDay.set(key, Number(row.count) || 0);
      }
      const trend7d: number[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart); d.setDate(d.getDate() + i);
        trend7d.push(trendByDay.get(toDateStr(d)) ?? 0);
      }

      const recentActivity = [
        ...recentTx.map((t) => ({
          id: `tx-${t.id}`,
          type: t.type === 'reward' ? 'reward' as const : 'stamp' as const,
          customerName: t.customerName || 'Unknown',
          description: t.type === 'reward' ? 'Redeemed reward' : 'Received a stamp',
          timestamp: t.createdAt,
        })),
        ...recentSpins.map((s) => ({
          id: `spin-${s.id}`,
          type: 'spin' as const,
          customerName: s.customerName || 'Unknown',
          description: s.prizeWon ? `Won: ${s.prizeWon}` : 'Spun the wheel',
          timestamp: s.spunAt,
        })),
      ]
        .filter((a) => a.timestamp)
        .sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime())
        .slice(0, 8);

      const attention: Record<string, number | boolean> = {
        readyToRedeem: cardCounts[0]?.readyToRedeem ?? 0,
        nearReward: cardCounts[0]?.nearReward ?? 0,
        inactive30d: cardCounts[0]?.inactive30d ?? 0,
      };

      let todaysShifts: { employeeName: string; startTime: string; endTime: string }[] = [];
      if (hasShiftProduct) {
        const [shiftRows, [tomorrowCount]] = await Promise.all([
          db.select({
            employeeName: shifts.employeeName,
            startTime: shifts.startTime,
            endTime: shifts.endTime,
          }).from(shifts)
            .where(and(eq(shifts.storeId, storeId), eq(shifts.shiftDate, toDateStr(todayStart))))
            .orderBy(asc(shifts.startTime)),
          db.select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(shifts)
            .where(and(eq(shifts.storeId, storeId), eq(shifts.shiftDate, toDateStr(tomorrow)))),
        ]);
        todaysShifts = shiftRows;
        attention.noShiftsTomorrow = (tomorrowCount?.count ?? 0) === 0;
      }

      res.json({
        today: {
          stamps: todayCounts.stamps,
          spins: todayCounts.spins,
          newMembers: newMembersToday[0]?.count ?? 0,
        },
        week: {
          stamps: weekCounts[0]?.stamps ?? 0,
          stampsPrevWeek: weekCounts[0]?.stampsPrevWeek ?? 0,
        },
        attention,
        todaysShifts,
        trend7d,
        recentActivity,
      });
    } catch (error: any) {
      console.error('[dashboard/summary] failed:', error);
      res.status(500).json({ error: "Failed to load dashboard summary" });
    }
  });

  app.get("/api/analytics/summary", requireAuth, requireSubscription, requirePermission('analytics'), async (req, res) => {
    try {
      const storeId = req.storeId!;
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const monthCounts = (from: Date, to?: Date) => {
        const txWhere = and(
          eq(loyaltyTransactions.storeId, storeId),
          gte(loyaltyTransactions.createdAt, from),
          ...(to ? [lt(loyaltyTransactions.createdAt, to)] : []),
        );
        return Promise.all([
          db.select({
            visits: sql<number>`count(*) filter (where ${loyaltyTransactions.type} = 'stamp')`.mapWith(Number),
            rewards: sql<number>`count(*) filter (where ${loyaltyTransactions.type} = 'reward')`.mapWith(Number),
          }).from(loyaltyTransactions).where(txWhere),
          db.select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(customers)
            .where(and(
              eq(customers.storeId, storeId),
              gte(customers.createdAt, from),
              ...(to ? [lt(customers.createdAt, to)] : []),
            )),
          db.select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(spins)
            .where(and(
              eq(spins.storeId, storeId),
              gte(spins.spunAt, from),
              ...(to ? [lt(spins.spunAt, to)] : []),
            )),
        ]).then(([[tx], [nm], [sp]]) => ({
          visits: tx?.visits ?? 0,
          newMembers: nm?.count ?? 0,
          spins: sp?.count ?? 0,
          rewards: tx?.rewards ?? 0,
        }));
      };

      const [thisMonth, lastMonth, repeatRows, dowRows, topRows] = await Promise.all([
        monthCounts(thisMonthStart),
        monthCounts(lastMonthStart, thisMonthStart),
        db.execute(sql`
          select
            coalesce(avg(cnt) filter (where cnt >= 2), 0)::float as avg_visits,
            count(*) filter (where cnt = 1)::int as single_visit,
            count(*) filter (where cnt >= 2)::int as repeat_members
          from (
            select ${loyaltyTransactions.loyaltyCardId} as card_id, count(*)::int as cnt
            from ${loyaltyTransactions}
            where ${loyaltyTransactions.storeId} = ${storeId}
              and ${loyaltyTransactions.type} = 'stamp'
              and ${loyaltyTransactions.createdAt} >= ${thisMonthStart}
            group by 1
          ) t
        `),
        db.select({
          dow: sql<number>`extract(dow from ${loyaltyTransactions.createdAt})::int`.mapWith(Number),
          count: sql<number>`count(*)`.mapWith(Number),
        }).from(loyaltyTransactions)
          .where(and(
            eq(loyaltyTransactions.storeId, storeId),
            eq(loyaltyTransactions.type, 'stamp'),
            gte(loyaltyTransactions.createdAt, days60Ago),
          ))
          .groupBy(sql`extract(dow from ${loyaltyTransactions.createdAt})`),
        db.select({
          name: customers.name,
          visits: sql<number>`count(*)`.mapWith(Number),
          lastVisit: sql<string>`to_char(max(${loyaltyTransactions.createdAt}), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
        }).from(loyaltyTransactions)
          .innerJoin(loyaltyCards, eq(loyaltyTransactions.loyaltyCardId, loyaltyCards.id))
          .innerJoin(customers, eq(loyaltyCards.customerId, customers.id))
          .where(and(
            eq(loyaltyTransactions.storeId, storeId),
            eq(loyaltyTransactions.type, 'stamp'),
          ))
          .groupBy(customers.id, customers.name)
          .orderBy(desc(sql`count(*)`))
          .limit(10),
      ]);

      const repeatRow: any = (repeatRows as any).rows?.[0] ?? {};
      const repeatRate = {
        avgVisitsRepeatMembers: Math.round((Number(repeatRow.avg_visits) || 0) * 10) / 10,
        singleVisitMembers: Number(repeatRow.single_visit) || 0,
        repeatMembers: Number(repeatRow.repeat_members) || 0,
      };

      // Monday-first: DOW 1..6 then 0 (Sunday)
      const visitsByDayOfWeek = [1, 2, 3, 4, 5, 6, 0].map(
        (dow) => dowRows.find((r) => r.dow === dow)?.count ?? 0,
      );

      const topCustomers = topRows.map((r) => ({
        name: r.name || 'Unknown',
        visits: r.visits,
        lastVisit: r.lastVisit,
      }));

      res.json({ thisMonth, lastMonth, repeatRate, visitsByDayOfWeek, topCustomers });
    } catch (error: any) {
      console.error('[analytics/summary] failed:', error);
      res.status(500).json({ error: "Failed to load analytics summary" });
    }
  });

  // Shifts Routes
  app.get("/api/shifts", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const allShifts = await db
        .select()
        .from(shifts)
        .where(eq(shifts.storeId, req.storeId!))
        .orderBy(asc(shifts.shiftDate), asc(shifts.startTime));

      res.json(allShifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shifts", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      
      const [shift] = await db
        .insert(shifts)
        .values({
          ...validatedData,
          storeId: req.storeId!,
          userId: req.user!.id,
        })
        .returning();

      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/shifts/copy-to-next-week", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const { weekStart, dates } = z.object({
        weekStart: z.string(),
        dates: z.array(z.string()).optional(),
      }).parse(req.body);

      const weekStartDate = new Date(weekStart + "T00:00:00");
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const startStr = weekStart.substring(0, 10);
      const endStr = weekEndDate.toISOString().substring(0, 10);

      const nextWeekStartDate = new Date(weekStartDate);
      nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
      const nextWeekEndDate = new Date(nextWeekStartDate);
      nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 6);
      const nextWeekStartStr = nextWeekStartDate.toISOString().substring(0, 10);
      const nextWeekEndStr = nextWeekEndDate.toISOString().substring(0, 10);

      const weekShifts = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.storeId, req.storeId!),
            gte(shifts.shiftDate, startStr),
            lte(shifts.shiftDate, endStr)
          )
        );

      const shiftsToCopy = (dates && dates.length > 0)
        ? weekShifts.filter(s => dates.includes(s.shiftDate))
        : weekShifts;

      if (shiftsToCopy.length === 0) {
        return res.json({ copied: 0, nextWeekHadShifts: false });
      }

      const nextWeekExisting = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.storeId, req.storeId!),
            gte(shifts.shiftDate, nextWeekStartStr),
            lte(shifts.shiftDate, nextWeekEndStr)
          )
        );

      const nextWeekHadShifts = nextWeekExisting.length > 0;

      const newShifts = shiftsToCopy.map(shift => {
        const [y, m, d] = shift.shiftDate.split("-").map(Number);
        const shifted = new Date(Date.UTC(y, m - 1, d + 7));
        const newDateStr = shifted.toISOString().substring(0, 10);
        return {
          storeId: req.storeId!,
          userId: req.user!.id,
          employeeName: shift.employeeName,
          employeeRole: shift.employeeRole,
          shiftDate: newDateStr,
          startTime: shift.startTime,
          endTime: shift.endTime,
          notes: shift.notes,
        };
      });

      await db.insert(shifts).values(newShifts);

      res.json({ copied: newShifts.length, nextWeekHadShifts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/shifts/:id", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      
      const [shift] = await db
        .update(shifts)
        .set(validatedData)
        .where(
          and(
            eq(shifts.id, req.params.id),
            eq(shifts.storeId, req.storeId!)
          )
        )
        .returning();

      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/shifts/:id", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      await db
        .delete(shifts)
        .where(
          and(
            eq(shifts.id, req.params.id),
            eq(shifts.storeId, req.storeId!)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shift PIN Management
  app.post("/api/shift-pin", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const { pin } = z.object({ pin: z.string().min(4).max(6) }).parse(req.body);
      
      if (!req.storeId) {
        return res.status(400).json({ error: "No active store selected" });
      }

      const hashedPin = await hashPassword(pin);

      // Shift PINs are per-store. We intentionally do NOT write the account-level
      // users.shiftAccessPin (legacy/deprecated) so a PIN can't leak across stores.
      await db
        .update(stores)
        .set({ shiftAccessPin: hashedPin })
        .where(and(eq(stores.id, req.storeId), eq(stores.userId, req.user!.id)));

      res.json({ success: true, pin });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/shift-pin", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      if (req.storeId) {
        const [store] = await db
          .select({ shiftAccessPin: stores.shiftAccessPin })
          .from(stores)
          .where(and(eq(stores.id, req.storeId), eq(stores.userId, req.user!.id)))
          .limit(1);
        // Per-store only — no account-level fallback.
        return res.json({ hasPIN: !!store?.shiftAccessPin });
      }
      res.json({ hasPIN: false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Timeframe Presets Routes
  app.get("/api/timeframe-presets", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const presets = await db
        .select()
        .from(timeframePresets)
        .where(eq(timeframePresets.storeId, req.storeId!))
        .orderBy(asc(timeframePresets.name));

      res.json(presets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/timeframe-presets", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const validatedData = insertTimeframePresetSchema.parse(req.body);
      
      const [preset] = await db
        .insert(timeframePresets)
        .values({
          ...validatedData,
          storeId: req.storeId!,
          userId: req.user!.id,
        })
        .returning();

      res.json(preset);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/timeframe-presets/:id", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const validatedData = insertTimeframePresetSchema.parse(req.body);
      
      const [preset] = await db
        .update(timeframePresets)
        .set(validatedData)
        .where(
          and(
            eq(timeframePresets.id, req.params.id),
            eq(timeframePresets.storeId, req.storeId!)
          )
        )
        .returning();

      if (!preset) {
        return res.status(404).json({ error: "Preset not found" });
      }

      res.json(preset);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/timeframe-presets/:id", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      await db
        .delete(timeframePresets)
        .where(
          and(
            eq(timeframePresets.id, req.params.id),
            eq(timeframePresets.storeId, req.storeId!)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public Crew Shifts View
  app.post("/api/shifts/public/:username", pinValidationLimiter, async (req, res) => {
    try {
      const { pin } = z.object({ pin: z.string() }).parse(req.body);

      // Find store by shopName first, fall back to user shopName for backward compat
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.shopName, req.params.username))
        .limit(1);

      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }

      // Get the PIN from store first, fall back to user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, store.userId))
        .limit(1);

      // Per-store PIN only — no account-level fallback, so one store's PIN can
      // never authenticate another store.
      const storedPin = store.shiftAccessPin;
      if (!storedPin) {
        return res.status(401).json({ error: "No PIN configured" });
      }

      let isPinValid = false;
      if (storedPin.includes('.')) {
        isPinValid = await comparePasswords(pin, storedPin);
      } else {
        isPinValid = storedPin === pin;
        if (isPinValid) {
          // Upgrade a legacy plaintext store PIN to a hash in place.
          const hashedPin = await hashPassword(pin);
          await db.update(stores).set({ shiftAccessPin: hashedPin }).where(eq(stores.id, store.id));
        }
      }

      if (!isPinValid) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      const now = new Date();
      const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7))
        .toISOString().substring(0, 10);
      const rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 35))
        .toISOString().substring(0, 10);

      const allShifts = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.storeId, store.id),
            gte(shifts.shiftDate, rangeStart),
            lte(shifts.shiftDate, rangeEnd)
          )
        )
        .orderBy(asc(shifts.shiftDate), asc(shifts.startTime));

      const merchant = {
        shopName: store.shopName,
        logo: store.logo || user?.logo,
        cardBackgroundColor: store.cardBackgroundColor || user?.cardBackgroundColor,
      };

      res.json({ shifts: allShifts, merchant });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"]!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId && session.subscription) {
        await db
          .update(users)
          .set({
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          })
          .where(eq(users.id, userId));
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      
      await db
        .update(users)
        .set({
          subscriptionStatus: subscription.status,
        })
        .where(eq(users.stripeCustomerId, subscription.customer as string));
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      await db
        .update(users)
        .set({
          subscriptionStatus: "canceled",
        })
        .where(eq(users.stripeCustomerId, subscription.customer as string));
    }

    res.json({ received: true });
  });

  // Subuser Management Routes
  
  // Create subuser (owner only)
  app.post("/api/subusers", ownerOnly, async (req: Request, res: Response) => {

    try {
      const { email, permissions } = insertSubuserSchema
        .pick({ email: true, permissions: true })
        .parse(req.body);

      // Validate storeIds if provided (null = all stores; array must be non-empty)
      let storeIds: string[] | null = null;
      if (Array.isArray(req.body.storeIds)) {
        const requestedIds: string[] = req.body.storeIds;
        if (requestedIds.length === 0) {
          return res.status(400).json({ error: "storeIds must not be empty; omit the field or set null to grant access to all stores" });
        }
        // Verify every ID belongs to this owner
        const ownerStores = await db
          .select({ id: stores.id })
          .from(stores)
          .where(eq(stores.userId, req.user!.id));
        const ownerStoreIds = new Set(ownerStores.map(s => s.id));
        const invalid = requestedIds.filter(id => !ownerStoreIds.has(id));
        if (invalid.length > 0) {
          return res.status(400).json({ error: "One or more store IDs are invalid" });
        }
        storeIds = requestedIds;
      }

      // Check if email already exists as user or subuser
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      const existingSubuser = await db.query.subusers.findFirst({
        where: eq(subusers.email, email),
      });

      if (existingUser || existingSubuser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Generate verification token
      const token = generateToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

      // Create subuser
      const [newSubuser] = await db
        .insert(subusers)
        .values({
          ownerId: req.user!.id,
          email,
          permissions: permissions || [],
          storeIds,
          verificationToken: token,
          verificationTokenExpiry: tokenExpiry,
          emailVerified: false,
        })
        .returning();

      // Get shop name for email
      const owner = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id),
      });

      // Send invitation email
      await sendSubuserInvitationEmail(
        email,
        owner?.shopName || 'the team',
        token,
        permissions || []
      );

      res.json({ 
        success: true, 
        subuser: { ...newSubuser, passwordHash: undefined } 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // List subusers (owner only)
  app.get("/api/subusers", ownerOnly, async (req: Request, res: Response) => {

    try {
      const subusersList = await db.query.subusers.findMany({
        where: eq(subusers.ownerId, req.user!.id),
        orderBy: [desc(subusers.createdAt)],
      });

      // Remove password hashes
      const sanitized = subusersList.map(({ passwordHash, ...rest }) => rest);

      res.json({ subusers: sanitized });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update subuser permissions and store access (owner only)
  app.patch("/api/subusers/:id", ownerOnly, async (req: Request, res: Response) => {

    try {
      const { id } = req.params;
      const { permissions } = req.body;

      // Validate storeIds if provided (null = all stores; array must be non-empty)
      let storeIds: string[] | null | undefined = undefined; // undefined = not changing
      if ('storeIds' in req.body) {
        if (req.body.storeIds === null) {
          storeIds = null; // explicitly requesting all-stores access
        } else if (Array.isArray(req.body.storeIds)) {
          const requestedIds: string[] = req.body.storeIds;
          if (requestedIds.length === 0) {
            return res.status(400).json({ error: "storeIds must not be empty; omit the field or set null to grant access to all stores" });
          }
          const ownerStores = await db
            .select({ id: stores.id })
            .from(stores)
            .where(eq(stores.userId, req.user!.id));
          const ownerStoreIds = new Set(ownerStores.map(s => s.id));
          const invalid = requestedIds.filter(sid => !ownerStoreIds.has(sid));
          if (invalid.length > 0) {
            return res.status(400).json({ error: "One or more store IDs are invalid" });
          }
          storeIds = requestedIds;
        }
      }

      // Verify subuser belongs to this owner
      const subuser = await db.query.subusers.findFirst({
        where: and(
          eq(subusers.id, id),
          eq(subusers.ownerId, req.user!.id)
        ),
      });

      if (!subuser) {
        return res.status(404).json({ error: "Subuser not found" });
      }

      // Update permissions and store access
      const updatePayload: { permissions?: string[]; storeIds?: string[] | null } = {};
      if (permissions !== undefined) updatePayload.permissions = permissions;
      if (storeIds !== undefined) updatePayload.storeIds = storeIds;

      const [updated] = await db
        .update(subusers)
        .set(updatePayload)
        .where(eq(subusers.id, id))
        .returning();

      res.json({ success: true, subuser: { ...updated, passwordHash: undefined } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete subuser (owner only)
  app.delete("/api/subusers/:id", ownerOnly, async (req: Request, res: Response) => {

    try {
      const { id } = req.params;

      // Verify subuser belongs to this owner
      const subuser = await db.query.subusers.findFirst({
        where: and(
          eq(subusers.id, id),
          eq(subusers.ownerId, req.user!.id)
        ),
      });

      if (!subuser) {
        return res.status(404).json({ error: "Subuser not found" });
      }

      await db.delete(subusers).where(eq(subusers.id, id));

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Subuser password setup (public route with token)
  app.post("/api/subuser-setup/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Find subuser by token
      const subuser = await db.query.subusers.findFirst({
        where: eq(subusers.verificationToken, token),
      });

      if (!subuser) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      // Check token expiry
      if (subuser.verificationTokenExpiry && new Date() > subuser.verificationTokenExpiry) {
        return res.status(400).json({ error: "Token has expired" });
      }

      // Hash password and update subuser
      const passwordHash = await hashPassword(password);
      await db
        .update(subusers)
        .set({
          passwordHash,
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(subusers.id, subuser.id));

      res.json({ success: true, message: "Password set successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
