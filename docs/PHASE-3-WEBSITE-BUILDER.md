# Phase 3 — Template editor and storefront renderer

## Included
- Three configuration-driven template styles: Boutique, Catalogue and Services.
- Authenticated editor that lists only the signed-in user's accessible workspaces.
- Business name, tagline, optional logo URL, primary/background colours, and up to eight configurable homepage sections.
- Private draft save/read API, with membership checked server-side.
- Preview rendered from escaped configuration data.
- Publishing validates content and writes a versioned published snapshot separate from the draft.
- Public storefront resolves a business slug through a read-only API and renders the published snapshot.
- Vercel server-side API routes use Firebase Admin; client Firestore writes remain denied.

## Routes
- `/dashboard/website-builder.html` — authenticated editor.
- `/api/websites/config` — GET draft / PUT draft; requires a valid Firebase ID token and owner/admin membership.
- `/api/websites/publish` — POST; validates and publishes a new version.
- `/api/websites/resolve?slug=...` — public read-only published site resolver.
- `/site.html?slug=...` — public storefront view.

## Data model
- `businesses/{businessId}/website/draft` — private editable configuration.
- `businesses/{businessId}/website/published` — current published snapshot with version and publisher metadata.
- `businesses/{businessId}` — status, slug and published version metadata.

The current renderer uses a shared template renderer. It does not create a separate app or deployment per tenant.

## Limitations
- The storefront is served by `/site.html?slug=...`; tenant subdomain routing and custom domains need explicit Vercel routing/domain configuration.
- The current contact CTA is a placeholder. WhatsApp number management, product/service inventory, cart, online payment gateway, order management, subscriptions and the complete notification centre are not part of Phase 3.
- Version metadata is recorded and the latest published snapshot is retained; a user-facing rollback UI is not yet included.
- Logo is accepted as an HTTP(S) URL. Uploading images to Firebase Storage is not implemented here.

## Validation checklist
1. Run `npm run check` and `npm run build`.
2. Sign in and open the editor; confirm only accessible workspaces appear.
3. Save a draft and reload; verify it persists.
4. Preview each template and check narrow/mobile viewport layout.
5. Publish a complete draft; verify the published site resolves by slug.
6. Sign in as another account and attempt to read/save/publish the first account's workspace; expect denial.
7. Confirm unpublished businesses do not resolve publicly.
