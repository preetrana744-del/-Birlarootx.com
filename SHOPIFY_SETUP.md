# Birla RootX commerce connection

The existing website and Supabase customer/admin accounts remain in place. The store is `vbvfdy-ed.myshopify.com`; other Shopify stores must not be used for this integration.

## Prepared and deployed

- Five existing Shopify draft products have the current website's label descriptions, images and prices. They have not been published or assigned invented stock levels.
- `rootx-shopify-checkout` is deployed. Its public GET currently returns `{"enabled":false}`. Authenticated POST verifies the Supabase user and official prices before creating a Shopify cart. The storefront continues accepting order requests while disabled.
- `rootx-shopify-webhook` is deployed but has no signing secret or subscriptions yet. It rejects unconfigured/unsigned requests. No Shopify orders are currently syncing.
- The database has service-only product mappings, checkout proofs, atomic checkout reservations and transactional order import. Customers still read only their own orders through existing RLS.
- The account page can display Shopify payment status and the final total, including shipping/tax, once imported orders exist.

## Activation steps requiring owner setup

1. Select an eligible Shopify plan and complete its subscription payment. The installed Headless channel is currently blocked by the trial plan.
2. Confirm the products' actual stock/availability, dispatch address, shipping areas/rates, delivery estimates, tax treatment, return/refund rules and legal business details. Finalize/publish the policy drafts. Configure and verify a payment gateway through the merchant's own account.
3. Create the Headless storefront and publish the approved products to it. Save its **public** Storefront API token in Supabase Edge Function secrets as `SHOPIFY_STOREFRONT_PUBLIC_TOKEN`. Do not paste credentials into frontend files, GitHub, chat or screenshots. The client only needs the website admin login.
4. Configure standard Shopify order JSON webhooks (API `2026-10`): `orders/create`, `orders/updated`, `orders/paid`, `orders/cancelled`, `orders/fulfilled`, all directed to `https://lbqgdfbpuxjkwldhwpvi.supabase.co/functions/v1/rootx-shopify-webhook`. Save the signing secret that belongs to those subscriptions as `SHOPIFY_WEBHOOK_SECRET` in Edge Function secrets. Headless does not automatically create these subscriptions. Verify the signing secret against a real delivery before activation.
5. Run a signed end-to-end test with a dedicated test customer/cart, Shopify gateway test mode and no real charge. Confirm the random `rootx_checkout` cart attribute arrives in order `note_attributes`, and that the webhook `cart_token` matches the token portion of the stored Storefront cart ID. This correspondence has **not** been verified on this store. If Shopify returns a different format, adapt and test the comparison before enabling checkout; do not remove the ownership check.
6. Confirm payment success/failure, duplicate clicks/retries, an expired session, cancellation/refund, phone/desktop checkout, and the customer/admin order views. A matching random proof and cart are required to attach an order to a Supabase customer. Matching email alone never grants order access. Shipment is not marked delivered automatically; admins still control expected date and final delivery updates.
7. Complete product synchronization before accepting live orders. Current website admin photo/price edits update Supabase. A prepared **manual price-only** helper is saved in `_shared/product-sync-handler.mjs`; it is not deployed, invoked or connected to Save. It requires a scoped secure Admin API token and explicit server activation. Automated price/photo syncing and durable media replacement remain to be implemented. Checkout refuses a product whose Shopify price differs from the website.
8. Only after those checks, set both `ROOTX_SHOPIFY_SYNC_READY=true` and `ROOTX_SHOPIFY_CHECKOUT_ENABLED=true` as server secrets. These are operational readiness flags, not automatic Shopify plan/gateway detection. Removing either flag restores order-request checkout for new visits.

## Implementation notes

All Shopify calls use the fixed store domain and API version `2026-10`. The public browser receives only a checkout URL, never service keys, admin tokens or secret-bearing cart IDs. Cart prices/variant IDs and account ownership are resolved on the server. Checkout creation is capped at ten reservations per signed-in account per hour under a database lock. A pending checkout older than two minutes asks the browser to start a fresh request; completed checkouts expire after seven days.

Webhook signature verification covers the exact raw bytes and checks the fixed store domain before parsing. Database writes, event receipts and proof consumption commit together. Duplicate deliveries are ignored; older snapshots cannot regress payments; same-timestamp payment progress is merged without replacing totals/items/address. A fulfillment indicates shipment, not delivery. Empty phone numbers and zero-total Shopify orders are supported without fabricating contact details. The existing request-order validation is retained.

Orders changed to unknown variants or different initial cart quantities deliberately fail import rather than attach uncertain data. Validate these scenarios and add controlled reconciliation if the merchant enables order/cart editing. Configure monitoring for webhook delivery errors before launch. Set agreed retention and cleanup for expired checkout proofs and delivery receipts; no automatic retention policy has been invented.

## Verification performed

- Storefront cart and variant GraphQL operations validated against the `2026-10` schema.
- Node unit/integration fixtures cover checkout auth, cart validation, price races, redirect safety, signatures, failed imports, retry IDs and payment display.
- Database regression fixtures ran against the project with assertions enabled inside a rolled-back transaction. They cover permissions/RLS, proof ownership, duplicate and out-of-order events, same-time paid updates, free orders, retained image snapshots and reservation limits. No test orders/users remain.
- Live endpoint checks confirmed readiness is false, unauthenticated checkout returns 401 and the unconfigured webhook returns 503.

Live Shopify payment/order delivery has not been tested and is not active.

References: [Cart API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage), [Storefront authentication](https://shopify.dev/docs/api/storefront/latest), [Webhooks](https://shopify.dev/docs/api/webhooks/2026-10), [Supabase function authorization](https://supabase.com/docs/guides/functions/auth-headers).
