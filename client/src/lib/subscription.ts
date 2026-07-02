// Client mirror of the server's access-granting subscription statuses (see
// hasAccessGrantingSubscription in server/billing.ts). "past_due" is included so
// a merchant whose card payment is temporarily failing keeps dashboard access
// during Stripe's retry grace window instead of being locked out mid-billing.
export const ACCESS_GRANTING_STATUSES = ["active", "trialing", "past_due"];

export function hasAccessGrantingSubscription(
  status: string | null | undefined,
): boolean {
  return !!status && ACCESS_GRANTING_STATUSES.includes(status);
}
