import cron from 'node-cron';
import { db } from './db';
import { users } from '@shared/schema';
import { and, eq, lt } from 'drizzle-orm';

export function startCleanupService() {
  // Run cleanup every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Cleanup] Starting unverified accounts cleanup...');
      
      // Delete accounts that are:
      // 1. Not email verified
      // 2. Created more than 48 hours ago
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
      
      if (deletedUsers.length > 0) {
        console.log(`[Cleanup] Deleted ${deletedUsers.length} unverified accounts older than 48 hours`);
      } else {
        console.log('[Cleanup] No unverified accounts to delete');
      }
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
    }
  });
  
  console.log('[Cleanup] Scheduled daily cleanup job for unverified accounts (runs at 2 AM)');
}
