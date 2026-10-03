import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.resolve(root, targetName);
const errors = [];
const read = (rel) => {
  const file = path.join(targetDir, rel);
  if (!fs.existsSync(file)) { errors.push(`Missing: ${rel}`); return ''; }
  return fs.readFileSync(file, 'utf8');
};

const critical = [
  'index.html', 'compare/index.html',
  'earphones/index.html', 'mobile-batteries/index.html', 'smartphones/index.html',
  'smartwatches/index.html', 'tablets/index.html', 'chargers/index.html',
  'earphones/compare/index.html', 'mobile-batteries/compare/index.html', 'smartphones/compare/index.html',
  'smartwatches/compare/index.html', 'tablets/compare/index.html', 'chargers/compare/index.html',
  'sitemap.xml', 'sitemap-products.xml', 'sitemap-comparisons.xml', 'robots.txt',
];
critical.forEach(read);

const rootHtml = read('index.html');
if (rootHtml.includes('主要8')) errors.push('Homepage still contains outdated 「主要8」 copy.');
if (!rootHtml.includes('モバイルバッテリー・スマホ')) errors.push('Homepage title is missing mobile-battery coverage.');
if (!rootHtml.includes('aria-label="カテゴリ別の直接比較一覧"')) errors.push('Homepage static shell is missing comparison-hub links.');

const compareHtml = read('compare/index.html');
for (const segment of ['earphones','mobile-batteries','smartphones','smartwatches','tablets','chargers']) {
  if (!compareHtml.includes(`/${segment}/`)) errors.push(`/compare/ is missing ${segment} navigation.`);
}
if (!compareHtml.includes('rel="canonical" href="https://minna-hikaku.vercel.app/compare/"')) errors.push('/compare/ canonical is missing.');

const comparisons = read('sitemap-comparisons.xml');
const comparisonLocs = [...comparisons.matchAll(/<loc>/g)].length;
if (comparisonLocs < 78) errors.push(`Expected at least 78 comparison sitemap URLs, found ${comparisonLocs}.`);

const products = read('sitemap-products.xml');
const productLocs = [...products.matchAll(/<loc>/g)].length;
if (productLocs < 60) errors.push(`Expected at least 60 product sitemap URLs, found ${productLocs}.`);

const sitemap = read('sitemap.xml');
if (!sitemap.includes('<loc>https://minna-hikaku.vercel.app/compare/</loc>')) errors.push('sitemap.xml is missing /compare/.');

const robots = read('robots.txt');
for (const name of ['sitemap.xml','sitemap-guides.xml','sitemap-categories.xml','sitemap-products.xml','sitemap-comparisons.xml']) {
  if (!robots.includes(name)) errors.push(`robots.txt is missing ${name}.`);
}

if (errors.length) {
  console.error('Generated-site validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Generated-site validation passed: ${comparisonLocs} comparison URLs, ${productLocs} product URLs.`);
