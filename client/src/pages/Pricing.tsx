import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Award, Gift, UtensilsCrossed, Calendar, ArrowRight, Shield, CheckCircle, Minus } from "lucide-react";
import { SiStripe } from "react-icons/si";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";

const GOLD = "#E53935";
const GOLD_DIM = "rgba(229, 57, 53,0.18)";
const GOLD_BORDER = "rgba(229, 57, 53,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

const plans = [
  {
    id: "loyalty",
    testid: "card-pricing-loyalty",
    btnTestid: "button-select-loyalty",
    icon: Award,
    title: "Loyalty Cards",
    price: "€19",
    features: ["Digital stamp cards", "Apple & Google Wallet", "Unlimited customers", "QR code scanning", "Built-in scanner"],
  },
  {
    id: "spin",
    testid: "card-pricing-spin",
    btnTestid: "button-select-spin",
    icon: Gift,
    title: "Spin Wheel",
    price: "€5",
    features: ["Customizable wheels", "Set win probabilities", "Unlimited campaigns", "Prize tracking", "Social sharing"],
  },
  {
    id: "menu",
    testid: "card-pricing-menu",
    btnTestid: "button-select-menu",
    icon: UtensilsCrossed,
    title: "Menu Builder",
    price: "€8",
    features: ["Create categories & items", "Add photos & descriptions", "QR code generation", "Real-time updates", "Public menu page"],
  },
  {
    id: "shift",
    testid: "card-pricing-shift",
    btnTestid: "button-select-shift",
    icon: Calendar,
    title: "Shift Manager",
    price: "€18",
    features: ["Weekly calendar view", "Crew management", "PIN-protected access", "Branded crew view", "Public shift URL"],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080808", color: "white" }}>

      {/* ─── HEADER ─── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "rgba(8,8,8,0.92)", borderColor: BORDER, backdropFilter: "blur(12px)" }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={logoImage} alt="uniHub logo" className="h-7 w-7" />
              <span className="text-xl tracking-tight">
                <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/demo">
              <Button variant="ghost" data-testid="button-demo"
                className="text-white/60 hover:text-white hover:bg-white/5">Demo</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" data-testid="button-pricing"
                className="text-white/60 hover:text-white hover:bg-white/5">Pricing</Button>
            </Link>
            <Link href="/auth?mode=login">
              <Button variant="outline" data-testid="button-login"
                className="ml-2 border-white/20 text-white bg-transparent hover:bg-white/5">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative px-6 py-28 md:py-36 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(229, 57, 53,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative container mx-auto max-w-3xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>Pricing</p>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
            Simple,<br />transparent pricing.
          </h1>
          <p className="text-lg font-light max-w-xl mx-auto" style={{ color: MUTED }}>
            Choose the products you need. Pay only for what you use. Cancel anytime.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ border: `1px solid ${GOLD_BORDER}`, color: MUTED }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-xs tracking-wide">No hidden fees. No contracts.</span>
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── PRICING CARDS ─── */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-px mb-px" style={{ backgroundColor: BORDER }}>
            {plans.map(({ id, testid, btnTestid, icon: Icon, title, price, features }) => (
              <div
                key={id}
                className="p-10 flex flex-col gap-6"
                style={{ backgroundColor: "#080808" }}
                data-testid={testid}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: GOLD_DIM }}
                  >
                    <Icon className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>{title}</h3>
                </div>

                <div>
                  <span className="text-5xl font-light text-white">{price}</span>
                  <span className="text-sm ml-1" style={{ color: MUTED }}>/month</span>
                </div>

                <div className="w-8 border-t" style={{ borderColor: GOLD_BORDER }} />

                <ul className="space-y-3 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/auth">
                  <Button
                    variant="outline"
                    className="w-full border-white/15 text-white bg-transparent hover:bg-white/5 tracking-wide text-sm"
                    data-testid={btnTestid}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Bundle card */}
          <div
            className="p-10 relative"
            style={{ backgroundColor: "#080808", border: `1px solid ${GOLD_BORDER}` }}
            data-testid="card-pricing-bundle"
          >
            <div
              className="absolute -top-px left-0 right-0 h-px"
              style={{ backgroundColor: GOLD }}
            />
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-[0.15em] uppercase mb-6"
                  style={{ backgroundColor: GOLD_DIM, color: GOLD }}
                  data-testid="badge-best-value"
                >
                  Best Value — Save €13
                </div>
                <h3 className="text-3xl font-light text-white mb-3">Complete Bundle</h3>
                <div className="mb-2">
                  <span className="text-6xl font-light text-white">€36.99</span>
                  <span className="text-sm ml-1" style={{ color: MUTED }}>/month</span>
                </div>
                <p className="text-sm mb-8" style={{ color: MUTED }}>
                  All four tools included. One price, everything you need.
                </p>
                <Link href="/auth">
                  <Button
                    className="text-sm px-8 tracking-wide font-medium"
                    style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
                    data-testid="button-select-bundle"
                  >
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <ul className="space-y-3">
                {[
                  "Everything in Loyalty Cards",
                  "Everything in Spin Wheel",
                  "Everything in Menu Builder",
                  "Everything in Shift Manager",
                  "Unified dashboard",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: MUTED }}>
                    <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── TRUST ─── */}
      <section className="py-20 px-6" style={{ backgroundColor: SURFACE }}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>Trust</p>
            <h2 className="text-3xl font-light text-white">Why businesses trust uniHub</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px" style={{ backgroundColor: BORDER }}>
            {[
              { icon: SiStripe, label: "Stripe Payments", body: "Industry-leading payment security with PCI compliance and fraud protection built-in.", testid: "card-trust-stripe" },
              { icon: Shield, label: "Cancel Anytime", body: "No long-term contracts or hidden fees. Pause or cancel your subscription with one click.", testid: "card-trust-cancel" },
              { icon: CheckCircle, label: "Transparent Pricing", body: "No hidden charges. What you see on this page is exactly what you pay each month.", testid: "card-trust-transparent" },
            ].map(({ icon: Icon, label, body, testid }) => (
              <div
                key={label}
                className="p-10 flex flex-col gap-4"
                style={{ backgroundColor: "#080808" }}
                data-testid={testid}
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: GOLD_DIM }}
                >
                  <Icon className="w-4 h-4" style={{ color: GOLD }} />
                </div>
                <h3 className="text-base font-medium text-white">{label}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>FAQ</p>
            <h2 className="text-3xl font-light text-white">Frequently asked questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
            {[
              {
                value: "item-1",
                testid: "faq-switch",
                q: "Can I switch products later?",
                a: "Yes, absolutely. You can upgrade, downgrade, or switch between products at any time. Changes take effect immediately and billing is prorated accordingly.",
              },
              {
                value: "item-2",
                testid: "faq-payment",
                q: "What payment methods do you accept?",
                a: "We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express. All payments are processed securely.",
              },
              {
                value: "item-3",
                testid: "faq-cancel",
                q: "Can I cancel my subscription?",
                a: "Yes, anytime with no penalties. You'll keep access until the end of your current billing period.",
              },
              {
                value: "item-4",
                testid: "faq-trial",
                q: "Is there a free trial?",
                a: "Yes — 3 days free, no credit card required. Explore all features before committing to any plan.",
              },
            ].map(({ value, testid, q, a }) => (
              <AccordionItem
                key={value}
                value={value}
                data-testid={testid}
                style={{ borderColor: BORDER }}
              >
                <AccordionTrigger
                  className="text-left text-white hover:no-underline py-5 text-sm tracking-wide"
                  style={{ color: "white" }}
                >
                  {q}
                </AccordionTrigger>
                <AccordionContent
                  className="text-sm font-light leading-relaxed pb-5"
                  style={{ color: MUTED }}
                >
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(229, 57, 53,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative container mx-auto max-w-2xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>Get started</p>
          <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-base font-light mb-10" style={{ color: MUTED }}>
            Join local businesses using uniHub to reward customers and drive repeat visits.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="text-sm px-10 tracking-wide font-medium"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-cta-get-started"
            >
              Get Started Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <div className="flex gap-8 justify-center flex-wrap mt-6 text-xs" style={{ color: MUTED }}>
            <span>3-day free trial</span>
            <span>·</span>
            <span>No credit card</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t py-16 px-6" style={{ borderColor: BORDER, backgroundColor: "#050505" }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImage} alt="uniHub logo" className="h-6 w-6" />
                <span className="text-base" style={{ fontWeight: 300 }}>
                  <span className="text-white">uni</span>
                  <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                One hub for every venue. Loyalty, menus, spin campaigns, and team management.
              </p>
            </div>
            <div>
              <h5 className="text-xs tracking-[0.18em] uppercase mb-4" style={{ color: GOLD }}>Products</h5>
              <ul className="space-y-2.5 text-sm" style={{ color: MUTED }}>
                <li><Link href="/pricing" data-testid="link-footer-loyalty">Loyalty Cards</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-spin">Spin Wheel</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-menu">Menu Builder</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-shift">Shift Manager</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs tracking-[0.18em] uppercase mb-4" style={{ color: GOLD }}>Company</h5>
              <ul className="space-y-2.5 text-sm" style={{ color: MUTED }}>
                <li><Link href="/demo" data-testid="link-footer-demo">Demo</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs tracking-[0.18em] uppercase mb-4" style={{ color: GOLD }}>Legal</h5>
              <ul className="space-y-2.5 text-sm" style={{ color: MUTED }}>
                <li><Link href="/privacy-policy" data-testid="link-privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" data-testid="link-terms-of-service">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" data-testid="link-cookie-policy">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-wrap items-center justify-between gap-4" style={{ borderColor: BORDER }}>
            <p className="text-xs" style={{ color: MUTED }}>© 2025 uniHub. All rights reserved.</p>
            <p className="text-xs" style={{ color: MUTED }}>info@unihub.live</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
