import { apiRequest, queryClient } from "./queryClient";
import type { User, Customer, LoyaltyCard, Reward, SpinToken } from "@shared/schema";

export interface LoyaltyCardWithCustomer {
  card: LoyaltyCard;
  customer: Customer | null;
}

export async function signup(data: { email: string; password: string; confirmPassword: string; shopName: string; turnstileToken?: string | null }) {
  const response = await apiRequest<{ success: boolean; message: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
}

export async function login(data: { email: string; password: string }) {
  // Clear any active-store selection left over from a previous session so this
  // login (and the requests right after it) never send another account's store
  // id via the X-Store-Id header, which the server rejects as "Store not found".
  localStorage.removeItem("activeStoreId");
  const response = await apiRequest<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
}

export async function logout() {
  await apiRequest("/api/auth/logout", { method: "POST" });
  // Fully reset client-side auth/session state so the next login starts clean.
  localStorage.removeItem("activeStoreId");
  queryClient.clear();
}

export async function getCurrentUser() {
  return apiRequest<{ user: User }>("/api/auth/me");
}

export async function getCustomers() {
  return apiRequest<Customer[]>("/api/customers");
}

export async function createCustomer(data: { name?: string; email?: string; phone?: string; maxStamps?: number; rewardText?: string }) {
  return apiRequest<{ customer: Customer; loyaltyCard: LoyaltyCard }>("/api/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getLoyaltyCards() {
  return apiRequest<LoyaltyCardWithCustomer[]>("/api/loyalty-cards");
}

export async function addStamp(cardId: string) {
  return apiRequest<LoyaltyCard>(`/api/loyalty-cards/${cardId}/stamp`, {
    method: "POST",
  });
}

export async function redeemReward(cardId: string) {
  return apiRequest<LoyaltyCard>(`/api/loyalty-cards/${cardId}/redeem`, {
    method: "POST",
  });
}

export async function getRewards() {
  return apiRequest<Reward[]>("/api/rewards");
}

export async function createReward(data: { name: string; description?: string; winChance: number; isActive?: boolean }) {
  return apiRequest<Reward>("/api/rewards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReward(rewardId: string, data: Partial<Reward>) {
  return apiRequest<Reward>(`/api/rewards/${rewardId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteReward(rewardId: string) {
  return apiRequest(`/api/rewards/${rewardId}`, {
    method: "DELETE",
  });
}

export async function spinWheel(token: string) {
  return apiRequest<{ reward: Reward }>("/api/spin", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function createCheckoutSession() {
  return apiRequest<{ url: string }>("/api/stripe/create-checkout-session", {
    method: "POST",
  });
}

export async function createPortalSession() {
  return apiRequest<{ url: string }>("/api/stripe/create-portal-session", {
    method: "POST",
  });
}

export async function getShopQRCode() {
  return apiRequest<{ qrCode: string }>("/api/shop-qr-code");
}
