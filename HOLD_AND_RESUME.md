# Temporary hold and resume

The storefront is temporarily unpublished in GitHub Pages. `site-status.json` has `"hold": true` and `"unpublished": true`; the latter prevents the deployment workflow from publishing again. Original storefront source is preserved. Domain configuration is retained. A passive holding-page build is also prepared if publication in maintenance mode is wanted later.

To resume:

1. Confirm business operations are ready and use the owner's privately saved resume instructions to restore backend request handling. Changing the frontend flag alone does not restore backend access.
2. Set both `"hold": false` and `"unpublished": false` in `site-status.json`.
3. Run the normal checks, then `node scripts/build-site.mjs`, `node scripts/check-public-site.mjs`, `node scripts/apply-site-status.mjs` and `node scripts/check-site-status.mjs`.
4. Commit and push to `main` to deploy through GitHub Pages. The build reconstructs the original storefront from its preserved source.
5. Confirm the deployment and run `node scripts/check-live-health.mjs`.

No return date is promised. The public site returns a GitHub Pages 404 while unpublished. A prolonged pause may affect search visibility. Keep the domain and hosting accounts active if the pause is temporary. The prepared maintenance page deliberately does not add a noindex directive.

## Preservation record

- Pre-hold source commit: `d1eb9947145154d609f98424f7f1db1db60bd79d`.
- Remote backup branch: `backup/before-hold-2026-11-03`.
- Operational backend details are recorded only in the owner's private resume instructions.
- This website hold does not cancel subscriptions or billing.
