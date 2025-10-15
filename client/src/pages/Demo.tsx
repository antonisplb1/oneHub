import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Gift, QrCode, Smartphone, TrendingUp, Users, ArrowRight, Check, Sparkles, CreditCard, Wallet, ScanLine, BarChart3, Bell, UtensilsCrossed, RefreshCw, Calendar } from "lucide-react";
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

      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-semibold mb-6">How uniHub Works</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A complete digital loyalty and engagement platform for businesses. Choose the features you need, 
              start rewarding customers immediately, and watch engagement grow.
            </p>
          </div>

          {/* Pricing Overview */}
          <div className="mb-24">
            <h2 className="text-3xl font-semibold text-center mb-10">Simple, Flexible Pricing</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Loyalty Cards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">€10<span className="text-lg text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Perfect for coffee shops, restaurants, salons</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Digital stamp cards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Google Wallet integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Customer management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>QR code scanning</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-chart-3" />
                    Spin Wheel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">€8<span className="text-lg text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Great for events, promotions, giveaways</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Customizable prize wheels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Set win probabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>QR code campaigns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Track prize distribution</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-chart-1" />
                    Menu Builder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">€5<span className="text-lg text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Ideal for restaurants, cafes, food trucks</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Create digital menus</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Add categories & items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>QR code menu access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Real-time menu updates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-chart-4" />
                    Shift Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">€10<span className="text-lg text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Perfect for teams, staff scheduling</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Weekly calendar view</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Crew management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>PIN-protected access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>Public shift URL</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Complete Bundle
                    </CardTitle>
                    <Badge>Best Value - Save €8</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">€24.99<span className="text-lg text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Complete engagement toolkit, save €8/month</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>All Loyalty features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>All Spin Wheel features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>All Menu Builder features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                      <span>All Shift Manager features</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How It Works - Loyalty */}
          <div className="space-y-24">
            <div>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Award className="w-10 h-10 text-primary" />
                  <h2 className="text-4xl font-semibold">Digital Loyalty Cards</h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Replace paper punch cards with digital stamp collection. Customers track their progress on their phones, 
                  and you scan their QR codes to award stamps instantly.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">1. Customer Joins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Display your merchant QR code at checkout. Customers scan it with their phone camera to 
                      instantly register and get their digital loyalty card.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
                      <ScanLine className="w-6 h-6 text-chart-2" />
                    </div>
                    <CardTitle className="text-lg">2. Award Stamps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Use the built-in camera scanner in your dashboard. Customers show their QR code from their 
                      phone, you scan it, and they instantly get a stamp. Safe scanning prevents accidents.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
                      <Gift className="w-6 h-6 text-chart-3" />
                    </div>
                    <CardTitle className="text-lg">3. Reward Collected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      When customers reach 10/10 stamps, the next scan automatically grants the reward and 
                      resets their card to 0/10 to start collecting again.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="p-8 bg-gradient-to-br from-primary/5 to-chart-2/5">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Wallet className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">Google Wallet Integration</div>
                          <div className="text-sm text-muted-foreground">Customers can add cards to Google Wallet for quick access</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">Customer Management</div>
                          <div className="text-sm text-muted-foreground">View all customers, track their progress, and see loyalty history</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">Analytics Dashboard</div>
                          <div className="text-sm text-muted-foreground">Track total customers, active cards, and rewards given</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-background rounded-lg p-6">
                    <div className="text-sm text-muted-foreground mb-2">Example Loyalty Card</div>
                    <div className="aspect-[1.6/1] bg-gradient-to-br from-primary to-primary/70 rounded-xl p-6 text-primary-foreground flex flex-col justify-between">
                      <div>
                        <div className="text-xs opacity-80 mb-1">Coffee Shop Rewards</div>
                        <div className="text-lg font-semibold">Sarah Johnson</div>
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
                        <div className="text-sm">7 of 10 stamps • Next: Free Coffee</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* How It Works - Spin Wheel */}
            <div>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Gift className="w-10 h-10 text-chart-3" />
                  <h2 className="text-4xl font-semibold">Spin Wheel Campaigns</h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Create excitement with customizable prize wheels. Perfect for grand openings, special events, 
                  or rewarding customers during promotions.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Two Ways to Run Campaigns</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0">
                              <QrCode className="w-5 h-5 text-chart-3" />
                            </div>
                            <div>
                              <div className="font-semibold mb-1">QR Code Tokens</div>
                              <p className="text-sm text-muted-foreground">
                                Generate unique QR codes (e.g., 100 codes). Share them via social media, email, 
                                or print flyers. Each code allows one spin only—perfect for customer acquisition campaigns.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Smartphone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold mb-1">In-Store Unlimited Spins</div>
                              <p className="text-sm text-muted-foreground">
                                Display a single QR code at your store during events. Customers can scan and spin 
                                as many times as they want—great for grand openings and special occasions.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Prize Configuration</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                        <span>Create up to 8 different prizes per wheel</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                        <span>Set custom win probabilities (0-100% per prize)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                        <span>Choose colors for each prize segment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-chart-2 mt-0.5" />
                        <span>Track total spins and prize distribution in real-time</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Card className="p-8" data-testid="card-spinwheel-demo">
                  <div className="aspect-square bg-gradient-to-br from-chart-3/20 to-primary/20 rounded-xl flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-56 h-56 rounded-full border-[16px] border-dashed border-chart-3/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                          <div className="bg-red-500/20"></div>
                          <div className="bg-yellow-500/20"></div>
                          <div className="bg-blue-500/20"></div>
                          <div className="bg-green-500/20"></div>
                        </div>
                        <div className="relative z-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-chart-3"></div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold">Grand Opening Special</div>
                      <div className="text-sm text-muted-foreground">Prizes: Free Coffee • 10% Off • 20% Off • Try Again</div>
                      <Badge variant="secondary" className="mt-2">147 spins today</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* How It Works - Menu Builder */}
            <div>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <UtensilsCrossed className="w-10 h-10 text-chart-1" />
                  <h2 className="text-4xl font-semibold">Digital Menu Builder</h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Create beautiful digital menus that customers can view on their phones. Share via QR code - no apps, no printing costs.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-3">
                      <UtensilsCrossed className="w-6 h-6 text-chart-1" />
                    </div>
                    <CardTitle className="text-lg">1. Create Your Menu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Add categories and menu items with photos, descriptions, and prices. Organize everything exactly how you want customers to see it.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">2. Share QR Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Download your menu QR code and display it at your location. Customers scan to view the full menu on their phones.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
                      <RefreshCw className="w-6 h-6 text-chart-2" />
                    </div>
                    <CardTitle className="text-lg">3. Update Anytime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Change prices, add specials, remove items - updates appear instantly on customer devices. No reprinting menus.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="p-8 bg-gradient-to-br from-chart-1/5 to-chart-2/5">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-chart-1 mt-0.5" />
                        <div>
                          <div className="font-medium">Category Organization</div>
                          <div className="text-sm text-muted-foreground">Group items by type (appetizers, mains, drinks, etc.)</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Gift className="w-5 h-5 text-chart-1 mt-0.5" />
                        <div>
                          <div className="font-medium">Rich Content</div>
                          <div className="text-sm text-muted-foreground">Add photos, detailed descriptions, and prices for each item</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Smartphone className="w-5 h-5 text-chart-1 mt-0.5" />
                        <div>
                          <div className="font-medium">Public Menu Page</div>
                          <div className="text-sm text-muted-foreground">Beautiful, mobile-friendly menu view for customers</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <RefreshCw className="w-5 h-5 text-chart-1 mt-0.5" />
                        <div>
                          <div className="font-medium">Instant Updates</div>
                          <div className="text-sm text-muted-foreground">Changes sync immediately, no delays</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-background rounded-lg p-6">
                    <div className="text-sm text-muted-foreground mb-2">Example Menu Item</div>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">Margherita Pizza</div>
                            <div className="text-xs text-muted-foreground">Main Dishes</div>
                          </div>
                          <div className="font-bold text-primary">€12.50</div>
                        </div>
                        <p className="text-sm text-muted-foreground">Fresh mozzarella, tomato sauce, basil, olive oil</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">Cappuccino</div>
                            <div className="text-xs text-muted-foreground">Beverages</div>
                          </div>
                          <div className="font-bold text-primary">€3.50</div>
                        </div>
                        <p className="text-sm text-muted-foreground">Espresso with steamed milk and foam</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* How It Works - Shift Manager */}
            <div>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Calendar className="w-10 h-10 text-chart-4" />
                  <h2 className="text-4xl font-semibold">Shift Manager</h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Keep your team organized with employee shift scheduling. Weekly calendar views, crew management, 
                  and PIN-protected public access for staff to check their schedules.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-chart-4" />
                    </div>
                    <CardTitle className="text-lg">1. Build Your Crew</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Add crew members to your roster and create reusable time presets for common shifts. 
                      Organize your team and standardize scheduling.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">2. Schedule Shifts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Use the weekly calendar to assign shifts. Select crew members, pick preset times or enter custom hours, 
                      and add notes. Navigate weeks with ease.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
                      <ScanLine className="w-6 h-6 text-chart-2" />
                    </div>
                    <CardTitle className="text-lg">3. Share with Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Set a PIN and share your unique shift URL. Staff access schedules via any device with PIN protection. 
                      No accounts needed.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="p-8 bg-gradient-to-br from-chart-4/5 to-chart-2/5">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Calendar className="w-5 h-5 text-chart-4 mt-0.5" />
                        <div>
                          <div className="font-medium">Weekly Calendar View</div>
                          <div className="text-sm text-muted-foreground">Monday-Sunday layout with easy week navigation</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-chart-4 mt-0.5" />
                        <div>
                          <div className="font-medium">Crew Roster Management</div>
                          <div className="text-sm text-muted-foreground">Add, remove, and manage employee names in one place</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Bell className="w-5 h-5 text-chart-4 mt-0.5" />
                        <div>
                          <div className="font-medium">Timeframe Presets</div>
                          <div className="text-sm text-muted-foreground">Save common shift times for faster scheduling</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <ScanLine className="w-5 h-5 text-chart-4 mt-0.5" />
                        <div>
                          <div className="font-medium">PIN-Protected Public Access</div>
                          <div className="text-sm text-muted-foreground">Secure URL for crew to view schedules on any device</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-background rounded-lg p-6">
                    <div className="text-sm text-muted-foreground mb-2">Example Weekly Schedule</div>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="font-semibold text-sm">Monday, Oct 15</div>
                            <div className="text-xs text-muted-foreground">Morning Shift</div>
                          </div>
                        </div>
                        <div className="text-sm mt-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-chart-4" />
                            <span className="font-medium">Sarah Johnson</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">8:00 AM - 2:00 PM • Server</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="font-semibold text-sm">Tuesday, Oct 16</div>
                            <div className="text-xs text-muted-foreground">Evening Shift</div>
                          </div>
                        </div>
                        <div className="text-sm mt-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-chart-4" />
                            <span className="font-medium">Mike Chen</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">5:00 PM - 11:00 PM • Chef</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Dashboard Overview */}
            <div>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <TrendingUp className="w-10 h-10 text-chart-2" />
                  <h2 className="text-4xl font-semibold">Unified Merchant Dashboard</h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need in one place. Manage customers, scan QR codes with your device camera, 
                  view analytics, and control all your campaigns.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ScanLine className="w-5 h-5" />
                      Built-in QR Scanner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Access camera-based scanning directly from your dashboard. Scan customer QR codes to award 
                      stamps with safety confirmations to prevent accidental double-scans.
                    </p>
                    <Badge variant="secondary">Camera permission required</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Customer Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      View complete customer list with loyalty card status, total rewards earned, and registration dates. 
                      Search and filter to find specific customers quickly.
                    </p>
                    <Badge variant="secondary">Export available</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Real-Time Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Track key metrics: total customers, active loyalty cards, rewards given, and spin wheel activity. 
                      Monitor engagement trends over time.
                    </p>
                    <Badge variant="secondary">Live updates</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Flexible Subscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Powered by Stripe. Switch between Loyalty, Spin Wheel, Menu Builder, Shift Manager, or get all four at any time. 
                      Cancel anytime—no long-term contracts or hidden fees.
                    </p>
                    <Badge variant="secondary">Secure payments</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Real Use Cases */}
            <div className="bg-muted/50 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-semibold text-center mb-10">Perfect For</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Coffee Shops & Cafes</h3>
                  <p className="text-sm text-muted-foreground">
                    "Buy 9 coffees, get the 10th free" with digital stamp cards. No more lost paper cards.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto">
                    <Gift className="w-8 h-8 text-chart-3" />
                  </div>
                  <h3 className="font-semibold text-lg">Retail Stores</h3>
                  <p className="text-sm text-muted-foreground">
                    Run spin wheel promotions during sales. Give customers a chance to win discounts at checkout.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-chart-2" />
                  </div>
                  <h3 className="font-semibold text-lg">Salons & Spas</h3>
                  <p className="text-sm text-muted-foreground">
                    Reward repeat visits with loyalty stamps. Offer spin wheel prizes for referrals and special occasions.
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto">
                    <UtensilsCrossed className="w-8 h-8 text-chart-1" />
                  </div>
                  <h3 className="font-semibold text-lg">Restaurants & Food Trucks</h3>
                  <p className="text-sm text-muted-foreground">
                    Digital menus accessible via QR code. Update daily specials instantly without reprinting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-semibold mb-4">Ready to Boost Customer Loyalty?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start with a free account. Choose your subscription after email verification. 
              Cancel anytime—no commitments.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth">
                <Button size="lg" className="text-base px-8" data-testid="button-start-now">
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
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

      <footer className="border-t py-12 px-6 mt-16">
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
