import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Gauge, TrendingUp } from "lucide-react";

export default function DashboardHome() {
  //todo: remove mock functionality
  const stats = [
    { title: "Total Customers", value: "245", icon: Users, color: "text-primary" },
    { title: "Active Loyalty Cards", value: "189", icon: CreditCard, color: "text-chart-2" },
    { title: "Spins This Week", value: "67", icon: Gauge, color: "text-chart-3" },
    { title: "Rewards Redeemed", value: "34", icon: TrendingUp, color: "text-chart-4" },
  ];

  const recentActivity = [
    { customer: "John Doe", action: "Received stamp", time: "2 minutes ago" },
    { customer: "Jane Smith", action: "Redeemed reward", time: "15 minutes ago" },
    { customer: "Bob Johnson", action: "Spun the wheel - Won 10% Off", time: "1 hour ago" },
    { customer: "Alice Brown", action: "Joined loyalty program", time: "2 hours ago" },
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
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-4 pb-4 border-b last:border-0"
                data-testid={`activity-${i}`}
              >
                <div className="flex-1">
                  <p className="font-semibold">{activity.customer}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
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
              <span className="font-semibold">142</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rewards Claimed</span>
              <span className="font-semibold">34</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Customers</span>
              <span className="font-semibold">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wheel Spins</span>
              <span className="font-semibold">67</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
