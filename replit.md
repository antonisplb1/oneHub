# uniHub - Merchant Engagement Platform

## Overview

uniHub is a B2B SaaS platform offering digital loyalty card programs, spin-to-win campaigns, and digital menu creation for merchants through a unified dashboard. Merchants can subscribe to Loyalty Cards, Spin Wheel, Menu Builder, or bundled options. The platform provides tools for managing campaigns, customer engagement, and analytics. Customers interact via mobile devices for loyalty, QR code scanning, and spin-to-win promotions, with optional integration into Apple Wallet and Google Wallet. The platform consolidates previously separate applications, providing unified authentication, subscription management, and shared customer data, aiming to enhance merchant capabilities and customer engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React, TypeScript, and Vite**, using **Wouter** for routing and **TanStack Query** for server state management. **shadcn/ui** (based on Radix UI) and **Tailwind CSS** define the UI, designed with a dual aesthetic: professional for merchants and playful for customers. It features a flexible HSL-based color palette and Inter font family, with components organized into UI primitives, feature-specific, and page components. Routing includes public, customer-facing, and protected dashboard routes with authentication guards.

### Backend Architecture

The backend uses **Express.js with TypeScript**, **Passport.js** for session-based authentication, and **Drizzle ORM** for database interactions with **Neon serverless PostgreSQL**. Authentication uses `scrypt` for password hashing and secure, httpOnly session cookies. The API is RESTful under `/api/*`, handling authentication, loyalty, customer management, QR codes, wallet integrations, and spin wheel functionalities. **Zod schemas** enforce data validation, and Drizzle Kit manages database migrations.

### System Design

-   **Flexible Product Selection & Pricing**: uniHub offers Loyalty Cards (€15/month), Spin Wheel (€10/month), and Menu Builder (€5/month), with bundle discounts (e.g., All Three for €23/month). Users select products post-registration, and the dashboard menu dynamically adjusts based on `selectedProducts`. Stripe handles proration for subscription changes.
-   **Registration & Authentication Flow**: Features email verification via Resend, password reset functionality, and product selection before subscription. Users must verify email and select products before gaining dashboard access.
-   **Security**: Implements a three-layer anti-spam system including Express rate-limiting, Cloudflare Turnstile CAPTCHA (environment-aware), and a daily cron job to remove unverified accounts older than 48 hours.
-   **Digital Menu Builder**: Allows merchants to create and manage digital menus with categories, items, and images. Generates QR codes for public menu access, with a customer-friendly public menu page featuring a warm color palette, sticky navigation, and responsive design.
-   **Customer Notification Messaging**: Merchants can send push notifications to Google Wallet loyalty card holders via a dashboard UI, with messages saved for history tracking. Google Wallet API limits to 3 notifications per 24 hours per loyalty class.
-   **QR Code System**: Generates Merchant Join, Customer Loyalty, and Spin Wheel QR codes. A merchant dashboard scanner is available for loyalty stamp operations.
-   **Digital Wallet Integration**: Includes buttons for Apple Wallet and Google Wallet on customer loyalty cards, with planned full integration.

### Database Schema

Key tables include `users` (merchants), `customers`, `loyaltyCards`, `loyaltyTransactions`, `rewards`, `spinTokens`, `spins`, `menuCategories`, `menuItems`, and `messages`. UUID primary keys, cascade deletes, and timestamps are standard. The `users` table includes `emailVerified`, `verificationToken`, `resetPasswordToken`, and `selectedProducts` (text array storing product choices like 'loyalty', 'spin', 'menu').

### UI/UX Decisions

-   **Landing Page & Pricing Redesign**: Features an interactive product showcase with shadcn/ui Tabs displaying all 3 products (Loyalty, Spin, Menu Builder), trust indicators (Stripe, cancel anytime), and a dedicated responsive pricing page. The pricing page details individual and bundle options (€15/€10/€5 individual, €23 for all three with €7 savings), includes FAQs, and a clear CTA.
-   **Demo Page**: Comprehensive product walkthrough with 4 pricing cards, detailed feature explanations for each product (Loyalty Cards, Spin Wheel, Menu Builder), 3-step workflows, and "Perfect For" use cases. Updated to reflect current pricing (€23 bundle saves €7) and includes Menu Builder feature.
-   **Public Menu Page**: Designed for customers with a warm, appetizing aesthetic, gradient hero, sticky category navigation, large typography, generous spacing, and responsive layout.

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