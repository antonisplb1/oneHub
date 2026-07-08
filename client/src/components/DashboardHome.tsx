import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, Gift, Calendar, QrCode, Activity, Trophy, AlertCircle, TrendingUp, TrendingDown, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface DashboardSummary {
  today: { stamps: number; spins: number; newMembers: number };
  week: { stamps: number; stampsPrevWeek: number };
  attention: {
    readyToRedeem: number;
    nearReward: number;
    inactive30d: number;
    noShiftsTomorrow?: boolean;
  };
  todaysShifts: { employeeName: string; startTime: string; endTime: string }[];
  trend7d: number[];
  recentActivity: {
    id: string;
    type: "stamp" | "reward" | "spin";
    customerName: string;
    description: string;
    timestamp: string;
  }[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DashboardHome() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: () => apiRequest<DashboardSummary>("/api/dashboard/summary"),
    staleTime: 60 * 1000,
  });

  if (isLoading || !summary) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Your loyalty program at a glance</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-card-border shadow-sm">
              <CardContent className="pt-6">
                <div className="h-16 animate-pulse rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { today, week, attention, todaysShifts, trend7d, recentActivity } = summary;

  const weekDiff = week.stamps - week.stampsPrevWeek;
  const maxTrend = Math.max(...trend7d, 1);
  const totalTrend = trend7d.reduce((a, b) => a + b, 0);
  const todayDow = new Date().getDay();

  // trend7d[6] is today; index i maps to day (todayDow - 6 + i)
  let busiestSentence: string | null = null;
  if (totalTrend > 0) {
    let bestIdx = 0;
    trend7d.forEach((v, i) => { if (v > trend7d[bestIdx]) bestIdx = i; });
    const busiestDow = (todayDow - 6 + bestIdx + 7) % 7;
    busiestSentence =
      bestIdx === 6
        ? "Your busiest day this week is today."
        : `Your busiest day this week was ${DAY_NAMES[busiestDow]}.`;
  }

  const attentionRows: { key: string; text: string; href: string }[] = [];
  if (attention.readyToRedeem > 0) {
    attentionRows.push({
      key: "ready",
      text: `${attention.readyToRedeem} customer${attention.readyToRedeem === 1 ? " is" : "s are"} ready to redeem a reward`,
      href: "/dashboard/customers",
    });
  }
  if (attention.nearReward > 0) {
    attentionRows.push({
      key: "near",
      text: `${attention.nearReward} customer${attention.nearReward === 1 ? " is" : "s are"} 1 stamp away from a reward`,
      href: "/dashboard/customers",
    });
  }
  if (attention.inactive30d > 0) {
    attentionRows.push({
      key: "inactive",
      text: `${attention.inactive30d} customer${attention.inactive30d === 1 ? " hasn't" : "s haven't"} visited in 30+ days`,
      href: "/dashboard/customers",
    });
  }
  if (attention.noShiftsTomorrow === true) {
    attentionRows.push({
      key: "shifts",
      text: "No shifts scheduled for tomorrow",
      href: "/dashboard/shifts",
    });
  }

  const todayStats = [
    { title: "Stamps today", value: today.stamps, icon: Award, color: "text-chart-2" },
    { title: "Spins today", value: today.spins, icon: Gift, color: "text-chart-4" },
    { title: "New members today", value: today.newMembers, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">What's happening today</p>
      </div>

      {/* Today strip */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {todayStats.map((stat) => (
          <Card key={stat.title} className="hover-elevate border-card-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight mb-1" data-testid={`text-${stat.title.toLowerCase().replace(/ /g, "-")}`}>
                {stat.value}
              </div>
              {stat.title === "Stamps today" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap" data-testid="text-week-comparison">
                  {weekDiff > 0 && <TrendingUp className="h-3 w-3 text-chart-2" />}
                  {weekDiff < 0 && <TrendingDown className="h-3 w-3 text-destructive" />}
                  {week.stamps} this week vs {week.stampsPrevWeek} last week
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs your attention */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold">Needs your attention</CardTitle>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {attentionRows.length === 0 ? (
            <p className="text-muted-foreground text-sm flex items-center gap-2" data-testid="text-all-good">
              <CheckCircle2 className="h-4 w-4 text-chart-2" />
              All good — nothing needs your attention today.
            </p>
          ) : (
            <div className="space-y-3">
              {attentionRows.map((row) => (
                <Link key={row.key} href={row.href}>
                  <div
                    className="flex items-center justify-between gap-4 p-3 rounded-md border border-border hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`attention-${row.key}`}
                  >
                    <p className="text-sm font-medium text-foreground">{row.text}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">View</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working today */}
      {todaysShifts.length > 0 && (
        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl font-semibold">Working today</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {todaysShifts.map((shift, i) => (
                <div
                  key={`${shift.employeeName}-${i}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-border"
                  data-testid={`shift-today-${i}`}
                >
                  <p className="text-sm font-medium text-foreground">{shift.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {shift.startTime}–{shift.endTime}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* 7-day trend (half height) */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-semibold">7-Day Activity Trend</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Total stamps + spins per day</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-20 gap-2">
            {trend7d.map((count, index) => {
              const dayIndex = (todayDow - 6 + index + 7) % 7;
              const isToday = index === 6;
              const height = (count / maxTrend) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-16">
                    <div
                      className={`w-full rounded-t-md transition-all ${isToday ? "bg-primary" : "bg-chart-2"}`}
                      style={{ height: `${height}%` }}
                      data-testid={`chart-bar-${index}`}
                    />
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {DAY_LABELS[dayIndex]}
                    </div>
                    <div className="text-xs text-muted-foreground">{count}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {busiestSentence ? (
            <p className="text-sm text-muted-foreground mt-4" data-testid="text-busiest-day">{busiestSentence}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-4" data-testid="text-busiest-day">No activity yet this week.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-6 pb-4 border-b last:border-0 last:pb-0"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      activity.type === "stamp" ? "bg-chart-2/20" :
                      activity.type === "reward" ? "bg-chart-3/20" :
                      "bg-chart-4/20"
                    }`}>
                      {activity.type === "stamp" && <Award className="w-4 h-4 text-chart-2" />}
                      {activity.type === "reward" && <Trophy className="w-4 h-4 text-chart-3" />}
                      {activity.type === "spin" && <Gift className="w-4 h-4 text-chart-4" />}
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
