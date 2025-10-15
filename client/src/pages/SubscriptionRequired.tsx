import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
    
    // All four products - Bundle discount (€24.99 instead of €33)
    if (sorted.length === 4 && sorted.includes('loyalty') && sorted.includes('spin') && sorted.includes('menu') && sorted.includes('shift')) {
      return 24.99;
    }
    
    // Individual prices for all other combinations
    const productPrices: Record<string, number> = {
      loyalty: 10,
      spin: 8,
      menu: 5,
      shift: 10,
    };
    
    return user.selectedProducts.reduce((total, id) => {
      return total + (productPrices[id] || 0);
    }, 0);
  };

  const price = calculatePrice();

  // Check if trial has expired
  const hasExpiredTrial = user?.trialEndsAt && new Date(user.trialEndsAt) <= new Date();
  const isTrialExpired = hasExpiredTrial && user?.subscriptionStatus !== 'active';

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-card-border shadow-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold mb-2">
            {isTrialExpired ? "Free Trial Expired" : "Subscription Required"}
          </CardTitle>
          <CardDescription className="text-base">
            {isTrialExpired 
              ? "Your 3-day free trial has ended. Subscribe now to continue using uniHub."
              : "Your payment was not completed or your subscription is not active."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            {isTrialExpired
              ? "To continue accessing the dashboard and all your data, subscribe now for just €" + price + "/month."
              : "To access the dashboard, you need an active subscription for €" + price + "/month. If you just completed payment, please wait a moment and refresh the page."
            }
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              size="lg"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              data-testid="button-complete-subscription"
            >
              {checkoutMutation.isPending ? "Loading..." : `Complete Subscription - €${price}/month`}
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.reload()}
              data-testid="button-refresh"
            >
              Refresh Page
            </Button>
            <Button 
              size="lg"
              variant="ghost" 
              onClick={() => logout()}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
