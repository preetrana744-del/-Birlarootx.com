# RootX account and communication operations

The order-request notification function is deployed, but sending is paused until a verified sender and provider credentials are configured. A saved request is not evidence of payment, provider acceptance is not evidence of inbox delivery, and database-role tests are not a full browser OAuth/email test.

## Sending service

Selected provider: Resend. Configure these secrets in Supabase Edge Function secrets, never in frontend code or this repository:

- RESEND_API_KEY: key permitted to send from the verified domain.
- ROOTX_FROM_EMAIL: an actual verified sender address. Do not use a Gmail address as a fabricated verified domain sender.
- ROOTX_ADMIN_EMAIL: admin new-request destination; defaults to the existing published support email, rootx1212@gmail.com.

Set up SPF/DKIM and appropriate DMARC for the sending domain through its DNS owner. The website must accurately disclose the enabled provider. Do not sign up for a paid plan or publish sender claims without verifying the account and domain.

Supabase Auth email confirmation/recovery uses its own SMTP configuration, separate from the order-email function. Configure custom SMTP, production Site URL https://birlarootx.com and the exact redirect URL https://birlarootx.com/account.html. Keep email verification enabled; do not bypass verification to obtain a passing test. Google requires the configured OAuth client and callback https://lbqgdfbpuxjkwldhwpvi.supabase.co/auth/v1/callback.

## Queue behaviour

The database atomically queues customer acknowledgement and admin notification for a new request, and customer messages for status/delivery changes. Existing orders are not bulk-notified. Snapshot recipients and wording do not come from browser input. Only service_role may lease or update queue records. The worker independently verifies the customer's user token and scopes jobs to that user; an authorized admin can process all pending jobs.

The frontend automatically attempts dispatch after a successful request/status update and when an admin opens their dashboard. Failed attempts remain queued with backoff and stable provider idempotency keys. A retry button is present for admins. The queue is durable, but there is not yet an independent scheduled sender: after provider configuration, add a secured server-side scheduled invocation so closing a browser after database commit cannot indefinitely delay delivery. Do not expose a service-role key or enable a public unauthenticated dispatcher. The current function requires a verified user token; a scheduler requires a separately authenticated service path, not an expired copied user JWT.

Provider responses are recorded as accepted, not delivered. A crash is retried under the same deduplication key within the provider's time window. Jobs uncertain beyond 23 hours move to review to avoid an unsafe duplicate send; terminal failures and five exhausted attempts require operator review. Reconcile provider logs before reopening a review job. Bounce/delivery webhook reconciliation remains an activation task if delivered/bounced states are required.

## Controlled verification

Run tests/account-communications.mjs for address validation, auth/intent guards and notification worker tests with fake provider responses. Run tests/account-communications.sql in a controlled session for transactional customer/admin permission and write/readback checks. Its synthetic Auth users/orders/product changes are rolled back; it does not log in through Google or send real messages, and it does not prove Storage upload byte delivery.

Before activation, complete actual inbox confirmation and recovery-link tests, perform a full Google return with a controlled Google account, and verify its profile ID matches auth.uid(). New-password entry must be completed by the account owner. Verify real photo upload bytes through Storage using a disposable test product/environment; the current transactional test verifies URL/price persistence and access enforcement without changing real production products.
