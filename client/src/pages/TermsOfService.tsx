import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, FileText, CreditCard, Shield, AlertCircle, Scale } from "lucide-react";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function TermsOfService() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold" data-testid="heading-terms-of-service">Terms of Service</h1>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-last-updated">
              Last updated: October 2025
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-muted-foreground leading-relaxed">
              Please read these Terms of Service carefully before using uniHub. By accessing or using our platform, you agree to be bound by these terms. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-acceptance">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By creating an account, accessing, or using the uniHub platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. These terms constitute a legally binding agreement between you and uniHub.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you are using uniHub on behalf of a business or organization, you represent and warrant that you have the authority to bind that entity to these terms.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold" data-testid="heading-service-description">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                uniHub provides a digital loyalty and rewards platform designed for businesses to engage with their customers. Our services include:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card data-testid="card-service-loyalty">
                  <CardHeader>
                    <CardTitle className="text-lg">Digital Loyalty Cards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create and manage QR code-based loyalty programs with automated stamp collection, reward tracking, and Google Wallet integration.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-service-spin">
                  <CardHeader>
                    <CardTitle className="text-lg">Spin Wheel Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Run interactive prize wheel promotions with customizable prizes, probability settings, and campaign analytics.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-service-menu">
                  <CardHeader>
                    <CardTitle className="text-lg">Menu Builder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create and share digital menus with categories, items, photos, and descriptions accessible via QR codes.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-service-subscription">
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      All features are provided through a subscription-based model with flexible monthly plans and the ability to cancel anytime.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-account-responsibilities">3. Account Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you create a uniHub account, you agree to the following responsibilities:
              </p>
              
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Accurate Information</h3>
                  <p className="text-sm text-muted-foreground">
                    You must provide accurate, complete, and up-to-date information when creating your account and keep this information current at all times.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Secure Password Management</h3>
                  <p className="text-sm text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your password and account credentials. You must notify us immediately of any unauthorized use of your account.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Customer Data Responsibility</h3>
                  <p className="text-sm text-muted-foreground">
                    You are solely responsible for all customer data you collect and process through our platform. You must obtain appropriate consent from your customers and comply with all applicable data protection laws.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Legal Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    You must comply with all applicable local, national, and international laws and regulations when using our services.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold" data-testid="heading-subscription-payments">4. Subscription and Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                uniHub operates on a subscription-based pricing model. Here are the key terms:
              </p>

              <Card data-testid="card-pricing-structure">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Pricing Structure
                  </CardTitle>
                  <CardDescription>Monthly subscription plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="font-semibold">Loyalty Cards Only</p>
                        <p className="text-2xl font-bold text-primary">€15<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="font-semibold">Spin Wheel Only</p>
                        <p className="text-2xl font-bold text-primary">€10<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="font-semibold">Menu Builder Only</p>
                        <p className="text-2xl font-bold text-primary">€5<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="font-semibold">Complete Bundle</p>
                        <p className="text-2xl font-bold text-primary">€23<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                        <p className="text-xs text-muted-foreground">All features included</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Payment Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    All payments are securely processed through Stripe. By subscribing, you authorize us to charge your payment method on a recurring monthly basis until you cancel your subscription.
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Cancel Anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    You may cancel your subscription at any time through your account settings. Cancellations take effect at the end of your current billing period, and you will retain access to paid features until that date.
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Plan Changes and Proration</h3>
                  <p className="text-sm text-muted-foreground">
                    When you upgrade or downgrade your plan, we will prorate the charges accordingly. Upgrades take effect immediately, while downgrades take effect at the start of the next billing cycle.
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">No Refunds for Partial Months</h3>
                  <p className="text-sm text-muted-foreground">
                    We do not provide refunds for partial months of service. If you cancel your subscription, you will continue to have access until the end of your current billing period.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-acceptable-use">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to use uniHub only for lawful purposes and in accordance with these terms. You must not:
              </p>

              <Card data-testid="card-prohibited-activities">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Prohibited Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Violate any local, national, or international laws or regulations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Abuse, harass, or harm other users or their customers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Violate customer privacy or data protection laws (including GDPR)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Use the platform for spam, phishing, or fraudulent activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Attempt to gain unauthorized access to our systems or other users' accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Interfere with or disrupt the integrity or performance of the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Use the platform to distribute malware, viruses, or harmful code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Reverse engineer, decompile, or attempt to extract source code from our platform</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-intellectual-property">6. Intellectual Property</h2>
              
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">uniHub Ownership</h3>
                  <p className="text-sm text-muted-foreground">
                    uniHub and all related software, designs, trademarks, logos, and content are the exclusive property of uniHub. These terms do not grant you any ownership rights to our intellectual property.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Your Data Ownership</h3>
                  <p className="text-sm text-muted-foreground">
                    You retain all ownership rights to the data you input into our platform, including customer information, business details, and content you create (menus, loyalty programs, campaigns).
                  </p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">License to Operate</h3>
                  <p className="text-sm text-muted-foreground">
                    By using our services, you grant uniHub a limited, non-exclusive license to use, store, and process your data solely for the purpose of providing and improving our services.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-limitation-liability">7. Limitation of Liability</h2>
              
              <Card data-testid="card-liability-disclaimer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Important Disclaimer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">"As Is" Service</h3>
                    <p className="text-sm text-muted-foreground">
                      uniHub is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that our services will be uninterrupted, timely, secure, or error-free.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">No Guarantee of Uptime</h3>
                    <p className="text-sm text-muted-foreground">
                      While we strive to maintain high availability, we do not guarantee 100% uptime or that our services will be available at all times. We may experience downtime for maintenance, updates, or unforeseen technical issues.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Not Liable for Lost Revenue</h3>
                    <p className="text-sm text-muted-foreground">
                      To the maximum extent permitted by law, uniHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, or business opportunities, even if we have been advised of the possibility of such damages.
                    </p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Our total liability to you for any claims arising from or related to these terms or our services shall not exceed the total amount you paid to uniHub in the 12 months preceding the claim.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-termination">8. Termination</h2>
              
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Suspension for Violations</h3>
                  <p className="text-sm text-muted-foreground">
                    We reserve the right to suspend or terminate your account immediately, without prior notice, if you violate these Terms of Service, engage in prohibited activities, or if we believe your use of the platform poses a risk to us, other users, or third parties.
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Merchant Cancellation</h3>
                  <p className="text-sm text-muted-foreground">
                    You may cancel your subscription and terminate your account at any time through your account settings. Upon cancellation, you will retain access to your subscription until the end of your current billing period.
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Data Deletion Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    After account termination, we will retain your data for 30 days to allow for account recovery. After this period, all data associated with your account will be permanently deleted, except where retention is required by law.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-changes-to-terms">9. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms of Service from time to time to reflect changes in our services, business practices, or legal requirements.
              </p>
              <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4">
                <h3 className="font-semibold mb-2">Notification of Changes</h3>
                <p className="text-sm text-muted-foreground">
                  We will notify you of any significant changes to these terms by posting a notice on our platform, updating the "Last updated" date, and sending an email to your registered email address. For material changes, we will provide at least 30 days' notice before the changes take effect.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your continued use of uniHub after the effective date of any changes constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-governing-law">10. Contact and Governing Law</h2>
              
              <Card data-testid="card-governing-law">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Governing Law
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    These Terms of Service shall be governed by and construed in accordance with the laws of the European Union and applicable member state laws. Any disputes arising from these terms or your use of uniHub shall be subject to the exclusive jurisdiction of the courts in the EU.
                  </p>
                </CardContent>
              </Card>

              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us:
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Email:</span>{" "}
                  <a 
                    href="mailto:antonispleipell@gmail.com" 
                    className="text-primary underline hover:text-primary/80"
                    data-testid="link-contact-email"
                  >
                    antonispleipell@gmail.com
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  We aim to respond to all inquiries within 48 hours during business days.
                </p>
              </div>
            </section>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mt-8">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Legal Disclaimer
              </h3>
              <p className="text-sm text-muted-foreground">
                These Terms of Service are provided for general informational purposes. While we strive to keep them accurate and up-to-date, they should not be considered a substitute for professional legal advice. We recommend that you review these terms with legal counsel to ensure they meet your specific business needs and comply with all applicable laws in your jurisdiction.
              </p>
            </div>

            <div className="pt-8 border-t flex justify-center">
              <Button
                variant="outline"
                onClick={scrollToTop}
                className="gap-2"
                data-testid="button-back-to-top"
              >
                <ArrowUp className="w-4 h-4" />
                Back to Top
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/privacy-policy">
                <Button variant="ghost" className="text-sm" data-testid="link-privacy-policy">
                  Privacy Policy
                </Button>
              </Link>
              <Link href="/terms-of-service">
                <Button variant="ghost" className="text-sm text-primary" data-testid="link-terms-of-service">
                  Terms of Service
                </Button>
              </Link>
              <Link href="/cookie-policy">
                <Button variant="ghost" className="text-sm" data-testid="link-cookie-policy">
                  Cookie Policy
                </Button>
              </Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 uniHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
