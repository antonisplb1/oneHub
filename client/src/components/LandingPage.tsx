import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Gift, UtensilsCrossed, Check, ArrowRight, Sparkles, Shield, CheckCircle } from "lucide-react";
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

      {/* Interactive Feature Showcase */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Everything You Need to Engage Customers</h3>
            <p className="text-lg text-muted-foreground">Choose from our suite of powerful tools</p>
          </div>

          <Tabs defaultValue="loyalty" className="w-full" data-testid="tabs-features">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 h-auto p-1.5">
              <TabsTrigger value="loyalty" className="flex items-center gap-2 py-3" data-testid="tab-loyalty">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Loyalty Cards</span>
                <span className="sm:hidden">Loyalty</span>
              </TabsTrigger>
              <TabsTrigger value="spin" className="flex items-center gap-2 py-3" data-testid="tab-spin">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Spin Wheel</span>
                <span className="sm:hidden">Spin</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2 py-3" data-testid="tab-menu">
                <UtensilsCrossed className="w-4 h-4" />
                <span className="hidden sm:inline">Menu Builder</span>
                <span className="sm:hidden">Menu</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loyalty" className="mt-0" data-testid="content-loyalty">
              <Card className="hover-elevate transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Award className="w-7 h-7 text-primary" />
                    </div>
                    Digital Loyalty Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    Customers collect stamps on their phones. Scan their QR code to award stamps instantly. Build lasting relationships with automated rewards.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg mb-3">Key Benefits</h4>
                      <ul className="space-y-2.5">
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Instant customer signup via QR code</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Google Wallet integration for easy access</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Built-in camera scanner for merchants</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Automatic reward tracking and notifications</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <Award className="w-20 h-20 text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Preview: Digital loyalty card interface</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spin" className="mt-0" data-testid="content-spin">
              <Card className="hover-elevate transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl">
                    <div className="w-14 h-14 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <Gift className="w-7 h-7 text-chart-3" />
                    </div>
                    Prize Wheel Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    Run exciting spin-to-win promotions. Perfect for events, sales, and customer acquisition. Create engaging experiences that drive foot traffic.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg mb-3">Key Benefits</h4>
                      <ul className="space-y-2.5">
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Customizable prizes and probabilities</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>QR code tokens or unlimited spins mode</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Real-time prize tracking and analytics</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Share campaigns on social media easily</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <Gift className="w-20 h-20 text-chart-3 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Preview: Interactive prize wheel</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="menu" className="mt-0" data-testid="content-menu">
              <Card className="hover-elevate transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl">
                    <div className="w-14 h-14 rounded-lg bg-chart-4/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-7 h-7 text-chart-4" />
                    </div>
                    Digital Menu Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    Create beautiful digital menus that customers can view on their phones. Share via QR code - no apps needed.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg mb-3">Key Benefits</h4>
                      <ul className="space-y-2.5">
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Create categories and menu items easily</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Add photos, prices, and descriptions</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>QR code for instant customer access</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                          <span>Update your menu in real-time</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <UtensilsCrossed className="w-20 h-20 text-chart-4 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Preview: Digital menu interface</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

      <footer className="border-t py-8 px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 uniHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
