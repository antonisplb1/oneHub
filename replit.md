# uniHub - Merchant Engagement Platform

## Overview

uniHub is a B2B SaaS platform offering digital loyalty card programs, spin-to-win campaigns, digital menu creation, and employee shift management for merchants through a unified dashboard. Merchants can subscribe to Loyalty Cards (€10/month), Spin Wheel (€8/month), Menu Builder (€5/month), Shift Manager (€10/month), or the Complete Bundle (All Four for €24.99/month, saves €8). The platform provides tools for managing campaigns, customer engagement, analytics, and crew scheduling. Customers interact via mobile devices for loyalty, QR code scanning, and spin-to-win promotions, with optional integration into Apple Wallet and Google Wallet. Employees access shift schedules via PIN-protected public URLs. The platform consolidates previously separate applications, providing unified authentication, subscription management, and shared customer data, aiming to enhance merchant capabilities, customer engagement, and staff coordination.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React, TypeScript, and Vite**, using **Wouter** for routing and **TanStack Query** for server state management. **shadcn/ui** (based on Radix UI) and **Tailwind CSS** define the UI, designed with a dual aesthetic: professional for merchants and playful for customers. It features a flexible HSL-based color palette and Inter font family, with components organized into UI primitives, feature-specific, and page components. Routing includes public, customer-facing, and protected dashboard routes with authentication guards.

### Backend Architecture

The backend uses **Express.js with TypeScript**, **Passport.js** for session-based authentication, and **Drizzle ORM** for database interactions with **Neon serverless PostgreSQL**. Authentication uses `scrypt` for password hashing and secure, httpOnly session cookies. The API is RESTful under `/api/*`, handling authentication, loyalty, customer management, QR codes, wallet integrations, and spin wheel functionalities. **Zod schemas** enforce data validation, and Drizzle Kit manages database migrations.

### System Design

-   **Flexible Product Selection & Pricing**: uniHub offers Loyalty Cards (€10/month), Spin Wheel (€8/month), Menu Builder (€5/month), and Shift Manager (€10/month), with one bundle discount: Complete Bundle (All Four for €24.99/month saves €8). Users select products post-registration, and the dashboard menu dynamically adjusts based on `selectedProducts`. Stripe handles proration for subscription changes. The checkout session endpoint automatically creates a Stripe customer for new users if one doesn't exist, ensuring seamless first-time subscription flow.
-   **Registration & Authentication Flow**: Features email verification via Resend, password reset functionality, and 3-day free trial. Users verify email, gain immediate dashboard access with trial, and are prompted to subscribe when trial expires. Trial start date is set upon email verification.
-   **Free Trial System**: 3-day trial period automatically starts upon email verification. Users get full dashboard access during trial. Trial status banner in dashboard shows days remaining with upgrade CTA. Post-trial, users see "Trial Expired" message and must subscribe to continue.
-   **Security**: Implements a three-layer anti-spam system including Express rate-limiting, Cloudflare Turnstile CAPTCHA (environment-aware), and a daily cron job to remove unverified accounts older than 48 hours.
-   **Digital Menu Builder**: Allows merchants to create and manage digital menus with categories, items, and images. Menu item images are stored using Replit Object Storage with a 5MB file size limit, presigned upload URLs for direct-to-cloud uploads, and public ACL policies for customer viewing. The system maintains backward compatibility by supporting both object storage keys (`imageStorageKey`) and legacy direct URLs (`imageUrl`). Features drag-and-drop menu item reordering using @dnd-kit library with automatic displayOrder calculation - merchants can reorder items within categories by dragging the grip icon, with changes persisting via bulk update endpoint (POST /api/menu-items/reorder). Generates QR codes for public menu access, with a customer-friendly public menu page featuring a warm color palette, sticky navigation, and responsive design. Merchants can upload custom banner images (max 5MB, stored as data URLs in menuBannerImage field, recommended 1920x600px) for the public menu header. Banners use cover sizing (backgroundSize: cover) to fill the entire hero area while maintaining aspect ratio, with centered positioning and overflow hidden to ensure no content extends beyond boundaries. A semi-transparent overlay ensures text readability. When no banner is uploaded, the public menu page displays comprehensive brand theming based on the merchant's loyalty card brand color (cardBackgroundColor): a subtle gradient background (0.12→0.05→0.02→0 opacity fade) and a dynamic hero header with the brand color gradient (solid to 80% opacity). Text color on the hero automatically adjusts using WCAG contrast ratio calculations to ensure optimal readability (white text on banner images or white/black text on brand color gradients depending on brand color luminance), meeting AA accessibility standards. Defaults to blue (#4285F4) for loading/error states.
-   **Customer Notification Messaging**: Merchants can send push notifications to Google Wallet loyalty card holders via a dashboard UI, with messages saved for history tracking. Google Wallet API limits to 3 notifications per 24 hours per loyalty class.
-   **QR Code System**: Generates Merchant Join, Customer Loyalty, and Spin Wheel QR codes. A merchant dashboard scanner is available for loyalty stamp operations.
-   **Digital Wallet Integration**: Includes buttons for Apple Wallet and Google Wallet on customer loyalty cards, with planned full integration. For iOS users, the customer loyalty card includes automatic device detection and dismissible instructions for adding the card to the home screen as a web app. Web app manifest meta tags are dynamically set using the merchant's logo as the icon, providing a native app-like experience until full Apple Wallet integration is complete.
-   **MyShift Employee Shift Manager**: Comprehensive shift scheduling system enabling merchants to manage employee shifts and crew rosters through the dashboard. Features include crew member management (add/delete crew names), weekly calendar view with Monday-Sunday layout, shift CRUD operations with crew dropdown selection, and 4-6 digit PIN protection for public crew access. Public crew view accessible at `/{store-username}/shifts` displays branded weekly calendar with merchant logo and colors, read-only shift information showing employee name/role/time/notes, and mobile-responsive design. Built with reusable ShiftSchedule component for calendar rendering, date-fns utilities for week calculations (getWeekRange, addWeeks, isSameDay), and TanStack Query for data management. Dashboard at `/dashboard/shifts` includes five sections: crew roster management, timeframe presets (reusable shift time templates with name, startTime, endTime that can be selected when creating shifts for faster workflow), weekly schedule with navigation, shift form dialog with 24-hour time inputs and validation (endTime > startTime), and PIN management with masked display and set/change functionality. Shift form supports both preset selection (auto-fills times) and manual time entry.

### Database Schema

Key tables include `users` (merchants), `customers`, `loyaltyCards`, `loyaltyTransactions`, `rewards`, `spinTokens`, `spins`, `menuCategories`, `menuItems`, `messages`, `shifts`, `crewMembers`, and `timeframePresets`. UUID primary keys, cascade deletes, and timestamps are standard. The `users` table includes `emailVerified`, `verificationToken`, `resetPasswordToken`, `shiftAccessPin` (4-6 digit PIN for public crew access), and `selectedProducts` (text array storing product choices like 'loyalty', 'spin', 'menu', 'shift'). The `shifts` table stores shift schedules with employeeName, employeeRole, shiftDate, startTime, endTime, and notes. The `crewMembers` table maintains crew roster with member names linked to merchants. The `timeframePresets` table stores reusable shift time templates with name, startTime, and endTime for efficient shift creation.

### UI/UX Decisions

-   **Landing Page Redesign (Minimalistic)**: Clean, professional landing page focused on product clarity without pricing details. Features a hero section with clear value proposition, four product cards showcasing Loyalty Cards, Spin Wheel, Menu Builder, and Shift Manager with key features (no pricing), "Why uniHub.live?" section explaining product flexibility (choose only what you need, no forced higher-tier plans), trust indicators (Stripe, GDPR, cancel anytime), and comprehensive footer. Product cards use unified design matching the pricing page (same icon sizes, spacing, and layout). All pricing information is on the dedicated `/pricing` page.
-   **Pricing Page**: Dedicated responsive pricing page with five individual product cards (€10/€8/€5/€10) plus featured Complete Bundle card (€24.99 saves €8). Includes detailed feature lists, FAQs, trust indicators, and clear CTAs. Product cards use unified design matching the landing page for consistency.
-   **Demo Page**: Comprehensive product walkthrough with pricing cards, detailed feature explanations for each product (Loyalty Cards, Spin Wheel, Menu Builder, Shift Manager), 3-step workflows, and "Perfect For" use cases. Updated to reflect current pricing (€24.99 Complete Bundle saves €8).
-   **About Page**: SEO-optimized marketing page at `/about` with complete Open Graph metadata for social sharing. Features 8 sections: hero with gradient background, mission/vision cards, What We Do (6 feature cards with icons), Who We Serve (6 business types), Why Choose Us (benefits), Trust & Transparency (Stripe/GDPR/security indicators), CTA section, and comprehensive footer. Implements semantic HTML, proper heading hierarchy, and all data-testid attributes for testing. Accessible from all page footers.
-   **Public Menu Page**: Designed for customers with a warm, appetizing aesthetic, gradient hero, sticky category navigation, large typography, generous spacing, and responsive layout.
-   **Legal & Compliance Pages**: Cookie consent system with banner and preferences dialog, plus three comprehensive legal pages (Cookie Policy, Privacy Policy, Terms of Service) with professional structure and contact email (antonispleipell@gmail.com). All pages feature consistent navigation and footer links.

## External Dependencies

### Third-Party Services

-   **Stripe**: Payment processing for flexible subscription billing and proration.
-   **Neon**: Serverless PostgreSQL database.
-   **Resend**: Transactional email service for verification and password resets.
-   **Cloudflare Turnstile**: CAPTCHA service for anti-spam.
-   **Google Wallet API**: For push notifications to loyalty card holders.

### UI/Development Libraries

-   **Radix UI**: Accessible, unstyled UI primitives.
-   **shadcn/ui**: Pre-styled Radix UI components with Tailwind CSS.
-   **Wouter**: Frontend routing.
-   **TanStack Query**: Server state management.
-   **Passport.js**: Authentication and session management.
-   **Drizzle ORM**: Database interactions.
-   **Zod**: Runtime schema validation.
-   **react-icons/si**: For Stripe logo.
-   **date-fns**: Date manipulation.
-   **nanoid**: Unique token generation.
-   **class-variance-authority**, **clsx**, **tailwind-merge**: Conditional CSS class composition.