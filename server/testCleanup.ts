import { db } from './db';
import { users } from '@shared/schema';
import { and, eq, lt } from 'drizzle-orm';
import { hashPassword } from './auth';

// Manual cleanup test function
export async function testCleanupFunction() {
  console.log('[Cleanup Test] Starting manual cleanup test...');
  
  // Create a test user that is old and unverified (should be deleted)
  const oldUnverifiedEmail = `old-unverified-${Date.now()}@test.com`;
  const oldDate = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours ago
  
  const [oldUser] = await db.insert(users).values({
    email: oldUnverifiedEmail,
    passwordHash: await hashPassword('test123'),
    shopName: 'Old Unverified Shop',
    emailVerified: false,
    createdAt: oldDate,
  }).returning();
  
  console.log(`[Cleanup Test] Created old unverified user: ${oldUser.email}`);
  
  // Create a test user that is recent and unverified (should NOT be deleted)
  const recentUnverifiedEmail = `recent-unverified-${Date.now()}@test.com`;
  
  const [recentUser] = await db.insert(users).values({
    email: recentUnverifiedEmail,
    passwordHash: await hashPassword('test123'),
    shopName: 'Recent Unverified Shop',
    emailVerified: false,
  }).returning();
  
  console.log(`[Cleanup Test] Created recent unverified user: ${recentUser.email}`);
  
  // Create a test user that is old but verified (should NOT be deleted)
  const oldVerifiedEmail = `old-verified-${Date.now()}@test.com`;
  
  const [verifiedUser] = await db.insert(users).values({
    email: oldVerifiedEmail,
    passwordHash: await hashPassword('test123'),
    shopName: 'Old Verified Shop',
    emailVerified: true,
    createdAt: oldDate,
  }).returning();
  
  console.log(`[Cleanup Test] Created old verified user: ${verifiedUser.email}`);
  
  // Run the cleanup logic
  console.log('[Cleanup Test] Running cleanup logic...');
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  const deletedUsers = await db
    .delete(users)
    .where(
      and(
        eq(users.emailVerified, false),
        lt(users.createdAt, fortyEightHoursAgo)
      )
    )
    .returning();
  
  console.log(`[Cleanup Test] Deleted ${deletedUsers.length} users`);
  
  // Verify the results
  const remainingUsers = await db.select().from(users).where(
    eq(users.email, oldUnverifiedEmail)
  );
  
  const recentStillExists = await db.select().from(users).where(
    eq(users.email, recentUnverifiedEmail)
  );
  
  const verifiedStillExists = await db.select().from(users).where(
    eq(users.email, oldVerifiedEmail)
  );
  
  console.log('[Cleanup Test] Results:');
  console.log(`  - Old unverified user deleted: ${remainingUsers.length === 0 ? 'YES ✓' : 'NO ✗'}`);
  console.log(`  - Recent unverified user kept: ${recentStillExists.length === 1 ? 'YES ✓' : 'NO ✗'}`);
  console.log(`  - Old verified user kept: ${verifiedStillExists.length === 1 ? 'YES ✓' : 'NO ✗'}`);
  
  // Cleanup test users
  await db.delete(users).where(eq(users.email, recentUnverifiedEmail));
  await db.delete(users).where(eq(users.email, oldVerifiedEmail));
  
  console.log('[Cleanup Test] Test completed and cleaned up');
}
