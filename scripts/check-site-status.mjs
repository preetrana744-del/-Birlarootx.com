import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {siteStatus, holdMarker} from './site-status.mjs';

const output = new URL('../_site/', import.meta.url).pathname;
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
  const target = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const files = walk(output);
const htmlFiles = files.filter(file => file.endsWith('.html'));
if (!siteStatus.hold) {
  assert(!fs.readFileSync(path.join(output, 'index.html'), 'utf8').includes(holdMarker), 'Normal build must not contain the hold marker');
  console.log('Open-storefront status verified.');
  process.exit(0);
}
for (const required of ['index.html', '404.html', 'account.html', 'product.html', 'policies/support.html', 'products/growth-factor/index.html', 'CNAME', 'robots.txt', 'sitemap.xml', '.nojekyll', 'favicon.svg', 'birla-rootx-original-logo.png']) {
  assert(fs.existsSync(path.join(output, required)), 'Missing maintenance artifact: ' + required);
}
for (const file of files) assert(!/\.(?:js|css)$/i.test(file), 'Storefront code must not be published during hold: ' + file);
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes(holdMarker), 'Route is not on hold: ' + file);
  assert(html.includes('Birla RootX is temporarily on hold.'), 'Missing hold message: ' + file);
  assert(!/<(?:script|form|iframe)\b|\bon\w+\s*=|noindex/i.test(html), 'Unexpected active content or noindex: ' + file);
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, 'Expected one heading: ' + file);
}
console.log(`Verified ${htmlFiles.length} holding pages; no forms, scripts, app assets or noindex directives.`);
