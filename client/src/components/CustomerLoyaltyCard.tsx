import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function CustomerLoyaltyCard() {
  //todo: remove mock functionality
  const shopName = "My Coffee Shop";
  const stamps = 7;
  const maxStamps = 10;
  const rewardText = "Free Coffee";
  const isRedeemable = stamps >= maxStamps;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {shopName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{shopName}</CardTitle>
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
              <Button className="w-full" size="lg" data-testid="button-claim-reward">
                Claim Your Reward
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                {maxStamps - stamps} more {maxStamps - stamps === 1 ? "stamp" : "stamps"} until your {rewardText}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
