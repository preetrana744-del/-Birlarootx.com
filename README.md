# BirlaRootX website

Static landing page for the five Birla RootX products. All are priced at ₹1,999. Prepared for GitHub Pages and `Birlarootx.com`.

## Publish with GitHub Pages

1. Unzip this package, then upload all the files inside `birlarootx-website` to the root of your GitHub repository. Keep the five product JPGs beside `index.html`, and include the `.github/workflows/deploy.yml` file.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the publishing source.
3. In the **Custom domain** field, enter `Birlarootx.com` and save. The `CNAME` file is already included in the project root.
4. At the service where the domain's DNS is managed, add these `A` records for the apex/root (`@`):

   | Type | Host | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |

5. After DNS updates, return to **Settings → Pages** and turn on **Enforce HTTPS** when GitHub offers it. DNS changes can take up to 24 hours to propagate; certificate setup can take additional time.

Optionally, add `www.Birlarootx.com` as a `CNAME` record pointing to `<your-github-username>.github.io` to enable the `www` address and GitHub's redirect. Do not include the repository name in that target.

## Project files

- `index.html` — page structure and copy
- `styles.css` — responsive visual design
- `script.js` — shopping bag preview and menu interactions
- Five product JPGs — Carbs Slayer, Jacked Pre-Workout, Spilan Test, Epic Burn Pro, and Growth Factor; each is ₹1,999
- `CNAME` — GitHub Pages custom domain
- `.github/workflows/deploy.yml` — deploys the site automatically on each push to `main`

The bag is a front-end preview and checkout is not connected to a payment or store service yet.
