# Design Guidelines: Elegant Merchant Engagement Platform

## Design Approach

**Reference Blend**: Stripe's refined professionalism + Linear's pristine minimalism + Notion's approachable sophistication

**Justification**: Premium B2B SaaS requiring sophisticated merchant dashboard that commands €25/month value while maintaining playful customer interactions. Design must convey quality, trust, and polish.

## Core Design Principles

1. **Refined Elegance**: Generous whitespace, subtle depth, premium feel
2. **Sophisticated Dual Nature**: Professional merchant tools + delightful customer experiences
3. **Visual Restraint**: Muted palette with purposeful color moments
4. **Quality Signaling**: Every detail communicates premium value

## Color Palette

### Merchant Dashboard (Sophisticated)
- **Primary**: 220 10% 25% (refined charcoal) - authority, professionalism
- **Accent**: 215 15% 55% (muted slate blue) - trust without loudness
- **Success**: 155 40% 48% (sage green) - growth, subtle celebration
- **Background Dark**: 220 8% 12% (deep sophisticated slate)
- **Surface Dark**: 220 7% 17% (elevated surface)
- **Background Light**: 210 20% 98% (warm off-white)
- **Surface Light**: 0 0% 100% (pure white cards)
- **Border**: 220 10% 88% (light) / 220 10% 22% (dark)
- **Text Primary**: 220 10% 20% (light) / 220 5% 95% (dark)
- **Text Secondary**: 220 8% 48% (both modes)

### Customer Interface (Playful Elegance)
- **Spin Accent**: 270 55% 62% (sophisticated purple) - excitement with refinement
- **Reward Gold**: 40 75% 58% (warm champagne gold) - achievement
- **Celebration**: 320 60% 65% (elegant pink) - delight moments

## Typography

**Fonts**:
- **Headlines**: Outfit (600-700 weight) - refined, geometric, premium
- **UI/Body**: Inter (400-500 weight) - clarity, professionalism
- **Numbers/Data**: Tabular nums variant of Inter

**Hierarchy**:
- Dashboard Hero: text-4xl (36px), tracking-tight
- Section Headers: text-2xl (24px), font-semibold
- Card Titles: text-lg (18px), font-medium
- Body: text-base (16px), leading-relaxed
- Captions: text-sm (14px), text-secondary

## Layout System

**Spacing Scale**: Units of **6, 8, 12, 16, 20, 24** for generous breathing room

**Container Strategy**:
- Dashboard max-width: 1400px
- Content sections: generous padding (px-8 md:px-12 lg:px-16)
- Card internal: p-8 to p-10
- Section vertical: py-16 to py-24

**Grid Structure**:
- Sidebar: 280px fixed width with subtle border-right
- Main content: fluid with max-width constraints
- Metrics: 3-column (lg) / 2-column (md) / 1-column (sm)
- Feature grids: Generous gap-8 to gap-10

## Component Library

### Merchant Dashboard

**Navigation**:
- Elegant sidebar with shop logo, subtle dividers between nav groups
- Active state: soft background (220 15% 20% dark / 220 20% 95% light) with refined border-left accent
- Icon + label pairs with generous padding (py-3 px-4)
- Hover: subtle background shift

**Elevated Cards**:
- Rounded: rounded-2xl for premium feel
- Shadow: Subtle layered shadows (shadow-sm with border, hover: shadow-md)
- Background: Surface colors (white light / elevated dark)
- Border: 1px subtle for definition
- Padding: p-8 for spaciousness

**Data Presentation**:
- Metric cards: Large numbers (text-3xl), label below (text-sm text-secondary)
- Tables: Generous row height (py-4), zebra striping subtle, hover background shift
- Charts: Muted color palette, refined axis labels
- Status badges: Rounded-full, subtle backgrounds, uppercase text-xs

**QR Elements**:
- Centered in elevated card with ample padding (p-12)
- Descriptive label above (text-sm text-secondary)
- Download button below (outline variant with icon)

### Customer-Facing

**Spin Wheel Interface**:
- Premium gradient background (270 to 320 degrees, low saturation)
- Wheel: Large (80% viewport, max 420px), smooth shadows
- Prizes: Icon + text with refined spacing
- Spin button: Large rounded-full, gradient, sophisticated glow (not garish)
- Win state: Elegant confetti with gold/purple palette, smooth fade

**Digital Loyalty Card**:
- Card metaphor: rounded-3xl, layered shadow for depth
- Shop branding: Logo centered top with generous margin
- Stamp grid: Max 10 in elegant 2-row layout, gap-6
- Empty stamps: Dashed circle (border-2), refined gray
- Filled stamps: Solid with subtle scale animation, checkmark or brand icon
- Progress: Elegant progress bar or "7/10" with refined typography
- Reward CTA: Prominent when unlocked, sophisticated color treatment

## Landing Page Structure

**Hero** (85vh, not forced):
- Two-column split: 45% compelling copy / 55% premium dashboard screenshot
- Headline: "Elevate Customer Loyalty" (text-6xl, Outfit font, tracking-tight)
- Subheadline: Refined explanation (text-xl, text-secondary, leading-relaxed)
- CTA pair: Primary "Start 14-Day Trial" + outline "Watch Demo"
- Background: Subtle gradient wash (blue-gray undertones, very low opacity)
- **Hero Image**: Polished dashboard screenshot showing unified interface - loyalty cards panel on left, spin wheel customization on right, with elegant spacing and real data. Professional lighting, subtle depth shadows.

**Value Proposition** (py-24, 3-column):
- Feature cards with generous padding (p-10)
- Icons: Lucide React (award, target, bar-chart-3) in accent color
- Feature 1: "Premium Loyalty Programs" - sophisticated stamp mechanics
- Feature 2: "Engaging Spin Campaigns" - gamified promotions
- Feature 3: "Unified Analytics" - elegant insights dashboard
- Supporting images: Mobile phone showing customer card view (320px width), merchant scanning interface, colorful spin wheel UI

**How It Works** (py-20, 3-step horizontal):
- Numbered cards (01, 02, 03) with refined typography
- Step flow: Setup → Customer Engagement → Growth Analytics
- Elegant icons and concise descriptions

**Social Proof** (py-16):
- Testimonial cards: 2-column, elevated style, merchant photos
- Trust indicators: "500+ Merchants" / "50k+ Customers Engaged"
- Merchant logos: Grayscale with subtle spacing

**Pricing** (py-24):
- Single plan centered, elevated card design (max-w-md)
- €25/month in large refined typography
- Feature checklist with checkmark icons
- Highlighted features: Unlimited customers, both tools, priority support
- Strong CTA: "Start Free Trial"

**Footer** (py-16):
- Multi-column: Product links, Company info, Resources, Legal
- Newsletter signup: Refined input + button combo
- Social links: Icon buttons with subtle hover states

## Images

**Landing Page**:
- **Hero**: Full dashboard interface (1200x800px) showing professional merchant view with both loyalty management and spin wheel features visible, modern UI with subtle shadows
- **Features**: Three supporting visuals (400x300px each) - mobile loyalty card, QR scanning moment, vibrant spin wheel
- **Social Proof**: Merchant headshots (80x80px, rounded-full)

**Dashboard**:
- Default shop logo: Elegant placeholder with initials
- Empty states: Refined illustrations (not cartoonish)
- Reward icons: Sophisticated emoji or icon set

## Shadows & Depth

**Layered Shadow System**:
- Cards: `shadow-sm` (subtle) with 1px border for definition
- Hover: `shadow-md` (gentle elevation)
- Modals: `shadow-xl` (clear separation)
- Never harsh or heavy shadows - always refined and purposeful

## Animations

**Merchant Dashboard**: Refined, subtle
- Card hover: translateY(-2px) + shadow transition (200ms)
- Button interactions: Scale(0.98) on press
- Page transitions: Fade + subtle slide (250ms)

**Customer Experience**: Delightful, smooth
- Spin wheel: Smooth rotation with elegant easing (2s)
- Win celebration: Sophisticated confetti (gold/purple), fade out
- Stamp addition: Gentle scale pop (0.95 → 1.05 → 1)
- All animations: <400ms, respect reduced-motion

## Responsive Strategy

- **Desktop (1024px+)**: Full sidebar, 3-column grids, spacious padding
- **Tablet (768-1023px)**: Collapsible sidebar, 2-column, reduced spacing
- **Mobile (<768px)**: Bottom nav, single column, card stack, touch-optimized targets (min 44px)

## Accessibility

- WCAG AA contrast ratios minimum (AAA preferred for body text)
- Dark mode: Fully implemented with consistent form styling
- Focus rings: 2px accent with offset for clarity
- Keyboard navigation: All interactive elements accessible
- Screen reader: Proper ARIA labels on icon buttons and status indicators