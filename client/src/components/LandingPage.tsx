import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Gift, TrendingUp, Check } from "lucide-react";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logoImage} alt="uniHub logo" className="h-8 w-8" />
              <h1 className="text-2xl font-semibold text-primary">uniHub</h1>
            </div>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg" data-testid="button-login">Login</Button>
          </Link>
        </div>
      </header>

      <section className="py-24 px-6">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-semibold mb-8 leading-tight tracking-tight">
              Boost Customer Loyalty & Engagement
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              All-in-one platform for digital stamp cards and prize wheels. Turn every visit into an opportunity.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/auth">
                <Button size="lg" data-testid="button-get-started" className="text-base px-8">
                  Register now..
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" data-testid="button-view-demo" className="text-base px-8">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
          <Card className="p-6 aspect-video flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Dashboard</h3>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2" />
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Loyalty Cards</span>
                </div>
                <p className="text-3xl font-bold">124</p>
                <p className="text-xs text-muted-foreground">Active customers</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-chart-3/10 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-chart-3" />
                  <span className="text-sm font-medium">Prize Wheels</span>
                </div>
                <p className="text-3xl font-bold">48</p>
                <p className="text-xs text-muted-foreground">Spins today</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-chart-2/10 to-transparent col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                  <span className="text-sm font-medium">Engagement Growth</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-chart-2 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Everything You Need</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <Award className="w-12 h-12 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">Digital Loyalty Cards</h4>
                <p className="text-muted-foreground">
                  Customers collect stamps on their phones. No cards to carry, no stamps to lose.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <Gift className="w-12 h-12 text-chart-3 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Prize Wheel Campaigns</h4>
                <p className="text-muted-foreground">
                  Create excitement with customizable spin-to-win wheels for promotions and events.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <TrendingUp className="w-12 h-12 text-chart-2 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Unified Dashboard</h4>
                <p className="text-muted-foreground">
                  Manage both features from one place. Track engagement and measure ROI effortlessly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Setup Your Account</h4>
              <p className="text-sm text-muted-foreground">Create your shop profile and customize your rewards in minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Customers Scan QR</h4>
              <p className="text-sm text-muted-foreground">Show your QR code at checkout or on your counter</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Track Engagement</h4>
              <p className="text-sm text-muted-foreground">Watch your repeat customers grow with real-time analytics</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h3>
            <p className="text-muted-foreground">Everything you need, one affordable price</p>
          </div>
          <Card className="p-8">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold mb-2">Professional Plan</h4>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">€20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited customers",
                "Digital loyalty cards",
                "Prize wheel campaigns",
                "QR code generation",
                "Real-time analytics",
                "Email support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth">
              <Button className="w-full" size="lg" data-testid="button-start-trial">
                Start Free Trial
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 uniHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
