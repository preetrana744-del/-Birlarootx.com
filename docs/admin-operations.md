# Birla RootX administrator guide

## Product prices and photos

Sign in with an authorized admin account. Set the selling price without changing the physical pack MRP. Upload non-empty JPG, PNG or WebP up to 5 MB; save, refresh and inspect the storefront/card/detail/bag. Existing orders retain their image/price snapshots.

A definite rejected product save removes only the photo uploaded by that attempt. If the network result is uncertain, refresh and inspect the product before retrying: the photo is retained because the write might have succeeded. Failed cleanup is reported for Storage review. Do not repeatedly upload while uncertain.

Old images are deliberately not auto-deleted. Before removing a historical object, check all product image_url references and rootx_order_items image_url snapshots, record an export/backup and obtain the owner's agreed retention period. Never delete by age or folder alone. An administrator should review ambiguous/orphan uploads; do not run a broad bucket purge. This guide establishes a safe process, not an automatic retention job or a claim of an executed restore.

## Requests, payment and fulfilment

Request received means an unpaid request was recorded. Confirm seller, stock, serviceability, shipping charges and final total before acceptance. Do not interpret an email or dispatch status as payment proof. Shopify payment remains disabled until its activation checks pass.

For dispatch, enter confirmed courier/tracking/date and an appropriate customer note, then save. Blue Dart and Delhivery show links to fixed official tracking pages; customers enter the displayed reference there. Unknown couriers retain a plain reference. No courier ETA or automatic delivery integration is implied.

Choose the dispatch/delay/cancellation/support template, edit it with confirmed facts and save. Customer-visible notes must not contain internal discussion, passwords, OTPs or payment secrets. Cancellation is separate from any payment refund; verify and communicate refunds separately.

## Notifications and support

Queued messages are durable. Provider acceptance is not inbox delivery. Missing sender configuration pauses sending; orders remain visible. Inspect admin notification status and retry only according to queue backoff. Review terminal failures and ambiguous jobs against provider logs before reopening; do not blindly resend.

The server-scheduled retry workflow is prepared but paused until ROOTX_NOTIFICATION_READY=true, a shared worker secret and verified sender are configured. The existing Gmail SMTP login is rejected; repair Auth SMTP independently of order emails. Do not disable email confirmation to conceal failures.

Use the published support email and email-app/copy alternatives. Confirm the business's actual support staffing, grievance owner, dispatch/return address and policy commitments before accepting live sales. Product label approval, including Growth Factor serving-size/directions clarification, remains with the business.

## Monitoring and recovery

Live storefront health probes run read-only every 30 minutes (GitHub schedules may be delayed). Failures appear in GitHub Actions. The repository owner should enable workflow failure notifications in their existing GitHub notification settings and verify their chosen destination; no new email/Slack alert channel has been connected.

The monitor checks storefront/account/product/support content, catalogue response and checkout readiness format. Disabled checkout is an allowed pre-launch state. It does not test email inbox delivery, real payments, carrier status, SEO indexing, database restore or physical image-upload bytes.

Keep two authorized recovery owners and document access without putting credentials in this repository. Confirm backup retention/storage export and perform a controlled restore before relying on the recovery procedure. Retire one-time owner bootstrap only after administrator recovery is verified.
