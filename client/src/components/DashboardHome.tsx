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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {combinedActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {combinedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold">{activity.customerName}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 rounded-md hover-elevate border" data-testid="button-quick-scan">
              <p className="font-semibold">Scan QR Code</p>
              <p className="text-sm text-muted-foreground">Add stamp or redeem reward</p>
            </button>
            <button className="w-full text-left p-3 rounded-md hover-elevate border" data-testid="button-quick-token">
              <p className="font-semibold">Generate Spin Token</p>
              <p className="text-sm text-muted-foreground">Create new token for customers</p>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stamps Added</span>
              <span className="font-semibold" data-testid="text-stamps-week">{stampsThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rewards Claimed</span>
              <span className="font-semibold" data-testid="text-rewards-week">{rewardsThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Customers</span>
              <span className="font-semibold" data-testid="text-customers-week">{newCustomersThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wheel Spins</span>
              <span className="font-semibold" data-testid="text-spins-week">{spinsThisWeek}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
