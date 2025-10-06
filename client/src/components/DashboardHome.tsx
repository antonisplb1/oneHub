import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Award, Gift, TrendingUp, Calendar, ArrowRight, QrCode, Trophy, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

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

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate stats
  const rewardTransactions = transactions.filter(
    (item: any) => item.transaction?.type === 'reward'
  );
  const stampTransactions = transactions.filter(
    (item: any) => item.transaction?.type === 'stamp'
  );

  const totalStamps = stampTransactions.length;
  const totalRewards = rewardTransactions.length;
  const totalSpins = spins.length;

  const stampsThisWeek = stampTransactions.filter(
    (item: any) => new Date(item.transaction.createdAt) >= startOfWeek
  ).length;

  const rewardsThisWeek = rewardTransactions.filter(
    (item: any) => new Date(item.transaction.createdAt) >= startOfWeek
  ).length;

  const spinsThisWeek = spins.filter(
    (item: any) => new Date(item.spin.spunAt) >= startOfWeek
  ).length;

  const customersThisMonth = loyaltyCards.filter(
    (item: any) => new Date(item.card.createdAt) >= startOfMonth
  ).length;

  // Calculate 7-day activity trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const dailyActivity = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayStamps = stampTransactions.filter((item: any) => {
      const createdAt = new Date(item.transaction.createdAt);
      return createdAt >= date && createdAt < nextDay;
    }).length;

    const daySpins = spins.filter((item: any) => {
      const spunAt = new Date(item.spin.spunAt);
      return spunAt >= date && spunAt < nextDay;
    }).length;

    return dayStamps + daySpins;
  });

  const maxActivity = Math.max(...dailyActivity, 1);

  // Top customers by stamp count
  const customerStampCounts = new Map<number, { name: string; count: number; customerId: number }>();
  
  stampTransactions.forEach((item: any) => {
    const customerId = item.customer?.id;
    const customerName = item.customer?.name || 'Unknown';
    if (customerId) {
      const existing = customerStampCounts.get(customerId);
      if (existing) {
        existing.count++;
      } else {
        customerStampCounts.set(customerId, { name: customerName, count: 1, customerId });
      }
    }
  });

  const topCustomers = Array.from(customerStampCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent activity (last 8 items)
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
    .slice(0, 8);

  const stats = [
    { 
      title: "Total Customers", 
      value: customers.length.toString(), 
      change: `+${customersThisMonth} this month`,
      icon: Users, 
      color: "text-primary" 
    },
    { 
      title: "Stamps Given", 
      value: totalStamps.toString(), 
      change: `+${stampsThisWeek} this week`,
      icon: Award, 
      color: "text-chart-2" 
    },
    { 
      title: "Rewards Redeemed", 
      value: totalRewards.toString(), 
      change: `+${rewardsThisWeek} this week`,
      icon: Trophy, 
      color: "text-chart-3" 
    },
    { 
      title: "Wheel Spins", 
      value: totalSpins.toString(), 
      change: `+${spinsThisWeek} this week`,
      icon: Gift, 
      color: "text-chart-4" 
    },
  ];

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = now.getDay();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Your loyalty program at a glance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate border-card-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Trend Chart */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">7-Day Activity Trend</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Total stamps + spins per day</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-2">
            {dailyActivity.map((count, index) => {
              const dayIndex = (today - 6 + index + 7) % 7;
              const isToday = index === 6;
              const height = maxActivity > 0 ? (count / maxActivity) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-32">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isToday ? 'bg-primary' : 'bg-chart-2'
                      }`}
                      style={{ height: `${height}%` }}
                      data-testid={`chart-bar-${index}`}
                    />
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {dayLabels[dayIndex]}
                    </div>
                    <div className="text-xs text-muted-foreground">{count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/scanner">
              <div className="w-full text-left p-4 rounded-xl hover-elevate active-elevate-2 border border-border cursor-pointer" data-testid="button-quick-scan">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Scan QR Code</p>
                    <p className="text-sm text-muted-foreground mt-1">Award stamps or redeem rewards</p>
                  </div>
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Link>
            <Link href="/dashboard/campaigns">
              <div className="w-full text-left p-4 rounded-xl hover-elevate active-elevate-2 border border-border cursor-pointer" data-testid="button-quick-campaigns">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Manage Campaigns</p>
                    <p className="text-sm text-muted-foreground mt-1">Create or view prize wheels</p>
                  </div>
                  <Gift className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Link>
            <Link href="/dashboard/customers">
              <div className="w-full text-left p-4 rounded-xl hover-elevate active-elevate-2 border border-border cursor-pointer" data-testid="button-quick-customers">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">View All Customers</p>
                    <p className="text-sm text-muted-foreground mt-1">Browse customer list and details</p>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Most Loyal Customers</CardTitle>
              <Trophy className="h-5 w-5 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No customer data yet</p>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.customerId}
                    className="flex items-center justify-between"
                    data-testid={`top-customer-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-chart-3/20 text-chart-3' :
                        index === 1 ? 'bg-chart-2/20 text-chart-2' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.count} stamps collected</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {combinedActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {combinedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-6 pb-4 border-b last:border-0 last:pb-0"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      activity.type === 'stamp' ? 'bg-chart-2/20' :
                      activity.type === 'reward' ? 'bg-chart-3/20' :
                      'bg-chart-4/20'
                    }`}>
                      {activity.type === 'stamp' && <Award className="w-4 h-4 text-chart-2" />}
                      {activity.type === 'reward' && <Trophy className="w-4 h-4 text-chart-3" />}
                      {activity.type === 'spin' && <Gift className="w-4 h-4 text-chart-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.customerName}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
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
    </div>
  );
}
