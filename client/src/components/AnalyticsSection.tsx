import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MousePointer, Gift, Trophy, TrendingUp, TrendingDown, CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsSummary {
  thisMonth: { visits: number; newMembers: number; spins: number; rewards: number };
  lastMonth: { visits: number; newMembers: number; spins: number; rewards: number };
  repeatRate: {
    avgVisitsRepeatMembers: number;
    singleVisitMembers: number;
    repeatMembers: number;
  };
  visitsByDayOfWeek: number[];
  topCustomers: { name: string; visits: number; lastVisit: string }[];
}

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function percentChange(current: number, previous: number): { text: string; direction: "up" | "down" | "none" } {
  if (previous === 0) return { text: "—", direction: "none" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { text: `+${pct}%`, direction: "up" };
  if (pct < 0) return { text: `${pct}%`, direction: "down" };
  return { text: "0%", direction: "none" };
}

export default function AnalyticsSection() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
    queryFn: () => apiRequest<AnalyticsSummary>("/api/analytics/summary"),
    staleTime: 60 * 1000,
  });

  if (isLoading || !summary) {
    return (
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-lg">Is loyalty working for your business?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
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

  const { thisMonth, lastMonth, repeatRate, visitsByDayOfWeek, topCustomers } = summary;

  const monthCards = [
    { title: "Visits", current: thisMonth.visits, previous: lastMonth.visits, icon: MousePointer, color: "text-chart-2" },
    { title: "New members", current: thisMonth.newMembers, previous: lastMonth.newMembers, icon: Users, color: "text-primary" },
    { title: "Spins", current: thisMonth.spins, previous: lastMonth.spins, icon: Gift, color: "text-chart-4" },
    { title: "Rewards", current: thisMonth.rewards, previous: lastMonth.rewards, icon: Trophy, color: "text-chart-3" },
  ];

  const totalDowVisits = visitsByDayOfWeek.reduce((a, b) => a + b, 0);
  const maxDow = Math.max(...visitsByDayOfWeek, 1);

  let dowSentence: string | null = null;
  if (totalDowVisits >= 10) {
    let busiest = 0;
    let quietest = 0;
    visitsByDayOfWeek.forEach((v, i) => {
      if (v > visitsByDayOfWeek[busiest]) busiest = i;
      if (v < visitsByDayOfWeek[quietest]) quietest = i;
    });
    dowSentence = `${DOW_NAMES[busiest]} is your busiest day; ${DOW_NAMES[quietest]} is your quietest.`;
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-lg">Your loyalty program's monthly review</p>
      </div>

      {/* Section 1: Is loyalty working? */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Is loyalty working?</h2>
        <p className="text-muted-foreground" data-testid="text-repeat-headline">
          {repeatRate.repeatMembers === 0
            ? "Not enough data yet — this fills in after a few weeks of stamps."
            : `Your repeat customers visited an average of ${repeatRate.avgVisitsRepeatMembers} times this month — ${repeatRate.repeatMembers} customer${repeatRate.repeatMembers === 1 ? "" : "s"} came back more than once.`}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {monthCards.map((card) => {
            const change = percentChange(card.current, card.previous);
            return (
              <Card key={card.title} className="hover-elevate border-card-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight mb-1" data-testid={`text-month-${card.title.toLowerCase().replace(/ /g, "-")}`}>
                    {card.current}
                  </div>
                  <p className="text-xs flex items-center gap-1 flex-wrap">
                    {change.direction === "up" && (
                      <span className="flex items-center gap-1 text-chart-2">
                        <TrendingUp className="h-3 w-3" />
                        {change.text}
                      </span>
                    )}
                    {change.direction === "down" && (
                      <span className="flex items-center gap-1 text-destructive">
                        <TrendingDown className="h-3 w-3" />
                        {change.text}
                      </span>
                    )}
                    {change.direction === "none" && (
                      <span className="text-muted-foreground">{change.text}</span>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: When do customers visit? */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">When do customers visit?</h2>
        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-semibold">Visits by day of week</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Stamp visits over the last 60 days</p>
              </div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {totalDowVisits === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No visits recorded in the last 60 days.</p>
            ) : (
              <>
                <div className="flex items-end justify-between h-32 gap-2">
                  {visitsByDayOfWeek.map((count, index) => {
                    const height = (count / maxDow) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col justify-end h-24">
                          <div
                            className="w-full rounded-t-md bg-chart-2 transition-all"
                            style={{ height: `${height}%` }}
                            data-testid={`dow-bar-${index}`}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-muted-foreground">{DOW_LABELS[index]}</div>
                          <div className="text-xs text-muted-foreground">{count}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {dowSentence && (
                  <p className="text-sm text-muted-foreground mt-4" data-testid="text-dow-sentence">{dowSentence}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Your best customers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Your best customers</h2>
        <Card className="border-card-border shadow-sm">
          <CardContent className="pt-6">
            {topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4" data-testid="text-no-customers">
                No customer visits recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div
                    key={`${customer.name}-${index}`}
                    className="flex items-center justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
                    data-testid={`top-customer-${index}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                        index === 0 ? "bg-chart-3/20 text-chart-3" :
                        index === 1 ? "bg-chart-2/20 text-chart-2" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.visits} visit{customer.visits === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {customer.lastVisit && !isNaN(new Date(customer.lastVisit).getTime())
                        ? `last visit ${formatDistanceToNow(new Date(customer.lastVisit), { addSuffix: true })}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
