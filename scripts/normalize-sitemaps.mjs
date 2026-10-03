import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');

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

const date = jstDate();
const sitemapFiles = ['sitemap-products.xml', 'sitemap-comparisons.xml'];

for (const name of sitemapFiles) {
  const file = path.join(publicDir, name);
  if (!fs.existsSync(file)) throw new Error(`Missing generated sitemap: ${name}`);
  let xml = fs.readFileSync(file, 'utf8').trim();
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error(`Invalid XML header: ${name}`);
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error(`Invalid sitemap root: ${name}`);
  }
  xml = xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${date}</lastmod>`);
  fs.writeFileSync(file, `${xml}\n`);
}

const robotsPath = path.join(publicDir, 'robots.txt');
let robots = fs.readFileSync(robotsPath, 'utf8').trimEnd();
for (const name of sitemapFiles) {
  const line = `Sitemap: https://minna-hikaku.vercel.app/${name}`;
  if (!robots.includes(line)) robots += `\n${line}`;
}
fs.writeFileSync(robotsPath, `${robots}\n`);

console.log(`Validated generated sitemaps with JST lastmod ${date}`);
