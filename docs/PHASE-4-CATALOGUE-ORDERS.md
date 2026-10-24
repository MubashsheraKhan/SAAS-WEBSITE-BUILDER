# Phase 4 — Products, services and customer actions

## Included
- Tenant-scoped product/service CRUD API with price, description, optional image URL, stock and active status.
- Public active-catalogue API for a published website.
- Public order request API; server reloads product records and calculates prices rather than trusting client totals.
- Private order listing and order status management.
- Public customer enquiry creation and private enquiry listing/status management.
- Firebase ID token authentication for private operations and server-side workspace membership checks.

## Routes
- GET/POST/PUT/DELETE /api/catalogue/items
- GET /api/catalogue/public?slug=...
- POST /api/orders — public order request; GET/PATCH /api/orders — private management.
- POST /api/enquiries — public enquiry; GET/PATCH /api/enquiries — private management.

## Firestore model
- businesses/{businessId}/catalogueItems/{itemId}
- businesses/{businessId}/orders/{orderId}
- businesses/{businessId}/enquiries/{enquiryId}

## Limitations
- These APIs are the Phase 4 backend foundation. Storefront forms and dashboard management UI are not yet connected in this commit.
- Orders record requests only; no payment gateway or payment verification.
- Stock is checked but not reserved/decremented transactionally.
- Images are provided as HTTP(S) URLs; Firebase Storage upload UI is not included.
- This branch builds on phase-3-website-builder; review and merge Phase 3 first, then rebase/merge Phase 4.
- Notifications are not included yet.

## Validation checklist
1. Run npm run check and npm run build.
2. Test product/service create, update, list and delete.
3. Verify other accounts cannot access private catalogue, orders or enquiries.
4. Confirm public catalogue returns only active items for published websites.
5. Submit an order with a manipulated client price and confirm the stored total uses server prices.
6. Test enquiry creation and status updates.
