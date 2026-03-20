import { db } from "./db";
import { adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

export async function seedAdminPassword() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  const seedEmail = process.env.ADMIN_SEED_EMAIL;

  if (!seedPassword || !seedEmail) return;

  try {
    const hashed = await hashPassword(seedPassword);
    const result = await db
      .update(adminUsers)
      .set({ passwordHash: hashed, resetPasswordToken: null, resetPasswordExpiry: null })
      .where(eq(adminUsers.email, seedEmail))
      .returning({ email: adminUsers.email });

    if (result.length > 0) {
      console.log(`[AdminSeed] Password updated for ${seedEmail}`);
    } else {
      console.log(`[AdminSeed] No admin found with email ${seedEmail}`);
    }
  } catch (err: any) {
    console.error(`[AdminSeed] Failed to seed admin password:`, err.message);
  }
}
