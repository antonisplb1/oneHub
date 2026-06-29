import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Ticket, Gift, UtensilsCrossed, Calendar, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/unihub-logo-transparent_1774625335894.png";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.18)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

const PRODUCTS = [
  { id: "loyalty", name: "Loyalty Cards", description: "Digital loyalty card program with stamp collection and rewards", price: 19, icon: Ticket },
  { id: "spin", name: "Spin Wheel", description: "Interactive prize wheel campaigns for customer engagement", price: 5, icon: Gift },
  { id: "menu", name: "Menu Builder", description: "Create and manage your digital menu for customers", price: 8, icon: UtensilsCrossed },
  { id: "shift", name: "Shift Manager", description: "Employee shift scheduling with weekly calendar and crew management", price: 18, icon: Calendar },
];

function calculatePrice(selected: string[]) {
  if (selected.length === 0) return 0;
  const sorted = [...selected].sort();
  if (
    sorted.length === 4 &&
    sorted.includes("loyalty") &&
    sorted.includes("spin") &&
    sorted.includes("menu") &&
    sorted.includes("shift")
  ) {
    return 36.99;
  }
  const prices: Record<string, number> = { loyalty: 19, spin: 5, menu: 8, shift: 18 };
  return selected.reduce((t, id) => t + (prices[id] || 0), 0);
}

export default function SubscriptionRequired() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [selected, setSelected] = useState<string[]>(user?.selectedProducts || []);

  useEffect(() => {
    if (user?.selectedProducts && selected.length === 0) {
      setSelected(user.selectedProducts);
    }
  }, [user]);

  const hasExpiredTrial = user?.trialEndsAt && new Date(user.trialEndsAt) <= new Date();
  const isTrialExpired = hasExpiredTrial && user?.subscriptionStatus !== "active";

  const price = calculatePrice(selected);
  const isBundle =
    selected.length === 4 &&
    selected.includes("loyalty") &&
    selected.includes("spin") &&
    selected.includes("menu") &&
    selected.includes("shift");

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (selected.length === 0) throw new Error("Select at least one feature");
      await apiRequest("/api/user/select-products", {
        method: "POST",
        body: JSON.stringify({ products: selected }),
      });
      const data = await apiRequest<{ url: string }>("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start checkout", variant: "destructive" });
    },
  });

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundColor: "#080808", color: "white" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(201,168,76,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-lg">

        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <img src={logoImage} alt="uniHub logo" className="h-7 w-7" />
              <span className="text-xl tracking-tight">
                <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </span>
            </div>
          </Link>
        </div>

        <div
          className="rounded-md overflow-hidden"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD} 0%, transparent 65%)` }} />

          <div className="p-8">
            <div className="flex justify-center mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
              >
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>

            <h2 className="text-xl font-light text-white text-center mb-1">
              {isTrialExpired ? "Free Trial Expired" : "Subscription Required"}
            </h2>
            <p className="text-sm font-light text-center mb-8" style={{ color: MUTED }}>
              {isTrialExpired
                ? "Your 3-day free trial has ended. Choose your features and subscribe to continue."
                : "Your payment was not completed. Choose your features and subscribe to continue."}
            </p>

            <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: GOLD }}>
              Choose features
            </p>

            <div className="space-y-2 mb-5">
              {PRODUCTS.map((product) => {
                const Icon = product.icon;
                const isSelected = selected.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 rounded-md cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? GOLD_DIM : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? GOLD_BORDER : "rgba(255,255,255,0.06)"}`,
                    }}
                    onClick={() => toggle(product.id)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(product.id)}
                        data-testid={`checkbox-product-${product.id}`}
                        className="border-white/25 data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                      />
                    </div>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? GOLD : MUTED }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      <p className="text-xs font-light" style={{ color: MUTED }}>{product.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-light text-white">€{product.price}</div>
                      <div className="text-xs" style={{ color: MUTED }}>/mo</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isBundle && (
              <div
                className="rounded-md p-3 mb-5 flex items-center justify-between"
                style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: GOLD }}>Complete Bundle Discount</p>
                  <p className="text-xs" style={{ color: MUTED }}>Save €13/month with all four features</p>
                </div>
                <div className="text-right">
                  <div className="text-xs line-through" style={{ color: MUTED }}>€50</div>
                  <div className="text-lg font-light text-white">€36.99</div>
                </div>
              </div>
            )}

            <div
              className="flex items-center justify-between p-4 rounded-md mb-5"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
            >
              <span className="text-sm text-white font-medium">Total</span>
              <span className="text-xl font-light text-white" data-testid="text-total-price">
                {selected.length === 0 ? "—" : `€${price}/month`}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || selected.length === 0}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: GOLD, color: "#080808", border: "none", cursor: selected.length === 0 ? "not-allowed" : "pointer" }}
                data-testid="button-complete-subscription"
              >
                {checkoutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {checkoutMutation.isPending
                  ? "Loading..."
                  : selected.length === 0
                  ? "Select a feature to continue"
                  : `Subscribe — €${price}/month`}
              </button>
              <button
                className="w-full py-2.5 rounded-lg text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "transparent", color: MUTED, border: `1px solid rgba(255,255,255,0.1)`, cursor: "pointer" }}
                onClick={() => window.location.reload()}
                data-testid="button-refresh"
              >
                Refresh Page
              </button>
              <button
                className="w-full py-2.5 rounded-lg text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "transparent", color: "rgba(255,255,255,0.25)", border: "none", cursor: "pointer" }}
                onClick={() => logout()}
                data-testid="button-logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
