import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, Cookie } from "lucide-react";
import logoImage from "@assets/blob-b137548_1759662451793.png";
import CookiePreferences from "@/components/CookiePreferences";

export default function CookiePolicy() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  
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
            <Link href="/about">
              <Button variant="ghost" data-testid="button-about">About</Button>
            </Link>
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
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold" data-testid="heading-cookie-policy">Cookie Policy</h1>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-last-updated">
              Last updated: October 2025
            </p>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-introduction">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                This Cookie Policy explains how uniHub ("we", "us", or "our") uses cookies and similar tracking technologies when you use our platform. Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience and allow certain features to function properly.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By using uniHub, you consent to our use of cookies in accordance with this policy. If you do not agree to our use of cookies, you should adjust your browser settings accordingly or refrain from using our platform.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold" data-testid="heading-cookie-categories">2. Cookie Categories</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use different types of cookies for various purposes. Below is a breakdown of the cookie categories we use:
              </p>

              <div className="space-y-4">
                <Card data-testid="card-essential-cookies">
                  <CardHeader>
                    <CardTitle className="text-xl">Essential Cookies</CardTitle>
                    <CardDescription>Required for the platform to function properly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      These cookies are necessary for the basic functionality of our platform. They enable core features such as secure login, session management, and payment processing.
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cookie Name</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">session_id</TableCell>
                          <TableCell>Maintains your login session</TableCell>
                          <TableCell>Session</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">auth_token</TableCell>
                          <TableCell>Authenticates your account</TableCell>
                          <TableCell>7 days</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Stripe cookies</TableCell>
                          <TableCell>Secure payment processing</TableCell>
                          <TableCell>Varies</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card data-testid="card-analytics-cookies">
                  <CardHeader>
                    <CardTitle className="text-xl">Analytics Cookies</CardTitle>
                    <CardDescription>Currently not in use</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      We do not currently use analytics cookies. In the future, we may implement analytics tools such as Google Analytics to help us understand how users interact with our platform and improve our services.
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cookie Name</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">_ga</TableCell>
                          <TableCell>Google Analytics tracking</TableCell>
                          <TableCell className="text-muted-foreground">Planned for future</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card data-testid="card-marketing-cookies">
                  <CardHeader>
                    <CardTitle className="text-xl">Marketing Cookies</CardTitle>
                    <CardDescription>Planned for future use</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      We do not currently use marketing cookies. In the future, we may use cookies to personalize advertisements and measure campaign effectiveness through services like Facebook Pixel and Google Ads.
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cookie Name</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">_fbp</TableCell>
                          <TableCell>Facebook Pixel tracking</TableCell>
                          <TableCell className="text-muted-foreground">Planned for future</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">_gcl_*</TableCell>
                          <TableCell>Google Ads conversion tracking</TableCell>
                          <TableCell className="text-muted-foreground">Planned for future</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-managing-cookies">3. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have control over the cookies we use. You can manage your cookie preferences at any time.
              </p>
              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Cookie Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  You can customize your cookie settings to control which types of cookies you allow. Note that disabling essential cookies may affect the functionality of our platform.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsPreferencesOpen(true)}
                  data-testid="button-manage-preferences"
                >
                  Manage Your Cookie Preferences
                </Button>
              </div>
              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Browser Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Most web browsers allow you to control cookies through their settings. You can typically find these options in the "Settings" or "Preferences" menu of your browser. Please note that blocking or deleting cookies may impact your ability to use certain features of our platform.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
                  <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
                  <li>Safari: Preferences → Privacy → Cookies and website data</li>
                  <li>Edge: Settings → Cookies and site permissions → Cookies and site data</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-third-party">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We work with trusted third-party service providers who may set cookies on our platform to provide their services:
              </p>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Stripe (Payment Processing)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Stripe uses cookies to provide secure payment processing and fraud prevention. These cookies are essential for completing transactions on our platform.
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
                </div>
                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold mb-2">Future Third-Party Services</h3>
                  <p className="text-sm text-muted-foreground">
                    We may integrate additional third-party services in the future, such as Google Analytics for performance monitoring and Facebook Pixel for advertising. We will update this policy and notify you when such services are implemented.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-updates">5. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of any significant changes by posting the updated policy on our platform and updating the "Last updated" date at the top of this page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold" data-testid="heading-contact">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
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

      <CookiePreferences 
        open={isPreferencesOpen} 
        onOpenChange={setIsPreferencesOpen} 
      />

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
                <Button variant="ghost" className="text-sm" data-testid="link-terms-of-service">
                  Terms of Service
                </Button>
              </Link>
              <Link href="/cookie-policy">
                <Button variant="ghost" className="text-sm text-primary" data-testid="link-cookie-policy">
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
