import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Reward } from "@shared/schema";

export default function InStoreSpinWheel() {
  const { userId } = useParams();
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);

  const { data: rewards = [] } = useQuery({
    queryKey: ["/api", "rewards", "public", userId],
    queryFn: () => apiRequest<Reward[]>(`/api/rewards/public/${userId}`),
  });

  const spinMutation = useMutation({
    mutationFn: () => apiRequest<{ reward: Reward }>(`/api/spin-in-store/${userId}`, {
      method: "POST",
    }),
    onSuccess: (data) => {
      setTimeout(() => {
        setPrizeWon(data.reward.name);
        setIsSpinning(false);
      }, 2000);
    },
  });

  const handleSpin = () => {
    setPrizeWon(null);
    setIsSpinning(true);
    spinMutation.mutate();
  };

  const handleReset = () => {
    setPrizeWon(null);
    spinMutation.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-chart-3/20 to-chart-2/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Spin to Win!</CardTitle>
          <p className="text-muted-foreground">Try your luck - unlimited spins!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!prizeWon && (
            <>
              <div className="w-full aspect-square bg-gradient-to-br from-primary to-chart-3 rounded-full flex items-center justify-center relative">
                <div
                  className={`w-4/5 h-4/5 bg-background rounded-full flex items-center justify-center ${
                    isSpinning ? "animate-spin" : ""
                  }`}
                >
                  <p className="text-4xl font-bold text-muted-foreground">?</p>
                </div>
                <div className="absolute top-0 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-chart-4" />
              </div>

              <Button
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full"
                size="lg"
                data-testid="button-spin"
              >
                {isSpinning ? "Spinning..." : "Spin Now!"}
              </Button>
            </>
          )}

          {prizeWon && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold">Congratulations!</h3>
              <p className="text-xl">You won: {prizeWon}</p>
              <p className="text-sm text-muted-foreground">Show this screen to claim your prize!</p>
              <Button
                onClick={handleReset}
                className="w-full"
                data-testid="button-spin-again"
              >
                Spin Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
