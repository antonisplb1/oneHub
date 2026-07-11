import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { spinWheel } from "@/lib/api";
import { PoweredByBadge } from "@/components/PoweredByBadge";

export default function CustomerSpinWheel() {
  const [token, setToken] = useState("");
  const [prizeWon, setPrizeWon] = useState<string | null>(null);

  const spinMutation = useMutation({
    mutationFn: (token: string) => spinWheel(token),
    onSuccess: (data) => {
      setTimeout(() => {
        setPrizeWon(data.reward.name);
      }, 2000);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to spin. Check your token and try again.");
    },
  });

  const handleSpin = () => {
    if (!token.trim()) return;
    setPrizeWon(null);
    spinMutation.mutate(token);
  };

  const handleReset = () => {
    setPrizeWon(null);
    setToken("");
    spinMutation.reset();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/20 via-chart-3/20 to-chart-2/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Spin to Win!</CardTitle>
          <p className="text-muted-foreground">Enter your token to try your luck</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!prizeWon && (
            <>
              <div className="w-full max-w-[320px] sm:max-w-none mx-auto aspect-square bg-gradient-to-br from-primary to-chart-3 rounded-full flex items-center justify-center relative">
                <div
                  className={`w-4/5 h-4/5 bg-background rounded-full flex items-center justify-center ${
                    spinMutation.isPending ? "animate-spin" : ""
                  }`}
                >
                  <p className="text-4xl font-bold text-muted-foreground">?</p>
                </div>
                <div className="absolute top-0 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-chart-4" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="spin-token">Spin Token</Label>
                  <Input
                    id="spin-token"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="Enter your token"
                    data-testid="input-spin-token"
                    disabled={spinMutation.isPending}
                    className="uppercase"
                  />
                </div>

                <Button
                  onClick={handleSpin}
                  disabled={spinMutation.isPending || !token.trim()}
                  className="w-full"
                  size="lg"
                  data-testid="button-spin"
                >
                  {spinMutation.isPending ? "Spinning..." : "Spin Now!"}
                </Button>
              </div>
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
      <PoweredByBadge variant="dark" className="absolute inset-x-0 bottom-6" />
    </div>
  );
}
