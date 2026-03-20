import { db } from "./db";
import { hashPassword } from "./auth";
import {
  users, customers, loyaltyCards, loyaltyTransactions,
  rewards, spinTokens, spins,
  menuCategories, menuItems,
  crewMembers, shifts, timeframePresets,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const DEMO_EMAIL = "demo@unihub.live";
const DEMO_SHOP_NAME = "unihub-demo";
const DEMO_PASSWORD = "DemoDemo";
const DEMO_SHIFT_PIN = "1234";

function randomQr() {
  return randomBytes(16).toString("hex");
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(offset: number) {
  const d = new Date("2026-03-16");
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export async function seedDemoAccount(): Promise<{ success: boolean; message: string }> {
  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing.length > 0) {
    return { success: false, message: "Demo account already exists" };
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const [user] = await db.insert(users).values({
    email: DEMO_EMAIL,
    passwordHash,
    shopName: DEMO_SHOP_NAME,
    emailVerified: true,
    subscriptionStatus: "active",
    selectedProducts: ["loyalty", "spin", "menu", "shift"],
    cardBackgroundColor: "#4285F4",
    shiftAccessPin: DEMO_SHIFT_PIN,
    verificationToken: null,
    verificationTokenExpiry: null,
  }).returning();

  const uid = user.id;

  // ── CUSTOMERS & LOYALTY CARDS ────────────────────────────────────────────
  const customerData = [
    { name: "Sophie Martin",    email: "sophie.m@email.com",   stamps: 2  },
    { name: "James O'Brien",    email: "james.ob@email.com",   stamps: 3  },
    { name: "Layla Hassan",     email: "layla.h@email.com",    stamps: 4  },
    { name: "Carlos Reyes",     email: "carlos.r@email.com",   stamps: 5  },
    { name: "Mei Lin",          email: "mei.lin@email.com",    stamps: 6  },
    { name: "Noah Williams",    email: "noah.w@email.com",     stamps: 7  },
    { name: "Amara Osei",       email: "amara.o@email.com",    stamps: 7  },
    { name: "Elijah Turner",    email: "elijah.t@email.com",   stamps: 8  },
    { name: "Isla Murray",      email: "isla.m@email.com",     stamps: 9  },
    { name: "Luca Ferrari",     email: "luca.f@email.com",     stamps: 9  },
    { name: "Priya Sharma",     email: "priya.s@email.com",    stamps: 10 },
    { name: "Finn Eriksson",    email: "finn.e@email.com",     stamps: 10 },
    { name: "Zara Ahmed",       email: "zara.a@email.com",     stamps: 10 },
    { name: "Marcus Johnson",   email: "marcus.j@email.com",   stamps: 3  },
    { name: "Chiara Bianchi",   email: "chiara.b@email.com",   stamps: 6  },
  ];

  for (const cd of customerData) {
    const [cust] = await db.insert(customers).values({
      userId: uid,
      name: cd.name,
      email: cd.email,
      customerQrCode: randomQr(),
    }).returning();

    const isRedeemable = cd.stamps >= 10;
    const [card] = await db.insert(loyaltyCards).values({
      userId: uid,
      customerId: cust.id,
      stamps: cd.stamps,
      maxStamps: 10,
      rewardText: "Free Coffee",
      isRedeemable,
      totalRewards: isRedeemable ? 1 : 0,
      lastStampAt: daysAgo(Math.floor(Math.random() * 7) + 1),
    }).returning();

    // stamp transactions
    for (let i = 0; i < cd.stamps; i++) {
      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        type: "stamp",
        amount: 1,
        description: "Stamp added",
        createdAt: daysAgo(cd.stamps - i + Math.floor(Math.random() * 3)),
      });
    }

    if (isRedeemable) {
      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        type: "reward",
        amount: 1,
        description: "Free Coffee redeemed",
        createdAt: daysAgo(1),
      });
    }
  }

  // ── SPIN WHEEL PRIZES ────────────────────────────────────────────────────
  const prizeData = [
    { name: "Free Coffee",        description: "One free coffee of your choice", winChance: 10, timesWon: 12 },
    { name: "10% Off",            description: "10% off your next order",         winChance: 20, timesWon: 18 },
    { name: "20% Off",            description: "20% off your next order",         winChance: 15, timesWon: 9  },
    { name: "Free Pastry",        description: "One free pastry with any drink",  winChance: 12, timesWon: 8  },
    { name: "Buy 1 Get 1 Free",   description: "Buy one, get one free",           winChance: 8,  timesWon: 5  },
    { name: "Free Upgrade",       description: "Free size upgrade on any drink",  winChance: 15, timesWon: 6  },
    { name: "€5 Voucher",         description: "€5 off any purchase over €10",   winChance: 5,  timesWon: 2  },
    { name: "Try Again",          description: "Better luck next time!",          winChance: 15, timesWon: 0  },
  ];

  const insertedRewards: { id: string; name: string }[] = [];
  for (const p of prizeData) {
    const [r] = await db.insert(rewards).values({
      userId: uid,
      name: p.name,
      description: p.description,
      winChance: p.winChance,
      isActive: true,
      timesWon: p.timesWon,
      createdAt: daysAgo(30),
    }).returning();
    insertedRewards.push({ id: r.id, name: r.name });
  }

  // spin history (60 entries over past 14 days)
  for (let i = 0; i < 60; i++) {
    const reward = insertedRewards[Math.floor(Math.random() * (insertedRewards.length - 1))];
    const daysBack = Math.floor(Math.random() * 14);
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 1);

    const [token] = await db.insert(spinTokens).values({
      userId: uid,
      token: randomQr(),
      customerName: customerData[Math.floor(Math.random() * customerData.length)].name,
      isUsed: true,
      usedAt: daysAgo(daysBack),
      expiresAt: tokenExpiry,
      createdAt: daysAgo(daysBack),
    }).returning();

    await db.insert(spins).values({
      tokenId: token.id,
      rewardId: reward.id,
      userId: uid,
      prizeWon: reward.name,
      type: "token",
      spunAt: daysAgo(daysBack),
    });
  }

  // ── MENU ─────────────────────────────────────────────────────────────────
  const menuData = [
    {
      name: "Coffee & Drinks",
      order: 0,
      items: [
        { name: "Espresso",          description: "Rich, bold single shot",            price: 2.50 },
        { name: "Americano",         description: "Espresso with hot water",            price: 3.00 },
        { name: "Flat White",        description: "Double espresso with microfoam",     price: 3.80 },
        { name: "Cappuccino",        description: "Equal parts espresso, milk, foam",   price: 3.80 },
        { name: "Latte",             description: "Espresso with steamed milk",         price: 4.00 },
        { name: "Mocha",             description: "Chocolate espresso with milk",       price: 4.20 },
        { name: "Cold Brew",         description: "Slow-steeped, served over ice",      price: 4.50 },
        { name: "Matcha Latte",      description: "Ceremonial grade matcha with oat milk", price: 4.50 },
        { name: "Hot Chocolate",     description: "Rich Belgian chocolate",             price: 3.80 },
        { name: "Chai Latte",        description: "Spiced chai with steamed milk",      price: 4.00 },
      ],
    },
    {
      name: "Breakfast",
      order: 1,
      items: [
        { name: "Avocado Toast",     description: "Sourdough, smashed avocado, chilli", price: 8.50 },
        { name: "Full Irish",        description: "Bacon, egg, sausage, beans, toast",  price: 11.00 },
        { name: "Eggs Benedict",     description: "Poached eggs, hollandaise on muffin", price: 10.50 },
        { name: "Granola Bowl",      description: "Housemade granola, yogurt, berries", price: 7.50 },
        { name: "Pancake Stack",     description: "Buttermilk pancakes with maple syrup", price: 9.00 },
        { name: "Smoked Salmon Bagel", description: "Cream cheese, capers, red onion", price: 10.00 },
      ],
    },
    {
      name: "Pastries & Desserts",
      order: 2,
      items: [
        { name: "Butter Croissant",  description: "Freshly baked, flaky and buttery",  price: 3.20 },
        { name: "Almond Croissant",  description: "Filled with almond frangipane",     price: 3.80 },
        { name: "Pain au Chocolat",  description: "Dark chocolate in a pastry shell",  price: 3.50 },
        { name: "Blueberry Muffin",  description: "Bursting with fresh blueberries",   price: 3.20 },
        { name: "Carrot Cake",       description: "With cream cheese frosting",        price: 5.00 },
        { name: "Brownie",           description: "Fudgy dark chocolate brownie",      price: 4.00 },
      ],
    },
    {
      name: "Daily Specials",
      order: 3,
      items: [
        { name: "Soup of the Day",   description: "Ask your barista for today's choice", price: 6.50 },
        { name: "Seasonal Salad",    description: "Fresh seasonal ingredients",         price: 8.00 },
        { name: "Sandwich of the Day", description: "Freshly made, ask for today's",   price: 7.50 },
        { name: "Chef's Quiche",     description: "Homemade with seasonal filling",     price: 7.00 },
      ],
    },
  ];

  for (const cat of menuData) {
    const [category] = await db.insert(menuCategories).values({
      userId: uid,
      name: cat.name,
      displayOrder: cat.order,
    }).returning();

    for (let i = 0; i < cat.items.length; i++) {
      const item = cat.items[i];
      await db.insert(menuItems).values({
        userId: uid,
        categoryId: category.id,
        name: item.name,
        description: item.description,
        price: item.price,
        displayOrder: i,
      });
    }
  }

  // ── CREW MEMBERS & SHIFTS ────────────────────────────────────────────────
  const crewData = [
    { name: "Alex Thompson"  },
    { name: "Maria Rodriguez" },
    { name: "John Wilson"    },
    { name: "Sarah Kim"      },
    { name: "Tom Anderson"   },
    { name: "Elena Petrou"   },
  ];

  const insertedCrew: string[] = [];
  for (const c of crewData) {
    const [cm] = await db.insert(crewMembers).values({ userId: uid, name: c.name }).returning();
    insertedCrew.push(cm.name);
  }

  // Timeframe presets
  await db.insert(timeframePresets).values([
    { userId: uid, name: "Morning Shift",   startTime: "07:00", endTime: "15:00" },
    { userId: uid, name: "Afternoon Shift", startTime: "12:00", endTime: "20:00" },
    { userId: uid, name: "Evening Shift",   startTime: "16:00", endTime: "23:00" },
  ]);

  // 21 shifts for the week of March 16–22 2026 (3 per day)
  const shiftSchedule = [
    // Mon
    { offset: 0, name: "Alex Thompson",   role: "Barista",   start: "07:00", end: "15:00" },
    { offset: 0, name: "Maria Rodriguez", role: "Supervisor", start: "12:00", end: "20:00" },
    { offset: 0, name: "John Wilson",     role: "Barista",   start: "16:00", end: "23:00" },
    // Tue
    { offset: 1, name: "Sarah Kim",       role: "Barista",   start: "07:00", end: "15:00" },
    { offset: 1, name: "Alex Thompson",   role: "Barista",   start: "12:00", end: "20:00" },
    { offset: 1, name: "Tom Anderson",    role: "Barista",   start: "16:00", end: "23:00" },
    // Wed
    { offset: 2, name: "Elena Petrou",    role: "Supervisor", start: "07:00", end: "15:00" },
    { offset: 2, name: "John Wilson",     role: "Barista",   start: "12:00", end: "20:00" },
    { offset: 2, name: "Maria Rodriguez", role: "Supervisor", start: "16:00", end: "23:00" },
    // Thu
    { offset: 3, name: "Alex Thompson",   role: "Barista",   start: "07:00", end: "15:00" },
    { offset: 3, name: "Sarah Kim",       role: "Barista",   start: "12:00", end: "20:00" },
    { offset: 3, name: "Elena Petrou",    role: "Supervisor", start: "16:00", end: "23:00" },
    // Fri
    { offset: 4, name: "Tom Anderson",    role: "Barista",   start: "07:00", end: "15:00" },
    { offset: 4, name: "Maria Rodriguez", role: "Supervisor", start: "12:00", end: "20:00" },
    { offset: 4, name: "John Wilson",     role: "Barista",   start: "16:00", end: "23:00" },
    // Sat
    { offset: 5, name: "Sarah Kim",       role: "Barista",   start: "07:00", end: "15:00" },
    { offset: 5, name: "Alex Thompson",   role: "Barista",   start: "12:00", end: "20:00" },
    { offset: 5, name: "Tom Anderson",    role: "Barista",   start: "16:00", end: "23:00" },
    // Sun
    { offset: 6, name: "Elena Petrou",    role: "Supervisor", start: "07:00", end: "15:00" },
    { offset: 6, name: "John Wilson",     role: "Barista",   start: "12:00", end: "20:00" },
    { offset: 6, name: "Maria Rodriguez", role: "Supervisor", start: "16:00", end: "23:00" },
  ];

  for (const s of shiftSchedule) {
    await db.insert(shifts).values({
      userId: uid,
      employeeName: s.name,
      employeeRole: s.role,
      shiftDate: dateStr(s.offset),
      startTime: s.start,
      endTime: s.end,
    });
  }

  return {
    success: true,
    message: `Demo account created: ${DEMO_EMAIL} / ${DEMO_PASSWORD} | shopName: ${DEMO_SHOP_NAME}`,
  };
}
