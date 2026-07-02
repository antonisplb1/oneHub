import cron from 'node-cron';
import { db } from './db';
import { users } from '@shared/schema';
import { and, eq, gt, lte, gte, isNull } from 'drizzle-orm';
import { hasAccessGrantingSubscription } from './billing';
import { sendTrialEndingSoonEmail, sendTrialEndedEmail } from './email';

// How far ahead we warn ("ends soon") and how far back we still nudge after a
// trial lapses ("has ended"). The 48h ended-window keeps us from emailing every
// long-dead trial in the DB — we only reach out to merchants whose trial ended
// recently enough that a reminder is still timely.
const ENDING_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;
const ENDED_WINDOW_MS = 48 * 60 * 60 * 1000;

// A merchant who is charge-free or already holds an access-granting subscription
// has effectively converted (or never needed to) — never email them about the
// trial.
function shouldSkipReminder(user: typeof users.$inferSelect): boolean {
  return user.chargeFree === true || hasAccessGrantingSubscription(user.subscriptionStatus);
}

// Send trial-lifecycle emails. Two independent passes, each guarded by its own
// "sent" flag so a merchant gets at most one ending-soon and one ended email.
// Each send is isolated: one failure never blocks the others, and the flag is
// only written after the email actually goes out (so a failed send retries on
// the next run).
export async function processTrialReminders(now: Date = new Date()): Promise<{
  endingSoonSent: number;
  endedSent: number;
}> {
  let endingSoonSent = 0;
  let endedSent = 0;

  // Pass 1: trial ends within the next 24 hours and we haven't warned yet.
  const soonCutoff = new Date(now.getTime() + ENDING_SOON_WINDOW_MS);
  const endingSoon = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.emailVerified, true),
        isNull(users.trialReminderSentAt),
        gt(users.trialEndsAt, now),
        lte(users.trialEndsAt, soonCutoff),
      ),
    );

  for (const user of endingSoon) {
    if (shouldSkipReminder(user)) continue;
    try {
      await sendTrialEndingSoonEmail(user.email, user.shopName);
      await db
        .update(users)
        .set({ trialReminderSentAt: now })
        .where(eq(users.id, user.id));
      endingSoonSent++;
    } catch (err) {
      console.error(`[TrialReminders] Failed to send ending-soon email to ${user.email}:`, err);
    }
  }

  // Pass 2: trial ended within the last 48 hours and we haven't followed up yet.
  const endedFloor = new Date(now.getTime() - ENDED_WINDOW_MS);
  const recentlyEnded = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.emailVerified, true),
        isNull(users.trialEndedEmailSentAt),
        lte(users.trialEndsAt, now),
        gte(users.trialEndsAt, endedFloor),
      ),
    );

  for (const user of recentlyEnded) {
    if (shouldSkipReminder(user)) continue;
    try {
      await sendTrialEndedEmail(user.email, user.shopName);
      await db
        .update(users)
        .set({ trialEndedEmailSentAt: now })
        .where(eq(users.id, user.id));
      endedSent++;
    } catch (err) {
      console.error(`[TrialReminders] Failed to send trial-ended email to ${user.email}:`, err);
    }
  }

  return { endingSoonSent, endedSent };
}

// Scheduled daily nudge for trialing merchants: one "ends soon" heads-up and one
// "has ended" follow-up, so a trial never lapses silently.
export function startTrialReminderService() {
  // Run every day at 9 AM — a sensible hour for a customer-facing reminder, well
  // clear of the 2 AM cleanup and 3 AM reconciliation jobs.
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[TrialReminders] Starting daily trial reminder run...');
      const result = await processTrialReminders();
      console.log(
        `[TrialReminders] Finished: ${result.endingSoonSent} ending-soon, ${result.endedSent} ended email(s) sent`,
      );
    } catch (error) {
      console.error('[TrialReminders] Error during trial reminder run:', error);
    }
  });

  console.log('[TrialReminders] Scheduled daily trial reminder job (runs at 9 AM)');
}
