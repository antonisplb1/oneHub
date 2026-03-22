import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/uniHub Icon Logo_1760616426501.png";
import { Link } from "wouter";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.18)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function SubscriptionRequired() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && (!user.selectedProducts || user.selectedProducts.length === 0)) {
      setLocation("/select-products");
    }
  }, [user, setLocation]);

  const calculatePrice = () => {
    if (!user?.selectedProducts || user.selectedProducts.length === 0) return 0;
    const sorted = [...user.selectedProducts].sort();
    if (sorted.length === 4 && sorted.includes('loyalty') && sorted.includes('spin') && sorted.includes('menu') && sorted.includes('shift')) {
      return 24.99;
    }
    const productPrices: Record<string, number> = { loyalty: 10, spin: 8, menu: 5, shift: 10 };
    return user.selectedProducts.reduce((total, id) => total + (productPrices[id] || 0), 0);
  };

  const price = calculatePrice();
  const hasExpiredTrial = user?.trialEndsAt && new Date(user.trialEndsAt) <= new Date();
  const isTrialExpired = hasExpiredTrial && user?.subscriptionStatus !== 'active';

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => { window.location.href = data.url; },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start checkout", variant: "destructive" });
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundColor: "#080808", color: "white" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(201,168,76,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
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
          className="p-10 rounded-md text-center"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
            >
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
          </div>

          <h2 className="text-xl font-light text-white mb-2">
            {isTrialExpired ? "Free Trial Expired" : "Subscription Required"}
          </h2>
          <p className="text-sm font-light mb-6" style={{ color: MUTED }}>
            {isTrialExpired
              ? "Your 3-day free trial has ended. Subscribe now to continue using uniHub."
              : "Your payment was not completed or your subscription is not active."}
          </p>

          <div
            className="rounded-md p-4 mb-6 text-left"
            style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
          >
            <p className="text-xs tracking-wide uppercase mb-1" style={{ color: GOLD }}>Your plan</p>
            <p className="text-2xl font-light text-white">€{price}<span className="text-sm ml-1" style={{ color: MUTED }}>/month</span></p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="w-full tracking-wide text-sm font-medium"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-complete-subscription"
            >
              {checkoutMutation.isPending ? "Loading..." : `Subscribe — €${price}/month`}
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm border-white/15 text-white bg-transparent hover:bg-white/5"
              onClick={() => window.location.reload()}
              data-testid="button-refresh"
            >
              Refresh Page
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm hover:bg-white/5"
              style={{ color: MUTED }}
              onClick={() => logout()}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
