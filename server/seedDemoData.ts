import { db } from "./db";
import { 
  users, 
  customers, 
  loyaltyCards,
  loyaltyTransactions,
  rewards,
  spins,
  menuCategories,
  menuItems,
  crewMembers,
  shifts
} from "@shared/schema";
import { hashPassword } from "./auth";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

async function seedDemoData() {
  console.log("🌱 Starting demo data seeding for Café Aroma...\n");

  try {
    // 1. Create or update demo user account
    console.log("1️⃣ Setting up demo user account...");
    
    const email = "demo@cafearoma.com";
    const shopName = "Café Aroma";
    const password = "DemoPass123!";
    const brandColor = "#8B4513"; // Coffee brown
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;
    
    if (existingUser) {
      console.log("   ✓ Demo user already exists, updating...");
      const [updatedUser] = await db
        .update(users)
        .set({
          emailVerified: true,
          subscriptionStatus: 'active',
          selectedProducts: ['loyalty', 'spin', 'menu', 'shift'],
          cardBackgroundColor: brandColor,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      userId = updatedUser.id;
    } else {
      const passwordHash = await hashPassword(password);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          shopName,
          emailVerified: true,
          subscriptionStatus: 'active',
          selectedProducts: ['loyalty', 'spin', 'menu', 'shift'],
          cardBackgroundColor: brandColor,
        })
        .returning();
      userId = newUser.id;
      console.log("   ✓ Demo user created successfully");
    }
    
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log(`   🏪 Shop: ${shopName}`);
    console.log(`   🎨 Brand Color: ${brandColor}\n`);

    // 2. Create sample customers with loyalty cards
    console.log("2️⃣ Creating sample customers with loyalty cards...");
    
    const customerData = [
      { name: "Sarah Johnson", email: "sarah.j@email.com", stamps: 7 },
      { name: "Michael Chen", email: "michael.c@email.com", stamps: 3 },
      { name: "Emma Davis", email: "emma.d@email.com", stamps: 9 },
    ];

    for (const customerInfo of customerData) {
      const customerQrCode = nanoid(12);
      const [customer] = await db
        .insert(customers)
        .values({
          userId,
          name: customerInfo.name,
          email: customerInfo.email,
          customerQrCode,
        })
        .returning();

      const [loyaltyCard] = await db
        .insert(loyaltyCards)
        .values({
          userId,
          customerId: customer.id,
          stamps: customerInfo.stamps,
          maxStamps: 10,
          rewardText: "Free Coffee",
          isRedeemable: customerInfo.stamps >= 10,
          lastStampAt: new Date(),
        })
        .returning();

      // Add transaction history for each stamp
      for (let i = 0; i < customerInfo.stamps; i++) {
        await db.insert(loyaltyTransactions).values({
          loyaltyCardId: loyaltyCard.id,
          type: "stamp",
          amount: 1,
          description: "Stamp added",
        });
      }

      console.log(`   ✓ ${customerInfo.name}: ${customerInfo.stamps}/10 stamps`);
    }
    console.log();

    // 3. Create spin wheel rewards
    console.log("3️⃣ Setting up spin wheel campaign...");
    
    const rewardData = [
      { name: "Free Coffee", description: "Get a free coffee of any size!", winChance: 20, color: "red" },
      { name: "10% Off", description: "10% off your next purchase", winChance: 30, color: "yellow" },
      { name: "20% Off", description: "20% off your next purchase", winChance: 20, color: "blue" },
      { name: "Try Again", description: "Better luck next time!", winChance: 30, color: "green" },
    ];

    const createdRewards = [];
    for (const rewardInfo of rewardData) {
      const [reward] = await db
        .insert(rewards)
        .values({
          userId,
          name: rewardInfo.name,
          description: rewardInfo.description,
          winChance: rewardInfo.winChance,
          isActive: true,
          timesWon: 0,
        })
        .returning();
      
      createdRewards.push(reward);
      console.log(`   ✓ ${rewardInfo.name} (${rewardInfo.winChance}% chance)`);
    }

    // Add some spin history
    console.log("   📊 Adding spin history...");
    const spinResults = [
      createdRewards[1], // 10% Off
      createdRewards[3], // Try Again
      createdRewards[0], // Free Coffee
      createdRewards[3], // Try Again
      createdRewards[2], // 20% Off
      createdRewards[1], // 10% Off
      createdRewards[3], // Try Again
      createdRewards[1], // 10% Off
      createdRewards[0], // Free Coffee
      createdRewards[3], // Try Again
      createdRewards[1], // 10% Off
      createdRewards[2], // 20% Off
    ];

    for (const reward of spinResults) {
      await db.insert(spins).values({
        userId,
        rewardId: reward.id,
        prizeWon: reward.name,
        type: 'customer',
        spunAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
      });

      await db
        .update(rewards)
        .set({ timesWon: (reward.timesWon || 0) + 1 })
        .where(eq(rewards.id, reward.id));
    }
    console.log(`   ✓ Added ${spinResults.length} spin records\n`);

    // 4. Create digital menu
    console.log("4️⃣ Building digital menu...");
    
    // Drinks category
    const [drinksCategory] = await db
      .insert(menuCategories)
      .values({
        userId,
        name: "Drinks",
        displayOrder: 0,
      })
      .returning();
    console.log(`   ✓ Created category: ${drinksCategory.name}`);

    const drinkItems = [
      { name: "Espresso", description: "Rich and bold Italian espresso", price: 3.50 },
      { name: "Cappuccino", description: "Espresso with steamed milk and foam", price: 4.50 },
      { name: "Latte", description: "Smooth espresso with steamed milk", price: 4.75 },
    ];

    for (let i = 0; i < drinkItems.length; i++) {
      await db.insert(menuItems).values({
        userId,
        categoryId: drinksCategory.id,
        name: drinkItems[i].name,
        description: drinkItems[i].description,
        price: drinkItems[i].price,
        displayOrder: i,
      });
      console.log(`      • ${drinkItems[i].name} - $${drinkItems[i].price.toFixed(2)}`);
    }

    // Food category
    const [foodCategory] = await db
      .insert(menuCategories)
      .values({
        userId,
        name: "Food",
        displayOrder: 1,
      })
      .returning();
    console.log(`   ✓ Created category: ${foodCategory.name}`);

    const foodItems = [
      { name: "Croissant", description: "Buttery French pastry", price: 3.25 },
      { name: "Muffin", description: "Fresh baked blueberry muffin", price: 2.95 },
      { name: "Bagel with Cream Cheese", description: "Toasted bagel with cream cheese", price: 4.50 },
    ];

    for (let i = 0; i < foodItems.length; i++) {
      await db.insert(menuItems).values({
        userId,
        categoryId: foodCategory.id,
        name: foodItems[i].name,
        description: foodItems[i].description,
        price: foodItems[i].price,
        displayOrder: i,
      });
      console.log(`      • ${foodItems[i].name} - $${foodItems[i].price.toFixed(2)}`);
    }
    console.log();

    // 5. Create crew members and shifts
    console.log("5️⃣ Setting up crew members and shifts...");
    
    const crewData = [
      { name: "Sarah" },
      { name: "Mike" },
      { name: "Emma" },
    ];

    const createdCrew = [];
    for (const crew of crewData) {
      const [member] = await db
        .insert(crewMembers)
        .values({
          userId,
          name: crew.name,
        })
        .returning();
      createdCrew.push(member);
      console.log(`   ✓ Added crew member: ${crew.name}`);
    }

    // Create shifts for current week
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week

    const shiftData = [
      { 
        employeeName: "Sarah",
        day: 0, // Monday
        startTime: "08:00",
        endTime: "14:00",
        role: "Barista"
      },
      { 
        employeeName: "Mike",
        day: 0, // Monday
        startTime: "14:00",
        endTime: "20:00",
        role: "Barista"
      },
      { 
        employeeName: "Emma",
        day: 1, // Tuesday
        startTime: "08:00",
        endTime: "14:00",
        role: "Manager"
      },
      { 
        employeeName: "Sarah",
        day: 2, // Wednesday
        startTime: "08:00",
        endTime: "14:00",
        role: "Barista"
      },
    ];

    for (const shift of shiftData) {
      const shiftDate = new Date(monday);
      shiftDate.setDate(monday.getDate() + shift.day);
      const dateString = shiftDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      await db.insert(shifts).values({
        userId,
        employeeName: shift.employeeName,
        employeeRole: shift.role,
        shiftDate: dateString,
        startTime: shift.startTime,
        endTime: shift.endTime,
      });

      const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][shift.day];
      console.log(`   ✓ ${shift.employeeName}: ${dayName} ${shift.startTime} - ${shift.endTime} (${shift.role})`);
    }
    console.log();

    // Summary
    console.log("✅ Demo data seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   • User: ${shopName} (${email})`);
    console.log(`   • Customers: ${customerData.length}`);
    console.log(`   • Spin Wheel Prizes: ${rewardData.length}`);
    console.log(`   • Spin History: ${spinResults.length} spins`);
    console.log(`   • Menu Categories: 2`);
    console.log(`   • Menu Items: ${drinkItems.length + foodItems.length}`);
    console.log(`   • Crew Members: ${crewData.length}`);
    console.log(`   • Shifts: ${shiftData.length}\n`);
    console.log("🎬 The account is ready for demo video recording!");
    console.log(`   Login at: http://localhost:5000`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

// Run the seeder
seedDemoData()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
