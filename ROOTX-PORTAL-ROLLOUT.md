# Birla RootX customer & admin portal — rollout notes

## Existing production backend

- Supabase project: `lbqgdfbpuxjkwldhwpvi`.
- Existing tables used as-is: `rootx_products`, `rootx_profiles`, `rootx_admin_users`, `rootx_orders`, `rootx_order_items`, `rootx_order_events`.
- Existing RPC `rootx_place_order(payload jsonb)` validates signed-in, verified users; generates totals from database product prices and handles idempotency.
- Existing storage bucket `rootx-product-images` accepts authenticated admin JPG/PNG/WebP images under 5 MB.
- SQL migration added minimum column UPDATE grants, not blanket access.
- SQL migration added signup customer-profile trigger for new Auth users.

## Pages

- `account.html`: one email/password login for customers and admins. Checks `rootx_admin_users` under row-level security; no public administrator registration.
- Customer: registration, password reset, own orders and status history; order request via existing RPC.
- Admin: total orders, customers, editable order status, expected delivery date, courier, tracking code, customer-visible update; editable product selling price and photo; customers list.
- `rootx-live.js`: adds account links to existing storefront and loads current Supabase product prices and images. Preserves existing shopping cart and product-detail code.

## Administrator access

The already-provisioned authorized admin identity is `rootx1212@gmail.com`. Its password is not available to developers and **must not be published in code or GitHub**. Use the portal's **Forgot password?** to set a new password using the email that owns the account. Admin privileges come from the database membership, not an email string in browser code.

## Test before merging to production

1. Verify SMTP signup/forgot-password delivery and Supabase Authentication redirect allowlist includes `https://birlarootx.com/account.html`.
2. Sign in as the authorized admin, change one test price and restore it. Verify storefront and product detail both display current price.
3. Upload a small approved JPG/WebP image and confirm it appears on product pages. Keep original product assets untouched.
4. Sign up with an independently controlled test customer email; verify admin can see this profile, but not access other customers' orders when logged in as customer.
5. From the site add an item to cart, sign in, submit an **order request** and confirm admin sees the request and its product snapshot. This **does not process any payment**.
6. Admin sets order status and estimated delivery date; customer refreshes and sees accurate updates.
7. Test mobile layouts, carousel, Add to cart, and existing SEO. Don't merge until reviewed.

## Deliberate limits

No real-time carrier API or shipment ETA calculation. Expected dates are manually maintained by an admin. No online card/UPI payments or payment-success claims. Do not use the order request flow as proof of payment. For a true paid checkout, integrate and verify an external payment processor separately.

Security follow-up: enable Supabase Auth leaked-password protection if available in the project plan; review the existing one-time owner setup edge function and remove it after the admin is safely provisioned.