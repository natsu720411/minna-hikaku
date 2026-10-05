import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.resolve(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';
const errors = [];
const warnings = [];

const walk = (dir, ext = '.html') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full, ext);
  return entry.isFile() && entry.name.endsWith(ext) ? [full] : [];
});

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);
const htmlFiles = walk(targetDir);
const redirects = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).redirects || []; }
  catch { return []; }
})();
const redirectPrefixes = redirects.map((r) => String(r.source || '').split('/:path*')[0]).filter(Boolean);

const existsForPath = (pathname) => {
  let clean = pathname.split('#')[0].split('?')[0];
  try { clean = decodeURI(clean); } catch {}
  if (!clean.startsWith('/')) return true;
  if (clean.startsWith('/api/')) return true;
  if (redirectPrefixes.some((prefix) => clean.startsWith(prefix))) return true;
  if (clean === '/') return fs.existsSync(path.join(targetDir, 'index.html'));
  const rel = clean.replace(/^\//, '');
  const candidates = clean.endsWith('/')
    ? [path.join(targetDir, rel, 'index.html')]
    : [path.join(targetDir, rel), path.join(targetDir, rel, 'index.html')];
  return candidates.some(fs.existsSync);
};

let internalLinks = 0;
let datedProducts = 0;
for (const file of htmlFiles) {
  const rel = path.relative(targetDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const href = match[1].replace(/&amp;/g, '&');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let local = href;
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith(ORIGIN)) continue;
      try {
        const parsed = new URL(href);
        local = parsed.pathname + parsed.search + parsed.hash;
      } catch { continue; }
    }
    if (!local.startsWith('/')) continue;
    internalLinks += 1;
    if (!existsForPath(local)) errors.push(`${rel}: broken internal link ${local}`);
  }

  const indexable = !/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
  if (indexable) {
    if (!html.includes('property="og:image"')) errors.push(`${rel}: missing og:image`);
    if (!html.includes('name="twitter:image"')) errors.push(`${rel}: missing twitter:image`);
  }

  if (/\/products\/[^/]+\/index\.html$/.test(`/${rel}`)) {
    const dateMatches = [...html.matchAll(/(20\d{2})年(\d{1,2})月(?:(\d{1,2})日)?/g)];
    if (!dateMatches.length) warnings.push(`${rel}: no visible verification/update date found`);
    else {
      datedProducts += 1;
      const latest = dateMatches.map((m) => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3] || 1))).sort((a,b) => b-a)[0];
      const ageDays = Math.floor((Date.now() - latest.getTime()) / 86400000);
      if (ageDays > 120) warnings.push(`${rel}: product information date is ${ageDays} days old`);
    }
  }
}

for (const required of ['privacy/index.html','404.html','og-image.svg']) {
  if (!fs.existsSync(path.join(targetDir, required))) errors.push(`Missing required finishing asset: ${required}`);
}
const sitemap = fs.readFileSync(path.join(targetDir, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('<loc>https://minna-hikaku.vercel.app/privacy/</loc>')) errors.push('sitemap.xml is missing /privacy/.');

const clientMedia = fs.readFileSync(path.join(targetDir, 'product-media.js'), 'utf8');
const serverMedia = fs.readFileSync(path.join(root, 'api/product-media.js'), 'utf8');
for (const term of ['保護フィルム','保護ケース','イヤーピース']) {
  if (!clientMedia.includes(term)) errors.push(`Client media guard lost accessory term: ${term}`);
  if (!serverMedia.includes(term)) errors.push(`Server media guard lost accessory term: ${term}`);
}
if (!/isLikelyProductMatch|matchesProduct/i.test(clientMedia)) warnings.push('Client product-media matching guard could not be recognized.');
if (!serverMedia.includes('brandIsCompatible')) errors.push('Server product-media brand compatibility guard is missing.');

console.log(`Site quality audit: ${htmlFiles.length} HTML files, ${internalLinks} internal links checked, ${datedProducts} dated product pages.`);
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  warnings.slice(0, 40).forEach((warning) => console.warn(`- ${warning}`));
  if (warnings.length > 40) console.warn(`- ...and ${warnings.length - 40} more`);
}
if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  errors.slice(0, 60).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 60) console.error(`- ...and ${errors.length - 60} more`);
  process.exit(1);
}
