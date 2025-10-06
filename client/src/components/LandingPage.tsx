import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Gift, QrCode, Check, ArrowRight, Sparkles } from "lucide-react";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logoImage} alt="uniHub logo" className="h-8 w-8" />
              <h1 className="text-2xl font-semibold text-primary">uniHub</h1>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" data-testid="button-demo">Demo</Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" data-testid="button-login">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Digital Loyalty & Rewards Platform</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Turn Customers Into<br />Loyal Regulars
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Digital loyalty cards and prize wheels in one platform. 
            No paper cards, no apps to download. Just QR codes.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth">
              <Button size="lg" className="text-base px-8" data-testid="button-get-started">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-view-demo">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            From €10/month • No setup fees • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  Digital Loyalty Cards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Customers collect stamps on their phones. Scan their QR code to award stamps instantly.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Instant customer signup via QR code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Google Wallet integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Built-in camera scanner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Automatic reward tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-chart-3" />
                  </div>
                  Prize Wheel Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Run exciting spin-to-win promotions. Perfect for events, sales, and customer acquisition.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Customizable prizes & probabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>QR code tokens or unlimited spins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Real-time prize tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Share campaigns on social media</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-chart-2" />
                </div>
                Everything Works with QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No apps for customers to download. Everything happens via QR codes and web browsers.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                  <div>
                    <div className="font-medium">Merchant QR</div>
                    <div className="text-muted-foreground">Customers scan to join</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                  <div>
                    <div className="font-medium">Customer QR</div>
                    <div className="text-muted-foreground">You scan to award stamps</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                  <div>
                    <div className="font-medium">Campaign QR</div>
                    <div className="text-muted-foreground">Share for spin promotions</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Simple Pricing</h3>
            <p className="text-lg text-muted-foreground">Choose what you need. Switch anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-xl">Loyalty Cards</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  €15<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Digital stamp cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Google Wallet support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Unlimited customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>QR code scanning</span>
                  </li>
                </ul>
                <Link href="/auth">
                  <Button variant="outline" className="w-full" data-testid="button-loyalty-plan">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-xl">Spin Wheel</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  €10<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Customizable wheels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Set win probabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Unlimited campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Prize tracking</span>
                  </li>
                </ul>
                <Link href="/auth">
                  <Button variant="outline" className="w-full" data-testid="button-spin-plan">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary hover-elevate">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl">Both Products</CardTitle>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">Save €5</span>
                </div>
                <div className="text-4xl font-bold mt-4">
                  €20<span className="text-lg text-muted-foreground font-normal">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Everything in Loyalty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Everything in Spin Wheel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Unified dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Complete toolkit</span>
                  </li>
                </ul>
                <Link href="/auth">
                  <Button className="w-full" data-testid="button-both-plan">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include unlimited customers, real-time analytics, and can be cancelled anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary/5 to-chart-2/5">
        <div className="container mx-auto max-w-3xl text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Building Loyalty?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join businesses using uniHub to reward customers and drive repeat visits.
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-base px-8" data-testid="button-final-cta">
              Get Started Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
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
