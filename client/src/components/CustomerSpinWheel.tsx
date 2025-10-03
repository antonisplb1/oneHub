import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CustomerSpinWheel() {
  const [token, setToken] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);

  //todo: remove mock functionality
  const rewards = ["Free Coffee", "10% Off", "Free Pastry", "Try Again"];
  
  const handleSpin = () => {
    if (!token.trim()) return;
    
    setIsSpinning(true);
    setPrizeWon(null);

    setTimeout(() => {
      const randomPrize = rewards[Math.floor(Math.random() * rewards.length)];
      setPrizeWon(randomPrize);
      setIsSpinning(false);
      console.log("Prize won:", randomPrize);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-chart-3/20 to-chart-2/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Spin to Win!</CardTitle>
          <p className="text-muted-foreground">Enter your token to try your luck</p>
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
                  <div className="grid grid-cols-2 gap-2 text-center text-sm font-semibold">
                    {rewards.map((reward, i) => (
                      <div key={i} className="p-2">
                        {reward}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-0 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-chart-4" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="spin-token">Spin Token</Label>
                  <Input
                    id="spin-token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your token"
                    data-testid="input-spin-token"
                    disabled={isSpinning}
                  />
                </div>

                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || !token.trim()}
                  className="w-full"
                  size="lg"
                  data-testid="button-spin"
                >
                  {isSpinning ? "Spinning..." : "Spin Now!"}
                </Button>
              </div>
            </>
          )}

          {prizeWon && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold">Congratulations!</h3>
              <p className="text-xl">You won: {prizeWon}</p>
              <Button
                onClick={() => {
                  setPrizeWon(null);
                  setToken("");
                }}
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
