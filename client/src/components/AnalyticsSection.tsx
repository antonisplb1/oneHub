import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Gauge, TrendingUp } from "lucide-react";

export default function AnalyticsSection() {
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => apiRequest<any[]>("/api/customers"),
  });

  const { data: loyaltyCards = [] } = useQuery({
    queryKey: ["/api/loyalty-cards"],
    queryFn: () => apiRequest<any[]>("/api/loyalty-cards"),
  });

  const { data: spins = [] } = useQuery({
    queryKey: ["/api/spins"],
    queryFn: () => apiRequest<any[]>("/api/spins"),
  });

  const activeCards = loyaltyCards.filter(card => card.stamps > 0);
  const totalRewards = loyaltyCards.reduce((sum, card) => sum + (card.totalRewards || 0), 0);

  const stats = [
    { 
      title: "Total Customers", 
      value: customers.length.toString(), 
      icon: Users, 
      color: "text-primary" 
    },
    { 
      title: "Active Loyalty Cards", 
      value: activeCards.length.toString(), 
      icon: CreditCard, 
      color: "text-chart-2" 
    },
    { 
      title: "Total Spins", 
      value: spins.length.toString(), 
      icon: Gauge, 
      color: "text-chart-3" 
    },
    { 
      title: "Rewards Redeemed", 
      value: totalRewards.toString(), 
      icon: TrendingUp, 
      color: "text-chart-4" 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your engagement metrics and customer activity
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loyaltyCards.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {loyaltyCards
                  .sort((a, b) => new Date(b.lastStampAt || 0).getTime() - new Date(a.lastStampAt || 0).getTime())
                  .slice(0, 5)
                  .map((card, index) => {
                    const customer = customers.find(c => c.id === card.customerId);
                    return (
                      <div key={card.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">{customer?.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {card.stamps}/{card.maxStamps} stamps
                          </p>
                        </div>
                        {card.totalRewards > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {card.totalRewards} reward{card.totalRewards !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Card Completion Rate</span>
                  <span className="text-sm font-medium">
                    {loyaltyCards.length > 0 
                      ? Math.round((loyaltyCards.filter(c => c.isRedeemable).length / loyaltyCards.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${loyaltyCards.length > 0 
                        ? (loyaltyCards.filter(c => c.isRedeemable).length / loyaltyCards.length) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Average Stamps</span>
                  <span className="text-sm font-medium">
                    {loyaltyCards.length > 0
                      ? (loyaltyCards.reduce((sum, card) => sum + card.stamps, 0) / loyaltyCards.length).toFixed(1)
                      : 0}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chart-2 transition-all"
                    style={{ 
                      width: `${loyaltyCards.length > 0
                        ? ((loyaltyCards.reduce((sum, card) => sum + card.stamps, 0) / loyaltyCards.length) / 10) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
