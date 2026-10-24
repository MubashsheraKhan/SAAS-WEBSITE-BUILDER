# Phase 1 setup and deployment

## Requirements
- Node.js 22+, npm, Firebase project, and Vercel project linked to this repository.

## Local setup
1. Run npm install.
2. Copy .env.example to .env.local (PowerShell: Copy-Item .env.example .env.local).
3. Fill in the six VITE_FIREBASE_* web app settings.
4. Run npm run dev.

## Firebase setup
1. Register a Firebase Web App.
2. Enable Email/Password under Authentication > Sign-in method.
3. Create Firestore and the default Storage bucket.
4. Install Firebase CLI, run firebase login, then deploy rules from the firebase directory after reviewing them.
5. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY as server-only environment variables. Never use a VITE_ prefix for Admin credentials or commit a service-account JSON file.

## Vercel setup
Import this repository, choose the Other framework preset, set build command to npm run build and output directory to dist. Configure all Firebase web settings and the three server-only Admin variables. The initial deployment can use the Vercel-provided domain.

## Checks
Run npm run check and npm run build. Test registration, login, password reset, logout and business creation with two unrelated accounts. Verify that neither account can read the other's business records. Configure and test Firebase rules in a non-production project before launch.

## Limitations
This is the Phase 1 foundation, not the complete SaaS product. Rate limiting, email-verification enforcement, staff invitations, Super Admin bootstrap, existing-workspace listing and automated cross-tenant emulator tests remain pending. Storefront publishing, payments, subscription enforcement and the notification centre are not implemented yet.
