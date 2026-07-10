import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hasAccessGrantingSubscription } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, Gift, Loader2, UtensilsCrossed, Calendar } from "lucide-react";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";
import { Link } from "wouter";

const GOLD = "#E53935";
const GOLD_DIM = "rgba(229, 57, 53,0.18)";
const GOLD_BORDER = "rgba(229, 57, 53,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: typeof Ticket;
}

const products: Product[] = [
  { id: 'loyalty', name: 'Loyalty Cards', description: 'Digital loyalty card program with stamp collection and rewards', price: 19, icon: Ticket },
  { id: 'spin', name: 'Spin Wheel', description: 'Interactive prize wheel campaigns for customer engagement', price: 5, icon: Gift },
  { id: 'menu', name: 'Menu Builder', description: 'Create and manage your digital menu for customers', price: 8, icon: UtensilsCrossed },
  { id: 'shift', name: 'Shift Manager', description: 'Employee shift scheduling with weekly calendar and crew management', price: 18, icon: Calendar },
];

export default function SelectProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const hasActiveTrial = user?.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasActiveSubscription = hasAccessGrantingSubscription(user?.subscriptionStatus);

  const selectProductsMutation = useMutation({
    mutationFn: async (products: string[]) => {
      await apiRequest('/api/user/select-products', {
        method: 'POST',
        body: JSON.stringify({ products }),
      });
      if (hasActiveTrial && !hasActiveSubscription) {
        return { isTrialFlow: true };
      }
      const checkoutRes = await apiRequest<{ url: string }>('/api/stripe/create-checkout-session', {
        method: 'POST',
      });
      return { isTrialFlow: false, url: checkoutRes.url };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
      if (data.isTrialFlow) {
        toast({ title: "Products selected", description: "You can now access your dashboard and explore during your free trial!" });
        setLocation("/dashboard");
      } else {
        toast({ title: "Products selected", description: "Opening checkout in new tab..." });
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({ title: "Selection failed", description: error.message, variant: "destructive" });
    },
  });

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const calculateTotal = () => {
    const sorted = [...selectedProducts].sort();
    if (sorted.length === 4 && sorted.includes('loyalty') && sorted.includes('spin') && sorted.includes('menu') && sorted.includes('shift')) {
      return 24.99;
    }
    return selectedProducts.reduce((total, id) => {
      const product = products.find(p => p.id === id);
      return total + (product?.price || 0);
    }, 0);
  };

  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      toast({ title: "No products selected", description: "Please select at least one product", variant: "destructive" });
      return;
    }
    selectProductsMutation.mutate(selectedProducts);
  };

  const isBundleSelected = selectedProducts.length === 4 &&
    selectedProducts.includes('loyalty') && selectedProducts.includes('spin') &&
    selectedProducts.includes('menu') && selectedProducts.includes('shift');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundColor: "#080808", color: "white" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(229, 57, 53,0.06) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-lg">
        {/* Logo + logout */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <img src={logoImage} alt="uniHub logo" className="h-7 w-7" />
              <span className="text-xl tracking-tight">
                <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </span>
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="text-xs tracking-wide transition-opacity opacity-50 hover:opacity-80"
            style={{ color: MUTED }}
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>

        <div className="mb-8">
          <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: GOLD }}>Onboarding</p>
          <h1 className="text-2xl font-light text-white mb-1" data-testid="text-page-title">Choose your products</h1>
          <p className="text-sm font-light" style={{ color: MUTED }} data-testid="text-page-description">
            Select the features you want to include in your subscription
          </p>
        </div>

        {/* Product list */}
        <div className="space-y-2 mb-4">
          {products.map((product) => {
            const Icon = product.icon;
            const isSelected = selectedProducts.includes(product.id);
            return (
              <div
                key={product.id}
                className="flex items-start gap-4 p-5 rounded-md cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected ? GOLD_DIM : SURFACE,
                  border: `1px solid ${isSelected ? GOLD_BORDER : BORDER}`,
                }}
                onClick={() => toggleProduct(product.id)}
                data-testid={`card-product-${product.id}`}
              >
                <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleProduct(product.id)}
                    data-testid={`checkbox-product-${product.id}`}
                    className="border-white/30 data-[state=checked]:bg-[#E53935] data-[state=checked]:border-[#E53935]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? GOLD : MUTED }} />
                    <h3 className="font-medium text-white text-sm" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-xs font-light" style={{ color: MUTED }} data-testid={`text-product-description-${product.id}`}>
                    {product.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-light text-white" data-testid={`text-product-price-${product.id}`}>€{product.price}</div>
                  <div className="text-xs" style={{ color: MUTED }}>/ month</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bundle banner */}
        {isBundleSelected && user?.customPrice == null && !user?.chargeFree && (
          <div
            className="rounded-md p-4 mb-4"
            style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: GOLD }} data-testid="text-bundle-discount">
                  Complete Bundle Discount
                </p>
                <p className="text-xs" style={{ color: MUTED }}>Save €13/month with all four products</p>
              </div>
              <div className="text-right">
                <div className="text-xs line-through" style={{ color: MUTED }}>€50</div>
                <div className="text-xl font-light text-white">€36.99</div>
              </div>
            </div>
          </div>
        )}

        {/* Total + CTA */}
        <div className="space-y-3">
          <div
            className="flex items-center justify-between p-4 rounded-md"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <span className="text-sm font-medium text-white">Total</span>
            <span className="text-xl font-light text-white" data-testid="text-total-price">
              {user?.chargeFree
                ? "No charge"
                : `€${user?.customPrice != null ? (user.customPrice / 100).toFixed(2) : calculateTotal()}/month`}
            </span>
          </div>
          {user?.chargeFree ? (
            <p className="text-xs" style={{ color: MUTED }} data-testid="text-charge-free-note">
              Your account has full access at no cost.
            </p>
          ) : user?.customPrice != null && (
            <p className="text-xs" style={{ color: MUTED }} data-testid="text-admin-adjusted-price">
              Price adjusted manually by admin.
            </p>
          )}
          <Button
            onClick={handleContinue}
            disabled={selectedProducts.length === 0 || selectProductsMutation.isPending}
            className="w-full tracking-wide text-sm font-medium"
            style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
            data-testid="button-continue"
          >
            {selectProductsMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : hasActiveTrial && !hasActiveSubscription ? (
              "Start Free Trial"
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
