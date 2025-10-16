# uniHub - Merchant Engagement Platform

## Overview

uniHub is a B2B SaaS platform providing a unified dashboard for merchants to manage digital loyalty card programs, spin-to-win campaigns, digital menus, and employee shifts. It aims to enhance merchant capabilities, customer engagement, and staff coordination by consolidating previously separate applications into a single platform with unified authentication, subscription management, and shared customer data. Merchants can subscribe to individual products (Loyalty Cards, Spin Wheel, Menu Builder, Shift Manager) or a Complete Bundle, with a focus on flexible product selection and pricing. The platform facilitates customer interaction via mobile devices, QR codes, and digital wallet integrations, and allows employees to access shift schedules securely.

## User Preferences

Preferred communication style: Simple, everyday language.

## Development Demo Account

A fully populated demo account exists for testing and video recording purposes:

**Login Credentials:**
- Email: `demo@unihub.local`
- Password: `DemoUniHub2025!`
- Shop Name (URL): `aroma-cafe`
- Shift Access PIN: `1234`

**Demo Data Summary:**
- 15 customers with loyalty cards (stamps: 2, 3, 4, 5, 6, 7, 7, 8, 9, 9, 10, 10, 10)
- 97 loyalty transaction history entries
- 8 spin wheel prizes (Free Coffee, 10% Off, 20% Off, Free Pastry, Buy 1 Get 1 Free, Free Upgrade, €5 Voucher, Try Again)
- 60 spin history entries (past 14 days)
- 4 menu categories: Coffee & Drinks (10 items), Breakfast (6 items), Pastries & Desserts (6 items), Daily Specials (4 items)
- 6 crew members: Alex Thompson, Maria Rodriguez, John Wilson, Sarah Kim, Tom Anderson, Elena Petrou
- 21 shifts for the current week (Oct 13-19, 2025) with morning/afternoon/evening coverage
- 3 timeframe presets: Morning Shift (07:00-15:00), Afternoon Shift (12:00-20:00), Evening Shift (16:00-23:00)
- All 4 products enabled: Loyalty Cards, Spin Wheel, Menu Builder, Shift Manager
- Email verified, 3-day free trial active

**Public URLs:**
- Public Shift Schedule: `/aroma-cafe/shifts` (PIN: 1234)

**Verification (Oct 16, 2025):**
- ✅ Login successful with credentials
- ✅ Dashboard loads with all 4 products enabled
- ✅ Customers page shows 15 customers with loyalty cards
- ✅ Spin Wheel page displays 8 prizes and spin history
- ✅ Menu Builder shows 4 categories with 26 items
- ✅ Shift Manager displays 6 crew members and weekly schedule
- ✅ All data verified via automated e2e testing

**Note:** This account is for development/testing only and contains realistic sample data for demonstrating all platform features.

## System Architecture

### Frontend Architecture
Built with React, TypeScript, and Vite, utilizing Wouter for routing and TanStack Query for server state management. UI is designed using shadcn/ui (Radix UI) and Tailwind CSS, featuring a dual aesthetic for merchants (professional) and customers (playful), with a flexible HSL-based color palette and Inter font family.

### Backend Architecture
Uses Express.js with TypeScript, Passport.js for session-based authentication, and Drizzle ORM for database interactions with Neon serverless PostgreSQL. Employs `scrypt` for password hashing, secure httpOnly session cookies, and Zod schemas for data validation. APIs are RESTful.

### System Design

-   **Flexible Product Selection & Pricing**: Merchants choose products post-registration, with dynamic dashboard adjustments. Stripe handles subscription and proration.
-   **Registration & Authentication**: Includes email verification via Resend, password reset, and a 3-day free trial activated upon email verification.
-   **Security**: Features Express rate-limiting, Cloudflare Turnstile CAPTCHA, and daily cron jobs for unverified account removal.
-   **Digital Menu Builder**: Allows merchants to create menus with categories, items, and images. Images are stored in Replit Object Storage, supporting presigned upload URLs. Features drag-and-drop reordering and generates QR codes for public menu access. The public menu page is customer-friendly, with dynamic branding based on loyalty card color, responsive design, and WCAG-compliant text readability.
-   **Customer Notification Messaging**: Merchants can send push notifications to Google Wallet loyalty card holders via a dashboard UI.
-   **QR Code System**: Generates Merchant Join, Customer Loyalty, and Spin Wheel QR codes, with a merchant dashboard scanner for loyalty stamps.
-   **Digital Wallet Integration**: Includes Apple Wallet and Google Wallet buttons on customer loyalty cards, with web app manifest for iOS home screen integration.
-   **MyShift Employee Shift Manager**: Comprehensive scheduling system with crew member management, weekly calendar view, shift CRUD operations, timeframe presets, and PIN-protected public access to schedules.
-   **Subuser/Team Management System**: Multi-user access control with email invitations, granular permissions (dashboard, customers, loyalty, spin, menu, shift, analytics), and backend enforcement of access rights.

### Database Schema
Key tables include `users`, `subusers`, `customers`, `loyaltyCards`, `loyaltyTransactions`, `rewards`, `spinTokens`, `spins`, `menuCategories`, `menuItems`, `messages`, `shifts`, `crewMembers`, and `timeframePresets`. Uses UUID primary keys, cascade deletes, and timestamps. Includes fields for email verification, reset tokens, `shiftAccessPin`, `selectedProducts`, and `permissions` for subusers.

### UI/UX Decisions
-   **Landing Page**: Professional, conversion-optimized design with benefit-driven hero, dual CTAs, social proof, product features, pricing overview, "Who We Serve" section, "Why uniHub" benefits, and security assurances. Uses lucide-react icons.
-   **Pricing Page**: Dedicated responsive page detailing individual product and bundle pricing with feature lists and FAQs.
-   **Demo Page**: Visual walkthrough demonstrating platform functionality in simple steps, focusing on "how it works" and product highlights without pricing information.
-   **Public Menu Page**: Customer-centric design with warm aesthetics, sticky navigation, large typography, and responsiveness.
-   **Legal & Compliance**: Cookie consent system and comprehensive legal pages (Cookie Policy, Privacy Policy, Terms of Service).

## External Dependencies

### Third-Party Services
-   **Stripe**: Payment processing for subscriptions.
-   **Neon**: Serverless PostgreSQL database.
-   **Resend**: Transactional email service.
-   **Cloudflare Turnstile**: CAPTCHA for anti-spam.
-   **Google Wallet API**: For push notifications to loyalty card holders.

### UI/Development Libraries
-   **Radix UI**: Accessible UI primitives.
-   **shadcn/ui**: Pre-styled Radix UI components with Tailwind CSS.
-   **Wouter**: Frontend routing.
-   **TanStack Query**: Server state management.
-   **Passport.js**: Authentication.
-   **Drizzle ORM**: Database interactions.
-   **Zod**: Schema validation.
-   **date-fns**: Date manipulation.