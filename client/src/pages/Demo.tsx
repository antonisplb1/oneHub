import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Gift, QrCode, Smartphone, TrendingUp, Users, ArrowRight, Check, Sparkles } from "lucide-react";

export default function Demo() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <h1 className="text-2xl font-semibold text-primary cursor-pointer">oneHub</h1>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg" data-testid="button-get-started">Get Started</Button>
          </Link>
        </div>
      </header>

      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-semibold mb-6">See oneHub in Action</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how oneHub helps businesses like yours boost customer loyalty and engagement with digital loyalty cards and prize wheels.
            </p>
          </div>

          <div className="space-y-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-semibold">Digital Loyalty Cards</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Say goodbye to paper punch cards. Customers collect digital stamps on their phones, making it easy to track rewards and never lose their progress.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Customers scan QR code to join instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Award stamps by scanning customer QR codes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Customize rewards and stamp limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Track repeat customer visits</span>
                  </li>
                </ul>
              </div>
              <Card className="p-8" data-testid="card-loyalty-demo">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-chart-3/20 rounded-xl flex flex-col items-center justify-center gap-6">
                  <div className="text-center">
                    <Award className="w-20 h-20 text-primary mx-auto mb-4" />
                    <div className="text-sm text-muted-foreground mb-2">Customer Loyalty Card</div>
                    <div className="flex gap-2 justify-center mb-4">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full ${
                            i < 7 ? 'bg-primary' : 'bg-muted'
                          }`}
                          data-testid={`stamp-${i}`}
                        />
                      ))}
                    </div>
                    <div className="text-lg font-semibold" data-testid="text-stamp-count">7 of 10 stamps</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <Card className="p-8 md:order-first" data-testid="card-prizewheel-demo">
                <div className="aspect-square bg-gradient-to-br from-chart-3/20 to-primary/20 rounded-xl flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full border-8 border-primary/30 flex items-center justify-center">
                      <Gift className="w-20 h-20 text-chart-3" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold" data-testid="text-prizewheel-title">Prize Wheel</div>
                    <div className="text-sm text-muted-foreground">Spin to Win!</div>
                  </div>
                </div>
              </Card>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-8 h-8 text-chart-3" />
                  <h2 className="text-3xl font-semibold">Prize Wheel Campaigns</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Create excitement with customizable spin-to-win wheels. Perfect for promotions, special events, or rewarding loyal customers.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Create custom prizes and set win probabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Generate unique QR codes for one-time spins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Run unlimited in-store spins during events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Track prize distribution and engagement</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-semibold">QR Code System</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Everything works with QR codes. Display your merchant QR for customer signups, scan customer QR codes to award stamps, or share spin QR codes for campaigns.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Smartphone className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Built-in camera scanner in dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <QrCode className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Unique QR codes for each customer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Instant customer registration</span>
                  </li>
                </ul>
              </div>
              <Card className="p-8" data-testid="card-qrcode-demo">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-chart-2/20 rounded-xl flex flex-col items-center justify-center gap-6">
                  <QrCode className="w-32 h-32 text-primary" />
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2" data-testid="text-qr-title">Scan to Join</div>
                    <div className="text-sm text-muted-foreground">Customer scans your QR code</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <Card className="p-8 md:order-first" data-testid="card-dashboard-demo">
                <div className="aspect-square bg-gradient-to-br from-chart-2/20 to-primary/20 rounded-xl flex flex-col items-center justify-center p-6">
                  <TrendingUp className="w-16 h-16 text-chart-2 mb-6" />
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Customers</span>
                      <span className="text-2xl font-bold" data-testid="text-total-customers">247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Cards</span>
                      <span className="text-2xl font-bold" data-testid="text-active-cards">189</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rewards Given</span>
                      <span className="text-2xl font-bold" data-testid="text-rewards-given">45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Spins Today</span>
                      <span className="text-2xl font-bold" data-testid="text-spins-today">23</span>
                    </div>
                  </div>
                </div>
              </Card>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-chart-2" />
                  <h2 className="text-3xl font-semibold">Unified Dashboard</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Manage everything from one elegant dashboard. Track customer engagement, view analytics, and control both loyalty and prize wheel features seamlessly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Real-time customer engagement metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Camera-based QR code scanning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Manage rewards and campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-1" />
                    <span>Access customer loyalty history</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h2 className="text-3xl font-semibold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses using oneHub to build lasting customer relationships.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth">
                <Button size="lg" className="text-base px-8" data-testid="button-start-now">
                  Start Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-back-home">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 oneHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
