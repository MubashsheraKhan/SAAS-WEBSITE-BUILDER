# Webaura by III — SaaS Website Builder

A multi-tenant, template-based website builder for ecommerce stores, WhatsApp catalogue sellers, and service businesses.

## Current implementation status

This repository is being built incrementally. The first commit establishes the Phase 1 foundation: repository setup, Firebase configuration, authentication UI, tenant-aware API scaffolding, security rules, and Vercel deployment configuration.

**Not yet implemented:** production-ready onboarding, full website editor, storefront publishing, ecommerce checkout/payment processing, subscription enforcement, and the complete notification centre. Do not treat this scaffold as production-ready until the configuration and security checks in the setup guide have been completed.

## Stack

- HTML5, Tailwind CSS, vanilla JavaScript ES modules
- Firebase Authentication, Cloud Firestore, Firebase Storage
- Node.js serverless functions on Vercel
- Firebase Admin SDK for trusted server-side operations

## Phase plan

1. Repository setup, Firebase initialization, authentication, business onboarding, tenant security, deployment.
2. Business dashboard, Super Admin foundation, navigation and reusable components.
3. Template engine, editor, preview, draft saving and publishing.
4. Public storefronts, products, services and image uploads.
5. WhatsApp handoff, cart, online orders and verified payments.
6. Subscription plans, entitlements and payment review.
7. Notification centre, real-time updates, announcements and preferences.
8. Security, accessibility, performance and private beta.

## Local setup

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and fill in your Firebase web configuration.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.
5. Follow `docs/PHASE-1-SETUP.md` to configure Firebase, security rules, and Vercel.

Never commit `.env.local`, Firebase service-account credentials, or payment secrets.
