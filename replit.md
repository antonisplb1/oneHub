# uniHub - Merchant Engagement Platform

## Overview

uniHub is a B2B SaaS platform offering digital loyalty card programs and spin-to-win campaigns to merchants through a unified dashboard. Merchants choose which products to subscribe to: Loyalty Cards (€15/month), Spin Wheel (€10/month), or Both (€20/month bundled). The platform provides tools for managing loyalty, creating spin campaigns, tracking customer engagement, and viewing analytics. Customers interact via mobile devices to collect loyalty stamps, use QR codes for merchant scanning, and participate in spin-to-win promotions, with optional integration into Apple Wallet or Google Wallet. The platform consolidates functionality from previously separate applications, providing unified authentication, subscription management, and shared customer data.

## Recent Changes (October 2025)

### Customer Notification Messaging (October 2025)
Push notification system for merchants to send messages to loyalty card customers via Google Wallet:

**Features:**
- Dialog popup UI in Loyalty Cards section (Shop QR Code tab) for sending notifications
- Accessed via "Send Notification" button next to "Download QR Code" button
- Message fields: Header (optional), Body (required), Display Start/End Times (required)
- All times based on merchant's local timezone
- Message type: TEXT_AND_NOTIFY (triggers push notifications to customer devices)
- Messages saved to database for history tracking with recipient count

**Implementation:**
- New `messages` table in database schema
- Backend endpoint: POST /api/messages (requires auth + subscription)
- Google Wallet API integration via loyaltyclass.addmessage endpoint
- Frontend dialog in LoyaltyCardsSection component with validation, loading states, and success/error toasts
- Sends to all customers who have added merchant's loyalty card to Google Wallet

**Rate Limits:**
- Google Wallet API: Maximum 3 push notifications per 24 hours per loyalty class
- Exceeding limit returns QuotaExceededException

**Technical Notes:**
- Messages include displayInterval with start/end timestamps in ISO 8601 format
- Recipients must have Google Wallet notifications enabled
- Hyperlinks allowed in message body (must be related to the pass per Google's Acceptable Use Policy)
- Push notification appearance controlled by Google Wallet

### Anti-Spam Security System (Production Ready)
Three-layer security implementation to prevent spam registrations:

**Phase 1 - Rate Limiting:**
- Express rate-limit middleware on signup endpoint
- 5 failed attempts per 15 minutes per IP
- Trust proxy configured for single hop (prevents IP spoofing)
- Only counts failed signup attempts (skipSuccessfulRequests: true)
- Returns 429 status with clear error message when limit exceeded

**Phase 2 - Cloudflare Turnstile CAPTCHA:**
- Frontend widget integrated in signup form
- Backend verification with Cloudflare API
- Environment-aware security:
  - Production: Strict CAPTCHA enforcement required
  - Development: Allows missing tokens (for testing flexibility)
- User-friendly error messaging for domain restrictions
- Requires TURNSTILE_SECRET_KEY and VITE_TURNSTILE_SITE_KEY in production

**Phase 3 - Automated Cleanup:**
- Scheduled cron job runs daily at 2:00 AM
- Removes unverified accounts older than 48 hours
- Preserves recent unverified and all verified accounts
- Tested and verified with manual test harness

**Configuration Notes:**
- Trust proxy set to 1 (trusts only Replit's proxy layer)
- Turnstile widget may show "Invalid domain" in development unless Replit domain whitelisted in Cloudflare
- All security layers tested and architect-approved for production deployment

### Email Verification System
- Implemented complete email verification flow with Resend integration
- Users must verify their email before accessing the platform
- Verification tokens expire after 24 hours
- Verification email sent automatically upon registration
- Email verification page at `/verify-email/:token`
- Resend verification endpoint available at `/api/auth/resend-verification`

### Password Reset System
- Complete forgot password and reset password flow
- Password reset tokens expire after 1 hour
- Forgot password page at `/forgot-password`
- Reset password page at `/reset-password/:token`
- Backend endpoints: `/api/auth/forgot-password` and `/api/auth/reset-password`

### Flexible Product Selection & Pricing
Three subscription tiers with flexible product selection:
1. **Loyalty Cards Only**: €15/month - Access to loyalty cards and QR scanner features
2. **Spin Wheel Only**: €10/month - Access to spin-to-win campaign features  
3. **Both Products (Bundle)**: €20/month - Full access to all features with €5/month savings

**Product Selection Flow:**
- After email verification, users are directed to `/select-products` page
- Users choose products before subscribing (mandatory step)
- Product changes can be made post-subscription via Settings page
- Stripe automatically handles proration when products are changed
- Dashboard menu dynamically filters to show only relevant features

**Dynamic Dashboard Menu:**
- Menu items are filtered based on `selectedProducts` array
- Always visible: Dashboard, Customers, Analytics, Settings
- Loyalty-only items: Loyalty Cards, QR Scanner (requires 'loyalty' in selectedProducts)
- Spin-only items: Spin Wheel (requires 'spin' in selectedProducts)
- Real-time menu updates when products are changed

### Updated Registration & Authentication Flow
1. User registers → receives verification email (no immediate Stripe redirect)
2. User clicks verification link → email marked as verified, Stripe customer created
3. User selects products → redirected to `/select-products` page (mandatory)
4. User continues → redirected to `/subscription-required` with dynamic pricing
5. User subscribes via Stripe checkout → gains dashboard access with filtered menu
6. User can modify product selection in Settings → Stripe updates subscription with proration

### Database Schema Updates
Added to users table:
- `emailVerified` (boolean, default false)
- `verificationToken` (varchar, nullable)
- `verificationTokenExpiry` (timestamp, nullable)
- `resetPasswordToken` (varchar, nullable)
- `resetPasswordExpiry` (timestamp, nullable)
- `selectedProducts` (text array, stores 'loyalty' and/or 'spin')

### Authentication Middleware
- `requireAuth` middleware checks session authentication
- `requireSubscription` middleware checks both `emailVerified` and `subscriptionStatus === 'active'`
- Dashboard routes protected by both middleware layers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React, TypeScript, and Vite**, utilizing **Wouter** for routing and **TanStack Query** for server state management. **shadcn/ui** (based on Radix UI) and **Tailwind CSS** define the UI, following a dual personality design: professional for merchants and playful for customers, with a flexible HSL-based color palette and Inter font family. Components are organized into UI primitives, feature-specific components, and page components. Routing includes public, customer-facing, and protected dashboard routes with authentication guards.

### Backend Architecture

The backend uses **Express.js with TypeScript**, **Passport.js** for session-based authentication, and **Drizzle ORM** for database interactions with **Neon serverless PostgreSQL**. Authentication involves `scrypt` for password hashing and secure, httpOnly session cookies. The API follows a RESTful design under `/api/*`, covering authentication, loyalty, customer management, QR code generation, logo serving, wallet integrations, and spin wheel functionalities. Data validation is enforced using **Zod schemas**, and database migrations are managed with Drizzle Kit.

### Database Schema

The core database schema includes tables for `users` (merchants), `customers`, `loyaltyCards`, `loyaltyTransactions`, `rewards`, `spinTokens`, and `spins`. Key design decisions include UUID primary keys, cascade deletes for referential integrity, and timestamps for audit trails. Customer information is kept optional for privacy.

The `users` table tracks product selections via the `selectedProducts` text array field, which stores 'loyalty' and/or 'spin' values to determine feature access and pricing.

### Payment Integration

**Stripe** is integrated for flexible subscription billing with three pricing tiers based on selected products:
- Loyalty Cards only: €15/month
- Spin Wheel only: €10/month  
- Both products (bundle): €20/month

Stripe products are created programmatically with helper functions managing the three product options. When users change their product selection post-subscription, Stripe automatically handles proration. Frontend uses `@stripe/stripe-js` and `@stripe/react-stripe-js`, while the backend uses the Stripe Node SDK.

### QR Code System

Three types of QR codes are generated: Merchant Join QR (for customer signup), Customer Loyalty QR (for merchant scanning stamps), and Spin Wheel QR (for customer spin-to-win). A camera-based scanner is available in the merchant dashboard for real-time QR code scanning to award stamps. Customer-initiated spins are tracked, while merchant-operated in-store spins are not saved to the database.

### Digital Wallet Integration

Buttons for **Apple Wallet** and **Google Wallet** are present on customer loyalty cards, with placeholder endpoints ready for full integration once necessary credentials are configured.

## External Dependencies

### Third-Party Services

-   **Stripe Payment Processing**: For subscription billing using client-side `@stripe/stripe-js` and `@stripe/react-stripe-js`, and server-side Stripe Node SDK.
-   **Neon Serverless PostgreSQL**: Managed database accessed via `@neondatabase/serverless` for WebSocket-supported connections.
-   **Resend**: Transactional email service for sending verification and password reset emails.

### UI Component Libraries

-   **Radix UI**: Provides accessible, unstyled UI primitives.
-   **shadcn/ui**: Pre-styled Radix UI components with Tailwind CSS, copied directly into the project.

### Development Tools

-   **Replit-Specific Plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`.
-   **Build Tools**: Vite (frontend), esbuild (server-side), TypeScript compiler, PostCSS with Tailwind and Autoprefixer.

### Authentication & Session Management

-   **Passport.js**: For local strategy authentication and session management.
-   **Session Storage**: `memorystore` for development, with a note for production scalability requiring persistent storage.

### Validation & Type Safety

-   **Zod**: For runtime schema validation and TypeScript type inference.

### Utility Libraries

-   **nanoid**: For unique token generation.
-   **date-fns**: For date manipulation.
-   **class-variance-authority**, **clsx**, **tailwind-merge**: For conditional CSS class composition.