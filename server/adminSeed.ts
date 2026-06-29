import { db } from "./db";
import { adminUsers, adminSecurity } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

export async function seedAdminPassword() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  const seedEmail = process.env.ADMIN_SEED_EMAIL;

  if (!seedPassword || !seedEmail) return;

  try {
    const hashed = await hashPassword(seedPassword);

    const existing = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, seedEmail));

    if (existing.length > 0) {
      await db
        .update(adminUsers)
        .set({ passwordHash: hashed, resetPasswordToken: null, resetPasswordExpiry: null })
        .where(eq(adminUsers.email, seedEmail));
      console.log(`[AdminSeed] Password updated for ${seedEmail}`);
    } else {
      const [newAdmin] = await db
        .insert(adminUsers)
        .values({ email: seedEmail, passwordHash: hashed })
        .returning({ id: adminUsers.id });

      await db.insert(adminSecurity).values({ adminId: newAdmin.id });
      console.log(`[AdminSeed] New admin created for ${seedEmail}`);
    }
  } catch (err: any) {
    console.error(`[AdminSeed] Failed to seed admin:`, err.message);
  }
}
