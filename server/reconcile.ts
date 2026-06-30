import cron from 'node-cron';
import { reconcileBilling, type BillingStripe } from './billing';

// Scheduled safety net for billing drift.
//
// syncBillingFromStores updates the DB and then best-effort syncs Stripe; if that
// Stripe call fails the merchant is left billed at a stale price with no alert and
// no automatic correction. This daily job re-checks every billable account's live
// Stripe price against the price their stores justify and corrects any drift.
export function startReconciliationService(stripe: BillingStripe) {
  // Run every day at 3 AM (one hour after the unverified-account cleanup so the
  // two scheduled jobs don't overlap).
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[Reconcile] Starting daily billing reconciliation...');
      await reconcileBilling(stripe);
    } catch (error) {
      console.error('[Reconcile] Error during billing reconciliation:', error);
    }
  });

  console.log('[Reconcile] Scheduled daily billing reconciliation job (runs at 3 AM)');
}
