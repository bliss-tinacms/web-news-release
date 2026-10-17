#!/usr/bin/env node
import fs from 'node:fs';

const path = process.argv[2] || 'src/pages/index.astro';
const source = fs.readFileSync(path, 'utf8');
const failures = [];

if (/from\s+['"]\.\.\/content\/page\/home\.mdx['"]/.test(source)) {
  failures.push('homepage imports the bundled home.mdx snapshot directly');
}
if (/\b(?:localHome|sourceHome)\b/.test(source)) {
  failures.push('homepage contains a second local SEO source outside getPublicPage()');
}
if (!/const\s+seo\s*=\s*data\.seo\s*\?\?\s*null\s*;/.test(source)) {
  failures.push('homepage SEO is not derived directly from resolved public page data');
}
if (!/const\s+page\s*=\s*await\s+getPublicPage\(slug\)/.test(source)) {
  failures.push('homepage is not using the public Tina-first page loader');
}

if (failures.length) {
  console.error('HOME_SEO_SOURCE_GUARD_FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('HOME_SEO_SOURCE_GUARD_OK');
