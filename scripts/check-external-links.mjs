import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const strict = process.argv.includes('--strict');
const targetDir = path.resolve(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';
const skipHosts = ['amazon.co.jp','www.amazon.co.jp','rakuten.co.jp','www.rakuten.co.jp','google-analytics.com','www.googletagmanager.com'];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
});

const urls = new Set();
for (const file of walk(targetDir)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/g)) {
    const href = match[1].replace(/&amp;/g, '&');
    if (href.startsWith(ORIGIN)) continue;
    try {
      const url = new URL(href);
      if (skipHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) continue;
      urls.add(url.href);
    } catch {}
  }
}

const list = [...urls].slice(0, 160);
const broken = [];
const warnings = [];
let cursor = 0;
const worker = async () => {
  while (cursor < list.length) {
    const i = cursor++;
    const url = list[i];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'minna-hikaku-site-health/1.0' } });
      if (response.status === 405) response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { Range: 'bytes=0-0', 'User-Agent': 'minna-hikaku-site-health/1.0' } });
      clearTimeout(timer);
      if (response.status === 404 || response.status === 410) broken.push(`${response.status} ${url}`);
      else if (response.status >= 400) warnings.push(`${response.status} ${url}`);
    } catch (error) {
      warnings.push(`${error?.name || 'error'} ${url}`);
    }
  }
};
await Promise.all(Array.from({ length: 5 }, worker));
console.log(`External source audit checked ${list.length} URLs.`);
if (warnings.length) {
  console.warn(`External warnings (${warnings.length}):`);
  warnings.slice(0, 30).forEach((item) => console.warn(`- ${item}`));
}
if (broken.length) {
  console.error(`Broken external URLs (${broken.length}):`);
  broken.forEach((item) => console.error(`- ${item}`));
  if (strict) process.exit(1);
}
