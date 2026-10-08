import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const ORIGIN = 'https://minna-hikaku.vercel.app';

const jstDate = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name === 'index.html' ? [full] : [];
});

const relativeParts = (file) => path.relative(publicDir, file).replaceAll('\\', '/').split('/');
const urlForFile = (file) => {
  const rel = path.relative(publicDir, file).replaceAll('\\', '/').replace(/index\.html$/, '');
  return `${ORIGIN}/${rel}`;
};

const date = jstDate();
const htmlFiles = walk(publicDir);
const discovered = {
  'sitemap-products.xml': htmlFiles
    .filter((file) => {
      const parts = relativeParts(file);
      return parts.length === 4 && parts[1] === 'products' && parts[3] === 'index.html';
    })
    .map(urlForFile),
  'sitemap-comparisons.xml': htmlFiles
    .filter((file) => {
      const parts = relativeParts(file);
      return parts[1] === 'compare' && parts.at(-1) === 'index.html' && (parts.length === 3 || parts.length === 4);
    })
    .map(urlForFile),
};

for (const [name, discoveredUrls] of Object.entries(discovered)) {
  const file = path.join(publicDir, name);
  if (!fs.existsSync(file)) throw new Error(`Missing generated sitemap: ${name}`);
  const xml = fs.readFileSync(file, 'utf8').trim();
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error(`Invalid XML header: ${name}`);
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) throw new Error(`Invalid sitemap root: ${name}`);

  const existingUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const urls = [...new Set([...existingUrls, ...discoveredUrls])].sort();
  const priority = name === 'sitemap-products.xml' ? '0.7' : '0.72';
  const output = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${date}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(file, output);
  console.log(`${name}: ${urls.length} URLs after discovering ${discoveredUrls.length} generated pages.`);
}

const robotsPath = path.join(publicDir, 'robots.txt');
let robots = fs.readFileSync(robotsPath, 'utf8').trimEnd();
for (const name of Object.keys(discovered)) {
  const line = `Sitemap: ${ORIGIN}/${name}`;
  if (!robots.includes(line)) robots += `\n${line}`;
}
fs.writeFileSync(robotsPath, `${robots}\n`);

console.log(`Validated and completed generated sitemaps with JST lastmod ${date}`);
