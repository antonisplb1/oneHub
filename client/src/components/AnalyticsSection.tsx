import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, MousePointer, Gauge } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AnalyticsSection() {
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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthNewCustomers = loyaltyCards.filter(
    (item: any) => new Date(item.card.createdAt) >= startOfMonth
  ).length;

  const stampTransactions = transactions.filter(
    (item: any) => item.transaction?.type === 'stamp'
  );

  const totalVisits = stampTransactions.length;

  const thisMonthVisits = stampTransactions.filter(
    (item: any) => new Date(item.transaction.createdAt) >= startOfMonth
  ).length;

  const rewardTransactions = transactions.filter(
    (item: any) => item.transaction?.type === 'reward'
  );

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
    .slice(0, 10);

  const stats = [
    { 
      title: "Total Customers", 
      value: customers.length.toString(), 
      icon: Users, 
      color: "text-primary" 
    },
    { 
      title: "New Customers This Month", 
      value: thisMonthNewCustomers.toString(), 
      icon: UserPlus, 
      color: "text-chart-2" 
    },
    { 
      title: "Total Visits", 
      value: totalVisits.toString(), 
      icon: MousePointer, 
      color: "text-chart-3" 
    },
    { 
      title: "Visits This Month", 
      value: thisMonthVisits.toString(), 
      icon: MousePointer, 
      color: "text-chart-4" 
    },
    { 
      title: "Total QR Spins", 
      value: spins.length.toString(), 
      icon: Gauge, 
      color: "text-chart-5" 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-lg">
          Track your engagement metrics and customer activity
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <p className="text-muted-foreground text-center py-8">
              No activity yet
            </p>
          ) : (
            <div className="space-y-5">
              {combinedActivities.map((activity) => (
                <div key={activity.id} className="flex items-start justify-between gap-6 pb-5 border-b last:border-0 last:pb-0" data-testid={`activity-${activity.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-1">{activity.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
