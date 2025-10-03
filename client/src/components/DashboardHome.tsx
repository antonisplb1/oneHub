import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Gauge, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DashboardHome() {
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => apiRequest<any[]>("/api/customers"),
  });

  const { data: loyaltyCards = [] } = useQuery({
    queryKey: ["/api/loyalty-cards"],
    queryFn: () => apiRequest<any[]>("/api/loyalty-cards"),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/loyalty-transactions"],
    queryFn: () => apiRequest<any[]>("/api/loyalty-transactions"),
  });

  const { data: spins = [] } = useQuery({
    queryKey: ["/api/spins"],
    queryFn: () => apiRequest<any[]>("/api/spins"),
  });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const spinsThisWeek = spins.filter(
    (item: any) => new Date(item.spin.spunAt) >= startOfWeek
  ).length;

  const rewardTransactions = transactions.filter(
    (item: any) => item.transaction?.type === 'reward'
  );
  const totalRewardsRedeemed = rewardTransactions.length;

  const stampTransactions = transactions.filter(
    (item: any) => item.transaction?.type === 'stamp'
  );

  const stampsThisWeek = stampTransactions.filter(
    (item: any) => new Date(item.transaction.createdAt) >= startOfWeek
  ).length;

  const rewardsThisWeek = rewardTransactions.filter(
    (item: any) => new Date(item.transaction.createdAt) >= startOfWeek
  ).length;

  const newCustomersThisWeek = loyaltyCards.filter(
    (item: any) => new Date(item.card.createdAt) >= startOfWeek
  ).length;

  const combinedActivities = [
    ...stampTransactions.map((item: any) => ({
      id: `stamp-${item.transaction.id}`,
      type: 'stamp' as const,
      customerName: item.customer?.name || 'Unknown',
      timestamp: item.transaction.createdAt,
      description: 'Received a stamp',
    })),
    ...rewardTransactions.map((item: any) => ({
      id: `reward-${item.transaction.id}`,
      type: 'reward' as const,
      customerName: item.customer?.name || 'Unknown',
      timestamp: item.transaction.createdAt,
      description: 'Redeemed reward',
    })),
    ...spins.map((item: any) => ({
      id: `spin-${item.spin.id}`,
      type: 'spin' as const,
      customerName: item.customer?.name || 'Unknown',
      timestamp: item.spin.spunAt,
      description: `Won: ${item.spin.prizeWon}`,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  const stats = [
    { title: "Total Customers", value: customers.length.toString(), icon: Users, color: "text-primary" },
    { title: "Active Loyalty Cards", value: loyaltyCards.length.toString(), icon: CreditCard, color: "text-chart-2" },
    { title: "Spins This Week", value: spinsThisWeek.toString(), icon: Gauge, color: "text-chart-3" },
    { title: "Rewards Redeemed", value: totalRewardsRedeemed.toString(), icon: TrendingUp, color: "text-chart-4" },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate border-card-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {combinedActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No activity yet</p>
          ) : (
            <div className="space-y-5">
              {combinedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-6 pb-5 border-b last:border-0 last:pb-0"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-1">{activity.customerName}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-4 rounded-xl hover-elevate border border-border" data-testid="button-quick-scan">
              <p className="font-medium text-foreground">Scan QR Code</p>
              <p className="text-sm text-muted-foreground mt-1">Add stamp or redeem reward</p>
            </button>
            <button className="w-full text-left p-4 rounded-xl hover-elevate border border-border" data-testid="button-quick-token">
              <p className="font-medium text-foreground">Generate Spin Token</p>
              <p className="text-sm text-muted-foreground mt-1">Create new token for customers</p>
            </button>
          </CardContent>
        </Card>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Stamps Added</span>
              <span className="text-lg font-semibold" data-testid="text-stamps-week">{stampsThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rewards Claimed</span>
              <span className="text-lg font-semibold" data-testid="text-rewards-week">{rewardsThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">New Customers</span>
              <span className="text-lg font-semibold" data-testid="text-customers-week">{newCustomersThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Wheel Spins</span>
              <span className="text-lg font-semibold" data-testid="text-spins-week">{spinsThisWeek}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
