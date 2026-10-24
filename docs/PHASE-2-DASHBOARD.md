# Phase 2 — Business dashboard foundation

## Included
- Authenticated dashboard shell with account identity and logout.
- Workspace summary counts and responsive workspace cards.
- Create-workspace panel for ecommerce, catalogue and service businesses.
- Authenticated server endpoint to list the signed-in owner's workspaces.
- Empty, loading, error and retry states.
- Output escaping for business data rendered into HTML.

## API contract
- `GET /api/business/list`: requires Firebase ID token; returns only businesses whose `ownerUid` equals the verified token UID.
- `POST /api/business/create`: existing Phase 1 endpoint; verifies the user and creates the owner membership transactionally.

## Data access
The listing endpoint uses the verified Firebase UID from the server-side token, not a UID supplied by the browser. Firestore rules continue to deny client writes. Do not use client-provided business IDs as authorization proof.

## Validation checklist
1. Run `npm run check` and `npm run build`.
2. Register and log in with account A; create a workspace and confirm it appears after refresh.
3. Register and log in with account B; confirm A's workspace is not returned.
4. Test empty, loading, failed-request and retry states.
5. Verify the deployed API with a valid Firebase session after deployment.

## Not included yet
Website template editing, live preview, publishing, product/service management, online checkout, subscriptions and the complete notification centre remain later phases.
