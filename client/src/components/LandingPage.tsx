import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Award,
  Gift,
  UtensilsCrossed,
  Calendar,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  Minus,
} from "lucide-react";
import { SiStripe } from "react-icons/si";
import logoImage from "@assets/unihub-logo-transparent_1774625335894.png";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.18)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

function Logo({ size = "lg" }: { size?: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-4xl md:text-5xl" : "text-xl";
  return (
    <span className={`${textSize} tracking-tight`} style={{ fontWeight: 300, letterSpacing: "-0.01em" }}>
      <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
      <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
    </span>
  );
}

function GoldDash() {
  return <span style={{ color: GOLD }} className="mr-3 select-none">—</span>;
}

export default function LandingPage() {
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
              <Logo size="sm" />
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
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 md:py-44 overflow-hidden">
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)",
          }}
        />

        {/* App icon */}
        <img
          src={logoImage}
          alt="uniHub icon"
          className="h-20 w-20 md:h-24 md:w-24 mb-10 relative"
          style={{ filter: "drop-shadow(0 0 24px rgba(201,168,76,0.35))" }}
        />

        {/* Wordmark */}
        <Logo size="lg" />

        {/* Tagline */}
        <p
          className="mt-5 text-lg md:text-xl italic"
          style={{ color: GOLD, fontWeight: 300, letterSpacing: "0.02em" }}
        >
          One hub for every venue.
        </p>

        {/* Thin rule */}
        <div className="mt-8 mb-8 w-12 border-t" style={{ borderColor: GOLD_BORDER }} />

        {/* Feature pills */}
        <div className="flex flex-col items-center gap-2 text-xs tracking-[0.2em] uppercase mb-12"
          style={{ color: MUTED }}>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span><GoldDash />Loyalty Cards</span>
            <span><GoldDash />Spin-to-Win</span>
            <span><GoldDash />Digital Menus</span>
            <span><GoldDash />Shift Management</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/auth">
            <Button
              size="lg"
              className="text-sm px-8 font-medium tracking-wide"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-get-started"
            >
              Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button
              size="lg"
              variant="outline"
              className="text-sm px-8 font-medium tracking-wide bg-transparent"
              style={{ borderColor: GOLD_BORDER, color: "white" }}
              data-testid="button-watch-demo"
            >
              Watch Demo
            </Button>
          </Link>
        </div>

        <p className="mt-5 text-xs" style={{ color: MUTED }}>
          3-day free trial — no credit card required
        </p>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── PRODUCTS ─── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">

          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>
              Platform
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-white">
              Four tools. One platform.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px" style={{ backgroundColor: BORDER }}>
            {/* Loyalty Cards */}
            <div
              className="p-10 flex flex-col gap-4"
              style={{ backgroundColor: "#080808" }}
              data-testid="product-card-loyalty"
            >
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5" style={{ color: GOLD }} />
                <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>
                  Loyalty Cards
                </h3>
              </div>
              <p className="text-white font-light text-lg leading-relaxed">
                Digital stamp cards that live in Apple Wallet and Google Wallet — updated in real-time when you scan.
              </p>
              <ul className="space-y-2 mt-2">
                {["Digital stamp cards", "Apple & Google Wallet", "QR code scanning", "Auto stamp updates"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                    <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Spin Wheel */}
            <div
              className="p-10 flex flex-col gap-4"
              style={{ backgroundColor: "#080808" }}
              data-testid="product-card-spin"
            >
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-5 h-5" style={{ color: GOLD }} />
                <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>
                  Spin-to-Win
                </h3>
              </div>
              <p className="text-white font-light text-lg leading-relaxed">
                Gamified promotions that keep customers excited and coming back for more.
              </p>
              <ul className="space-y-2 mt-2">
                {["Customizable prize wheels", "Win-chance control", "Prize tracking", "Instant customer access"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                    <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Menu Builder */}
            <div
              className="p-10 flex flex-col gap-4"
              style={{ backgroundColor: "#080808" }}
              data-testid="product-card-menu"
            >
              <div className="flex items-center gap-3 mb-2">
                <UtensilsCrossed className="w-5 h-5" style={{ color: GOLD }} />
                <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>
                  Digital Menus
                </h3>
              </div>
              <p className="text-white font-light text-lg leading-relaxed">
                A beautiful QR menu your guests scan at the table — updated instantly, no printing.
              </p>
              <ul className="space-y-2 mt-2">
                {["Photo uploads", "QR code generated", "Real-time updates", "Mobile-first design"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                    <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Shift Manager */}
            <div
              className="p-10 flex flex-col gap-4"
              style={{ backgroundColor: "#080808" }}
              data-testid="product-card-shift"
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5" style={{ color: GOLD }} />
                <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>
                  Shift Management
                </h3>
              </div>
              <p className="text-white font-light text-lg leading-relaxed">
                Keep your team organized with simple weekly scheduling and a PIN-protected public schedule.
              </p>
              <ul className="space-y-2 mt-2">
                {["Weekly calendar view", "Crew management", "Public shift URL", "PIN-protected access"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                    <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button
                variant="ghost"
                data-testid="button-explore-features"
                className="text-sm tracking-wide hover:bg-white/5"
                style={{ color: GOLD }}
              >
                View full pricing <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── WHY UNIHUB ─── */}
      <section className="py-24 px-6" style={{ backgroundColor: SURFACE }}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>
              Why uniHub
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-white">
              Built for venues. Priced to grow.
            </h2>
            <p className="mt-4 text-base font-light max-w-xl mx-auto" style={{ color: MUTED }}>
              Choose only the tools you need. No bundles, no contracts — cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                id: "card-benefit-browser",
                icon: CheckCircle,
                title: "100% Browser-Based",
                body: "No app downloads for you or your customers. Everything works instantly in the browser.",
              },
              {
                id: "card-benefit-qr",
                icon: Zap,
                title: "Live in Minutes",
                body: "Scan a QR, add a stamp, update a menu — operations that take seconds, not hours.",
              },
              {
                id: "card-benefit-affordable",
                icon: Shield,
                title: "Pay Only for What You Use",
                body: "Individual product pricing. No expensive bundles or features you'll never touch.",
              },
              {
                id: "card-benefit-design",
                icon: CheckCircle,
                title: "Apple & Google Wallet",
                body: "Passes update automatically when you stamp — no customer action required.",
              },
              {
                id: "card-benefit-features",
                icon: Zap,
                title: "Continuously Updated",
                body: "New features ship regularly. Your subscription always includes the latest tools.",
              },
              {
                id: "card-benefit-easy",
                icon: Shield,
                title: "No Technical Skills",
                body: "An intuitive dashboard anyone on your team can use from day one.",
              },
            ].map(({ id, icon: Icon, title, body }) => (
              <div key={id} data-testid={id} className="flex flex-col gap-3">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GOLD_DIM }}
                >
                  <Icon className="w-4 h-4" style={{ color: GOLD }} />
                </div>
                <h4 className="text-white font-medium">{title}</h4>
                <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-xs tracking-[0.25em] uppercase mb-10" style={{ color: GOLD }}>
            Trusted by local businesses
          </p>

          <blockquote data-testid="section-testimonial">
            <div data-testid="card-testimonial">
              <p
                className="text-xl md:text-2xl font-light italic leading-relaxed text-white mb-8"
              >
                "We replaced paper stamp cards with uniHub's loyalty system and our repeat visits increased 25%."
              </p>
              <p className="text-sm tracking-[0.15em] uppercase" style={{ color: MUTED }}>
                — Café Aroma, Nicosia
              </p>
            </div>
          </blockquote>

          <div className="mt-16 flex justify-center gap-12 flex-wrap">
            {[
              { name: "Café Aroma", loc: "Nicosia" },
              { name: "The Barber Room", loc: "Limassol" },
              { name: "SweetBite Bakery", loc: "Athens" },
              { name: "Chill Café", loc: "Larnaca" },
            ].map(({ name, loc }) => (
              <div key={name} className="text-center">
                <div className="text-sm font-medium text-white">{name}</div>
                <div className="text-xs mt-0.5" style={{ color: MUTED }}>{loc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── TRUST STRIP ─── */}
      <section className="py-16 px-6" style={{ backgroundColor: SURFACE }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: SiStripe, label: "Stripe Payments", sub: "Secure & reliable processing" },
              { icon: Shield, label: "GDPR Compliant", sub: "Enterprise-grade protection" },
              { icon: Shield, label: "SSL Secured", sub: "All data encrypted in transit" },
              { icon: Zap, label: "Cancel Anytime", sub: "No contracts, one click" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label}>
                <div
                  className="w-10 h-10 mx-auto rounded-md flex items-center justify-center mb-3"
                  style={{ backgroundColor: GOLD_DIM }}
                >
                  <Icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative container mx-auto max-w-2xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>
            Get started
          </p>
          <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
            Ready to modernize<br />your venue?
          </h2>
          <p className="text-base font-light mb-10" style={{ color: MUTED }}>
            Join cafés, salons, and local shops across Cyprus and beyond using uniHub.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="text-sm px-10 tracking-wide font-medium"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-final-cta"
            >
              Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <div className="flex gap-8 justify-center flex-wrap mt-6 text-xs" style={{ color: MUTED }}>
            <span>3-day free trial</span>
            <span>·</span>
            <span>No credit card</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>

          <div
            className="inline-flex items-center gap-2 mt-10 px-5 py-2 rounded-full border text-xs tracking-[0.15em] uppercase"
            style={{ borderColor: GOLD_BORDER, color: MUTED }}
            data-testid="card-benefit-trial"
          >
            <span style={{ color: GOLD }}>●</span>
            3-day free trial — everything included
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
                One hub for every venue. Loyalty, menus, spin campaigns, and team management — all in one place.
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
                <li><Link href="/privacy-policy" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" data-testid="link-footer-terms">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" data-testid="link-footer-cookies">Cookie Policy</Link></li>
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
