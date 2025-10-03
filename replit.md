# uniHub - Merchant Engagement Platform

## Overview

uniHub is a B2B SaaS platform offering digital loyalty card programs and spin-to-win campaigns to merchants through a unified dashboard. Merchants pay a €25/month subscription to access tools for managing loyalty, creating spin campaigns, tracking customer engagement, and viewing analytics. Customers interact via mobile devices to collect loyalty stamps, use QR codes for merchant scanning, and participate in spin-to-win promotions, with optional integration into Apple Wallet or Google Wallet. The platform consolidates functionality from previously separate applications, providing unified authentication, subscription management, and shared customer data.

## Recent Changes (October 2025)

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

### Updated Registration & Authentication Flow
1. User registers → receives verification email (no immediate Stripe redirect)
2. User clicks verification link → email marked as verified, Stripe customer created
3. User logs in → checked for email verification and subscription status
4. If not subscribed → redirected to `/subscription-required` page
5. User subscribes via Stripe checkout → gains dashboard access

### Database Schema Updates
Added to users table:
- `emailVerified` (boolean, default false)
- `verificationToken` (varchar, nullable)
- `verificationTokenExpiry` (timestamp, nullable)
- `resetPasswordToken` (varchar, nullable)
- `resetPasswordExpiry` (timestamp, nullable)

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

### Payment Integration

**Stripe** is integrated for subscription billing (€25/month), managing customer and subscription statuses. Frontend uses `@stripe/stripe-js` and `@stripe/react-stripe-js`, while the backend uses the Stripe Node SDK.

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