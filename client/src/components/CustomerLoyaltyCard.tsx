import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CustomerLoyaltyCard() {
  const { customerId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api", "loyalty-card", "customer", customerId],
    queryFn: () => apiRequest<any>(`/api/loyalty-card/customer/${customerId}`),
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading your card...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Card not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { card, customer, user } = data;
  const shopName = user?.shopName || "Shop";
  const shopLogo = user?.logo;
  const stamps = card.stamps;
  const maxStamps = card.maxStamps;
  const rewardText = card.rewardText;
  const isRedeemable = card.isRedeemable;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto">
            {shopLogo ? (
              <AvatarImage src={shopLogo} alt={shopName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {shopName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{shopName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {customer?.name || "Loyalty Member"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              {stamps}/{maxStamps} Stamps
            </p>
            <div className="grid grid-cols-5 gap-3 justify-items-center">
              {Array.from({ length: maxStamps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    i < stamps
                      ? "bg-chart-2 border-chart-2 text-white"
                      : "border-muted bg-muted/20"
                  }`}
                  data-testid={`stamp-${i}`}
                >
                  {i < stamps && <Check className="w-6 h-6" />}
                </div>
              ))}
            </div>
          </div>

          {isRedeemable ? (
            <div className="text-center space-y-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                Reward Ready!
              </Badge>
              <p className="text-xl font-semibold text-chart-2">{rewardText}</p>
              <p className="text-sm text-muted-foreground">
                Show this screen to the cashier to claim your reward!
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                {maxStamps - stamps} more {maxStamps - stamps === 1 ? "stamp" : "stamps"} until your {rewardText}
              </p>
            </div>
          )}

          <div className="pt-4 border-t text-center text-xs text-muted-foreground">
            Save this page to your home screen for quick access
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
