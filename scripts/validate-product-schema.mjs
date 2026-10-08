import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.resolve(root, targetName);
const errors = [];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
});

const hasProductType = (value) => Array.isArray(value) ? value.includes('Product') : value === 'Product';
const validOffer = (offer) => {
  if (Array.isArray(offer)) return offer.some(validOffer);
  if (!offer || typeof offer !== 'object') return false;
  if (offer['@type'] && offer['@type'] !== 'Offer' && offer['@type'] !== 'AggregateOffer') return false;
  if (offer['@type'] === 'AggregateOffer') return Boolean(offer.priceCurrency && (offer.lowPrice || offer.highPrice));
  return Boolean(offer.priceCurrency && offer.price !== undefined && offer.price !== null && String(offer.price).trim());
};

let productNodes = 0;
let eligibleProductNodes = 0;
let jsonBlocks = 0;
let visibleOfferPriceChecks = 0;

const offerPrices = (offer) => {
  if (Array.isArray(offer)) return offer.flatMap(offerPrices);
  if (!offer || typeof offer !== 'object') return [];
  return [offer.price, offer.lowPrice, offer.highPrice].filter((value) => value !== undefined && value !== null && String(value).trim());
};

const visibleTextForPrice = (html) => html
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/,/g, '')
  .replace(/\s+/g, '');

const inspectNode = (node, rel, html) => {
  if (Array.isArray(node)) {
    node.forEach((item) => inspectNode(item, rel, html));
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (hasProductType(node['@type'])) {
    productNodes += 1;
    const hasReview = Boolean(node.review || node.aggregateRating);
    const hasOffer = Boolean(node.offers);
    if (!hasReview && !hasOffer) {
      errors.push(`${rel}: Product JSON-LD is missing offers, review, or aggregateRating (${node.name || 'unnamed Product'}).`);
    } else if (hasOffer && !validOffer(node.offers) && !hasReview) {
      errors.push(`${rel}: Product Offer is missing a valid price/priceCurrency (${node.name || 'unnamed Product'}).`);
    } else {
      eligibleProductNodes += 1;
      if (hasOffer && rel.includes('/products/')) {
        const visible = visibleTextForPrice(html);
        for (const price of offerPrices(node.offers)) {
          const normalized = String(price).replace(/[^0-9.]/g, '').replace(/\.0+$/, '');
          if (!normalized) continue;
          visibleOfferPriceChecks += 1;
          const integer = normalized.split('.')[0];
          if (!visible.includes(integer)) {
            errors.push(`${rel}: Product Offer price ${price} is not visible in the page content (${node.name || 'unnamed Product'}).`);
          }
        }
      }
    }
  }

  for (const value of Object.values(node)) inspectNode(value, rel, html);
};

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);

for (const file of walk(targetDir)) {
  const rel = path.relative(targetDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    jsonBlocks += 1;
    try {
      inspectNode(JSON.parse(match[1].trim()), rel, html);
    } catch (error) {
      errors.push(`${rel}: invalid JSON-LD (${error.message}).`);
    }
  }
}

console.log(`Product schema validation: ${jsonBlocks} JSON-LD blocks, ${productNodes} Product nodes, ${eligibleProductNodes} eligible Product nodes, ${visibleOfferPriceChecks} visible Offer price checks (${targetName}).`);
if (errors.length) {
  console.error(`Product schema validation failed with ${errors.length} error(s):`);
  errors.slice(0, 60).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 60) console.error(`- ...and ${errors.length - 60} more`);
  process.exit(1);
}
