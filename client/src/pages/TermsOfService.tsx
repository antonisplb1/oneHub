import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowUp, FileText, CreditCard, Shield, AlertCircle, Scale } from "lucide-react";
import logoImage from "@assets/uniHub Icon Logo_1760616426501.png";

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

function AccentLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-4 space-y-1" style={{ borderLeft: `2px solid ${GOLD_BORDER}` }}>
      {children}
    </div>
  );
}

export default function TermsOfService() {
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
                <FileText className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <h1 className="text-3xl font-light text-white" data-testid="heading-terms-of-service">Terms of Service</h1>
            </div>
            <p className="text-xs tracking-wide" style={{ color: MUTED }} data-testid="text-last-updated">Last updated: October 2025</p>
          </div>

          <InfoBox>
            <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
              Please read these Terms of Service carefully before using uniHub. By accessing or using our platform, you agree to be bound by these terms. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </InfoBox>

          <div className="space-y-10 mt-10">
            {/* 1. Acceptance */}
            <section className="space-y-3">
              <h2 className="text-xl font-light text-white" data-testid="heading-acceptance">1. Acceptance of Terms</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                By creating an account, accessing, or using the uniHub platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. These terms constitute a legally binding agreement between you and uniHub.
              </p>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                If you are using uniHub on behalf of a business or organization, you represent and warrant that you have the authority to bind that entity to these terms.
              </p>
            </section>

            {/* 2. Service Description */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-service-description">2. Service Description</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                uniHub provides a digital loyalty and rewards platform designed for businesses to engage with their customers. Our services include:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <GoldCard testId="card-service-loyalty">
                  <h3 className="font-medium text-white text-sm mb-2">Digital Loyalty Cards</h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>Create and manage QR code-based loyalty programs with automated stamp collection, reward tracking, and Google Wallet integration.</p>
                </GoldCard>
                <GoldCard testId="card-service-spin">
                  <h3 className="font-medium text-white text-sm mb-2">Spin Wheel Campaigns</h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>Run interactive prize wheel promotions with customizable prizes, probability settings, and campaign analytics.</p>
                </GoldCard>
                <GoldCard testId="card-service-menu">
                  <h3 className="font-medium text-white text-sm mb-2">Menu Builder</h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>Create and share digital menus with categories, items, photos, and descriptions accessible via QR codes.</p>
                </GoldCard>
                <GoldCard testId="card-service-subscription">
                  <h3 className="font-medium text-white text-sm mb-2">Subscription Access</h3>
                  <p className="text-xs font-light" style={{ color: MUTED }}>All features are provided through a subscription-based model with flexible monthly plans and the ability to cancel anytime.</p>
                </GoldCard>
              </div>
            </section>

            {/* 3. Account Responsibilities */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-account-responsibilities">3. Account Responsibilities</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                When you create a uniHub account, you agree to the following responsibilities:
              </p>
              <div className="space-y-3">
                {[
                  { title: "Accurate Information", body: "You must provide accurate, complete, and up-to-date information when creating your account and keep this information current at all times." },
                  { title: "Secure Password Management", body: "You are responsible for maintaining the confidentiality of your password and account credentials. You must notify us immediately of any unauthorized use of your account." },
                  { title: "Customer Data Responsibility", body: "You are solely responsible for all customer data you collect and process through our platform. You must obtain appropriate consent from your customers and comply with all applicable data protection laws." },
                  { title: "Legal Compliance", body: "You must comply with all applicable local, national, and international laws and regulations when using our services." },
                ].map(item => (
                  <AccentLine key={item.title}>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                  </AccentLine>
                ))}
              </div>
            </section>

            {/* 4. Subscription and Payments */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-subscription-payments">4. Subscription and Payments</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                uniHub operates on a subscription-based pricing model. Here are the key terms:
              </p>
              <GoldCard testId="card-pricing-structure">
                <h3 className="font-medium text-white text-sm mb-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: GOLD }} /> Pricing Structure
                </h3>
                <p className="text-xs mb-4" style={{ color: MUTED }}>Monthly subscription plans</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { label: "Loyalty Cards Only", price: "€15" },
                    { label: "Spin Wheel Only", price: "€5" },
                    { label: "Menu Builder Only", price: "€5" },
                    { label: "Complete Bundle", price: "€24.99", note: "All features included" },
                  ].map(item => (
                    <div key={item.label} className="rounded-md p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <p className="text-xs font-medium text-white mb-1">{item.label}</p>
                      <p className="text-xl font-light" style={{ color: GOLD }}>{item.price}<span className="text-xs ml-1" style={{ color: MUTED }}>/month</span></p>
                      {item.note && <p className="text-xs mt-1" style={{ color: MUTED }}>{item.note}</p>}
                    </div>
                  ))}
                </div>
              </GoldCard>
              <div className="space-y-3">
                {[
                  { title: "Payment Processing", body: "All payments are securely processed through Stripe. By subscribing, you authorize us to charge your payment method on a recurring monthly basis until you cancel your subscription." },
                  { title: "Cancel Anytime", body: "You may cancel your subscription at any time through your account settings. Cancellations take effect at the end of your current billing period, and you will retain access to paid features until that date." },
                  { title: "Plan Changes and Proration", body: "When you upgrade or downgrade your plan, we will prorate the charges accordingly. Upgrades take effect immediately, while downgrades take effect at the start of the next billing cycle." },
                  { title: "No Refunds for Partial Months", body: "We do not provide refunds for partial months of service. If you cancel your subscription, you will continue to have access until the end of your current billing period." },
                ].map(item => (
                  <InfoBox key={item.title}>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                  </InfoBox>
                ))}
              </div>
            </section>

            {/* 5. Acceptable Use */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-acceptable-use">5. Acceptable Use</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                You agree to use uniHub only for lawful purposes and in accordance with these terms. You must not:
              </p>
              <GoldCard testId="card-prohibited-activities">
                <h3 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" /> Prohibited Activities
                </h3>
                <ul className="space-y-2">
                  {[
                    "Violate any local, national, or international laws or regulations",
                    "Abuse, harass, or harm other users or their customers",
                    "Violate customer privacy or data protection laws (including GDPR)",
                    "Use the platform for spam, phishing, or fraudulent activities",
                    "Attempt to gain unauthorized access to our systems or other users' accounts",
                    "Interfere with or disrupt the integrity or performance of the platform",
                    "Use the platform to distribute malware, viruses, or harmful code",
                    "Reverse engineer, decompile, or attempt to extract source code from our platform",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs font-light" style={{ color: MUTED }}>
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GoldCard>
            </section>

            {/* 6. Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-intellectual-property">6. Intellectual Property</h2>
              <div className="space-y-3">
                {[
                  { title: "uniHub Ownership", body: "uniHub and all related software, designs, trademarks, logos, and content are the exclusive property of uniHub. These terms do not grant you any ownership rights to our intellectual property." },
                  { title: "Your Data Ownership", body: "You retain all ownership rights to the data you input into our platform, including customer information, business details, and content you create (menus, loyalty programs, campaigns)." },
                  { title: "License to Operate", body: "By using our services, you grant uniHub a limited, non-exclusive license to use, store, and process your data solely for the purpose of providing and improving our services." },
                ].map(item => (
                  <AccentLine key={item.title}>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                  </AccentLine>
                ))}
              </div>
            </section>

            {/* 7. Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-limitation-liability">7. Limitation of Liability</h2>
              <GoldCard testId="card-liability-disclaimer">
                <h3 className="font-medium text-white text-sm mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: GOLD }} /> Important Disclaimer
                </h3>
                <div className="space-y-4">
                  {[
                    { title: '"As Is" Service', body: 'uniHub is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that our services will be uninterrupted, timely, secure, or error-free.' },
                    { title: "No Guarantee of Uptime", body: "While we strive to maintain high availability, we do not guarantee 100% uptime or that our services will be available at all times. We may experience downtime for maintenance, updates, or unforeseen technical issues." },
                    { title: "Not Liable for Lost Revenue", body: "To the maximum extent permitted by law, uniHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, or business opportunities, even if we have been advised of the possibility of such damages." },
                  ].map(item => (
                    <div key={item.title}>
                      <h4 className="font-medium text-white text-xs mb-1">{item.title}</h4>
                      <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                    </div>
                  ))}
                  <div className="rounded-md p-3 mt-2" style={{ backgroundColor: GOLD_DIM }}>
                    <p className="text-xs font-light" style={{ color: MUTED }}>
                      Our total liability to you for any claims arising from or related to these terms or our services shall not exceed the total amount you paid to uniHub in the 12 months preceding the claim.
                    </p>
                  </div>
                </div>
              </GoldCard>
            </section>

            {/* 8. Termination */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-termination">8. Termination</h2>
              <div className="space-y-3">
                {[
                  { title: "Suspension for Violations", body: "We reserve the right to suspend or terminate your account immediately, without prior notice, if you violate these Terms of Service, engage in prohibited activities, or if we believe your use of the platform poses a risk to us, other users, or third parties." },
                  { title: "Merchant Cancellation", body: "You may cancel your subscription and terminate your account at any time through your account settings. Upon cancellation, you will retain access to your subscription until the end of your current billing period." },
                  { title: "Data Deletion Policy", body: "After account termination, we will retain your data for 30 days to allow for account recovery. After this period, all data associated with your account will be permanently deleted, except where retention is required by law." },
                ].map(item => (
                  <InfoBox key={item.title}>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{item.body}</p>
                  </InfoBox>
                ))}
              </div>
            </section>

            {/* 9. Changes to Terms */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-changes-to-terms">9. Changes to Terms</h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                We may update these Terms of Service from time to time to reflect changes in our services, business practices, or legal requirements.
              </p>
              <div className="rounded-md p-4" style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
                <h3 className="font-medium text-white text-sm mb-1">Notification of Changes</h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  We will notify you of any significant changes to these terms by posting a notice on our platform, updating the "Last updated" date, and sending an email to your registered email address. For material changes, we will provide at least 30 days' notice before the changes take effect.
                </p>
              </div>
              <p className="text-xs font-light" style={{ color: MUTED }}>
                Your continued use of uniHub after the effective date of any changes constitutes your acceptance of the updated terms.
              </p>
            </section>

            {/* 10. Governing Law */}
            <section className="space-y-4">
              <h2 className="text-xl font-light text-white" data-testid="heading-governing-law">10. Contact and Governing Law</h2>
              <GoldCard testId="card-governing-law">
                <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" style={{ color: GOLD }} /> Governing Law
                </h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  These Terms of Service shall be governed by and construed in accordance with the laws of the European Union and applicable member state laws. Any disputes arising from these terms or your use of uniHub shall be subject to the exclusive jurisdiction of the courts in the EU.
                </p>
              </GoldCard>
              <InfoBox>
                <h3 className="font-medium text-white text-sm">Contact Information</h3>
                <p className="text-xs font-light" style={{ color: MUTED }}>
                  If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us:
                </p>
                <p className="text-sm text-white">
                  <span className="font-medium">Email:</span>{" "}
                  <a href="mailto:antonispleipell@gmail.com" className="underline" style={{ color: GOLD }} data-testid="link-contact-email">
                    antonispleipell@gmail.com
                  </a>
                </p>
                <p className="text-xs font-light" style={{ color: MUTED }} data-testid="text-response-time">
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

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgba(255,255,255,0.02)" }} className="py-8 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <Link href="/privacy-policy"><Button variant="ghost" className="text-sm" style={{ color: MUTED }} data-testid="link-privacy-policy">Privacy Policy</Button></Link>
            <Link href="/terms-of-service"><Button variant="ghost" className="text-sm" style={{ color: GOLD }} data-testid="link-terms-of-service">Terms of Service</Button></Link>
            <Link href="/cookie-policy"><Button variant="ghost" className="text-sm" style={{ color: MUTED }} data-testid="link-cookie-policy">Cookie Policy</Button></Link>
          </div>
          <p className="text-center text-xs" style={{ color: MUTED }}>© 2025 uniHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
