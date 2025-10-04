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
    if (!user?.selectedProducts) return 0;
    if (user.selectedProducts.length === 2) return 20;
    if (user.selectedProducts.includes('loyalty')) return 15;
    if (user.selectedProducts.includes('spin')) return 10;
    return 0;
  };

  const price = calculatePrice();

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
          <CardTitle className="text-2xl font-semibold mb-2">Subscription Required</CardTitle>
          <CardDescription className="text-base">
            Your payment was not completed or your subscription is not active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            To access the dashboard, you need an active subscription for €{price}/month. 
            If you just completed payment, please wait a moment and refresh the page.
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
