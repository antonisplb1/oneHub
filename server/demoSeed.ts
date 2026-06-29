import { db } from "./db";
import { hashPassword } from "./auth";
import {
  users, customers, loyaltyCards, loyaltyTransactions,
  rewards, spinTokens, spins, menuItems,
  menuCategories,
  crewMembers, shifts, timeframePresets,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const DEMO_EMAIL = "antonispleipell@gmail.com";
const DEMO_SHOP_NAME = "The Golden Cup";
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

/** Returns the Monday of the current ISO week */
function currentWeekMonday(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns YYYY-MM-DD for Monday + offset days */
function weekDateStr(offset: number): string {
  const d = currentWeekMonday();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

// ─── Seed (first-time) ───────────────────────────────────────────────────────
export async function seedDemoAccount(): Promise<{ success: boolean; message: string }> {
  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing.length > 0) {
    return { success: false, message: "Demo account already exists — use reseed to refresh" };
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [user] = await db.insert(users).values({
    email: DEMO_EMAIL,
    passwordHash,
    shopName: DEMO_SHOP_NAME,
    emailVerified: true,
    subscriptionStatus: "active",
    selectedProducts: ["loyalty", "spin", "menu", "shift"],
    cardBackgroundColor: "#c9a84c",
    shiftAccessPin: DEMO_SHIFT_PIN,
    verificationToken: null,
    verificationTokenExpiry: null,
  }).returning();

  await populateDemoData(user.id);

  return {
    success: true,
    message: `Demo account created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
  };
}

// ─── Reseed (wipe + repopulate) ──────────────────────────────────────────────
export async function reseedDemoAccount(): Promise<{ success: boolean; message: string }> {
  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing.length === 0) {
    return seedDemoAccount();
  }

  const uid = existing[0].id;

  // Update shop name, settings and reset password
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db.update(users).set({
    shopName: DEMO_SHOP_NAME,
    cardBackgroundColor: "#c9a84c",
    shiftAccessPin: DEMO_SHIFT_PIN,
    subscriptionStatus: "active",
    selectedProducts: ["loyalty", "spin", "menu", "shift"],
    passwordHash,
    emailVerified: true,
  }).where(eq(users.id, uid));

  // Wipe existing feature data — child tables before parents to respect FK constraints
  // spins.rewardId references rewards WITHOUT cascade, so spins must go first
  await db.delete(spins).where(eq(spins.userId, uid));
  await db.delete(spinTokens).where(eq(spinTokens.userId, uid));
  await db.delete(rewards).where(eq(rewards.userId, uid));
  // loyaltyTransactions cascade from loyaltyCards; delete cards first, then customers
  await db.delete(loyaltyCards).where(eq(loyaltyCards.userId, uid));
  await db.delete(customers).where(eq(customers.userId, uid));
  // menuItems → menuCategories (cascade, but explicit)
  await db.delete(menuItems).where(eq(menuItems.userId, uid));
  await db.delete(menuCategories).where(eq(menuCategories.userId, uid));
  // shifts / crew
  await db.delete(shifts).where(eq(shifts.userId, uid));
  await db.delete(crewMembers).where(eq(crewMembers.userId, uid));
  await db.delete(timeframePresets).where(eq(timeframePresets.userId, uid));

  await populateDemoData(uid);

  return { success: true, message: `Demo account refreshed for ${DEMO_EMAIL}` };
}

// ─── Shared data population ──────────────────────────────────────────────────
async function populateDemoData(uid: string) {

  // ── CUSTOMERS & LOYALTY CARDS ───────────────────────────────────────────
  const customerData = [
    { name: "Sophie Martin",      email: "sophie.m@email.com",     stamps: 2,  daysBack: 1  },
    { name: "James O'Brien",      email: "james.ob@email.com",     stamps: 3,  daysBack: 2  },
    { name: "Layla Hassan",       email: "layla.h@email.com",      stamps: 5,  daysBack: 1  },
    { name: "Carlos Reyes",       email: "carlos.r@email.com",     stamps: 7,  daysBack: 3  },
    { name: "Mei Lin",            email: "mei.lin@email.com",      stamps: 6,  daysBack: 0  },
    { name: "Noah Williams",      email: "noah.w@email.com",       stamps: 8,  daysBack: 1  },
    { name: "Amara Osei",         email: "amara.o@email.com",      stamps: 4,  daysBack: 5  },
    { name: "Elijah Turner",      email: "elijah.t@email.com",     stamps: 9,  daysBack: 2  },
    { name: "Isla Murray",        email: "isla.m@email.com",       stamps: 10, daysBack: 0  },
    { name: "Luca Ferrari",       email: "luca.f@email.com",       stamps: 10, daysBack: 1  },
    { name: "Priya Sharma",       email: "priya.s@email.com",      stamps: 10, daysBack: 3  },
    { name: "Finn Eriksson",      email: "finn.e@email.com",       stamps: 1,  daysBack: 0  },
    { name: "Zara Ahmed",         email: "zara.a@email.com",       stamps: 3,  daysBack: 2  },
    { name: "Marcus Johnson",     email: "marcus.j@email.com",     stamps: 6,  daysBack: 4  },
    { name: "Chiara Bianchi",     email: "chiara.b@email.com",     stamps: 8,  daysBack: 1  },
    { name: "Oliver Chen",        email: "oliver.c@email.com",     stamps: 2,  daysBack: 0  },
    { name: "Fatima Al-Rashid",   email: "fatima.a@email.com",     stamps: 5,  daysBack: 3  },
    { name: "David Kowalski",     email: "david.k@email.com",      stamps: 7,  daysBack: 2  },
    { name: "Yuna Park",          email: "yuna.p@email.com",       stamps: 4,  daysBack: 1  },
    { name: "Remy Dupont",        email: "remy.d@email.com",       stamps: 9,  daysBack: 0  },
  ];

  for (const cd of customerData) {
    const [cust] = await db.insert(customers).values({
      userId: uid,
      name: cd.name,
      email: cd.email,
      customerQrCode: randomQr(),
      createdAt: daysAgo(cd.stamps + cd.daysBack + 2),
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
      lastStampAt: daysAgo(cd.daysBack),
    }).returning();

    for (let i = 0; i < cd.stamps; i++) {
      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        type: "stamp",
        amount: 1,
        description: "Stamp added",
        createdAt: daysAgo(cd.stamps - i + cd.daysBack),
      });
    }

    if (isRedeemable) {
      await db.insert(loyaltyTransactions).values({
        loyaltyCardId: card.id,
        type: "reward",
        amount: 1,
        description: "Free Coffee redeemed",
        createdAt: daysAgo(cd.daysBack),
      });
    }
  }

  // ── SPIN WHEEL ──────────────────────────────────────────────────────────
  const prizeData = [
    { name: "Free Coffee",       description: "One free coffee of your choice",        winChance: 10, timesWon: 18 },
    { name: "10% Off",           description: "10% off your next order",               winChance: 20, timesWon: 26 },
    { name: "20% Off",           description: "20% off your next order",               winChance: 15, timesWon: 14 },
    { name: "Free Pastry",       description: "One free pastry with any drink",        winChance: 12, timesWon: 11 },
    { name: "Buy 1 Get 1 Free",  description: "Buy one, get one free on any item",     winChance: 8,  timesWon: 7  },
    { name: "Free Upgrade",      description: "Free size upgrade on any drink",        winChance: 15, timesWon: 9  },
    { name: "€5 Voucher",        description: "€5 off any purchase over €10",          winChance: 5,  timesWon: 4  },
    { name: "Try Again",         description: "Better luck next time!",                winChance: 15, timesWon: 0  },
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

  const spinCustomerNames = customerData.map(c => c.name);
  for (let i = 0; i < 89; i++) {
    const reward = insertedRewards[Math.floor(Math.random() * (insertedRewards.length - 1))];
    const daysBack = Math.floor(Math.random() * 30);
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 1);

    const [token] = await db.insert(spinTokens).values({
      userId: uid,
      token: randomQr(),
      customerName: spinCustomerNames[Math.floor(Math.random() * spinCustomerNames.length)],
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

  // ── MENU ────────────────────────────────────────────────────────────────
  const menuData = [
    {
      name: "Coffee & Drinks", order: 0,
      items: [
        { name: "Espresso",           description: "Rich, bold single shot",                price: 2.50 },
        { name: "Americano",          description: "Espresso with hot water",               price: 3.00 },
        { name: "Flat White",         description: "Double espresso with microfoam milk",   price: 3.80 },
        { name: "Cappuccino",         description: "Equal parts espresso, milk, and foam",  price: 3.80 },
        { name: "Latte",              description: "Espresso with silky steamed milk",      price: 4.00 },
        { name: "Oat Milk Latte",     description: "Latte made with creamy oat milk",       price: 4.50 },
        { name: "Mocha",              description: "Chocolate espresso with steamed milk",  price: 4.20 },
        { name: "Cold Brew",          description: "Slow-steeped 12 hr, served over ice",   price: 4.50 },
        { name: "Matcha Latte",       description: "Ceremonial grade matcha, oat milk",     price: 4.50 },
        { name: "Hot Chocolate",      description: "Rich Belgian drinking chocolate",       price: 3.80 },
        { name: "Chai Latte",         description: "Spiced chai concentrate, steamed milk", price: 4.00 },
        { name: "Iced Americano",     description: "Double espresso over ice",              price: 3.50 },
      ],
    },
    {
      name: "Breakfast", order: 1,
      items: [
        { name: "Avocado Toast",          description: "Sourdough, smashed avocado, chilli flakes",   price: 8.50  },
        { name: "Full Irish",             description: "Bacon, egg, sausage, beans, black pudding",   price: 13.00 },
        { name: "Eggs Benedict",          description: "Poached eggs, hollandaise on toasted muffin", price: 11.50 },
        { name: "Granola Bowl",           description: "House granola, natural yogurt, seasonal berries", price: 7.50 },
        { name: "Buttermilk Pancakes",    description: "Stack of 3 with maple syrup & fresh berries", price: 9.50  },
        { name: "Smoked Salmon Bagel",    description: "Cream cheese, capers, dill, red onion",       price: 11.00 },
        { name: "Shakshuka",              description: "Eggs poached in spiced tomato sauce, feta",   price: 10.50 },
        { name: "Overnight Oats",         description: "Chia seeds, almond milk, fruit compote",      price: 6.50  },
      ],
    },
    {
      name: "Pastries & Bakes", order: 2,
      items: [
        { name: "Butter Croissant",   description: "Freshly baked, light and flaky",          price: 3.20 },
        { name: "Almond Croissant",   description: "Filled with almond frangipane",           price: 3.80 },
        { name: "Pain au Chocolat",   description: "Dark chocolate in a buttery pastry",      price: 3.50 },
        { name: "Blueberry Muffin",   description: "Bursting with fresh blueberries",         price: 3.20 },
        { name: "Carrot Cake Slice",  description: "Warming spices, cream cheese frosting",   price: 5.00 },
        { name: "Chocolate Brownie",  description: "Fudgy dark chocolate, sea salt top",      price: 4.00 },
        { name: "Banana Bread",       description: "Moist banana loaf, toasted with butter",  price: 3.50 },
        { name: "Cinnamon Roll",      description: "Soft dough, vanilla glaze",               price: 4.20 },
      ],
    },
    {
      name: "Lunch & Light Bites", order: 3,
      items: [
        { name: "Soup of the Day",       description: "Ask your barista for today's selection",  price: 6.50 },
        { name: "Caesar Salad",          description: "Romaine, parmesan, house dressing",       price: 9.00 },
        { name: "Grilled Chicken Wrap",  description: "Chicken, lettuce, tomato, chipotle mayo", price: 9.50 },
        { name: "Smashed Burger",        description: "Double smash, cheddar, pickles, sauce",   price: 13.00 },
        { name: "Quiche of the Day",     description: "Homemade with seasonal filling",          price: 7.00 },
        { name: "Club Sandwich",         description: "Triple layer, chicken, bacon, egg",       price: 10.50 },
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

  // ── CREW MEMBERS & SHIFTS ───────────────────────────────────────────────
  const crewData = [
    { name: "Alex Thompson"   },
    { name: "Maria Rodriguez" },
    { name: "Sarah Kim"       },
    { name: "Tom Anderson"    },
    { name: "Elena Petrou"    },
    { name: "John Wilson"     },
    { name: "Aisling Murphy"  },
  ];

  for (const c of crewData) {
    await db.insert(crewMembers).values({ userId: uid, name: c.name });
  }

  await db.insert(timeframePresets).values([
    { userId: uid, name: "Morning Shift",   startTime: "07:00", endTime: "15:00" },
    { userId: uid, name: "Afternoon Shift", startTime: "12:00", endTime: "20:00" },
    { userId: uid, name: "Evening Shift",   startTime: "16:00", endTime: "23:00" },
  ]);

  // Current week shifts (Mon=0 … Sun=6)
  const shiftSchedule = [
    // Mon
    { offset: 0, name: "Alex Thompson",   role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 0, name: "Maria Rodriguez", role: "Supervisor", start: "12:00", end: "20:00" },
    { offset: 0, name: "John Wilson",     role: "Barista",    start: "16:00", end: "23:00" },
    // Tue
    { offset: 1, name: "Sarah Kim",       role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 1, name: "Alex Thompson",   role: "Barista",    start: "12:00", end: "20:00" },
    { offset: 1, name: "Tom Anderson",    role: "Barista",    start: "16:00", end: "23:00" },
    // Wed
    { offset: 2, name: "Elena Petrou",    role: "Supervisor", start: "07:00", end: "15:00" },
    { offset: 2, name: "Aisling Murphy",  role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 2, name: "John Wilson",     role: "Barista",    start: "12:00", end: "20:00" },
    { offset: 2, name: "Maria Rodriguez", role: "Supervisor", start: "16:00", end: "23:00" },
    // Thu
    { offset: 3, name: "Alex Thompson",   role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 3, name: "Sarah Kim",       role: "Barista",    start: "12:00", end: "20:00" },
    { offset: 3, name: "Elena Petrou",    role: "Supervisor", start: "16:00", end: "23:00" },
    // Fri
    { offset: 4, name: "Tom Anderson",    role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 4, name: "Aisling Murphy",  role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 4, name: "Maria Rodriguez", role: "Supervisor", start: "12:00", end: "20:00" },
    { offset: 4, name: "John Wilson",     role: "Barista",    start: "16:00", end: "23:00" },
    // Sat
    { offset: 5, name: "Sarah Kim",       role: "Barista",    start: "07:00", end: "15:00" },
    { offset: 5, name: "Alex Thompson",   role: "Barista",    start: "12:00", end: "20:00" },
    { offset: 5, name: "Tom Anderson",    role: "Barista",    start: "16:00", end: "23:00" },
    // Sun
    { offset: 6, name: "Elena Petrou",    role: "Supervisor", start: "07:00", end: "15:00" },
    { offset: 6, name: "John Wilson",     role: "Barista",    start: "12:00", end: "20:00" },
    { offset: 6, name: "Maria Rodriguez", role: "Supervisor", start: "16:00", end: "23:00" },
  ];

  for (const s of shiftSchedule) {
    await db.insert(shifts).values({
      userId: uid,
      employeeName: s.name,
      employeeRole: s.role,
      shiftDate: weekDateStr(s.offset),
      startTime: s.start,
      endTime: s.end,
    });
  }
}
