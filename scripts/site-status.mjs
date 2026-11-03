import fs from 'node:fs';

export const siteStatus = JSON.parse(fs.readFileSync(new URL('../site-status.json', import.meta.url), 'utf8'));
if (typeof siteStatus.hold !== 'boolean') throw new Error('site-status.json must contain a boolean hold value');
export const holdMarker = 'data-rootx-status="on-hold"';
