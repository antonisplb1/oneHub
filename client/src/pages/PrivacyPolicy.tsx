import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowUp, Shield, Lock, Database, Eye, Download, Trash2, FileText } from "lucide-react";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";

const GOLD = "#E53935";
const GOLD_DIM = "rgba(229, 57, 53,0.12)";
const GOLD_BORDER = "rgba(229, 57, 53,0.3)";
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
    <div
      className="rounded-md p-5"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function AccentLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-4 space-y-1" style={{ borderLeft: `2px solid ${GOLD_BORDER}` }}>
      {children}
    </div>
  );
}

function LegalHeader({ current }: { current: string }) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "rgba(8,8,8,0.85)",
        borderBottom: `1px solid ${BORDER}`,
        backdropFilter: "blur(12px)",
      }}
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
          <Link href="/demo">
            <Button variant="ghost" className="text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="button-demo">Demo</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" className="text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="button-pricing">Pricing</Button>
          </Link>
          <Link href="/auth?mode=login">
            <Button
              variant="outline"
              className="text-sm border-white/15 text-white bg-transparent hover:bg-white/5"
              data-testid="button-login"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function LegalFooter({ current }: { current: string }) {
  return (
    <footer style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgba(255,255,255,0.02)" }} className="py-8 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Link href="/privacy-policy">
            <Button
              variant="ghost"
              className="text-sm"
              style={{ color: current === "privacy" ? GOLD : MUTED }}
              data-testid="link-privacy-policy"
            >
              Privacy Policy
            </Button>
          </Link>
          <Link href="/terms-of-service">
            <Button
              variant="ghost"
              className="text-sm"
              style={{ color: current === "terms" ? GOLD : MUTED }}
              data-testid="link-terms-of-service"
            >
              Terms of Service
            </Button>
          </Link>
          <Link href="/cookie-policy">
            <Button
              variant="ghost"
              className="text-sm"
              style={{ color: current === "cookie" ? GOLD : MUTED }}
              data-testid="link-cookie-policy"
            >
              Cookie Policy
            </Button>
          </Link>
        </div>
        <p className="text-center text-xs" style={{ color: MUTED }}>© 2025 uniHub. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function PrivacyPolicy() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080808", color: "white" }}>
      <LegalHeader current="privacy" />

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: GOLD_DIM }}
              >
                <Shield className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <h1 className="text-3xl font-light text-white" data-testid="heading-privacy-policy">Privacy Policy</h1>
            </div>
            <p className="text-xs tracking-wide" style={{ color: MUTED }} data-testid="text-last-updated">
              Last updated: October 2025
            </p>
          </div>

          <InfoBox>
            <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
              At uniHub, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our digital loyalty and rewards platform.
            </p>
          </InfoBox>

          <div className="space-y-10 mt-10">
            {/* 1. Information We Collect */}
            <section className="space-y-5">
              <h2 className="text-xl font-light text-white" data-testid="heading-information-collected">1. Information We Collect</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We collect different types of information to provide and improve our services:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <GoldCard testId="card-account-info">
                  <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" style={{ color: GOLD }} /> Account Information
                  </h3>
                  <ul className="space-y-1.5 text-xs font-light" style={{ color: MUTED }}>
                    <li>• Email address</li>
                    <li>• Business name</li>
                    <li>• Shop details and settings</li>
                    <li>• Profile information</li>
                    <li>• Account preferences</li>
                  </ul>
                </GoldCard>
                <GoldCard testId="card-customer-data">
                  <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" style={{ color: GOLD }} /> Customer Data
                  </h3>
                  <ul className="space-y-1.5 text-xs font-light" style={{ color: MUTED }}>
                    <li>• Customer names</li>
                    <li>• Loyalty card progress</li>
                    <li>• Prize wheel participation</li>
                    <li>• Reward redemption history</li>
                    <li>• Customer preferences</li>
                  </ul>
                </GoldCard>
                <GoldCard testId="card-payment-info">
                  <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: GOLD }} /> Payment Information
                  </h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>
                    All payment information is securely processed and stored by Stripe. We do not store your complete credit card details on our servers. Stripe maintains PCI DSS compliance for payment security.
                  </p>
                </GoldCard>
                <GoldCard testId="card-usage-data">
                  <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" style={{ color: GOLD }} /> Usage Data
                  </h3>
                  <ul className="space-y-1.5 text-xs font-light" style={{ color: MUTED }}>
                    <li>• Platform usage patterns</li>
                    <li>• Feature utilization</li>
                    <li>• Device and browser information</li>
                    <li>• IP address and location</li>
                    <li>• Session duration and activity</li>
                  </ul>
                </GoldCard>
              </div>
            </section>

            {/* 2. How We Use Information */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-how-we-use">2. How We Use Information</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We use the information we collect for the following purposes:
              </p>
              <div className="space-y-3">
                {[
                  { title: "Provide the Service", body: "To operate and maintain the uniHub platform, including loyalty card management, prize wheel campaigns, menu builder, and all related features." },
                  { title: "Process Payments", body: "To process subscription payments, manage billing, and handle refunds through our payment processor, Stripe." },
                  { title: "Send Transactional Emails", body: "To send important account notifications, password resets, subscription updates, and service-related communications via Resend." },
                  { title: "Improve the Platform", body: "To analyze usage patterns, identify areas for improvement, develop new features, and enhance user experience." },
                  { title: "Customer Support", body: "To respond to your inquiries, resolve technical issues, and provide assistance with our services." },
                ].map(item => (
                  <AccentLine key={item.title}>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                  </AccentLine>
                ))}
              </div>
            </section>

            {/* 3. Data Storage and Security */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-data-security">3. Data Storage and Security</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We take the security of your data seriously and implement industry-standard security measures:
              </p>
              <GoldCard testId="card-security-measures">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" style={{ color: GOLD }} /> Infrastructure
                    </h3>
                    <ul className="space-y-1.5 text-xs font-light" style={{ color: MUTED }}>
                      <li>• Hosted on Neon/Replit infrastructure</li>
                      <li>• Enterprise-grade data centers</li>
                      <li>• Regular security audits</li>
                      <li>• Automated backups</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4" style={{ color: GOLD }} /> Encryption & Protection
                    </h3>
                    <ul className="space-y-1.5 text-xs font-light" style={{ color: MUTED }}>
                      <li>• HTTPS encrypted connections</li>
                      <li>• Secure session management</li>
                      <li>• Password hashing (scrypt algorithm)</li>
                      <li>• Protection against common attacks</li>
                    </ul>
                  </div>
                </div>
              </GoldCard>
            </section>

            {/* 4. Third-Party Services */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-third-party">4. Third-Party Services</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We work with trusted third-party service providers to deliver our services:
              </p>
              <div className="space-y-3">
                {[
                  { name: "Stripe", desc: "Payment Processing", body: "Stripe processes all payment transactions securely. They are PCI DSS Level 1 certified, the highest level of security certification in the payments industry.", link: "https://stripe.com/privacy", linkText: "View Stripe Privacy Policy →", testId: "link-stripe-privacy" },
                  { name: "Resend", desc: "Email Delivery", body: "Resend handles our transactional email delivery, including account verification, password resets, and subscription notifications.", link: "https://resend.com/legal/privacy-policy", linkText: "View Resend Privacy Policy →", testId: "link-resend-privacy" },
                  { name: "Google Wallet API", desc: "Digital Loyalty Cards", body: "Google Wallet API enables customers to save their loyalty cards directly to their mobile wallets for easy access.", link: "https://policies.google.com/privacy", linkText: "View Google Privacy Policy →", testId: "link-google-privacy" },
                ].map(item => (
                  <GoldCard key={item.name}>
                    <p className="font-medium text-white text-sm">{item.name}</p>
                    <p className="text-xs mb-2" style={{ color: MUTED }}>{item.desc}</p>
                    <p className="text-xs font-light mb-3" style={{ color: MUTED }}>{item.body}</p>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: GOLD }} data-testid={item.testId}>
                      {item.linkText}
                    </a>
                  </GoldCard>
                ))}
              </div>
            </section>

            {/* 5. Data Retention */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-data-retention">5. Data Retention</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We retain your data for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <div className="space-y-3">
                {[
                  { title: "Active Accounts", body: "Your data is retained for as long as your account remains active and you continue to use our services." },
                  { title: "Deleted Accounts", body: "When you delete your account, we will remove all your personal data and customer information within 30 days, except where we are required to retain certain data for legal compliance purposes." },
                  { title: "Legal Compliance", body: "We may retain certain data for longer periods if required by law, such as financial records for tax purposes, or to resolve disputes and enforce our agreements." },
                ].map(item => (
                  <InfoBox key={item.title}>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                  </InfoBox>
                ))}
              </div>
            </section>

            {/* 6. Your Rights (GDPR) */}
            <section className="space-y-5">
              <h2 className="text-xl font-light text-white" data-testid="heading-your-rights">6. Your Rights (GDPR)</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                Under the General Data Protection Regulation (GDPR) and other privacy laws, you have the following rights regarding your personal data:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <GoldCard testId="card-right-access">
                  <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" style={{ color: GOLD }} /> Access Your Data
                  </h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>You have the right to request a copy of all personal data we hold about you.</p>
                </GoldCard>
                <GoldCard testId="card-right-correct">
                  <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: GOLD }} /> Correct/Update Data
                  </h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>You can update or correct any inaccurate personal information through your account settings.</p>
                </GoldCard>
                <GoldCard testId="card-right-delete">
                  <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" style={{ color: GOLD }} /> Delete Account & Data
                  </h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>You have the right to delete your account and request removal of all your personal data.</p>
                </GoldCard>
                <GoldCard testId="card-right-export">
                  <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4" style={{ color: GOLD }} /> Export Data
                  </h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>You can request a machine-readable copy of your data for portability to another service.</p>
                </GoldCard>
              </div>
              <div className="rounded-md p-4" style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
                <h3 className="font-medium text-white text-sm mb-1">Withdraw Consent</h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  Where we rely on your consent to process your personal data, you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing based on consent before its withdrawal.
                </p>
              </div>
              <InfoBox>
                <h3 className="font-medium text-white text-sm">How to Exercise Your Rights</h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  To exercise any of these rights, please contact us at the email address below. We will respond to your request within 30 days.
                </p>
                <p className="text-xs text-white">
                  <span className="font-medium">Email:</span>{" "}
                  <a href="mailto:antonispleipell@gmail.com" className="underline" style={{ color: GOLD }} data-testid="link-rights-email">
                    antonispleipell@gmail.com
                  </a>
                </p>
              </InfoBox>
            </section>

            {/* 7. Updates */}
            <section className="space-y-3">
              <h2 className="text-xl font-light text-white" data-testid="heading-updates">7. Updates to This Policy</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. We will notify you of any significant changes by posting the updated policy on our platform and updating the "Last updated" date. For material changes, we will provide additional notice, such as via email.
              </p>
            </section>

            {/* 8. Contact */}
            <section className="space-y-3">
              <h2 className="text-xl font-light text-white" data-testid="heading-contact">8. Contact Us</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <InfoBox>
                <p className="text-sm text-white">
                  <span className="font-medium">Email:</span>{" "}
                  <a href="mailto:antonispleipell@gmail.com" className="underline" style={{ color: GOLD }} data-testid="link-contact-email">
                    antonispleipell@gmail.com
                  </a>
                </p>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  We aim to respond to all inquiries within 48 hours during business days.
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

      <LegalFooter current="privacy" />
    </div>
  );
}
