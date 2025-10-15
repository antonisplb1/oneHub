import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Award, Gift, UtensilsCrossed, Check, ArrowRight, Shield, CheckCircle, Sparkles, Calendar } from "lucide-react";
import { SiStripe } from "react-icons/si";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logoImage} alt="uniHub logo" className="h-8 w-8" />
              <h1 className="text-2xl font-semibold text-primary">uniHub</h1>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/about">
              <Button variant="ghost" data-testid="button-about">About</Button>
            </Link>
            <Link href="/demo">
              <Button variant="ghost" data-testid="button-demo">Demo</Button>
            </Link>
            <Link href="/auth?mode=login">
              <Button variant="outline" data-testid="button-login">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <CheckCircle className="w-4 h-4" />
            <span>No Hidden Fees</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the products you need. Pay only for what you use. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Loyalty Cards */}
            <Card className="hover-elevate flex flex-col" data-testid="card-pricing-loyalty">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Loyalty Cards</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€10</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
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
                    <span className="text-sm">Unlimited customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">QR code scanning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Built-in scanner</span>
                  </li>
                </ul>
                <Link href="/auth" className="mt-6">
                  <Button variant="outline" className="w-full" data-testid="button-select-loyalty">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Spin Wheel */}
            <Card className="hover-elevate flex flex-col" data-testid="card-pricing-spin">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
                  <Gift className="w-6 h-6 text-chart-3" />
                </div>
                <CardTitle className="text-2xl">Spin Wheel</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€8</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Customizable wheels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Set win probabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unlimited campaigns</span>
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
                <Link href="/auth" className="mt-6">
                  <Button variant="outline" className="w-full" data-testid="button-select-spin">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Menu Builder */}
            <Card className="hover-elevate flex flex-col" data-testid="card-pricing-menu">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
                  <UtensilsCrossed className="w-6 h-6 text-chart-4" />
                </div>
                <CardTitle className="text-2xl">Menu Builder</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Create categories & items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Add photos & descriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">QR code generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Real-time updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Public menu page</span>
                  </li>
                </ul>
                <Link href="/auth" className="mt-6">
                  <Button variant="outline" className="w-full" data-testid="button-select-menu">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Shift Manager */}
            <Card className="hover-elevate flex flex-col" data-testid="card-pricing-shift">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-chart-5" />
                </div>
                <CardTitle className="text-2xl">Shift Manager</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€10</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Weekly calendar view</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Crew management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">PIN-protected access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Branded crew view</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Public shift URL</span>
                  </li>
                </ul>
                <Link href="/auth" className="mt-6">
                  <Button variant="outline" className="w-full" data-testid="button-select-shift">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* All Products Bundle - FEATURED */}
            <Card className="hover-elevate flex flex-col border-primary relative" data-testid="card-pricing-bundle">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground" data-testid="badge-best-value">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Best Value - Save €8
                </Badge>
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Complete Bundle</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€24.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Loyalty Cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Spin Wheel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Menu Builder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Shift Manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unified dashboard</span>
                  </li>
                </ul>
                <Link href="/auth" className="mt-6">
                  <Button className="w-full" data-testid="button-select-bundle">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Why Businesses Trust uniHub</h3>
            <p className="text-lg text-muted-foreground">Built with security, transparency, and flexibility in mind</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate text-center" data-testid="card-trust-stripe">
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

            <Card className="hover-elevate text-center" data-testid="card-trust-cancel">
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

            <Card className="hover-elevate text-center" data-testid="card-trust-transparent">
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

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Frequently Asked Questions</h3>
            <p className="text-lg text-muted-foreground">Everything you need to know about our pricing</p>
          </div>

          <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
            <AccordionItem value="item-1" data-testid="faq-switch">
              <AccordionTrigger className="text-left">
                Can I switch products later?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, absolutely! You can upgrade, downgrade, or switch between products at any time. 
                Changes take effect immediately, and we'll prorate your billing accordingly.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" data-testid="faq-payment">
              <AccordionTrigger className="text-left">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept all major credit and debit cards through Stripe, including Visa, Mastercard, 
                American Express, and more. All payments are processed securely with industry-leading encryption.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" data-testid="faq-cancel">
              <AccordionTrigger className="text-left">
                Can I cancel my subscription?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you can cancel your subscription at any time with no penalties or cancellation fees. 
                You'll continue to have access until the end of your current billing period.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" data-testid="faq-trial">
              <AccordionTrigger className="text-left">
                Is there a free trial?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can explore all features with our demo mode before committing to a subscription. 
                This allows you to test the platform and see if it's the right fit for your business.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary/5 to-chart-2/5">
        <div className="container mx-auto max-w-3xl text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join businesses using uniHub to reward customers and drive repeat visits.
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-base px-8" data-testid="button-cta-get-started">
              Get Started Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">uniHub</h3>
              <p className="text-sm text-muted-foreground">
                Digital loyalty cards, spin campaigns, menu builder, and shift management for modern businesses.
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
