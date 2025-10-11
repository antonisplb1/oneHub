import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Award, 
  Gift, 
  UtensilsCrossed, 
  ArrowRight, 
  Target, 
  Eye, 
  Coffee,
  Pizza,
  Scissors,
  ShoppingBag,
  Wine,
  Cake,
  Shield,
  CheckCircle,
  Sparkles,
  BarChart3,
  CreditCard,
  Lock,
  Globe
} from "lucide-react";
import { SiStripe } from "react-icons/si";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function About() {
  useEffect(() => {
    document.title = "About uniHub - Digital Customer Engagement for Local Businesses";
    
    // Add meta description if not already present
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn how uniHub helps cafés, restaurants, salons, and local businesses build customer loyalty with QR-powered digital loyalty cards, prize wheels, and menus. No apps required.');
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Learn how uniHub helps cafés, restaurants, salons, and local businesses build customer loyalty with QR-powered digital loyalty cards, prize wheels, and menus. No apps required.');
      document.head.appendChild(metaDescription);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logoImage} alt="uniHub logo - Digital loyalty and rewards platform" className="h-8 w-8" />
              <h1 className="text-2xl font-semibold text-primary">uniHub</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            <Link href="/demo">
              <Button variant="ghost" data-testid="button-demo">Demo</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" data-testid="button-pricing">Pricing</Button>
            </Link>
            <Link href="/auth?mode=login">
              <Button variant="outline" data-testid="button-login">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-6 bg-gradient-to-br from-primary/5 to-chart-2/5">
          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>About uniHub</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" data-testid="heading-hero">
              Empowering Local Businesses to Build Stronger Customer Relationships
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto" data-testid="text-hero-description">
              At uniHub, we believe that every visit matters. We help cafés, bars, salons, and local shops 
              connect with their customers in smarter, more engaging ways — without complicated apps or expensive systems.
            </p>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 px-6" aria-labelledby="mission-heading">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="hover-elevate" data-testid="card-mission">
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="w-7 h-7 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-3xl" id="mission-heading">Our Mission</CardTitle>
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
                    <Eye className="w-7 h-7 text-chart-3" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-3xl" id="vision-heading">Our Vision</CardTitle>
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

        {/* What We Do Section */}
        <section className="py-16 px-6 bg-muted/30" aria-labelledby="what-we-do-heading">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" id="what-we-do-heading" data-testid="heading-what-we-do">
                What We Do
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                uniHub provides a merchant dashboard that allows you to create engaging digital experiences 
                for your customers — all web-based and mobile-friendly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate" data-testid="card-feature-loyalty">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Award className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Digital Loyalty Cards</CardTitle>
                  <CardDescription>Reward repeat customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create digital loyalty cards to reward your regulars. Customers can access their cards 
                    via QR code and track their progress — no paper, no hassle.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-spin">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
                    <Gift className="w-6 h-6 text-chart-3" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Prize Wheels</CardTitle>
                  <CardDescription>Drive excitement and return visits</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Set up fun, interactive prize wheels to create buzz and encourage customers to come back. 
                    Customize rewards and control win probabilities.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-menu">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
                    <UtensilsCrossed className="w-6 h-6 text-chart-4" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Menu Builder</CardTitle>
                  <CardDescription>Share your menu online</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Design and share your own menu online — complete with a QR code for instant access. 
                    Update items in real-time.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-payments">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
                    <CreditCard className="w-6 h-6 text-chart-2" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Secure Payments</CardTitle>
                  <CardDescription>Powered by Stripe</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Accept secure payments via Stripe — no hassle, no extra setup. Industry-leading payment 
                    security with PCI compliance built-in.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-analytics">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-chart-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Analytics</CardTitle>
                  <CardDescription>Track engagement and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Monitor customer engagement with built-in analytics. Understand what works and optimize 
                    your campaigns for better results.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-qr">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Globe className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">QR Code Access</CardTitle>
                  <CardDescription>Instant customer engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Everything is accessible through a simple QR scan. Your customers can engage instantly 
                    through their browser — no apps to download.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section className="py-16 px-6" aria-labelledby="who-we-serve-heading">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" id="who-we-serve-heading" data-testid="heading-who-we-serve">
                Who We Serve
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                uniHub is built for local businesses with returning customers. If you want to reward loyalty 
                and drive repeat visits, we're here to help.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <Card className="hover-elevate text-center" data-testid="card-business-cafes">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Coffee className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">Cafés & Coffee Shops</h3>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-business-restaurants">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-chart-3/10 flex items-center justify-center mb-3">
                    <Pizza className="w-8 h-8 text-chart-3" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">Restaurants & Takeaways</h3>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-business-bars">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-chart-4/10 flex items-center justify-center mb-3">
                    <Wine className="w-8 h-8 text-chart-4" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">Bars & Nightlife</h3>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-business-bakeries">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-chart-5/10 flex items-center justify-center mb-3">
                    <Cake className="w-8 h-8 text-chart-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">Bakeries & Sweet Shops</h3>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-business-salons">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
                    <Scissors className="w-8 h-8 text-chart-2" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">Salons & Barbers</h3>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-business-retail">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <ShoppingBag className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">Boutiques & Retail</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 px-6 bg-muted/30" aria-labelledby="why-choose-heading">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" id="why-choose-heading" data-testid="heading-why-choose">
                Why Businesses Choose uniHub
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Join thousands of small businesses moving toward digital-first loyalty and engagement tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate" data-testid="card-benefit-browser">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-chart-2" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">100% Browser-Based</h3>
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
                      <CheckCircle className="w-5 h-5 text-chart-2" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Fast QR Code Setup</h3>
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
                      <CheckCircle className="w-5 h-5 text-chart-2" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Clean, Modern Design</h3>
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
                      <CheckCircle className="w-5 h-5 text-chart-2" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Affordable & Scalable</h3>
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
                      <CheckCircle className="w-5 h-5 text-chart-2" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Continuous Improvements</h3>
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
                      <CheckCircle className="w-5 h-5 text-chart-2" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No Coding Required</h3>
                      <p className="text-sm text-muted-foreground">
                        Easy-to-use dashboard that anyone can master. No technical skills needed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust & Transparency Section */}
        <section className="py-16 px-6" aria-labelledby="trust-heading">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" id="trust-heading" data-testid="heading-trust">
                Trust & Transparency
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We take privacy and reliability seriously. Your business and your customers deserve the best.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover-elevate text-center" data-testid="card-trust-stripe">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <SiStripe className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All transactions are securely handled through Stripe, with industry-leading encryption and 
                    PCI compliance to protect your business and customers.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-trust-gdpr">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto rounded-full bg-chart-3/10 flex items-center justify-center mb-3">
                    <Shield className="w-8 h-8 text-chart-3" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">GDPR Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We comply with GDPR and cookie transparency practices. User data is protected using modern 
                    web standards and best practices.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate text-center" data-testid="card-trust-data">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
                    <Lock className="w-8 h-8 text-chart-2" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">Data Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your data is encrypted, backed up regularly, and stored securely. Both merchants and 
                    customers can trust our platform completely.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-chart-2/5" aria-labelledby="cta-heading">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" id="cta-heading" data-testid="heading-cta">
              Join the Movement
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Thousands of small businesses are moving toward digital-first loyalty and engagement tools — 
              and uniHub is leading the way. Start engaging your customers smarter — the uniHub way.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth">
                <Button size="lg" className="text-base px-8" data-testid="button-cta-get-started">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-cta-view-pricing">
                  View Pricing
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-cta-try-demo">
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src={logoImage} alt="uniHub logo" className="h-8 w-8" />
                <h3 className="font-semibold text-lg">uniHub</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Digital loyalty cards, prize wheels, and menu builder for modern local businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-demo">Demo</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-pricing">Pricing</Link></li>
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-about">About</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-about-us">About Us</Link></li>
                <li><Link href="/auth" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-get-started">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-terms">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 uniHub. All rights reserved. Built for local businesses with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
