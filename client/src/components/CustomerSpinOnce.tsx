import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Reward } from "@shared/schema";

export default function CustomerSpinOnce() {
  const { userId } = useParams();
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);

  const { data: rewards = [] } = useQuery({
    queryKey: ["/api", "rewards", "public", userId],
    queryFn: () => apiRequest<Reward[]>(`/api/rewards/public/${userId}`),
  });

  useEffect(() => {
    const hasSpunBefore = sessionStorage.getItem(`spin-${userId}`);
    if (hasSpunBefore) {
      setHasSpun(true);
    }
  }, [userId]);

  const spinMutation = useMutation({
    mutationFn: () => apiRequest<{ reward: Reward }>(`/api/spin-in-store/${userId}`, {
      method: "POST",
    }),
    onSuccess: (data) => {
      const winningReward = data.reward;
      const activeRewards = rewards.filter(r => r.isActive);
      const winningIndex = activeRewards.findIndex(r => r.id === winningReward.id);
      
      let targetAngle = 0;
      let cumulative = 0;
      for (let i = 0; i < winningIndex; i++) {
        cumulative += activeRewards[i].winChance;
      }
      targetAngle = cumulative + (activeRewards[winningIndex].winChance / 2);
      const normalizedAngle = 360 - targetAngle + 90;
      const spinRotations = 360 * 5;
      const finalRotation = spinRotations + normalizedAngle;
      
      setRotation(finalRotation);
      
      setTimeout(() => {
        setPrizeWon(winningReward.name);
        setIsSpinning(false);
        setHasSpun(true);
        sessionStorage.setItem(`spin-${userId}`, 'true');
      }, 3000);
    },
  });

  const handleSpin = () => {
    if (hasSpun) return;
    setIsSpinning(true);
    spinMutation.mutate();
  };

  const activeRewards = rewards.filter(r => r.isActive);
  const totalPercentage = activeRewards.reduce((sum, r) => sum + r.winChance, 0);

  const colors = [
    "#ef4444", "#f59e0b", "#10b981", "#3b82f6", 
    "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"
  ];

  const renderWheel = () => {
    if (activeRewards.length === 0) return null;

    let currentAngle = 0;
    const segments = activeRewards.map((reward, index) => {
      const percentage = (reward.winChance / totalPercentage) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      
      const x1 = 200 + 180 * Math.cos(startRad);
      const y1 = 200 + 180 * Math.sin(startRad);
      const x2 = 200 + 180 * Math.cos(endRad);
      const y2 = 200 + 180 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M 200 200 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const textAngle = startAngle + angle / 2;
      const textRad = (textAngle - 90) * (Math.PI / 180);
      const textX = 200 + 120 * Math.cos(textRad);
      const textY = 200 + 120 * Math.sin(textRad);

      return (
        <g key={reward.id}>
          <path
            d={pathData}
            fill={colors[index % colors.length]}
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
          >
            {reward.name}
          </text>
          <text
            x={textX}
            y={textY + 16}
            fill="white"
            fontSize="12"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textAngle}, ${textX}, ${textY + 16})`}
          >
            {Math.round(percentage)}%
          </text>
        </g>
      );
    });

    return (
      <svg
        ref={wheelRef}
        width="400"
        height="400"
        viewBox="0 0 400 400"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
        }}
      >
        <circle cx="200" cy="200" r="190" fill="none" stroke="#ddd" strokeWidth="2" />
        {segments}
        <circle cx="200" cy="200" r="20" fill="white" stroke="#333" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-chart-3/20 to-chart-2/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Spin to Win!</CardTitle>
          <p className="text-muted-foreground">One spin per customer</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!prizeWon && activeRewards.length > 0 ? (
            <>
              <div className="relative flex justify-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                  <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-500" />
                </div>
                {renderWheel()}
              </div>

              <Button
                onClick={handleSpin}
                disabled={isSpinning || hasSpun}
                className="w-full"
                size="lg"
                data-testid="button-spin"
              >
                {hasSpun ? "Already Spun" : isSpinning ? "Spinning..." : "Spin Now!"}
              </Button>
              
              {hasSpun && !prizeWon && (
                <p className="text-center text-muted-foreground text-sm">
                  You've already used your spin!
                </p>
              )}
            </>
          ) : prizeWon ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold">Congratulations!</h3>
              <p className="text-xl">You won: {prizeWon}</p>
              <p className="text-sm text-muted-foreground">Show this screen to claim your prize!</p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No active rewards configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
