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

const inspectNode = (node, rel) => {
  if (Array.isArray(node)) {
    node.forEach((item) => inspectNode(item, rel));
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
    }
  }

  for (const value of Object.values(node)) inspectNode(value, rel);
};

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);

for (const file of walk(targetDir)) {
  const rel = path.relative(targetDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    jsonBlocks += 1;
    try {
      inspectNode(JSON.parse(match[1].trim()), rel);
    } catch (error) {
      errors.push(`${rel}: invalid JSON-LD (${error.message}).`);
    }
  }
}

console.log(`Product schema validation: ${jsonBlocks} JSON-LD blocks, ${productNodes} Product nodes, ${eligibleProductNodes} eligible Product nodes (${targetName}).`);
if (errors.length) {
  console.error(`Product schema validation failed with ${errors.length} error(s):`);
  errors.slice(0, 60).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 60) console.error(`- ...and ${errors.length - 60} more`);
  process.exit(1);
}
