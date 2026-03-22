import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Settings,
  Rocket,
  TrendingUp,
  Award,
  Gift,
  UtensilsCrossed,
  Calendar,
  QrCode,
  Wallet,
  Users,
  BarChart3,
  ArrowRight,
  Play,
  Minus,
} from "lucide-react";
import logoImage from "@assets/uniHub Icon Logo_1760616426501.png";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.18)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function Demo() {
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
      <section className="relative px-6 py-28 md:py-40 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative container mx-auto max-w-4xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>
            Platform Overview
          </p>
          <h1
            className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight"
            data-testid="text-demo-hero-title"
          >
            See how uniHub works<br />in one minute.
          </h1>
          <p className="text-lg font-light mb-14 max-w-2xl mx-auto" style={{ color: MUTED }}>
            One dashboard to launch loyalty cards, spin campaigns, digital menus, and staff schedules.
          </p>

          {/* Video placeholder */}
          <div
            className="aspect-video rounded-md flex items-center justify-center mb-10 relative overflow-hidden"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
            data-testid="video-demo-placeholder"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)" }}
            />
            <div className="relative text-center space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
              >
                <Play className="w-9 h-9 ml-1" style={{ color: GOLD }} />
              </div>
              <p className="text-sm tracking-[0.1em] uppercase" style={{ color: MUTED }}>
                1-Minute Product Demo
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Coming soon</p>
            </div>
          </div>

          <Link href="/auth">
            <Button
              size="lg"
              className="text-sm px-10 tracking-wide font-medium"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-hero-cta"
            >
              Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-6" style={{ backgroundColor: SURFACE }}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>Process</p>
            <h2
              className="text-3xl md:text-4xl font-light text-white"
              data-testid="text-how-it-works-title"
            >
              Up and running in four steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-px" style={{ backgroundColor: BORDER }}>
            {[
              { icon: UserPlus, n: "01", title: "Create your account", body: "Sign up, verify your email, and get instant access to your dashboard.", testid: "card-step-1" },
              { icon: Settings, n: "02", title: "Pick your tools", body: "Choose Loyalty, Spin Wheel, Menu Builder, or Shift Manager — or all four.", testid: "card-step-2" },
              { icon: Rocket, n: "03", title: "Launch campaigns", body: "Generate QR codes for your customers, menus, or promotions in seconds.", testid: "card-step-3" },
              { icon: TrendingUp, n: "04", title: "Track engagement", body: "Monitor stamps, spins, and team activity in real time from one place.", testid: "card-step-4" },
            ].map(({ icon: Icon, n, title, body, testid }) => (
              <div
                key={n}
                className="p-8 flex flex-col gap-5"
                style={{ backgroundColor: "#080808" }}
                data-testid={testid}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: GOLD_DIM }}
                  >
                    <Icon className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  <span className="text-xs tracking-[0.2em]" style={{ color: "rgba(201,168,76,0.4)" }}>{n}</span>
                </div>
                <h3 className="text-base font-medium text-white">{title}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── PRODUCT HIGHLIGHTS ─── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>Features</p>
            <h2
              className="text-3xl md:text-4xl font-light text-white"
              data-testid="text-product-highlights-title"
            >
              Your complete engagement toolkit.
            </h2>
          </div>

          <div className="space-y-px" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            {/* Loyalty Cards */}
            <div
              className="grid md:grid-cols-2 gap-0"
              style={{ borderBottom: `1px solid ${BORDER}` }}
              data-testid="card-product-loyalty"
            >
              <div
                className="p-10 flex items-center justify-center"
                style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-full max-w-xs rounded-lg p-6 flex flex-col gap-4"
                  style={{ backgroundColor: "#080808", border: `1px solid ${GOLD_BORDER}` }}
                >
                  <div className="text-xs tracking-[0.1em] uppercase" style={{ color: MUTED }}>Coffee Shop Rewards</div>
                  <div className="text-white font-light">Customer Name</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: i < 7 ? GOLD : "rgba(201,168,76,0.15)" }}
                      />
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: MUTED }}>7 of 10 stamps</div>
                </div>
              </div>
              <div className="p-10 flex flex-col gap-4" style={{ backgroundColor: "#080808" }}>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5" style={{ color: GOLD }} />
                  <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>Loyalty Cards</h3>
                </div>
                <p className="text-white font-light text-lg leading-relaxed">
                  Reward repeat customers with digital stamp cards that live in Apple and Google Wallet.
                </p>
                <ul className="space-y-2 mt-2">
                  {[
                    { icon: QrCode, label: "QR code scanning" },
                    { icon: Wallet, label: "Apple & Google Wallet" },
                    { icon: Users, label: "Customer management" },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Spin Wheel */}
            <div
              className="grid md:grid-cols-2 gap-0"
              style={{ borderBottom: `1px solid ${BORDER}` }}
              data-testid="card-product-spin"
            >
              <div className="p-10 flex flex-col gap-4 md:order-2" style={{ backgroundColor: "#080808" }}>
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5" style={{ color: GOLD }} />
                  <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>Spin-to-Win</h3>
                </div>
                <p className="text-white font-light text-lg leading-relaxed">
                  Run gamified promotions that keep customers excited and coming back for more.
                </p>
                <ul className="space-y-2 mt-2">
                  {[
                    { icon: Settings, label: "Customizable prizes & probabilities" },
                    { icon: QrCode, label: "QR code campaigns" },
                    { icon: BarChart3, label: "Real-time tracking" },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="p-10 flex items-center justify-center md:order-1"
                style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}
              >
                <div className="relative">
                  <div
                    className="w-44 h-44 rounded-full flex items-center justify-center relative overflow-hidden"
                    style={{ border: `2px solid ${GOLD_BORDER}` }}
                  >
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      {["rgba(201,168,76,0.12)", "rgba(201,168,76,0.06)", "rgba(201,168,76,0.09)", "rgba(201,168,76,0.15)"].map((bg, i) => (
                        <div key={i} style={{ backgroundColor: bg }} />
                      ))}
                    </div>
                    <div
                      className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: GOLD_DIM }}
                    >
                      <Gift className="w-7 h-7" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0"
                    style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `16px solid ${GOLD}` }}
                  />
                </div>
              </div>
            </div>

            {/* Menu Builder */}
            <div
              className="grid md:grid-cols-2 gap-0"
              style={{ borderBottom: `1px solid ${BORDER}` }}
              data-testid="card-product-menu"
            >
              <div
                className="p-10 flex items-center justify-center"
                style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-full max-w-xs rounded-lg overflow-hidden"
                  style={{ backgroundColor: "#080808", border: `1px solid ${BORDER}` }}
                >
                  <div className="h-20 flex items-center justify-center" style={{ backgroundColor: GOLD_DIM }}>
                    <UtensilsCrossed className="w-10 h-10" style={{ color: GOLD }} />
                  </div>
                  <div className="p-4 space-y-3">
                    {[["3/4", "1/2"], ["2/3", "1/3"]].map(([w1, w2], i) => (
                      <div key={i} className="space-y-1.5">
                        <div className={`h-2.5 rounded w-${w1}`} style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
                        <div className={`h-2 rounded w-${w2}`} style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-10 flex flex-col gap-4" style={{ backgroundColor: "#080808" }}>
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-5 h-5" style={{ color: GOLD }} />
                  <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>Digital Menus</h3>
                </div>
                <p className="text-white font-light text-lg leading-relaxed">
                  A beautiful QR menu your guests scan at the table — updated instantly, no printing needed.
                </p>
                <ul className="space-y-2 mt-2">
                  {["Beautiful mobile menus", "Instant QR code access", "Real-time updates"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Shift Manager */}
            <div className="grid md:grid-cols-2 gap-0" data-testid="card-product-shift">
              <div className="p-10 flex flex-col gap-4 md:order-2" style={{ backgroundColor: "#080808" }}>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: GOLD }} />
                  <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>Shift Manager</h3>
                </div>
                <p className="text-white font-light text-lg leading-relaxed">
                  Simple weekly scheduling for your crew, with a PIN-protected public schedule link.
                </p>
                <ul className="space-y-2 mt-2">
                  {["Weekly calendar view", "Crew management", "PIN-protected public access"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="p-10 flex items-center justify-center md:order-1"
                style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-full max-w-xs rounded-lg overflow-hidden"
                  style={{ backgroundColor: "#080808", border: `1px solid ${BORDER}` }}
                >
                  <div className="h-14 flex items-center justify-center" style={{ backgroundColor: GOLD_DIM }}>
                    <Calendar className="w-7 h-7" style={{ color: GOLD }} />
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-xs text-center" style={{ color: MUTED }}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[...Array(14)].map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-sm"
                          style={{ backgroundColor: i % 3 === 0 ? GOLD_DIM : "rgba(255,255,255,0.05)" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative container mx-auto max-w-2xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>Get started</p>
          <h2
            className="text-3xl md:text-5xl font-light text-white mb-6"
            data-testid="text-cta-title"
          >
            Ready to see it<br />in action?
          </h2>
          <p className="text-base font-light mb-10" style={{ color: MUTED }}>
            Try uniHub free for 3 days — no credit card required.
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
                <li><Link href="/pricing">Loyalty Cards</Link></li>
                <li><Link href="/pricing">Spin Wheel</Link></li>
                <li><Link href="/pricing">Menu Builder</Link></li>
                <li><Link href="/pricing">Shift Manager</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs tracking-[0.18em] uppercase mb-4" style={{ color: GOLD }}>Company</h5>
              <ul className="space-y-2.5 text-sm" style={{ color: MUTED }}>
                <li><Link href="/demo">Demo</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs tracking-[0.18em] uppercase mb-4" style={{ color: GOLD }}>Legal</h5>
              <ul className="space-y-2.5 text-sm" style={{ color: MUTED }}>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service">Terms of Service</Link></li>
                <li><Link href="/cookie-policy">Cookie Policy</Link></li>
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
