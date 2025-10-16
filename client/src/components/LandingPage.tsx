import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Award, 
  Gift, 
  UtensilsCrossed, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Calendar,
  Target,
  Eye,
  Coffee,
  Pizza,
  Wine,
  Cake,
  Scissors,
  ShoppingBag,
  CheckCircle
} from "lucide-react";
import { SiStripe } from "react-icons/si";
import logoImage from "@assets/uniHub Icon Logo_1760616426501.png";

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
            <span>3-Day Free Trial – No Card Needed</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Grow Repeat Business.<br />Simplify Your Operations.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            uniHub gives cafés, salons, and local shops everything they need to reward customers, run promotions, and manage staff — all from one simple dashboard.
          </p>
          <div className="flex gap-6 justify-center flex-wrap mb-10 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-chart-2" />
              <span>Digital Loyalty Cards</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-chart-2" />
              <span>Spin-to-Win Campaigns</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-chart-2" />
              <span>QR Menus</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-chart-2" />
              <span>Shift Scheduling</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth">
              <Button size="lg" className="text-base px-8" data-testid="button-get-started">
                Start Free Trial – No Card Needed <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-watch-demo">
                Watch 1-Minute Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-8 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Trusted by local businesses in Cyprus, Greece & beyond
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-lg font-semibold">Café Aroma</div>
              <div className="text-xs text-muted-foreground">Nicosia</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">The Barber Room</div>
              <div className="text-xs text-muted-foreground">Limassol</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">SweetBite Bakery</div>
              <div className="text-xs text-muted-foreground">Athens</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Chill Café</div>
              <div className="text-xs text-muted-foreground">Larnaca</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Four Tools. One Platform. Everything You Need to Grow.</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the tools you need. Each product works independently or together seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Loyalty Cards */}
            <Card className="hover-elevate flex flex-col" data-testid="product-card-loyalty">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Loyalty Cards</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Replace paper cards with a digital loyalty system that customers love.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Digital stamp cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Google Wallet support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">QR code scanning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Spin Wheel */}
            <Card className="hover-elevate flex flex-col" data-testid="product-card-spin">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
                  <Gift className="w-6 h-6 text-chart-3" />
                </div>
                <CardTitle className="text-xl">Spin Wheel</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Run gamified promotions that keep people coming back.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Customizable wheels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Prize tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Social sharing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Menu Builder */}
            <Card className="hover-elevate flex flex-col" data-testid="product-card-menu">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
                  <UtensilsCrossed className="w-6 h-6 text-chart-4" />
                </div>
                <CardTitle className="text-xl">Menu Builder</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Show off your menu beautifully — no printing or app required.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Photo uploads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">QR code generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Real-time updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Shift Manager */}
            <Card className="hover-elevate flex flex-col" data-testid="product-card-shift">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-chart-5" />
                </div>
                <CardTitle className="text-xl">Shift Manager</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Keep your team organized with simple drag-and-drop scheduling.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Weekly scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Crew management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Public shift URL</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button variant="ghost" className="text-base" data-testid="button-explore-features">
                Explore all features <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why uniHub.live Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Choose What You Need, Pay Only for What You Use</h3>
            <p className="text-lg text-muted-foreground">
              No bundles, no contracts — just the tools that make your business run better.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-4">Choose Only What You Need</h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    uniHub.live offers flexibility by letting you choose only the products you need — without locking you into higher-tier plans that include tools you may not use.
                  </p>
                  <div className="mt-6 flex gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border">
                      <Check className="w-4 h-4 text-chart-2" />
                      <span className="text-sm font-medium">Pay only for what you use</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border">
                      <Check className="w-4 h-4 text-chart-2" />
                      <span className="text-sm font-medium">No forced bundles</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border">
                      <Check className="w-4 h-4 text-chart-2" />
                      <span className="text-sm font-medium">Cancel anytime</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-2/10 text-chart-2 text-sm font-medium mb-6">
              <Check className="w-4 h-4" />
              <span>3-Day Free Trial — Test everything with no commitment</span>
            </div>
            <div>
              <Link href="/pricing">
                <Button size="lg" className="text-base px-8" data-testid="button-see-pricing">
                  See Pricing <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover-elevate" data-testid="card-mission">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-3xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  To simplify customer engagement for small and medium-sized businesses by offering powerful 
                  digital tools that feel effortless to use. We aim to replace paper loyalty cards and clunky 
                  apps with elegant, web-first solutions that boost repeat business, increase brand loyalty, 
                  and create genuine connections.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-vision">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                  <Eye className="w-7 h-7 text-chart-3" />
                </div>
                <CardTitle className="text-3xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  To make digital customer engagement accessible to every local business, regardless of size 
                  or tech experience. We envision a world where every café, bakery, or boutique can deliver 
                  a seamless digital experience to customers — effortlessly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Who We Serve</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              uniHub is built for local businesses with returning customers. If you want to reward loyalty 
              and drive repeat visits, we're here to help.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card className="hover-elevate text-center" data-testid="card-business-cafes">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Coffee className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Cafés & Coffee Shops</h4>
                <p className="text-xs text-muted-foreground">Reward your regulars effortlessly</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center" data-testid="card-business-restaurants">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-chart-3/10 flex items-center justify-center mb-3">
                  <Pizza className="w-8 h-8 text-chart-3" />
                </div>
                <h4 className="font-semibold mb-1">Restaurants & Takeaways</h4>
                <p className="text-xs text-muted-foreground">QR menus and loyalty, all in one</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center" data-testid="card-business-bars">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-chart-4/10 flex items-center justify-center mb-3">
                  <Wine className="w-8 h-8 text-chart-4" />
                </div>
                <h4 className="font-semibold mb-1">Bars & Nightlife</h4>
                <p className="text-xs text-muted-foreground">Run exciting spin wheel promos</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center" data-testid="card-business-bakeries">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-chart-5/10 flex items-center justify-center mb-3">
                  <Cake className="w-8 h-8 text-chart-5" />
                </div>
                <h4 className="font-semibold mb-1">Bakeries & Sweet Shops</h4>
                <p className="text-xs text-muted-foreground">Digital loyalty made sweet</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center" data-testid="card-business-salons">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
                  <Scissors className="w-8 h-8 text-chart-2" />
                </div>
                <h4 className="font-semibold mb-1">Salons & Barbers</h4>
                <p className="text-xs text-muted-foreground">Schedule staff and reward clients</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate text-center" data-testid="card-business-retail">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Boutiques & Retail</h4>
                <p className="text-xs text-muted-foreground">Engage shoppers with digital rewards</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/demo">
              <Button variant="ghost" className="text-base" data-testid="button-see-how-works">
                See how uniHub works for your business type <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose uniHub Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Why Businesses Choose uniHub</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of small businesses moving toward digital-first loyalty and engagement tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate" data-testid="card-benefit-browser">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">100% Browser-Based</h4>
                    <p className="text-sm text-muted-foreground">
                      No apps or downloads required for you or your customers. Everything works in the browser.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-benefit-qr">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Fast QR Code Setup</h4>
                    <p className="text-sm text-muted-foreground">
                      Get started in minutes with simple QR codes. Your customers scan and engage instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-benefit-design">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Clean, Modern Design</h4>
                    <p className="text-sm text-muted-foreground">
                      Mobile-friendly interface that looks professional and works beautifully on all devices.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-benefit-affordable">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Affordable & Scalable</h4>
                    <p className="text-sm text-muted-foreground">
                      Pricing that works for any business size. Start small and scale as you grow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-benefit-features">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Continuous Improvements</h4>
                    <p className="text-sm text-muted-foreground">
                      Regular updates with new features like menus, analytics, and customer insights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-benefit-easy">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">No Coding Required</h4>
                    <p className="text-sm text-muted-foreground">
                      Easy-to-use dashboard that anyone can master. No technical skills needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/20" data-testid="card-benefit-trial">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">3-Day Free Trial</h4>
                    <p className="text-sm text-muted-foreground">
                      Test everything with no commitment. No credit card required to start.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonial */}
          <div className="mt-12 max-w-3xl mx-auto" data-testid="section-testimonial">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-8" data-testid="card-testimonial">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-primary" aria-label="Award" />
                  </div>
                  <div>
                    <p className="text-lg italic mb-4">
                      "We replaced paper stamp cards with uniHub's loyalty system and our repeat visits increased 25%!"
                    </p>
                    <p className="text-sm font-semibold">— Café Aroma, Nicosia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Built with Privacy and Reliability in Mind</h3>
            <p className="text-lg text-muted-foreground">Your business data is secure, compliant, and always accessible</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <SiStripe className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Stripe-Powered Payments</h4>
              <p className="text-sm text-muted-foreground">
                Secure, reliable payment processing
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-chart-2/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-chart-2" />
              </div>
              <h4 className="text-lg font-semibold mb-2">GDPR Compliant</h4>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade data protection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-chart-3/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-chart-3" />
              </div>
              <h4 className="text-lg font-semibold mb-2">SSL Secured</h4>
              <p className="text-sm text-muted-foreground">
                All data encrypted in transit
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-chart-4/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-chart-4" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Cancel Anytime</h4>
              <p className="text-sm text-muted-foreground">
                No contracts. One-click cancellation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Modernize Your Business?</h3>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join local cafés, salons, and retail shops using uniHub to reward customers and simplify operations.
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-lg px-12 py-6" data-testid="button-final-cta">
              Start Free Trial – No Credit Card Needed <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-6 justify-center flex-wrap mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-chart-2" />
              <span>3-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-chart-2" />
              <span>No commitment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-chart-2" />
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
              <h5 className="font-semibold mb-3">Products</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" data-testid="link-footer-loyalty">Loyalty Cards</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-spin">Spin Wheel</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-menu">Menu Builder</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-shift">Shift Manager</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-3">Company</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/demo" data-testid="link-footer-demo">Demo</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-pricing">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-3">Legal</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy-policy" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" data-testid="link-footer-terms">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" data-testid="link-footer-cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 uniHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
