import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowUp, Cookie } from "lucide-react";
import logoImage from "@assets/unihub-logo-transparent_1774625335894.png";
import CookiePreferences from "@/components/CookiePreferences";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.12)";
const GOLD_BORDER = "rgba(201,168,76,0.3)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.5)";

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md p-4 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
      {children}
    </div>
  );
}

function GoldCard({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div className="rounded-md p-5" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }} data-testid={testId}>
      {children}
    </div>
  );
}

export default function CookiePolicy() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080808", color: "white" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: "rgba(8,8,8,0.85)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(12px)" }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
              <img src={logoImage} alt="uniHub logo" className="h-7 w-7" />
              <span className="text-xl tracking-tight">
                <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/demo"><Button variant="ghost" className="text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="button-demo">Demo</Button></Link>
            <Link href="/pricing"><Button variant="ghost" className="text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="button-pricing">Pricing</Button></Link>
            <Link href="/auth?mode=login"><Button variant="outline" className="text-sm border-white/15 text-white bg-transparent hover:bg-white/5" data-testid="button-login">Login</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD_DIM }}>
                <Cookie className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <h1 className="text-3xl font-light text-white" data-testid="heading-cookie-policy">Cookie Policy</h1>
            </div>
            <p className="text-xs tracking-wide" style={{ color: MUTED }} data-testid="text-last-updated">Last updated: October 2025</p>
          </div>

          <div className="space-y-10">
            {/* 1. Introduction */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-introduction">1. Introduction</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                This Cookie Policy explains how uniHub ("we", "us", or "our") uses cookies and similar tracking technologies when you use our platform. Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience and allow certain features to function properly.
              </p>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                By using uniHub, you consent to our use of cookies in accordance with this policy. If you do not agree to our use of cookies, you should adjust your browser settings accordingly or refrain from using our platform.
              </p>
            </section>

            {/* 2. Cookie Categories */}
            <section className="space-y-5">
              <h2 className="text-xl font-light text-white" data-testid="heading-cookie-categories">2. Cookie Categories</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We use different types of cookies for various purposes. Below is a breakdown of the cookie categories we use:
              </p>
              <div className="space-y-3">
                <GoldCard testId="card-essential-cookies">
                  <h3 className="font-medium text-white text-sm mb-1">Essential Cookies</h3>
                  <p className="text-xs mb-4" style={{ color: MUTED }}>Required for the platform to function properly</p>
                  <p className="text-xs font-light mb-4" style={{ color: MUTED }}>
                    These cookies are necessary for the basic functionality of our platform. They enable core features such as secure login, session management, and payment processing.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className="text-left py-2 pr-4 font-medium text-white">Cookie Name</th>
                          <th className="text-left py-2 pr-4 font-medium text-white">Purpose</th>
                          <th className="text-left py-2 font-medium text-white">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "session_id", purpose: "Maintains your login session", duration: "Session" },
                          { name: "auth_token", purpose: "Authenticates your account", duration: "7 days" },
                          { name: "Stripe cookies", purpose: "Secure payment processing", duration: "Varies" },
                        ].map(row => (
                          <tr key={row.name} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td className="py-2 pr-4 font-medium text-white">{row.name}</td>
                            <td className="py-2 pr-4" style={{ color: MUTED }}>{row.purpose}</td>
                            <td className="py-2" style={{ color: MUTED }}>{row.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GoldCard>

                <GoldCard testId="card-analytics-cookies">
                  <h3 className="font-medium text-white text-sm mb-1">Analytics Cookies</h3>
                  <p className="text-xs mb-4" style={{ color: MUTED }}>Currently not in use</p>
                  <p className="text-xs font-light mb-4" style={{ color: MUTED }}>
                    We do not currently use analytics cookies. In the future, we may implement analytics tools such as Google Analytics to help us understand how users interact with our platform and improve our services.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className="text-left py-2 pr-4 font-medium text-white">Cookie Name</th>
                          <th className="text-left py-2 pr-4 font-medium text-white">Purpose</th>
                          <th className="text-left py-2 font-medium text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 pr-4 font-medium text-white">_ga</td>
                          <td className="py-2 pr-4" style={{ color: MUTED }}>Google Analytics tracking</td>
                          <td className="py-2 text-xs" style={{ color: MUTED }}>Planned for future</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </GoldCard>

                <GoldCard testId="card-marketing-cookies">
                  <h3 className="font-medium text-white text-sm mb-1">Marketing Cookies</h3>
                  <p className="text-xs mb-4" style={{ color: MUTED }}>Planned for future use</p>
                  <p className="text-xs font-light mb-4" style={{ color: MUTED }}>
                    We do not currently use marketing cookies. In the future, we may use cookies to personalize advertisements and measure campaign effectiveness through services like Facebook Pixel and Google Ads.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className="text-left py-2 pr-4 font-medium text-white">Cookie Name</th>
                          <th className="text-left py-2 pr-4 font-medium text-white">Purpose</th>
                          <th className="text-left py-2 font-medium text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "_fbp", purpose: "Facebook Pixel tracking" },
                          { name: "_gcl_*", purpose: "Google Ads conversion tracking" },
                        ].map(row => (
                          <tr key={row.name} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td className="py-2 pr-4 font-medium text-white">{row.name}</td>
                            <td className="py-2 pr-4" style={{ color: MUTED }}>{row.purpose}</td>
                            <td className="py-2 text-xs" style={{ color: MUTED }}>Planned for future</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GoldCard>
              </div>
            </section>

            {/* 3. Managing Cookies */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-managing-cookies">3. Managing Cookies</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                You have control over the cookies we use. You can manage your cookie preferences at any time.
              </p>
              <InfoBox>
                <h3 className="font-medium text-white text-sm">Cookie Preferences</h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  You can customize your cookie settings to control which types of cookies you allow. Note that disabling essential cookies may affect the functionality of our platform.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsPreferencesOpen(true)}
                  className="text-xs border-white/15 text-white bg-transparent hover:bg-white/5 mt-1"
                  data-testid="button-manage-preferences"
                >
                  Manage Your Cookie Preferences
                </Button>
              </InfoBox>
              <InfoBox>
                <h3 className="font-medium text-white text-sm">Browser Settings</h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  Most web browsers allow you to control cookies through their settings. You can typically find these options in the "Settings" or "Preferences" menu of your browser. Please note that blocking or deleting cookies may impact your ability to use certain features of our platform.
                </p>
                <ul className="text-xs font-light space-y-1 mt-1" style={{ color: MUTED }}>
                  <li>• Chrome: Settings → Privacy and security → Cookies and other site data</li>
                  <li>• Firefox: Settings → Privacy &amp; Security → Cookies and Site Data</li>
                  <li>• Safari: Preferences → Privacy → Cookies and website data</li>
                  <li>• Edge: Settings → Cookies and site permissions → Cookies and site data</li>
                </ul>
              </InfoBox>
            </section>

            {/* 4. Third-Party Cookies */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-third-party">4. Third-Party Cookies</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We work with trusted third-party service providers who may set cookies on our platform to provide their services:
              </p>
              <div className="space-y-3">
                <div className="pl-4 space-y-1" style={{ borderLeft: `2px solid ${GOLD_BORDER}` }}>
                  <h3 className="font-medium text-white text-sm">Stripe (Payment Processing)</h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>
                    Stripe uses cookies to provide secure payment processing and fraud prevention. These cookies are essential for completing transactions on our platform.
                  </p>
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: GOLD }} data-testid="link-stripe-privacy">
                    View Stripe Privacy Policy →
                  </a>
                </div>
                <div className="pl-4 space-y-1" style={{ borderLeft: `2px solid ${BORDER}` }}>
                  <h3 className="font-medium text-white text-sm">Future Third-Party Services</h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>
                    We may integrate additional third-party services in the future, such as Google Analytics for performance monitoring and Facebook Pixel for advertising. We will update this policy and notify you when such services are implemented.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Updates */}
            <section className="space-y-3">
              <h2 className="text-xl font-light text-white" data-testid="heading-updates">5. Updates to This Policy</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of any significant changes by posting the updated policy on our platform and updating the "Last updated" date at the top of this page.
              </p>
            </section>

            {/* 6. Contact */}
            <section className="space-y-3">
              <h2 className="text-xl font-light text-white" data-testid="heading-contact">6. Contact Us</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <InfoBox>
                <p className="text-sm text-white">
                  <span className="font-medium">Email:</span>{" "}
                  <a href="mailto:antonispleipell@gmail.com" className="underline" style={{ color: GOLD }} data-testid="link-contact-email">
                    antonispleipell@gmail.com
                  </a>
                </p>
              </InfoBox>
            </section>

            <div className="pt-8 flex justify-center" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button
                variant="outline"
                onClick={scrollToTop}
                className="gap-2 border-white/15 text-white bg-transparent hover:bg-white/5 text-sm"
                data-testid="button-back-to-top"
              >
                <ArrowUp className="w-4 h-4" />
                Back to Top
              </Button>
            </div>
          </div>
        </div>
      </main>

      <CookiePreferences open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen} />

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgba(255,255,255,0.02)" }} className="py-8 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <Link href="/privacy-policy"><Button variant="ghost" className="text-sm" style={{ color: MUTED }} data-testid="link-privacy-policy">Privacy Policy</Button></Link>
            <Link href="/terms-of-service"><Button variant="ghost" className="text-sm" style={{ color: MUTED }} data-testid="link-terms-of-service">Terms of Service</Button></Link>
            <Link href="/cookie-policy"><Button variant="ghost" className="text-sm" style={{ color: GOLD }} data-testid="link-cookie-policy">Cookie Policy</Button></Link>
          </div>
          <p className="text-center text-xs" style={{ color: MUTED }}>© 2025 uniHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
