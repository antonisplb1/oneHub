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
  signupSchema,
  loginSchema,
  createRewardSchema,
  createTokenSchema,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { hashPassword, generateToken } from "./auth";
import passport from "passport";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import QRCode from "qrcode";
import { GoogleWalletService, type LoyaltyPassData } from "./googleWallet";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import rateLimit from "express-rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

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
  if (req.isAuthenticated() && req.user!.emailVerified && req.user!.subscriptionStatus === "active") {
    return next();
  }
  res.status(403).json({ error: "Active subscription required" });
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

export function registerRoutes(app: Express) {
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
        res.json({ user });
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
      res.json({ user: req.user });
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

      const [updatedUser] = await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          stripeCustomerId: stripeCustomer.id,
        })
        .where(eq(users.id, user.id))
        .returning();

      res.json({ 
        success: true, 
        message: "Email verified successfully! You can now log in.",
        user: updatedUser
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

  app.patch("/api/user/profile", requireSubscription, async (req, res) => {
    try {
      const { shopName, logo } = req.body;
      
      const [updatedUser] = await db
        .update(users)
        .set({
          shopName: shopName || req.user!.shopName,
          logo: logo || req.user!.logo,
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers", requireSubscription, async (req, res) => {
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

  app.post("/api/customers", requireSubscription, async (req, res) => {
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

  app.get("/api/loyalty-cards", requireSubscription, async (req, res) => {
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

  app.post("/api/loyalty-cards/scan-stamp", requireSubscription, async (req, res) => {
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

  app.post("/api/loyalty-cards/:cardId/stamp", requireSubscription, async (req, res) => {
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

  app.post("/api/loyalty-cards/:cardId/redeem", requireSubscription, async (req, res) => {
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

  app.get("/api/rewards", requireSubscription, async (req, res) => {
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

  app.post("/api/rewards", requireSubscription, async (req, res) => {
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

  app.patch("/api/rewards/:rewardId", requireSubscription, async (req, res) => {
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

  app.delete("/api/rewards/:rewardId", requireSubscription, async (req, res) => {
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

  app.get("/api/spins", requireSubscription, async (req, res) => {
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

  app.get("/api/spin-tokens", requireSubscription, async (req, res) => {
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

  app.post("/api/spin-tokens", requireSubscription, async (req, res) => {
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

  app.get("/api/spin-token/:tokenId/qr", requireSubscription, async (req, res) => {
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

  app.get("/api/spin-in-store-qr/:userId", requireSubscription, async (req, res) => {
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

  app.post("/api/stripe/create-checkout-session", requireAuth, async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: req.user!.stripeCustomerId!,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "Professional Plan",
                description: "Unlimited customers, loyalty cards & prize wheels",
              },
              unit_amount: 2500,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/payment-processing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription-required`,
        metadata: {
          userId: req.user!.id,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stripe/verify-session/:sessionId", requireAuth, async (req, res) => {
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

  app.post("/api/stripe/create-portal-session", requireAuth, async (req, res) => {
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
        result.user.logo
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
}
