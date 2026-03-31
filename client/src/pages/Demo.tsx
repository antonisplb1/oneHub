import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  UserPlus, Settings, Rocket, TrendingUp,
  Award, Gift, UtensilsCrossed, Calendar,
  QrCode, Wallet, Users, BarChart3, ArrowRight, Minus, Coffee, Check,
} from "lucide-react";
import logoImage from "@assets/unihub-logo-transparent_1774625335894.png";

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.18)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

// ─── Loyalty Card Demo ────────────────────────────────────────────────────────
function LoyaltyDemo() {
  const [stamps, setStamps] = useState(7);
  const [redeemed, setRedeemed] = useState(false);
  const MAX = 10;
  const isComplete = stamps >= MAX;

  const addStamp = () => {
    if (!isComplete) setStamps(s => s + 1);
  };
  const redeem = () => {
    setRedeemed(true);
    setTimeout(() => { setStamps(0); setRedeemed(false); }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>The Golden Cup</p>
        <p className="text-sm font-light" style={{ color: MUTED }}>Sophie Martin's loyalty card</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-5"
        style={{ background: `linear-gradient(135deg, #1a1508 0%, #0f0a03 100%)`, border: `1px solid ${GOLD_BORDER}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.15em] uppercase" style={{ color: GOLD }}>Loyalty Reward</p>
            <p className="text-white font-medium mt-0.5">Free Coffee</p>
          </div>
          <Coffee className="w-6 h-6" style={{ color: GOLD }} />
        </div>

        {/* Stamps grid */}
        <div className="flex gap-2 flex-wrap">
          {[...Array(MAX)].map((_, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: i < stamps ? GOLD : "rgba(255,255,255,0.06)",
                border: i < stamps ? "none" : `1px solid rgba(255,255,255,0.1)`,
                transform: i === stamps - 1 && stamps > 0 ? "scale(1.15)" : "scale(1)",
              }}
            >
              {i < stamps && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: MUTED }}>{stamps} of {MAX} stamps</p>
          {isComplete && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: GOLD_DIM, color: GOLD }}
            >
              Reward ready!
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      {redeemed ? (
        <div className="text-sm font-medium" style={{ color: GOLD }}>Redeemed! New card started.</div>
      ) : isComplete ? (
        <Button
          onClick={redeem}
          className="text-sm font-medium px-8"
          style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
          data-testid="button-demo-redeem"
        >
          Redeem Free Coffee
        </Button>
      ) : (
        <Button
          onClick={addStamp}
          variant="outline"
          className="text-sm px-8"
          style={{ borderColor: GOLD_BORDER, color: GOLD, backgroundColor: "transparent" }}
          data-testid="button-demo-add-stamp"
        >
          + Add Stamp ({stamps}/{MAX})
        </Button>
      )}
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Click to simulate a stamp scan</p>
    </div>
  );
}

// ─── Spin Wheel Demo ──────────────────────────────────────────────────────────
const PRIZES = [
  { label: "Free Coffee",   short: "Coffee",  color: "#c9a84c" },
  { label: "10% Off",       short: "10% Off", color: "#7a5014" },
  { label: "Free Pastry",   short: "Pastry",  color: "#a87530" },
  { label: "Try Again",     short: "Try Again",color: "#1e1e1e" },
  { label: "20% Off",       short: "20% Off", color: "#8b6020" },
  { label: "Buy 1 Get 1",   short: "BOGO",    color: "#c9a84c" },
  { label: "€5 Voucher",    short: "€5 Off",  color: "#7a5014" },
  { label: "Free Upgrade",  short: "Upgrade", color: "#a87530" },
];

function SpinDemo() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const spinCount = useRef(0);

  const spin = () => {
    if (isSpinning) return;
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const segDeg = 360 / PRIZES.length;
    const currentNorm = ((rotation % 360) + 360) % 360;
    const targetOnWheel = prizeIndex * segDeg + segDeg / 2;
    const targetFinal = (360 - targetOnWheel + 360) % 360;
    let delta = targetFinal - currentNorm;
    if (delta <= 0) delta += 360;
    delta += 5 * 360;
    spinCount.current += 1;
    setIsSpinning(true);
    setResult(null);
    setRotation(prev => prev + delta);
    setTimeout(() => {
      setIsSpinning(false);
      setResult(PRIZES[prizeIndex].label);
    }, 3800);
  };

  const cx = 130, cy = 130, r = 118;
  const n = PRIZES.length;

  const segments = PRIZES.map((prize, i) => {
    const startRad = (i * (360 / n) - 90) * (Math.PI / 180);
    const endRad = ((i + 1) * (360 / n) - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const midRad = ((i + 0.5) * (360 / n) - 90) * (Math.PI / 180);
    const tr = r * 0.68;
    return {
      ...prize,
      path: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      tx: cx + tr * Math.cos(midRad),
      ty: cy + tr * Math.sin(midRad),
      textAngle: (i + 0.5) * (360 / n),
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="relative" data-testid="wheel-container">
        {/* Pointer */}
        <div
          className="absolute top-0 left-1/2 z-10"
          style={{
            transform: "translateX(-50%) translateY(-6px)",
            width: 0, height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `20px solid ${GOLD}`,
          }}
        />

        <svg
          width="260"
          height="260"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "transform 3.8s cubic-bezier(0.17, 0.67, 0.08, 1.0)" : "none",
            display: "block",
          }}
        >
          {segments.map((s, i) => (
            <g key={i}>
              <path d={s.path} fill={s.color} stroke="#080808" strokeWidth="2" />
              <text
                x={s.tx}
                y={s.ty}
                fill="rgba(255,255,255,0.85)"
                fontSize="9.5"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${s.textAngle}, ${s.tx}, ${s.ty})`}
              >
                {s.short}
              </text>
            </g>
          ))}
          <circle cx={cx} cy={cy} r="22" fill="#080808" />
          <circle cx={cx} cy={cy} r="18" fill={GOLD_DIM} stroke={GOLD_BORDER} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD_BORDER} strokeWidth="1.5" />
        </svg>
      </div>

      {result ? (
        <div
          className="px-5 py-3 rounded-lg text-center"
          style={{ backgroundColor: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
        >
          <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: MUTED }}>You won</p>
          <p className="text-lg font-medium" style={{ color: GOLD }} data-testid="text-spin-result">{result}</p>
        </div>
      ) : (
        <div style={{ height: 52 }} />
      )}

      <Button
        onClick={spin}
        disabled={isSpinning}
        className="text-sm font-medium px-10"
        style={{ backgroundColor: GOLD, color: "#080808", border: "none", opacity: isSpinning ? 0.6 : 1 }}
        data-testid="button-demo-spin"
      >
        {isSpinning ? "Spinning…" : spinCount.current === 0 ? "Spin the Wheel" : "Spin Again"}
      </Button>
    </div>
  );
}

// ─── Menu Demo ────────────────────────────────────────────────────────────────
const MENU = {
  Drinks: [
    { name: "Espresso",       price: "€2.50", desc: "Rich, bold single shot" },
    { name: "Flat White",     price: "€3.80", desc: "Double espresso with microfoam" },
    { name: "Oat Milk Latte", price: "€4.50", desc: "Espresso with creamy oat milk" },
    { name: "Cold Brew",      price: "€4.50", desc: "Slow-steeped 12 hr, over ice" },
    { name: "Matcha Latte",   price: "€4.50", desc: "Ceremonial grade matcha" },
  ],
  Breakfast: [
    { name: "Avocado Toast",  price: "€8.50",  desc: "Sourdough, smashed avocado, chilli" },
    { name: "Eggs Benedict",  price: "€11.50", desc: "Poached eggs, hollandaise" },
    { name: "Granola Bowl",   price: "€7.50",  desc: "Yogurt, house granola, berries" },
    { name: "Full Irish",     price: "€13.00", desc: "Bacon, egg, sausage, beans" },
  ],
  Pastries: [
    { name: "Butter Croissant", price: "€3.20", desc: "Freshly baked, light and flaky" },
    { name: "Almond Croissant", price: "€3.80", desc: "Filled with almond frangipane" },
    { name: "Chocolate Brownie",price: "€4.00", desc: "Fudgy dark chocolate, sea salt" },
    { name: "Cinnamon Roll",    price: "€4.20", desc: "Soft dough, vanilla glaze" },
  ],
};

function MenuDemo() {
  const categories = Object.keys(MENU) as Array<keyof typeof MENU>;
  const [active, setActive] = useState<keyof typeof MENU>("Drinks");

  return (
    <div className="flex flex-col gap-4 py-2 w-full max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs tracking-[0.2em] uppercase mb-0.5" style={{ color: GOLD }}>The Golden Cup</p>
        <p className="text-sm font-light" style={{ color: MUTED }}>Digital Menu</p>
      </div>

      {/* Category tabs */}
      <div
        className="flex rounded-md overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="flex-1 py-2 text-xs font-medium tracking-wide transition-all"
            style={{
              backgroundColor: active === cat ? GOLD_DIM : "transparent",
              color: active === cat ? GOLD : MUTED,
              borderRight: cat !== "Pastries" ? `1px solid ${BORDER}` : "none",
            }}
            data-testid={`button-menu-cat-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 240 }}>
        {MENU[active].map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 rounded-md"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
            data-testid={`item-menu-${i}`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-white">{item.name}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>{item.desc}</p>
            </div>
            <p className="text-sm font-light flex-shrink-0" style={{ color: GOLD }}>{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shift Demo ───────────────────────────────────────────────────────────────
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SAMPLE_SHIFTS = [
  { day: 0, name: "Alex T.",  role: "Barista",  start: "07:00", end: "15:00" },
  { day: 0, name: "Maria R.", role: "Manager",  start: "09:00", end: "17:00" },
  { day: 1, name: "Maria R.", role: "Manager",  start: "07:00", end: "15:00" },
  { day: 1, name: "Tom A.",   role: "Barista",  start: "15:00", end: "23:00" },
  { day: 2, name: "Sarah K.", role: "Barista",  start: "07:00", end: "15:00" },
  { day: 2, name: "Alex T.",  role: "Barista",  start: "12:00", end: "20:00" },
  { day: 3, name: "Tom A.",   role: "Barista",  start: "07:00", end: "15:00" },
  { day: 3, name: "Maria R.", role: "Manager",  start: "15:00", end: "23:00" },
  { day: 4, name: "Alex T.",  role: "Barista",  start: "07:00", end: "15:00" },
  { day: 4, name: "Sarah K.", role: "Barista",  start: "12:00", end: "20:00" },
  { day: 5, name: "Tom A.",   role: "Barista",  start: "10:00", end: "18:00" },
  { day: 6, name: "Sarah K.", role: "Barista",  start: "10:00", end: "18:00" },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function ShiftDemo() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const thisWeek = () => setWeekStart(getMonday(new Date()));

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`;

  return (
    <div className="flex flex-col gap-4 py-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>The Golden Cup</p>
          <p className="text-sm font-light" style={{ color: MUTED }}>Weekly Schedule</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={thisWeek}
            className="text-xs px-2 py-1 rounded border transition-colors"
            style={{ borderColor: BORDER, color: MUTED, backgroundColor: "transparent" }}
            data-testid="button-demo-this-week"
          >
            This Week
          </button>
          <button
            onClick={prevWeek}
            className="px-2 py-1 rounded border transition-colors"
            style={{ borderColor: BORDER, color: MUTED }}
            data-testid="button-demo-prev-week"
          >
            ‹
          </button>
          <span className="text-xs px-1" style={{ color: MUTED }}>{weekLabel}</span>
          <button
            onClick={nextWeek}
            className="px-2 py-1 rounded border transition-colors"
            style={{ borderColor: BORDER, color: MUTED }}
            data-testid="button-demo-next-week"
          >
            ›
          </button>
        </div>
      </div>

      {/* 7-column day grid */}
      <div className="overflow-x-auto">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, minmax(88px, 1fr))", minWidth: 560 }}>
          {WEEK_DAYS.map((day, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const shifts = SAMPLE_SHIFTS.filter(s => s.day === i);
            const isToday = formatShortDate(date) === formatShortDate(new Date());

            return (
              <div key={day} className="flex flex-col gap-1.5" data-testid={`demo-day-${i}`}>
                {/* Day header */}
                <div className="mb-1">
                  <div
                    className="text-xs font-semibold"
                    style={{ color: isToday ? GOLD : "white" }}
                  >
                    {day}
                  </div>
                  <div className="text-xs" style={{ color: MUTED }}>
                    {formatShortDate(date)}
                  </div>
                </div>

                {/* Shift cards */}
                {shifts.length === 0 ? (
                  <div className="text-xs py-3 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                    —
                  </div>
                ) : (
                  shifts.map((shift, si) => (
                    <div
                      key={si}
                      className="rounded p-2 flex flex-col gap-0.5"
                      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                      data-testid={`demo-shift-${i}-${si}`}
                    >
                      <div className="text-xs font-semibold text-white truncate">{shift.name}</div>
                      <div className="text-xs truncate" style={{ color: MUTED }}>{shift.role}</div>
                      <div className="text-xs font-medium mt-0.5" style={{ color: GOLD }}>
                        {shift.start} – {shift.end}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
        Read-only view — staff access the schedule via a PIN-protected link
      </p>
    </div>
  );
}

// ─── Interactive Demo Container ───────────────────────────────────────────────
const TABS = [
  { id: "loyalty", label: "Loyalty Cards", icon: Award },
  { id: "spin",    label: "Spin Wheel",    icon: Gift },
  { id: "menu",    label: "Menu",          icon: UtensilsCrossed },
  { id: "shifts",  label: "Shifts",        icon: Calendar },
] as const;

type TabId = typeof TABS[number]["id"];

function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<TabId>("loyalty");

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
      data-testid="interactive-demo"
    >
      {/* Tab bar */}
      <div
        className="flex border-b"
        style={{ borderColor: BORDER, backgroundColor: "#0d0d0d" }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium tracking-wide transition-all"
            style={{
              color: activeTab === id ? GOLD : MUTED,
              borderBottom: activeTab === id ? `2px solid ${GOLD}` : "2px solid transparent",
              backgroundColor: activeTab === id ? "rgba(201,168,76,0.05)" : "transparent",
            }}
            data-testid={`tab-demo-${id}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="px-6 pb-8 pt-4" style={{ minHeight: 380 }}>
        {activeTab === "loyalty" && <LoyaltyDemo />}
        {activeTab === "spin"    && <SpinDemo />}
        {activeTab === "menu"    && <MenuDemo />}
        {activeTab === "shifts"  && <ShiftDemo />}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
      <section className="relative px-6 py-20 md:py-32 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative container mx-auto max-w-4xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>
            Live Preview
          </p>
          <h1
            className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight"
            data-testid="text-demo-hero-title"
          >
            Try the features<br />before you subscribe.
          </h1>
          <p className="text-lg font-light mb-12 max-w-2xl mx-auto" style={{ color: MUTED }}>
            Click through all four tools below with real sample data — no login required.
          </p>

          {/* Interactive Demo */}
          <InteractiveDemo />

          <div className="mt-8">
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
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="border-t" style={{ borderColor: BORDER }} />

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-6" style={{ backgroundColor: SURFACE }}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>Process</p>
            <h2 className="text-3xl md:text-4xl font-light text-white" data-testid="text-how-it-works-title">
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
              <div key={n} className="p-8 flex flex-col gap-5" style={{ backgroundColor: "#080808" }} data-testid={testid}>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: GOLD_DIM }}>
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
            <h2 className="text-3xl md:text-4xl font-light text-white" data-testid="text-product-highlights-title">
              Your complete engagement toolkit.
            </h2>
          </div>
          <div className="space-y-px" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            {/* Loyalty Cards */}
            <div className="grid md:grid-cols-2 gap-0" style={{ borderBottom: `1px solid ${BORDER}` }} data-testid="card-product-loyalty">
              <div className="p-10 flex items-center justify-center" style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}>
                <div className="w-full max-w-xs rounded-lg p-6 flex flex-col gap-4" style={{ backgroundColor: "#080808", border: `1px solid ${GOLD_BORDER}` }}>
                  <div className="text-xs tracking-[0.1em] uppercase" style={{ color: MUTED }}>Coffee Shop Rewards</div>
                  <div className="text-white font-light">Customer Name</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full" style={{ backgroundColor: i < 7 ? GOLD : "rgba(201,168,76,0.15)" }} />
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
                <p className="text-white font-light text-lg leading-relaxed">Reward repeat customers with digital stamp cards that live in Apple and Google Wallet.</p>
                <ul className="space-y-2 mt-2">
                  {[{ icon: QrCode, label: "QR code scanning" }, { icon: Wallet, label: "Apple & Google Wallet" }, { icon: Users, label: "Customer management" }].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />{label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Spin Wheel */}
            <div className="grid md:grid-cols-2 gap-0" style={{ borderBottom: `1px solid ${BORDER}` }} data-testid="card-product-spin">
              <div className="p-10 flex flex-col gap-4 md:order-2" style={{ backgroundColor: "#080808" }}>
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5" style={{ color: GOLD }} />
                  <h3 className="text-sm tracking-[0.15em] uppercase" style={{ color: GOLD }}>Spin-to-Win</h3>
                </div>
                <p className="text-white font-light text-lg leading-relaxed">Run gamified promotions that keep customers excited and coming back for more.</p>
                <ul className="space-y-2 mt-2">
                  {[{ icon: Settings, label: "Customizable prizes & probabilities" }, { icon: QrCode, label: "QR code campaigns" }, { icon: BarChart3, label: "Real-time tracking" }].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />{label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-10 flex items-center justify-center md:order-1" style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}>
                <div className="relative">
                  <div className="w-44 h-44 rounded-full flex items-center justify-center relative overflow-hidden" style={{ border: `2px solid ${GOLD_BORDER}` }}>
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      {["rgba(201,168,76,0.12)", "rgba(201,168,76,0.06)", "rgba(201,168,76,0.09)", "rgba(201,168,76,0.15)"].map((bg, i) => (
                        <div key={i} style={{ backgroundColor: bg }} />
                      ))}
                    </div>
                    <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD_DIM }}>
                      <Gift className="w-7 h-7" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0" style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `16px solid ${GOLD}` }} />
                </div>
              </div>
            </div>
            {/* Menu Builder */}
            <div className="grid md:grid-cols-2 gap-0" style={{ borderBottom: `1px solid ${BORDER}` }} data-testid="card-product-menu">
              <div className="p-10 flex items-center justify-center" style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}>
                <div className="w-full max-w-xs rounded-lg overflow-hidden" style={{ backgroundColor: "#080808", border: `1px solid ${BORDER}` }}>
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
                <p className="text-white font-light text-lg leading-relaxed">A beautiful QR menu your guests scan at the table — updated instantly, no printing needed.</p>
                <ul className="space-y-2 mt-2">
                  {["Beautiful mobile menus", "Instant QR code access", "Real-time updates"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />{f}
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
                <p className="text-white font-light text-lg leading-relaxed">Simple weekly scheduling for your crew, with a PIN-protected public schedule link.</p>
                <ul className="space-y-2 mt-2">
                  {["Weekly calendar view", "Crew management", "PIN-protected public access"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-10 flex items-center justify-center md:order-1" style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}>
                <div className="w-full max-w-xs rounded-lg overflow-hidden" style={{ backgroundColor: "#080808", border: `1px solid ${BORDER}` }}>
                  <div className="h-14 flex items-center justify-center" style={{ backgroundColor: GOLD_DIM }}>
                    <Calendar className="w-7 h-7" style={{ color: GOLD }} />
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <div key={i} className="text-xs text-center" style={{ color: MUTED }}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[...Array(14)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-sm" style={{ backgroundColor: i % 3 === 0 ? GOLD_DIM : "rgba(255,255,255,0.05)" }} />
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
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
        <div className="relative container mx-auto max-w-2xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: GOLD }}>Get started</p>
          <h2 className="text-3xl md:text-5xl font-light text-white mb-6" data-testid="text-cta-title">
            Ready to see it<br />in action?
          </h2>
          <p className="text-base font-light mb-10" style={{ color: MUTED }}>Try uniHub free for 3 days — no credit card required.</p>
          <Link href="/auth">
            <Button size="lg" className="text-sm px-10 tracking-wide font-medium" style={{ backgroundColor: GOLD, color: "#080808", border: "none" }} data-testid="button-final-cta">
              Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <div className="flex gap-8 justify-center flex-wrap mt-6 text-xs" style={{ color: MUTED }}>
            <span>3-day free trial</span><span>·</span><span>No credit card</span><span>·</span><span>Cancel anytime</span>
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
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>One hub for every venue. Loyalty, menus, spin campaigns, and team management.</p>
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
