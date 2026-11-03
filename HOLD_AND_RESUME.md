# Temporary hold and resume

The storefront is temporarily paused through `site-status.json` with `"hold": true`. Original storefront source and customer data are preserved. The public build replaces every built HTML route, including account/product pages and the 404 fallback, with a static holding page. No forms or storefront scripts are published. Domain configuration, robots/sitemap files, the logo and verification file remain attached.

To resume:

1. Confirm business operations are ready and use the owner's privately saved resume instructions to restore backend request handling. Changing the frontend flag alone does not restore backend access.
2. Set `"hold": false` in `site-status.json`.
3. Run the normal checks, then `node scripts/build-site.mjs`, `node scripts/check-public-site.mjs`, `node scripts/apply-site-status.mjs` and `node scripts/check-site-status.mjs`.
4. Commit and push to `main` to deploy through GitHub Pages. The build reconstructs the original storefront from its preserved source.
5. Confirm the deployment and run `node scripts/check-live-health.mjs`.

No return date is promised. The maintenance page deliberately does not add a noindex directive. GitHub Pages serves static HTML rather than a configurable 503 response, so a long pause may still affect search visibility. Keep the domain and hosting accounts active if the pause is temporary.

## Preservation record

- Pre-hold source commit: `d1eb9947145154d609f98424f7f1db1db60bd79d`.
- Remote backup branch: `backup/before-hold-2026-11-03`.
- Operational backend details are recorded only in the owner's private resume instructions.
- This website hold does not cancel subscriptions or billing.
