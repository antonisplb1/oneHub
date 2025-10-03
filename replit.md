# Merchant Engagement Platform

## Overview

This is a unified B2B SaaS platform that combines digital loyalty card programs and spin-to-win prize wheel campaigns into a single merchant dashboard. Business owners subscribe for €25/month to access both customer engagement tools. The platform serves two distinct user groups:

1. **Merchants** - Use a professional dashboard to manage loyalty programs, create spin wheel campaigns, track customer engagement, and view analytics
2. **Customers** - Interact via mobile devices to collect loyalty stamps, view their digital cards, and participate in spin-to-win promotions through QR code scanning

The application merges functionality from two separate apps into one cohesive platform with unified authentication, subscription management, and customer data sharing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety
- Vite as the build tool and dev server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system

**Design System:**
- Dual personality approach: Professional merchant dashboard + playful customer-facing experiences
- Color palette uses HSL CSS variables for theme flexibility (supports light/dark mode)
- Typography primarily uses Inter font family
- Custom CSS variables in `index.css` define elevation states (`--elevate-1`, `--elevate-2`) for hover/active interactions
- Spacing follows Tailwind's 4px grid system (units of 4, 6, 8, 12, 16)

**Component Organization:**
- UI components in `client/src/components/ui/` (shadcn/ui primitives)
- Feature components in `client/src/components/` (AuthPage, DashboardLayout, LoyaltyCardsSection, SpinWheelSection, etc.)
- Example components for development/testing in `client/src/components/examples/`
- Page components in `client/src/pages/`

**Routing Strategy:**
- Public routes: Landing page (`/`), Auth (`/auth`)
- Customer-facing routes: `/card/:customerId`, `/spin/:tokenId`, `/join/:userId`, `/in-store-spin/:userId`
- Protected dashboard routes: `/dashboard/*` with auth guards
- Dashboard subroutes: `/dashboard/loyalty`, `/dashboard/spin-wheel`, `/dashboard/settings`, etc.

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Passport.js for authentication with local strategy
- Session-based authentication using express-session with MemoryStore
- Drizzle ORM for database operations
- Neon serverless PostgreSQL as the database

**Authentication Flow:**
- Password hashing using Node.js crypto scrypt with salt
- Session cookies with 7-day expiration
- Secure cookies in production, httpOnly and sameSite settings
- User serialization/deserialization via Passport

**API Design:**
- RESTful endpoints under `/api/*`
- Authentication endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Loyalty endpoints: `/api/customers`, `/api/loyalty-cards`, `/api/loyalty-cards/:id/stamp`, `/api/loyalty-cards/:id/redeem`
- Spin wheel endpoints: `/api/rewards`, `/api/spin-tokens`, `/api/spin/:token`, `/api/spin-in-store/:userId`
- QR code generation endpoints for both features
- Middleware for route protection via `requireAuth` function

**Data Layer:**
- Drizzle schema in `shared/schema.ts` for type-safe database operations
- Zod schemas for request validation (signupSchema, loginSchema, createRewardSchema, etc.)
- Database migrations managed via Drizzle Kit in `/migrations`

### Database Schema

**Core Tables:**

1. **users** - Shop owners/merchants
   - Authentication credentials (email, passwordHash)
   - Shop information (shopName, logo)
   - Stripe integration (customerId, subscriptionId, subscriptionStatus, subscriptionEndsAt)

2. **customers** - End users who participate in loyalty/spin programs
   - Contact information (name, email, phone - all optional for privacy)
   - Unique QR code for identification (customerQrCode)
   - Foreign key to users table (userId)

3. **loyaltyCards** - Digital stamp cards
   - Progress tracking (stamps, maxStamps, isRedeemable)
   - Reward configuration (rewardText)
   - Metrics (totalRewards, lastStampAt)
   - Unique constraint on (userId, customerId) to prevent duplicates

4. **loyaltyTransactions** - Audit trail for stamps and redemptions
   - Type ('stamp' or 'reward')
   - Amount and timestamp

5. **rewards** - Prize wheel reward configurations
   - Reward details (name, winChance as percentage)
   - Foreign key to users table

6. **spinTokens** - One-time use tokens for spin-to-win
   - Token string and expiration
   - Usage tracking (used, usedAt)
   - Optional customer association

7. **spins** - Historical record of all spins
   - Links token, user, reward, and optional customer
   - Timestamp tracking

**Key Design Decisions:**
- UUID primary keys for all tables using PostgreSQL's `gen_random_uuid()`
- Cascade deletes to maintain referential integrity when merchants delete accounts
- Timestamps for audit trails and analytics
- Optional customer information to respect privacy while enabling personalization

### Payment Integration

**Stripe Integration:**
- Stripe JS and Stripe React components for frontend
- Subscription model at €25/month
- Customer and subscription IDs stored in users table
- Subscription status tracking (active/inactive)
- Subscription end date for grace period handling

**Considerations:**
- Webhooks would be needed for production to handle subscription updates
- Payment flow implementation details are referenced but not fully shown in codebase

### QR Code System

**Implementation:**
- QRCode library generates data URLs
- Two QR code types:
  1. **Loyalty QR** - Links to `/join/:userId` (merchant-specific signup) or `/card/:customerId` (existing customer card)
  2. **Spin QR** - Links to `/spin/:tokenId` (token-based) or `/in-store-spin/:userId` (unlimited merchant-specific)
- QR codes generated on-demand via API endpoints
- Base64 encoded images returned for display/download

## External Dependencies

### Third-Party Services

**Stripe Payment Processing:**
- Purpose: Subscription billing and payment management
- Integration: Client-side with `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Server-side with Stripe Node SDK
- API version: 2025-09-30.clover

**Neon Serverless PostgreSQL:**
- Purpose: Managed PostgreSQL database
- Integration: Via `@neondatabase/serverless` package with WebSocket support
- Connection pooling enabled
- DATABASE_URL environment variable required

### UI Component Libraries

**Radix UI:**
- Comprehensive set of unstyled, accessible UI primitives
- Components used: Dialog, Dropdown Menu, Popover, Tooltip, Accordion, Tabs, Select, and many more
- Provides keyboard navigation and ARIA attributes out of the box

**shadcn/ui:**
- Pre-styled Radix UI components with Tailwind CSS
- Configured via `components.json` with "new-york" style
- Components are copied into project rather than installed as dependencies
- Path aliases configured for easy imports (`@/components`, `@/lib`, `@/hooks`)

### Development Tools

**Replit-Specific Plugins:**
- `@replit/vite-plugin-runtime-error-modal` - Runtime error overlay
- `@replit/vite-plugin-cartographer` - Code navigation
- `@replit/vite-plugin-dev-banner` - Development environment indicator

**Build Tools:**
- Vite for frontend bundling and HMR
- esbuild for server-side bundling
- TypeScript compiler for type checking
- PostCSS with Tailwind and Autoprefixer

### Authentication & Session Management

**Passport.js:**
- Local strategy for username/password authentication
- Session serialization/deserialization
- Type extensions for Express user object

**Session Storage:**
- Development: MemoryStore from `memorystore` package
- Production consideration: Would need persistent session store (Redis, PostgreSQL) for scaling

### Validation & Type Safety

**Zod:**
- Runtime schema validation
- Type inference for TypeScript
- Integration with Drizzle via `drizzle-zod` for automatic schema generation from database models

**Utility Libraries:**
- nanoid - Unique token generation
- date-fns - Date manipulation and formatting
- class-variance-authority - Type-safe variant styling
- clsx & tailwind-merge - Conditional className composition