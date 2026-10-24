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
for (const key of ['mobile-batteries','smartphones']) {
  const html = read(key + '/index.html');
  if (!html.includes('legacy-product-visual')) fail(key + ' catalog has no product image slots');
}
const earphonesHub = read('earphones/index.html');
if (!earphonesHub.includes('/earphones/products/')) fail('Earphone product guide list is missing');
if (!productMedia.includes('enhanceEarphoneHub()') || !productMedia.includes('legacyVisual = card.querySelector')) fail('Legacy and earphone image integration missing');
if (!productMedia.includes('loadCachedLookup') || !productMedia.includes("fetchLookup(key, 'rakuten')")) fail('Rakuten-only product media lookup or cache is missing');
if (productMedia.includes("'ケーブル','usbケーブル'") || productMedia.includes("'ケース','カバー'") || productMedia.includes("'バンド','ベルト'")) fail('Legitimate cable-integrated or watch-band products would be blocked as accessories');
const serverMedia = fs.readFileSync(path.resolve('api/product-media.js'),'utf8');
if (!serverMedia.includes('ankerzolopowerbank10000') || !serverMedia.includes("requiredTerms: ['30W','A1688']")) fail('Anker Zolo 10000mAh/30W image lookup must remain exact');
if (!serverMedia.includes('logicoolmxkeyss') || !serverMedia.includes("requiredTerms: ['MX Keys S']")) fail('Keyboard keyword lookup must distinguish MX Keys S');
const linkStyles = read('category-comparison.css');
if (!linkStyles.includes('.rank-links .detail-link') || !linkStyles.includes('.rank-links .source-link')) fail('Missing separated product/detail links');

const windsorChecks = [
  ['earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/index.html','earfun-vs-liberty','差額5,000円'],
  ['smartphones/compare/iphone-17-pro-vs-xperia-1-viii/index.html','iphone-xperia','/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/'],
  ['smartwatches/iphone/index.html','watch-iphone','/smartwatches/fast-charging-ios/'],
  ['smartwatches/battery/index.html','watch-battery','/smartwatches/iphone/'],
  ['earphones/index.html','earphone-discovery','/earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/'],
];
for(const [file,marker,expected] of windsorChecks){
  const html = read(file);
  if(!html.includes('data-windsor-focus="'+marker+'"')) fail('Windsor/GSC landing-page patch missing: '+file);
  if(!html.includes(expected)) fail('Windsor/GSC content or navigation missing: '+file);
}
const affiliateJs = read('market-links.js');
const fixedAffiliate = 'https://hb.afl.rakuten.co.jp/ichiba/58c41089.9dd88c19.58c4108a.3dd87233/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ftry3%2F4571411228452%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsImFtcCI6ZmFsc2V9';
if (!affiliateJs.includes(fixedAffiliate) ||
    !affiliateJs.includes("verifiedRakutenUrl(name)") ||
    !affiliateJs.includes("link.dataset.verifiedAffiliate === '1'")) fail('Soundcore Liberty 5 Rakuten direct affiliate URL missing or may be overwritten');
if (!productMedia.includes("button.dataset.verifiedAffiliate === '1'")) fail('Dynamic Rakuten media must not overwrite the verified product affiliate URL');
if (!fixedAffiliate.startsWith('https://hb.afl.rakuten.co.jp/ichiba/') ||
    !fixedAffiliate.includes('4571411228452') ||
    !fixedAffiliate.includes('link_type=hybrid_url')) fail('Unexpected manually verified product affiliate URL');
const searchIndex = JSON.parse(read('product-catalog.json'));
if (searchIndex.length !== 430) fail('Global product search must contain 430 products');
if (new Set(searchIndex.map(p => p.url)).size !== 430) fail('Global search has duplicate URLs');
if (new Set(searchIndex.map(p => p.category)).size !== 20) fail('Global search must include 20 categories');
for (const p of searchIndex) if (!p.name || !p.url || !p.category || !p.url.startsWith('/'+p.category+'/products/')) fail('Malformed cross-category search record');
for (const f of ['index.html','earphones/index.html','smartphones/index.html','smartwatches/index.html','mice/index.html','earphones/products/soundcore-liberty-5/index.html']) {
  const html = read(f);
  if (!html.includes('src="/site-experience.js"') || !html.includes('href="/site-experience.css"')) fail('Usability layer missing from '+f);
}
// Every indexed product must offer Rakuten image retrieval and a graceful fallback.
let preparedDetailPages = 0;
for (const p of searchIndex) {
  const html = read(p.url.replace(/^\//,'') + 'index.html');
  if (!html.includes('src="/market-links.js"') ||
      !html.includes('src="/site-experience.js"')) fail('Rakuten media scripts missing: '+p.url);
  if (!html.includes('class="product-visual') && !html.includes(' catalog-detail-visual'))
    fail('Product image fallback not generated: '+p.url);
  preparedDetailPages++;
}
if (preparedDetailPages !== 430) fail('Rakuten coverage must span all 430 product pages');
const rakutenApi = read('market-links.js');
if (!rakutenApi.includes("if (link.textContent !== label) link.textContent = label")) fail('Affiliate observer must not trigger an infinite DOM update loop');
if (!rakutenApi.includes("media.dataset.affiliate !== 'rakuten'") ||
    !rakutenApi.includes("link.dataset.verifiedAffiliate === '1'") ||
    !rakutenApi.includes("const rakutenUrl = (name) => verifiedRakutenUrl(name) || `/rakuten/?q="))
  fail('Rakuten links must use verified affiliate destinations or the internal gateway');
const serverRakuten = fs.readFileSync(path.resolve('api/product-media.js'),'utf8');
if (!serverRakuten.includes('searchRakutenProductSafely') || !serverRakuten.includes("startsWith('rakuten_product_400')")) fail('Invalid product API keyword should retry item API');
if (serverRakuten.includes("url.searchParams.set('imageFlag', '1')"))
  fail('Affiliate-only listings without photos must remain searchable');
if (!serverRakuten.includes("!safeAffiliateUrl(item.affiliateUrl, affiliateId)"))
  fail('Rakuten no-image matches require a verified affiliate URL');
if (!serverRakuten.includes("code === 'rakuten_no_result' || code === 'rakuten_no_safe_result'"))
  fail('No-match errors should not be reported as upstream 502 failures');
if (!serverRakuten.includes('rakutenAffiliate: Boolean') ||
    !serverRakuten.includes('safeAffiliateUrl') ||
    !serverRakuten.includes('isAffiliate: Boolean(affiliateUrl)'))
  fail('Rakuten API commission attribution missing');
const mediaFrontend = read('product-media.js');
if (mediaFrontend.includes("cache.set(key, result);\n      if (result) saveCachedLookup"))
  fail('Negative Rakuten lookups may be stuck in browser cache');
if (!mediaFrontend.includes("fetchLookup(key, 'rakuten')") ||
    !mediaFrontend.includes('window.minnaRakutenMediaLookup = lookup') ||
    !mediaFrontend.includes('realAffiliate') ||
    !mediaFrontend.includes('楽天で見る（PR）') ||
    !mediaFrontend.includes('rakuten-affiliate-disclosure'))
  fail('Rakuten-first product media or search thumbnail hooks missing');
const searchUX = read('site-experience.js');
if (!searchUX.includes('hydrateSearchImages') ||
    !searchUX.includes('data-rakuten-name'))
  fail('Rakuten photo previews missing from cross-category search');
// Do not send any of the 430 products to an untracked Rakuten search URL.
const redirectPage=read('rakuten/index.html');
const redirectLogic=read('rakuten-gateway.js');
if(!redirectPage.includes('src="/rakuten-gateway.js"') ||
   !redirectLogic.includes("url.hostname==='hb.afl.rakuten.co.jp'") ||
   !redirectLogic.includes("location.replace(affiliate)") ||
   !redirectLogic.includes("result?.isAffiliate===true"))
  fail('Affiliate-only gateway must verify a Rakuten-issued tracking URL');
if(rakutenApi.includes('https://search.rakuten.co.jp/search/mall/'))
  fail('Untracked Rakuten search fallback is still used for product buttons');
if(!mediaFrontend.includes('const destination = officialRakutenAffiliate(result)') ||
   !mediaFrontend.includes('link.href = verified || affiliateGateway(name)'))
  fail('Affiliate media could open untracked product URLs');
const searchAffiliateLayer=read('site-experience.js');
if(!searchAffiliateLayer.includes("u.hostname === 'hb.afl.rakuten.co.jp'") ||
   !searchAffiliateLayer.includes("url = '/rakuten/?q='"))
  fail('Global product thumbnails may link to untracked Rakuten product URLs');
for(const item of searchIndex){
  const page = read(item.url.slice(1) + 'index.html');
  if(!page.includes('src="/market-links.js"'))
    fail('430-product affiliate gateway coverage incomplete: '+item.url);
}
const experience = read('site-experience.js');
for (const feature of ['ux-compare-dock','ux-share','ux-fav-btn','product-catalog.json','ux-diff-cell','ux-related','ux-search-launch'])
  if (!experience.includes(feature)) fail('Usability function missing: '+feature);
if (!fs.readFileSync(path.resolve('src/main.jsx'),'utf8').includes('data-ux-priority={primary}')) fail('React ranking share-state missing');
console.log('20-category smoke checks passed: 20 categories, 430 site products, 100 new-category details, comparison pages, source links, sitemaps and navigation.');
