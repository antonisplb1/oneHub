import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Shield, Lock, Database, Eye, Download, Trash2, FileText } from "lucide-react";
import logoImage from "@assets/blob-b137548_1759662451793.png";

export default function PrivacyPolicy() {
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
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold" data-testid="heading-privacy-policy">Privacy Policy</h1>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-last-updated">
              Last updated: October 2025
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-muted-foreground leading-relaxed">
              At uniHub, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our digital loyalty and rewards platform.
            </p>
          </div>

          <div className="space-y-8">
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold" data-testid="heading-information-collected">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect different types of information to provide and improve our services:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card data-testid="card-account-info">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Email address</li>
                      <li>• Business name</li>
                      <li>• Shop details and settings</li>
                      <li>• Profile information</li>
                      <li>• Account preferences</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card data-testid="card-customer-data">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Customer Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Customer names</li>
                      <li>• Loyalty card progress</li>
                      <li>• Prize wheel participation</li>
                      <li>• Reward redemption history</li>
                      <li>• Customer preferences</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card data-testid="card-payment-info">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      All payment information is securely processed and stored by Stripe. We do not store your complete credit card details on our servers. Stripe maintains PCI DSS compliance for payment security.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-usage-data">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      Usage Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Platform usage patterns</li>
                      <li>• Feature utilization</li>
                      <li>• Device and browser information</li>
                      <li>• IP address and location</li>
                      <li>• Session duration and activity</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-how-we-use">2. How We Use Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Provide the Service</h3>
                  <p className="text-sm text-muted-foreground">
                    To operate and maintain the uniHub platform, including loyalty card management, prize wheel campaigns, menu builder, and all related features.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Process Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    To process subscription payments, manage billing, and handle refunds through our payment processor, Stripe.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Send Transactional Emails</h3>
                  <p className="text-sm text-muted-foreground">
                    To send important account notifications, password resets, subscription updates, and service-related communications via Resend.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Improve the Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    To analyze usage patterns, identify areas for improvement, develop new features, and enhance user experience.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Customer Support</h3>
                  <p className="text-sm text-muted-foreground">
                    To respond to your inquiries, resolve technical issues, and provide assistance with our services.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-data-security">3. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We take the security of your data seriously and implement industry-standard security measures:
              </p>
              <Card data-testid="card-security-measures">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Infrastructure
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Hosted on Neon/Replit infrastructure</li>
                        <li>• Enterprise-grade data centers</li>
                        <li>• Regular security audits</li>
                        <li>• Automated backups</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Encryption & Protection
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• HTTPS encrypted connections</li>
                        <li>• Secure session management</li>
                        <li>• Password hashing (scrypt algorithm)</li>
                        <li>• Protection against common attacks</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-third-party">4. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We work with trusted third-party service providers to deliver our services:
              </p>
              <div className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stripe</CardTitle>
                    <CardDescription>Payment Processing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Stripe processes all payment transactions securely. They are PCI DSS Level 1 certified, the highest level of security certification in the payments industry.
                    </p>
                    <a 
                      href="https://stripe.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline hover:text-primary/80"
                      data-testid="link-stripe-privacy"
                    >
                      View Stripe Privacy Policy →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resend</CardTitle>
                    <CardDescription>Email Delivery</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Resend handles our transactional email delivery, including account verification, password resets, and subscription notifications.
                    </p>
                    <a 
                      href="https://resend.com/legal/privacy-policy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline hover:text-primary/80"
                      data-testid="link-resend-privacy"
                    >
                      View Resend Privacy Policy →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Google Wallet API</CardTitle>
                    <CardDescription>Digital Loyalty Cards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Google Wallet API enables customers to save their loyalty cards directly to their mobile wallets for easy access.
                    </p>
                    <a 
                      href="https://policies.google.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline hover:text-primary/80"
                      data-testid="link-google-privacy"
                    >
                      View Google Privacy Policy →
                    </a>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-data-retention">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Active Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is retained for as long as your account remains active and you continue to use our services.
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Deleted Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    When you delete your account, we will remove all your personal data and customer information within 30 days, except where we are required to retain certain data for legal compliance purposes.
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Legal Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    We may retain certain data for longer periods if required by law, such as financial records for tax purposes, or to resolve disputes and enforce our agreements.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold" data-testid="heading-your-rights">6. Your Rights (GDPR)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Under the General Data Protection Regulation (GDPR) and other privacy laws, you have the following rights regarding your personal data:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card data-testid="card-right-access">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      Access Your Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You have the right to request a copy of all personal data we hold about you.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-right-correct">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Correct/Update Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You can update or correct any inaccurate personal information through your account settings.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-right-delete">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-primary" />
                      Delete Account & Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You have the right to delete your account and request removal of all your personal data.
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-right-export">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Download className="w-5 h-5 text-primary" />
                      Export Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You can request a machine-readable copy of your data for portability to another service.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4">
                <h3 className="font-semibold mb-2">Withdraw Consent</h3>
                <p className="text-sm text-muted-foreground">
                  Where we rely on your consent to process your personal data, you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing based on consent before its withdrawal.
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3">How to Exercise Your Rights</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To exercise any of these rights, please contact us at the email address below. We will respond to your request within 30 days.
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Email:</span>{" "}
                  <a 
                    href="mailto:antonispleipell@gmail.com" 
                    className="text-primary underline hover:text-primary/80"
                    data-testid="link-rights-email"
                  >
                    antonispleipell@gmail.com
                  </a>
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-updates">7. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. We will notify you of any significant changes by posting the updated policy on our platform and updating the "Last updated" date. For material changes, we will provide additional notice, such as via email.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-contact">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted/30 rounded-lg p-6">
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
                <Button variant="ghost" className="text-sm text-primary" data-testid="link-privacy-policy">
                  Privacy Policy
                </Button>
              </Link>
              <Link href="/terms-of-service">
                <Button variant="ghost" className="text-sm" data-testid="link-terms-of-service">
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
