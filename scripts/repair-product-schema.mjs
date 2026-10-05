import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.resolve(root, targetName);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
});

const canonicalFor = (html) => html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
  || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
  || '';

const visiblePriceFor = (html) => {
  const patterns = [
    /(?:公式掲載価格|掲載価格|参考価格)\s*[：:]?\s*<[^>]+>\s*([0-9][0-9,]*)円/i,
    /(?:公式掲載価格|掲載価格|参考価格)\s*[：:]?\s*([0-9][0-9,]*)円/i,
    /(?:公式掲載価格|掲載価格|参考価格)[^0-9]{0,80}([0-9][0-9,]*)円/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/,/g, '');
  }
  return '';
};

const hasProductType = (value) => Array.isArray(value) ? value.includes('Product') : value === 'Product';
const replaceProductType = (value) => {
  if (Array.isArray(value)) return value.map((type) => type === 'Product' ? 'Thing' : type);
  return value === 'Product' ? 'Thing' : value;
};

const repairNode = (node, context) => {
  if (Array.isArray(node)) {
    node.forEach((item) => repairNode(item, context));
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (hasProductType(node['@type'])) {
    const hasEligibilityField = Boolean(node.offers || node.review || node.aggregateRating);
    if (!hasEligibilityField) {
      if (context.isProductPage && context.price) {
        if (!node.url && context.canonical) node.url = context.canonical;
        node.offers = {
          '@type': 'Offer',
          url: context.canonical || node.url || undefined,
          priceCurrency: 'JPY',
          price: context.price,
        };
        if (!node.offers.url) delete node.offers.url;
        context.offersAdded += 1;
      } else {
        node['@type'] = replaceProductType(node['@type']);
        delete node.brand;
        delete node.category;
        context.productsDowngraded += 1;
      }
    }
  }

  for (const value of Object.values(node)) repairNode(value, context);
};

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);

let changedFiles = 0;
let offersAdded = 0;
let productsDowngraded = 0;
let jsonErrors = 0;

for (const file of walk(targetDir)) {
  const rel = path.relative(targetDir, file).replace(/\\/g, '/');
  const isProductPage = /(^|\/)products\/[^/]+\/index\.html$/.test(rel);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const canonical = canonicalFor(html);
  const price = isProductPage ? visiblePriceFor(html) : '';
  const context = { isProductPage, canonical, price, offersAdded: 0, productsDowngraded: 0 };

  html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (full, raw) => {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      jsonErrors += 1;
      return full;
    }
    repairNode(data, context);
    return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  });

  if (html !== before) {
    fs.writeFileSync(file, html);
    changedFiles += 1;
  }
  offersAdded += context.offersAdded;
  productsDowngraded += context.productsDowngraded;
}

if (jsonErrors) console.warn(`Product schema repair skipped ${jsonErrors} invalid JSON-LD block(s).`);
console.log(`Product schema repair: ${changedFiles} HTML files changed, ${offersAdded} Offer blocks added, ${productsDowngraded} non-detail Product nodes changed to Thing (${targetName}).`);
