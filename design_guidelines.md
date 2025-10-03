# Design Guidelines: Unified Merchant Engagement Platform

## Design Approach

**Reference-Based Approach**: Blend of Linear's clean dashboard efficiency + Stripe's professional SaaS aesthetic + Airbnb's approachable warmth

**Justification**: This is a utility-focused B2B SaaS platform where merchants need efficient tools to manage both loyalty programs and promotional campaigns. The design should inspire confidence and professionalism while remaining approachable for small business owners.

## Core Design Principles

1. **Dual Personality**: Professional merchant dashboard + playful customer-facing experiences
2. **Feature Clarity**: Both loyalty and spin features clearly accessible without overwhelming
3. **Trust & Credibility**: Clean, modern design that justifies €25/month subscription value
4. **Mobile-First Customer Experience**: Customers primarily interact via mobile (scanning QR, spinning wheels, viewing cards)

## Color Palette

### Merchant Dashboard (Professional)
- **Primary**: 220 70% 50% (deep blue) - trust, stability, professional
- **Accent**: 142 70% 45% (emerald green) - success, growth, rewards
- **Background Dark**: 220 15% 10% (deep slate)
- **Background Light**: 0 0% 98% (off-white)
- **Text**: 220 10% 20% (charcoal) for light mode, 0 0% 95% for dark

### Customer Interface (Engaging)
- **Primary**: Same blue for brand consistency
- **Accent Vibrant**: 280 60% 60% (playful purple) for spin wheel, celebrations
- **Reward Gold**: 45 90% 55% (warm gold) for stamp achievements
- **Success**: 142 70% 45% (matching merchant accent)

## Typography

**Fonts**: 
- **Headlines**: Inter (bold, 700-800 weight) - modern, professional, excellent readability
- **Body**: Inter (regular, 400-500 weight)
- **Display/Marketing**: Outfit (for landing page hero) - friendly, approachable

**Scale**:
- Hero/H1: text-5xl to text-6xl (48-60px)
- H2 Dashboard: text-3xl (30px)
- H3 Sections: text-2xl (24px)
- Body: text-base (16px)
- Captions: text-sm (14px)

## Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16** for consistency
- Tight spacing: p-4, gap-4 (cards, buttons)
- Standard spacing: p-6, gap-6 (sections, containers)
- Generous spacing: p-8 to p-16 (page sections, hero)

**Grid Structure**:
- Dashboard: 12-column grid with sidebar (1/5 width) + main content (4/5 width)
- Feature cards: 2-column on desktop, 1-column mobile
- Analytics: 3-column metric cards on desktop

## Component Library

### Merchant Dashboard Components

**Navigation Sidebar**:
- Fixed left sidebar (260px width)
- Shop logo/name at top
- Primary nav: Dashboard, Loyalty Cards, Spin Wheel, Customers, Analytics, Settings
- Secondary: Billing, Support
- Active state: subtle background with accent border-left

**Dashboard Cards**:
- White background (light mode) / 220 15% 15% (dark)
- Rounded corners: rounded-xl
- Shadow: shadow-sm with subtle border
- Padding: p-6
- Hover: subtle lift with shadow-md transition

**Data Tables**:
- Striped rows for readability
- Hover states: background highlight
- Action buttons: icon-only (pencil, trash) with tooltips
- Pagination: centered bottom

**QR Code Displays**:
- Centered in card
- Download/Share buttons below
- Label above explaining purpose

### Customer-Facing Components

**Spin Wheel**:
- Vibrant gradient background (purple to blue)
- Large, centered wheel (70% viewport width, max 400px)
- Prizes with emojis + text
- Animated pointer at top
- Spin button: large, rounded-full, gradient, pulsing glow
- Celebration confetti animation on win

**Loyalty Card**:
- Card-like container with rounded-2xl
- Shop logo at top center
- Stamp grid: max 10 stamps in 2 rows
- Empty stamps: dashed border circles
- Filled stamps: solid with checkmark or coffee icon
- Progress indicator: "7/10 stamps"
- Reward text highlighted when redeemable

**Mobile QR Scanner** (for merchants):
- Full-screen camera view
- Overlay frame showing scan area
- Instructions at top
- Manual entry option below camera

## Landing Page Design

**Hero Section** (80vh):
- Split layout: 50% text + 50% mockup/screenshot
- Large headline: "Boost Customer Loyalty & Engagement"
- Subheadline: "All-in-one platform for digital stamp cards and prize wheels"
- Dual CTA: "Start Free Trial" (primary) + "View Demo" (outline)
- Background: subtle gradient (blue to purple, low opacity)
- **Image**: Dashboard mockup showing both loyalty and spin features side-by-side

**Features Section** (3-column grid):
- Icons: from Lucide React (award, gift, trending-up)
- Feature 1: "Digital Loyalty Cards" - stamp collection, rewards
- Feature 2: "Prize Wheel Campaigns" - spin tokens, promotions
- Feature 3: "Unified Dashboard" - all tools in one place

**How It Works** (3-step process):
- Step cards with numbers
- Icons showing: 1) Setup account 2) Customers scan QR 3) Track engagement

**Pricing** (single plan):
- €25/month card centered
- Feature checklist: unlimited customers, both features, analytics, support
- Single prominent CTA

**Social Proof** (if available):
- Testimonial cards or merchant logos
- Stats: "X merchants trust us" or "X rewards redeemed"

**Footer**:
- Links: About, Features, Pricing, Support, Terms, Privacy
- Newsletter signup (optional)
- Social icons

## Images

**Landing Page**:
- **Hero Image**: Professional dashboard screenshot showing split view - left half displays loyalty card management with stamp grid, right half shows spin wheel customization. Should look crisp, modern, with subtle UI glow effects. Position: right 50% of hero section.
- **Feature Section**: Three supporting images - 1) Mobile phone showing customer loyalty card view, 2) Merchant tablet scanning QR code, 3) Colorful spinning wheel interface. Small, accent images within feature cards.

**Dashboard**:
- Shop logo placeholders (if no logo uploaded)
- Default reward icons/emojis
- Empty state illustrations (when no customers/campaigns yet)

## Animations

**Merchant Dashboard**: Minimal, professional
- Card hover: subtle lift (translateY -2px)
- Button press: scale(0.98)
- Page transitions: fade-in (200ms)

**Customer Interface**: Engaging, celebratory
- Spin wheel: smooth rotation with easing
- Win celebration: confetti burst, scale pulse
- Stamp collection: satisfying "pop" when stamp added
- Reward unlocked: gold shimmer effect

**General**: All animations should be <300ms, respect prefers-reduced-motion

## Responsive Behavior

**Desktop** (1024px+): Full sidebar, multi-column grids, tables
**Tablet** (768-1023px): Collapsible sidebar, 2-column grids
**Mobile** (<768px): Bottom nav bar, single column, full-width cards, stack everything vertically

## Accessibility

- Dark mode fully implemented across all screens
- Form inputs maintain consistent styling in dark mode
- High contrast ratios (WCAG AA minimum)
- Focus indicators: 2px accent ring
- Skip navigation links
- Screen reader labels on icon buttons
- Keyboard navigation for all interactive elements