import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Settings, Rocket, TrendingUp, Award, Gift, UtensilsCrossed, Calendar, QrCode, ScanLine, Wallet, Users, BarChart3, CheckCircle, ArrowRight, Play } from "lucide-react";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function Demo() {
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
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" data-testid="text-demo-hero-title">
            See How uniHub Transforms Your Business in 1 Minute
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Watch how to launch a loyalty card, spin wheel, digital menu, and staff manager — all from one simple dashboard.
          </p>

          {/* Video/GIF Placeholder */}
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-xl flex items-center justify-center mb-8 border-2 border-dashed border-primary/20" data-testid="video-demo-placeholder">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Play className="w-10 h-10 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground">1-Minute Product Demo Video</p>
              <p className="text-sm text-muted-foreground">Coming Soon: Watch a complete walkthrough</p>
            </div>
          </div>

          <Link href="/auth">
            <Button size="lg" className="text-lg px-10 py-6" data-testid="button-hero-cta">
              Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16" data-testid="text-how-it-works-title">How It Works</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center" data-testid="card-step-1">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-10 h-10 text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up, verify your email, and get instant access to your dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center" data-testid="card-step-2">
              <div className="w-20 h-20 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-chart-2" />
              </div>
              <div className="w-10 h-10 rounded-full bg-chart-2 text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Pick Your Tools</h3>
              <p className="text-muted-foreground">
                Choose the features you want: Loyalty, Spin Wheel, Menu, or Shift Manager.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center" data-testid="card-step-3">
              <div className="w-20 h-20 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10 text-chart-3" />
              </div>
              <div className="w-10 h-10 rounded-full bg-chart-3 text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Launch Campaigns</h3>
              <p className="text-muted-foreground">
                Generate QR codes for your customers, menus, or promotions instantly.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center" data-testid="card-step-4">
              <div className="w-20 h-20 rounded-full bg-chart-4/10 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-chart-4" />
              </div>
              <div className="w-10 h-10 rounded-full bg-chart-4 text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Engagement</h3>
              <p className="text-muted-foreground">
                Track loyalty stamps, spins, and team activity in real time — all from one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlights Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16" data-testid="text-product-highlights-title">Your Complete Engagement Toolkit</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Loyalty Cards */}
            <Card className="overflow-hidden" data-testid="card-product-loyalty">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-8">
                <div className="aspect-[1.6/1] w-full max-w-md bg-gradient-to-br from-primary to-primary/70 rounded-xl p-6 text-primary-foreground flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="text-xs opacity-80 mb-1">Coffee Shop Rewards</div>
                    <div className="text-lg font-semibold">Customer Name</div>
                  </div>
                  <div>
                    <div className="flex gap-1.5 mb-2">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full ${
                            i < 7 ? 'bg-primary-foreground' : 'bg-primary-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm">7 of 10 stamps</div>
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Digital Loyalty Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Reward repeat customers instantly with digital stamp cards.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>QR code scanning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wallet className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Google Wallet integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Customer management</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spin Wheel */}
            <Card className="overflow-hidden" data-testid="card-product-spin">
              <div className="aspect-video bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center p-8">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full border-[16px] border-dashed border-chart-3/30 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      <div className="bg-red-500/20"></div>
                      <div className="bg-yellow-500/20"></div>
                      <div className="bg-blue-500/20"></div>
                      <div className="bg-green-500/20"></div>
                    </div>
                    <div className="relative z-10 w-16 h-16 rounded-full bg-chart-3 flex items-center justify-center">
                      <Gift className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[24px] border-t-chart-3"></div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-chart-3" />
                  Spin-to-Win Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create promotions your customers love with exciting prize wheels.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Settings className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Customizable prizes & probabilities</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>QR code campaigns</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart3 className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Real-time tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Digital Menu */}
            <Card className="overflow-hidden" data-testid="card-product-menu">
              <div className="aspect-video bg-gradient-to-br from-chart-1/20 to-chart-1/5 flex items-center justify-center p-8">
                <div className="w-full max-w-xs bg-background rounded-xl shadow-xl border overflow-hidden">
                  <div className="h-24 bg-gradient-to-br from-chart-1 to-chart-1/70 flex items-center justify-center">
                    <UtensilsCrossed className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted/50 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-2 bg-muted/50 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-6 h-6 text-chart-1" />
                  Digital Menu Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Modernize your restaurant with no apps needed.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Beautiful mobile menus</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Instant QR code access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Real-time updates</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shift Manager */}
            <Card className="overflow-hidden" data-testid="card-product-shift">
              <div className="aspect-video bg-gradient-to-br from-chart-4/20 to-chart-4/5 flex items-center justify-center p-8">
                <div className="w-full max-w-xs bg-background rounded-xl shadow-xl border overflow-hidden">
                  <div className="h-16 bg-gradient-to-br from-chart-4 to-chart-4/70 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-3">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-xs text-center text-muted-foreground">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[...Array(14)].map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded ${
                            i % 3 === 0 ? 'bg-chart-4/30' : 'bg-muted/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-chart-4" />
                  Employee Shift Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Simplify staff scheduling for your team.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Weekly calendar view</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>Crew management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-chart-2 mt-0.5" />
                    <span>PIN-protected public access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-chart-2/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-cta-title">Ready to see it in action?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Try uniHub free for 3 days — no credit card required.
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-lg px-12 py-6" data-testid="button-final-cta">
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-6 justify-center flex-wrap mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-chart-2" />
              <span>3-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-chart-2" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-chart-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImage} alt="uniHub logo" className="h-6 w-6" />
                <span className="font-semibold text-lg">uniHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All-in-one platform for customer engagement and team management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Loyalty Cards</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Spin Wheel</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Menu Builder</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Shift Manager</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} uniHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
