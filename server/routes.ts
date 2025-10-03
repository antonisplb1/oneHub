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
import { hashPassword } from "./auth";
import passport from "passport";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import QRCode from "qrcode";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

function requireAuth(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

export function registerRoutes(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = await hashPassword(validatedData.password);
      
      const stripeCustomer = await stripe.customers.create({
        email: validatedData.email,
        name: validatedData.shopName,
      });

      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          passwordHash,
          shopName: validatedData.shopName,
          stripeCustomerId: stripeCustomer.id,
        })
        .returning();

      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after signup" });
        }
        res.json({ user: newUser });
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

  app.patch("/api/user/profile", requireAuth, async (req, res) => {
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

  app.get("/api/customers", requireAuth, async (req, res) => {
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

  app.get("/api/shop-qr-code", requireAuth, async (req, res) => {
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

  app.post("/api/customers", requireAuth, async (req, res) => {
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

  app.get("/api/loyalty-cards", requireAuth, async (req, res) => {
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

  app.post("/api/loyalty-cards/:cardId/stamp", requireAuth, async (req, res) => {
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

      res.json(updatedCard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty-cards/:cardId/redeem", requireAuth, async (req, res) => {
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

      res.json(updatedCard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rewards", requireAuth, async (req, res) => {
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

  app.post("/api/rewards", requireAuth, async (req, res) => {
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

  app.patch("/api/rewards/:rewardId", requireAuth, async (req, res) => {
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

  app.get("/api/spin-tokens", requireAuth, async (req, res) => {
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

  app.post("/api/spin-tokens", requireAuth, async (req, res) => {
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

  app.get("/api/spin-token/:tokenId/qr", requireAuth, async (req, res) => {
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

  app.get("/api/spin-in-store-qr/:userId", requireAuth, async (req, res) => {
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
        success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/dashboard`,
        metadata: {
          userId: req.user!.id,
        },
      });

      res.json({ url: session.url });
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
