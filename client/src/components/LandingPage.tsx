import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Gift, UtensilsCrossed, Check, ArrowRight, Sparkles, Shield, CheckCircle, Users, Target, Heart, Bell, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { SiStripe } from "react-icons/si";
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
            <Link href="/pricing">
              <Button variant="ghost" data-testid="button-pricing">Pricing</Button>
            </Link>
            <Link href="/auth?mode=login">
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
            Trusted by businesses • Powered by Stripe • Cancel anytime
          </p>
        </div>
      </section>

      {/* Customer Lifecycle Flow */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Engage Customers</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete customer engagement lifecycle - from first visit to loyal regulars
            </p>
          </div>

          {/* Circular Lifecycle Flow */}
          <div className="relative max-w-5xl mx-auto">
            {/* Desktop: Circular Flow */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-8 lg:gap-12 mb-12">
              {/* Top Left: ATTRACT */}
              <div className="flex items-start gap-6" data-testid="lifecycle-attract">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-chart-3 to-chart-3/70 flex items-center justify-center">
                    <Target className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-chart-3 flex items-center justify-center">
                    <span className="text-sm font-bold text-chart-3">1</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    ATTRACT
                    <ArrowDownRight className="w-5 h-5 text-chart-3" />
                  </h4>
                  <p className="text-muted-foreground mb-3">Draw in new customers with exciting promotions</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-chart-3" />
                    <span className="font-semibold">Spin Wheel Campaigns</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Run spin-to-win events and prize giveaways</p>
                </div>
              </div>

              {/* Top Right: SHOWCASE */}
              <div className="flex items-start gap-6" data-testid="lifecycle-showcase">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-chart-4 to-chart-4/70 flex items-center justify-center">
                    <UtensilsCrossed className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-chart-4 flex items-center justify-center">
                    <span className="text-sm font-bold text-chart-4">2</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    SHOWCASE
                    <ArrowDownRight className="w-5 h-5 text-chart-4" />
                  </h4>
                  <p className="text-muted-foreground mb-3">Display your offerings beautifully</p>
                  <div className="flex items-center gap-2 text-sm">
                    <UtensilsCrossed className="w-4 h-4 text-chart-4" />
                    <span className="font-semibold">Digital Menu Builder</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">QR code menus with photos and prices</p>
                </div>
              </div>

              {/* Bottom Left: ENGAGE */}
              <div className="flex items-start gap-6" data-testid="lifecycle-engage">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <Award className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    ENGAGE
                    <ArrowUpRight className="w-5 h-5 text-primary" />
                  </h4>
                  <p className="text-muted-foreground mb-3">Build lasting customer relationships</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Digital Loyalty Cards</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Reward repeat visits with stamps and prizes</p>
                </div>
              </div>

              {/* Bottom Right: RETAIN */}
              <div className="flex items-start gap-6" data-testid="lifecycle-retain">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center">
                    <Heart className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-chart-2 flex items-center justify-center">
                    <span className="text-sm font-bold text-chart-2">4</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    RETAIN
                    <ArrowUpRight className="w-5 h-5 text-chart-2" />
                  </h4>
                  <p className="text-muted-foreground mb-3">Keep customers coming back</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4 text-chart-2" />
                    <span className="font-semibold">Push Notifications</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Send updates directly to customer wallets</p>
                </div>
              </div>
            </div>

            {/* Mobile: Stacked Cards */}
            <div className="md:hidden space-y-6">
              <Card className="hover-elevate" data-testid="lifecycle-attract-mobile">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-3 to-chart-3/70 flex items-center justify-center">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-chart-3 flex items-center justify-center">
                        <span className="text-xs font-bold text-chart-3">1</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-1">ATTRACT</h4>
                      <p className="text-sm text-muted-foreground mb-2">Draw in new customers</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-chart-3" />
                        <span className="font-semibold">Spin Wheel Campaigns</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="lifecycle-showcase-mobile">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-4 to-chart-4/70 flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-chart-4 flex items-center justify-center">
                        <span className="text-xs font-bold text-chart-4">2</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-1">SHOWCASE</h4>
                      <p className="text-sm text-muted-foreground mb-2">Display offerings beautifully</p>
                      <div className="flex items-center gap-2 text-sm">
                        <UtensilsCrossed className="w-4 h-4 text-chart-4" />
                        <span className="font-semibold">Digital Menu Builder</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="lifecycle-engage-mobile">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-1">ENGAGE</h4>
                      <p className="text-sm text-muted-foreground mb-2">Build lasting relationships</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="font-semibold">Digital Loyalty Cards</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="lifecycle-retain-mobile">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-chart-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-chart-2">4</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-1">RETAIN</h4>
                      <p className="text-sm text-muted-foreground mb-2">Keep customers coming back</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Bell className="w-4 h-4 text-chart-2" />
                        <span className="font-semibold">Push Notifications</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Text for Desktop */}
            <div className="hidden md:block text-center mt-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Complete Customer Lifecycle</span>
              </div>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Our integrated platform guides customers from their first visit through to becoming loyal regulars, 
                all managed from one simple dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Why Businesses Trust uniHub</h3>
            <p className="text-lg text-muted-foreground">Built with security, transparency, and flexibility in mind</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <SiStripe className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Secure Payments via Stripe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Industry-leading payment security with PCI compliance and fraud protection built-in
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-full bg-chart-3/10 flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-chart-3" />
                </div>
                <CardTitle className="text-xl">Cancel Anytime</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No long-term commitments or hidden contracts. Pause or cancel your subscription with one click
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-chart-2" />
                </div>
                <CardTitle className="text-xl">Get What You See</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transparent pricing with no hidden fees. What you see is exactly what you pay
                </p>
              </CardContent>
            </Card>
          </div>
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

      <footer className="border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">uniHub</h3>
              <p className="text-sm text-muted-foreground">
                Digital loyalty cards, spin campaigns, and menu builder for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground" data-testid="link-about">About</Link></li>
                <li><Link href="/demo" className="text-muted-foreground hover:text-foreground">Demo</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground" data-testid="link-privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground" data-testid="link-terms-of-service">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground" data-testid="link-cookie-policy">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 uniHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
