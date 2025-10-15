import type { Express, Request, Response } from "express";
import { db } from "./db";
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
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { hashPassword, generateToken, comparePasswords } from "./auth";
import passport from "passport";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import QRCode from "qrcode";
import { GoogleWalletService, type LoyaltyPassData } from "./googleWallet";
import { sendVerificationEmail, sendPasswordResetEmail, sendSubuserInvitationEmail } from "./email";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { requirePermission, ownerOnly } from "./permissions";

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

// Product pricing configuration
const PRODUCT_PRICES = {
  'loyalty': 1000, // €10 in cents
  'spin': 800,     // €8 in cents
  'menu': 500,     // €5 in cents
  'shift': 1000,   // €10 in cents
};

// Calculate price based on selected products
function calculateProductPrice(products: string[]): number {
  const sortedProducts = [...products].sort();
  
  // All four products - Bundle discount (€24.99 instead of €33)
  if (sortedProducts.length === 4 && sortedProducts.includes('loyalty') && sortedProducts.includes('spin') && sortedProducts.includes('menu') && sortedProducts.includes('shift')) {
    return 2499;
  }
  // Individual prices for all other combinations
  else {
    return sortedProducts.reduce((sum, product) => {
      return sum + (PRODUCT_PRICES[product as keyof typeof PRODUCT_PRICES] || 0);
    }, 0);
  }
}

// Get product description based on selected products
function getProductDescription(products: string[]): string {
  const sortedProducts = [...products].sort();
  
  if (sortedProducts.length === 4 && sortedProducts.includes('loyalty') && sortedProducts.includes('spin') && sortedProducts.includes('menu') && sortedProducts.includes('shift')) {
    return "Complete Bundle: Loyalty Cards, Spin Wheel, Menu Builder & Shift Manager";
  } else if (sortedProducts.includes('loyalty')) {
    return "Access to Loyalty Cards feature";
  } else if (sortedProducts.includes('spin')) {
    return "Access to Spin Wheel feature";
  } else if (sortedProducts.includes('menu')) {
    return "Access to Menu Builder feature";
  } else if (sortedProducts.includes('shift')) {
    return "Access to Shift Manager feature";
  }
  
  return "No products selected";
}

let googleWalletService: GoogleWalletService | null = null;
try {
  googleWalletService = new GoogleWalletService();
} catch (error) {
  console.warn('Google Wallet service not initialized:', error);
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

  const hasActiveSubscription = req.user!.subscriptionStatus === "active";
  const hasActiveTrial = req.user!.trialEndsAt && new Date(req.user!.trialEndsAt) > new Date();

  if (hasActiveSubscription || hasActiveTrial) {
    return next();
  }

  res.status(403).json({ error: "Active subscription or trial required" });
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

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        // Explicitly save session to persist isSubuser and permissions
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Session save failed" });
          }
          res.json({ user });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        user: req.user,
        isSubuser: req.session.isSubuser || false,
        subuserId: req.session.subuserId,
        permissions: req.session.permissions || [],
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
      req.login(updatedUser, (err) => {
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
        price: calculateProductPrice(products),
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
        // Check if it's a valid data URL format
        const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
        if (!dataUrlRegex.test(menuBannerImage)) {
          return res.status(400).json({ error: "Invalid banner image format. Must be a valid image data URL (PNG, JPG, GIF, or WebP)" });
        }
        
        // Extract base64 data
        const base64Data = menuBannerImage.split(',')[1];
        if (!base64Data) {
          return res.status(400).json({ error: "Invalid banner image data" });
        }
        
        // Decode base64 to get actual byte size
        try {
          const buffer = Buffer.from(base64Data, 'base64');
          const sizeInBytes = buffer.length;
          const maxSizeBytes = 5 * 1024 * 1024; // 5MB
          
          if (sizeInBytes > maxSizeBytes) {
            return res.status(400).json({ error: "Banner image too large. Maximum size is 5MB" });
          }
          
          // Verify the buffer contains valid data
          if (buffer.length === 0) {
            return res.status(400).json({ error: "Invalid banner image: empty data" });
          }
        } catch (error) {
          return res.status(400).json({ error: "Invalid banner image: failed to decode base64 data" });
        }
      }
      
      const updateData: any = {
        shopName: shopName || req.user!.shopName,
        logo: logo || req.user!.logo,
      };
      
      if (menuBannerImage !== undefined) {
        updateData.menuBannerImage = menuBannerImage || null;
      }
      
      if (cardBackgroundColor) {
        updateData.cardBackgroundColor = cardBackgroundColor;
      }
      
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers", requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const customerList = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, req.user!.id))
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
      const shopUrl = `${protocol}://${host}/join/${req.user!.id}`;
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
      const menuUrl = `${protocol}://${host}/menu/${req.user!.id}`;
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
      const { userId, name, email, phone } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const customerQrCode = nanoid(12);
      
      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          name: name || null,
          email: email || null,
          phone: phone || null,
          customerQrCode,
        })
        .returning();

      const [loyaltyCard] = await db
        .insert(loyaltyCards)
        .values({
          userId,
          customerId: newCustomer.id,
          stamps: 0,
          maxStamps: 10,
          rewardText: "Free Reward",
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
      
      const [newCustomer] = await db
        .insert(customers)
        .values({
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
          userId: req.user!.id,
          customerId: newCustomer.id,
          stamps: 0,
          maxStamps: req.body.maxStamps || 10,
          rewardText: req.body.rewardText || "Free Reward",
        })
        .returning();

      res.json({ customer: newCustomer, loyaltyCard });
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
        .where(eq(loyaltyCards.userId, req.user!.id))
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
        .where(eq(loyaltyCards.userId, req.user!.id))
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
            eq(customers.userId, req.user!.id)
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
            eq(loyaltyCards.userId, req.user!.id)
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
            eq(loyaltyCards.userId, req.user!.id)
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
            eq(loyaltyCards.userId, req.user!.id)
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
        })
        .where(eq(loyaltyCards.id, req.params.cardId))
        .returning();

      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
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
        .where(eq(rewards.userId, req.user!.id))
        .orderBy(desc(rewards.createdAt));
      res.json(rewardList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rewards/public/:userId", async (req, res) => {
    try {
      const rewardList = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.userId, req.params.userId),
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
            eq(rewards.userId, req.user!.id)
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
            eq(rewards.userId, req.user!.id)
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
            eq(spins.userId, req.user!.id),
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
        .where(eq(spinTokens.userId, req.user!.id))
        .orderBy(desc(spinTokens.createdAt));
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

      const activeRewards = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.userId, token.userId),
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

  app.post("/api/spin-in-store/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const activeRewards = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.userId, userId),
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

  app.post("/api/customer-spin/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const activeRewards = await db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.userId, userId),
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
        rewardId: selectedReward.id,
        userId: userId,
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
            eq(spinTokens.userId, req.user!.id)
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

  app.get("/api/spin-in-store-qr/:userId", requireSubscription, requirePermission('spin'), async (req, res) => {
    try {
      if (req.params.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const protocol = req.protocol;
      const host = req.get("host");
      const spinUrl = `${protocol}://${host}/spin-in-store/${req.user!.id}`;
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

      const price = calculateProductPrice(selectedProducts);
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
          user: users,
        })
        .from(loyaltyCards)
        .leftJoin(customers, eq(loyaltyCards.customerId, customers.id))
        .leftJoin(users, eq(loyaltyCards.userId, users.id))
        .where(eq(customers.id, req.params.customerId))
        .limit(1);

      if (!result || !result.customer || !result.user) {
        return res.status(404).send("Loyalty card not found");
      }

      const passData: LoyaltyPassData = {
        customerId: result.customer.id,
        customerName: result.customer.name!,
        shopName: result.user.shopName,
        stamps: result.card.stamps,
        maxStamps: result.card.maxStamps,
        rewardText: result.card.rewardText || 'Loyalty Reward',
        customerQrCode: result.customer.customerQrCode || result.customer.id,
      };

      const saveUrl = await googleWalletService.createLoyaltyPass(
        passData,
        result.user.id,
        result.user.logo,
        result.user.cardBackgroundColor
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
      const [result] = await db
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

      if (!result) {
        return res.status(404).send("Loyalty card not found");
      }

      res.status(501).send(`
        <html>
          <head><title>Apple Wallet Setup Required</title></head>
          <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>🔧 Apple Wallet Setup Required</h1>
            <p>To enable Apple Wallet passes, you need to:</p>
            <ol>
              <li>Enroll in Apple Developer Program ($99/year)</li>
              <li>Create a Pass Type ID in Apple Developer Portal</li>
              <li>Generate and download a Pass Signing Certificate</li>
              <li>Install the <code>passkit-generator</code> npm package</li>
              <li>Create a .pass template folder with icons and pass.json</li>
              <li>Add certificate files to the server</li>
            </ol>
            <p><strong>Customer:</strong> ${result.customer?.name || 'Customer'}<br>
            <strong>Points:</strong> ${result.card.stamps}/${result.card.maxStamps}</p>
            <p><a href="https://developer.apple.com/documentation/walletpasses">View Apple Wallet Documentation →</a></p>
          </body>
        </html>
      `);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/messages", requireAuth, requireSubscription, requirePermission('loyalty'), async (req, res) => {
    try {
      const validatedData = sendMessageSchema.parse(req.body);
      const user = req.user!;

      const customerList = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, user.id));

      const classId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_${user.id}`;

      if (googleWalletService) {
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
          userId: user.id,
          header: validatedData.header || null,
          body: validatedData.body,
          displayStartTime: validatedData.displayStartTime,
          displayEndTime: validatedData.displayEndTime,
          messageType: "TEXT_AND_NOTIFY",
          recipientCount: customerList.length,
        })
        .returning();

      res.json({ success: true, message });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  // Menu Categories Routes
  app.get("/api/menu-categories", requireSubscription, requirePermission('menu'), async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.userId, req.user!.id))
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
            eq(menuCategories.userId, req.user!.id)
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
            eq(menuCategories.userId, req.user!.id)
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
        .where(eq(menuItems.userId, req.user!.id))
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
            eq(menuCategories.userId, req.user!.id)
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
            eq(menuCategories.userId, req.user!.id)
          )
        )
        .limit(1);

      if (!category) {
        return res.status(403).json({ error: "Category not found or unauthorized" });
      }
      
      const [newItem] = await db
        .insert(menuItems)
        .values({
          userId: req.user!.id,
          categoryId: validatedData.categoryId,
          name: validatedData.name,
          description: validatedData.description || null,
          price: validatedData.price,
          imageUrl: validatedData.imageUrl || null,
          displayOrder: validatedData.displayOrder ?? 0,
        })
        .returning();

      // Handle image upload ACL
      if (validatedData.imageUrl && validatedData.imageUrl.startsWith("https://storage.googleapis.com/")) {
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          validatedData.imageUrl,
          {
            owner: req.user!.id,
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
              eq(menuCategories.userId, req.user!.id)
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
            eq(menuItems.userId, req.user!.id)
          )
        )
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Handle image upload ACL
      if (validatedData.imageUrl && validatedData.imageUrl.startsWith("https://storage.googleapis.com/")) {
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          validatedData.imageUrl,
          {
            owner: req.user!.id,
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
            eq(menuItems.userId, req.user!.id)
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
              eq(menuItems.userId, req.user!.id)
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
  app.get("/api/menu/:userId", async (req, res) => {
    try {
      const [merchant] = await db
        .select({
          shopName: users.shopName,
          logo: users.logo,
          cardBackgroundColor: users.cardBackgroundColor,
          menuBannerImage: users.menuBannerImage,
        })
        .from(users)
        .where(eq(users.id, req.params.userId))
        .limit(1);

      if (!merchant) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      const categories = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.userId, req.params.userId))
        .orderBy(asc(menuCategories.displayOrder));

      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.userId, req.params.userId))
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
        .where(eq(crewMembers.userId, req.user!.id))
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
          userId: req.user!.id,
        })
        .returning();

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
            eq(crewMembers.userId, req.user!.id)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shifts Routes
  app.get("/api/shifts", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const allShifts = await db
        .select()
        .from(shifts)
        .where(eq(shifts.userId, req.user!.id))
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
          userId: req.user!.id,
        })
        .returning();

      res.json(shift);
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
            eq(shifts.userId, req.user!.id)
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
            eq(shifts.userId, req.user!.id)
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
      
      // Hash the PIN using the same secure hashing as passwords
      const hashedPin = await hashPassword(pin);
      
      await db
        .update(users)
        .set({ shiftAccessPin: hashedPin })
        .where(eq(users.id, req.user!.id));

      // Return the plaintext PIN once so the user can save it
      res.json({ success: true, pin });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/shift-pin", requireAuth, requireSubscription, requirePermission('shift'), async (req, res) => {
    try {
      const [user] = await db
        .select({ shiftAccessPin: users.shiftAccessPin })
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      // Only return metadata indicating if a PIN exists, never the actual PIN
      res.json({ hasPIN: !!user?.shiftAccessPin });
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
        .where(eq(timeframePresets.userId, req.user!.id))
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
            eq(timeframePresets.userId, req.user!.id)
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
            eq(timeframePresets.userId, req.user!.id)
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
      
      // Find user by shop name (username)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.shopName, req.params.username))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "Store not found" });
      }

      if (!user.shiftAccessPin) {
        return res.status(401).json({ error: "No PIN configured" });
      }

      // Verify PIN using secure comparison
      // Check if PIN is hashed (contains ".") or plaintext (backward compatibility)
      let isPinValid = false;
      if (user.shiftAccessPin.includes('.')) {
        // Hashed PIN - use secure comparison with constant-time algorithm
        isPinValid = await comparePasswords(pin, user.shiftAccessPin);
      } else {
        // Legacy plaintext PIN - still compare but this shouldn't exist after migration
        isPinValid = user.shiftAccessPin === pin;
        
        // Automatically upgrade to hashed PIN if valid
        if (isPinValid) {
          const hashedPin = await hashPassword(pin);
          await db
            .update(users)
            .set({ shiftAccessPin: hashedPin })
            .where(eq(users.id, user.id));
        }
      }

      if (!isPinValid) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      // Get shifts
      const allShifts = await db
        .select()
        .from(shifts)
        .where(eq(shifts.userId, user.id))
        .orderBy(asc(shifts.shiftDate), asc(shifts.startTime));

      // Get merchant branding
      const merchant = {
        shopName: user.shopName,
        logo: user.logo,
        cardBackgroundColor: user.cardBackgroundColor,
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
          ownerId: req.user.id,
          email,
          permissions: permissions || [],
          verificationToken: token,
          verificationTokenExpiry: tokenExpiry,
          emailVerified: false,
        })
        .returning();

      // Get shop name for email
      const owner = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
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
        where: eq(subusers.ownerId, req.user.id),
        orderBy: [desc(subusers.createdAt)],
      });

      // Remove password hashes
      const sanitized = subusersList.map(({ passwordHash, ...rest }) => rest);

      res.json({ subusers: sanitized });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update subuser permissions (owner only)
  app.patch("/api/subusers/:id", ownerOnly, async (req: Request, res: Response) => {

    try {
      const { id } = req.params;
      const { permissions } = req.body;

      // Verify subuser belongs to this owner
      const subuser = await db.query.subusers.findFirst({
        where: and(
          eq(subusers.id, id),
          eq(subusers.ownerId, req.user.id)
        ),
      });

      if (!subuser) {
        return res.status(404).json({ error: "Subuser not found" });
      }

      // Update permissions
      const [updated] = await db
        .update(subusers)
        .set({ permissions })
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
          eq(subusers.ownerId, req.user.id)
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
