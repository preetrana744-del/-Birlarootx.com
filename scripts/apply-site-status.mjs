import fs from 'node:fs';
import path from 'node:path';
import {siteStatus, holdMarker} from './site-status.mjs';

const output = new URL('../_site/', import.meta.url).pathname;
if (!siteStatus.hold) {
  console.log('Storefront is open; original public build retained.');
  process.exit(0);
}
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
  const target = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const files = walk(output);
const htmlFiles = files.filter(file => file.endsWith('.html'));
if (!htmlFiles.some(file => path.relative(output, file) === 'index.html') || !htmlFiles.some(file => path.relative(output, file) === '404.html')) {
  throw new Error('Build the original public website before applying maintenance mode');
}
for (const file of htmlFiles) {
  const original = fs.readFileSync(file, 'utf8');
  const canonical = original.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  const canonicalTag = canonical ? `<link rel="canonical" href="${canonical}">` : '';
  fs.writeFileSync(file, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Birla RootX | Temporarily on hold</title>
  <meta name="description" content="Birla RootX is temporarily on hold. We’ll be back.">
  <meta name="theme-color" content="#173e2c">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${canonicalTag}
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#f4f4ec;color:#173e2c;font-family:Arial,Helvetica,sans-serif}main{width:min(100%,620px);text-align:center;padding:56px 24px}img{width:min(240px,75%);height:auto;margin-bottom:38px}p{font-size:17px;line-height:1.7;margin:16px 0;color:#506354}h1{font-size:clamp(32px,7vw,48px);line-height:1.15;letter-spacing:-1px;margin:0;font-weight:600}.status{display:inline-block;border:1px solid #c7d1c3;border-radius:999px;padding:7px 14px;margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
  </style>
</head>
<body ${holdMarker}>
  <main>
    <img src="/birla-rootx-original-logo.png" alt="Birla RootX">
    <div><span class="status">Temporarily on hold</span></div>
    <h1>We’ll be back.</h1>
    <p>Birla RootX is temporarily on hold.<br>Thank you for your patience.</p>
  </main>
</body>
</html>
`);
}
// Publish only the holding pages and domain/discovery/verification essentials.
// Original source files remain untouched; the next normal build restores them.
const keep = new Set(['CNAME', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'birla-rootx-original-logo.png', '.nojekyll']);
for (const file of files) {
  const relative = path.relative(output, file);
  if (!file.endsWith('.html') && !keep.has(relative) && !/^[a-f0-9]{32}\.txt$/.test(relative)) fs.unlinkSync(file);
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Temporary hold applied to ${htmlFiles.length} public HTML routes; storefront code excluded.`);
