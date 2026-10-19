import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv.find(v => v.startsWith('--target='))?.slice(9) || 'dist');
const keys = ['mice','keyboards','external-ssds','microwaves','dehumidifiers'];
const origin = 'https://minna-hikaku.vercel.app';
const fail = (message) => { throw new Error('20-category regression: ' + message); };
const read = (rel) => {
  const file = path.join(dist, rel);
  if (!fs.existsSync(file)) fail('Missing page ' + rel);
  return fs.readFileSync(file, 'utf8');
};
const root = read('index.html');
const directory = read('compare/index.html');
for (const [name, html] of [['homepage',root],['directory',directory]]) {
  if (!html.includes('20カテゴリ・430商品')) fail(name + ' has stale site totals');
}
if (!root.includes('"numberOfItems":20')) fail('Homepage structured data does not list 20 categories');
const productSitemap = read('sitemap-products.xml');
const compareSitemap = read('sitemap-comparisons.xml');
const categorySitemap = read('sitemap-categories.xml');
let totalNewProducts = 0;
for (const key of keys) {
  const html = read(key + '/index.html');
  const match = html.match(/window\.COMPARISON_CONFIG\s*=\s*(\{[^<]+\});\s*<\/script>/);
  if (!match) fail(key + ' is missing working comparison configuration');
  const cfg = JSON.parse(match[1]);
  if (cfg.categoryKey !== key || cfg.products.length !== 20) fail(key + ' has an incorrect product count');
  if (new Set(cfg.products.map(p => p.id)).size !== 20) fail(key + ' has duplicate product IDs');
  if (!Array.isArray(cfg.priorities) || cfg.priorities.length === 0) fail(key + ' has no interactive ranking criteria');
  for (const p of cfg.products) {
    if (p.price !== null) fail(key + '/' + p.id + ' has an unverified price');
    if (!p.source.startsWith('https://')) fail(key + '/' + p.id + ' has an invalid official source');
    const rel = key + '/products/' + p.id + '/index.html';
    const detail = read(rel);
    const url = origin + '/' + key + '/products/' + p.id + '/';
    if (!detail.includes(p.name) || !detail.includes(p.source.replaceAll('&','&amp;'))) fail(rel + ' does not match product data');
    if (!detail.includes('catalog-detail-visual')) fail(rel + ' lacks image fallback');
    if (!productSitemap.includes('<loc>' + url + '</loc>')) fail(rel + ' is missing from sitemap');
    totalNewProducts++;
  }
  const direct = read(key + '/compare/index.html');
  const slug = cfg.products[0].id + '-vs-' + cfg.products[1].id;
  const pair = key + '/compare/' + slug + '/index.html';
  const pairHtml = read(pair);
  if (!direct.includes('/' + key + '/compare/' + slug + '/') || !pairHtml.includes(cfg.products[0].name) || !pairHtml.includes(cfg.products[1].name)) fail(key + ' pair comparison does not match product data');
  if (!compareSitemap.includes('<loc>' + origin + '/' + key + '/compare/' + slug + '/</loc>')) fail(key + ' pair comparison is missing from sitemap');
  if (!categorySitemap.includes('<loc>' + origin + '/' + key + '/</loc>')) fail(key + ' category is missing from sitemap');
  if (!root.includes('/' + key + '/') || !directory.includes('/' + key + '/')) fail(key + ' navigation is missing');
}
if (totalNewProducts !== 100) fail('New catalog product count does not total 100');
const media = read('market-links.js');
if (!media.includes('heading.innerText || heading.textContent')) fail('Compare-page link rendering regression');
const comparisonJs = read('category-comparison.js');
if (!comparisonJs.includes('const priceOptions = cfg.products.some')) fail('No-price sort control regression');
if (!comparisonJs.includes('catalog-product-visual') || !comparisonJs.includes('const imageIcons')) fail('Comparison cards lack product photo slots');
const productMedia = read('product-media.js');
if (!productMedia.includes('enhanceCompareGallery') || !productMedia.includes('api-compare-gallery')) fail('Two-product image layout is missing');
console.log('20-category smoke checks passed: 20 categories, 430 site products, 100 new-category details, comparison pages, source links, sitemaps and navigation.');
