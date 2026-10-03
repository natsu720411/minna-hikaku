import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.join(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';

const categories = {
  smartwatches: {
    label: 'スマートウォッチ', compareLabel: '20モデルを比較',
    specs: [['ケース・サイズ', 'size'], ['重量', 'weight'], ['バッテリー', 'batteryText'], ['対応スマホ', 'compat']],
    criteria: [
      ['装着感', (p) => `${p.facts?.size || 'サイズ'}・${p.facts?.weight || '重量'}を、毎日着けるときの使いやすさで比較できます。`],
      ['バッテリー', (p) => `${p.facts?.batteryText || '公称バッテリー'}を基準に、充電頻度の違いを確認できます。`],
      ['対応スマホ', (p) => `${p.facts?.compat || '対応OS'}を確認し、手持ちのスマートフォンとの組み合わせで選べます。`],
    ],
    guides: [['/smartwatches/iphone/', '🍎 iPhone向け'], ['/smartwatches/android/', '🤖 Android向け'], ['/smartwatches/battery/', '🔋 バッテリー重視'], ['/smartwatches/sports/', '🏃 スポーツ向け']],
    comparePoints: '健康管理・スポーツ・バッテリー・軽さ・スマート機能・コスパ',
    comparisonPairs: [
      ['apple-watch-series-11-42', 'pixel-watch-4-41'],
      ['apple-watch-series-11-42', 'galaxy-watch8-40'],
      ['garmin-venu-4-41', 'huawei-watch-fit-4-pro'],
      ['galaxy-watch8-44', 'pixel-watch-4-45'],
    ],
  },
  tablets: {
    label: 'タブレット', compareLabel: '20モデルを比較',
    specs: [['画面', 'displayText'], ['重量', 'weight'], ['ストレージ', 'storageText'], ['ペン', 'penText']],
    criteria: [
      ['画面', (p) => `${p.facts?.displayText || '画面仕様'}を、動画・ノート・作業領域の使いやすさで比較できます。`],
      ['持ち運び', (p) => `${p.facts?.weight || '重量'}を基準に、ケースやキーボードを含めた持ち運びやすさを確認できます。`],
      ['保存・ペン', (p) => `${p.facts?.storageText || 'ストレージ'}・${p.facts?.penText || 'ペン対応'}を、勉強や制作用途に合わせて比較できます。`],
    ],
    guides: [['/tablets/student/', '🎓 大学生・勉強向け'], ['/tablets/drawing/', '✏️ ペン・お絵描き向け'], ['/tablets/lightweight/', '🪶 軽量モデル'], ['/tablets/gaming/', '🎮 ゲーム向け']],
    comparePoints: '性能・画面・軽さ・ストレージ・ペン対応・コスパ',
    comparisonPairs: [
      ['ipad-a16', 'galaxy-tab-s10-fe'],
      ['ipad-mini-a17-pro', 'lenovo-legion-tab'],
      ['ipad-pro-m5-11', 'galaxy-tab-s11'],
      ['xiaomi-pad-7', 'huawei-matepad-115'],
    ],
  },
  chargers: {
    label: 'USB充電器', compareLabel: '20製品を比較',
    specs: [['最大出力', 'powerText'], ['ポート', 'portsText'], ['重量', 'weight'], ['特徴', 'feature']],
    criteria: [
      ['出力', (p) => `${p.facts?.powerText || '最大出力'}を、スマホ・タブレット・ノートPCの必要W数と照らして比較できます。`],
      ['ポート数', (p) => `${p.facts?.portsText || 'ポート構成'}を確認し、同時に充電したい機器の数で選べます。`],
      ['持ち運び', (p) => `${p.facts?.weight || '重量'}・${p.facts?.feature || '本体特徴'}を、通学や旅行での携帯性と合わせて比較できます。`],
    ],
    guides: [['/chargers/iphone/', '🍎 iPhone向け'], ['/chargers/laptop/', '💻 ノートPC向け'], ['/chargers/compact/', '🧳 小型・軽量'], ['/chargers/multiport/', '🔌 複数ポート']],
    comparePoints: '最大出力・ポート数・軽さ・コンパクトさ・対応力・コスパ',
    comparisonPairs: [
      ['anker-nano-70-3port', 'cio-trio-67'],
      ['anker-prime-100', 'cio-quad2-100'],
      ['anker-511-30', 'anker-nano-45-display'],
      ['ugreen-nexode-pro-65', 'belkin-boostcharge-pro-65-dual'],
    ],
  },
};

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const formatPrice = (price) => Number.isFinite(price) ? `${price.toLocaleString('ja-JP')}円` : 'メーカー公式で確認';

const loadComparisonConfig = (key) => {
  const file = path.join(publicDir, key, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/window\.COMPARISON_CONFIG=({[\s\S]*?});<\/script>/);
  if (!match) throw new Error(`COMPARISON_CONFIG not found: ${file}`);
  return vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 1000 });
};

const productDescription = (p, meta) => {
  const values = meta.specs.map(([, key]) => p.facts?.[key]).filter(Boolean).slice(0, 4);
  return `${p.name}の${values.join('、')}を整理。${meta.label}の比較表と目的別ガイドから、ほかの候補との違いを確認できます。`;
};

const productUrl = (key, id) => `/${key}/products/${encodeURIComponent(id)}/`;
const compareSlug = (a, b) => `${a}-vs-${b}`;
const compareUrl = (key, slug) => `/${key}/compare/${slug}/`;
const normalizedPairKey = (a, b) => [a, b].sort().join('::');

const makeJsonLd = (p, key, meta, canonical, description) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {'@type': 'Product', name: p.name, brand: {'@type': 'Brand', name: p.brand}, category: meta.label, description, url: canonical},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'トップ', item: `${ORIGIN}/`},
      {'@type': 'ListItem', position: 2, name: `${meta.label}比較`, item: `${ORIGIN}/${key}/`},
      {'@type': 'ListItem', position: 3, name: p.name, item: canonical},
    ]},
  ],
}).replace(/</g, '\\u003c');

const productDistance = (a, b) => {
  const keys = [...new Set([...Object.keys(a.scores || {}), ...Object.keys(b.scores || {})])];
  const distance = keys.reduce((sum, key) => sum + Math.abs(Number(a.scores?.[key] || 0) - Number(b.scores?.[key] || 0)), 0);
  const brandPenalty = a.brand === b.brand ? 12 : 0;
  return distance + brandPenalty;
};

const relatedProducts = (p, products) => products
  .filter((candidate) => candidate.id !== p.id)
  .map((candidate) => ({ candidate, distance: productDistance(p, candidate) }))
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 3)
  .map(({ candidate }) => candidate);

const renderPage = (p, key, meta, products, pairMap) => {
  const canonical = `${ORIGIN}${productUrl(key, p.id)}`;
  const description = productDescription(p, meta);
  const specValues = meta.specs.map(([, specKey]) => p.facts?.[specKey]).filter(Boolean);
  const titleBits = specValues.slice(0, 2).join('・');
  const title = `${p.name}を比較${titleBits ? `｜${titleBits}` : ''} 2026｜みんなの比較表`;
  const specs = meta.specs.map(([label, specKey]) => `<li>${escapeHtml(label)}：${escapeHtml(p.facts?.[specKey] || '公式仕様で確認')}</li>`).join('');
  const criteria = meta.criteria.map(([label, copy]) => `<div class="criteria-card"><b>${escapeHtml(label)}</b><p>${escapeHtml(copy(p))}</p></div>`).join('');
  const guides = meta.guides.slice(0, 3).map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('');
  const badges = (p.badges || []).slice(0, 3).join('・');
  const lead = `${p.name}は、${badges || specValues.slice(0, 3).join('・')}を比較材料にできる${meta.label}です。重視する条件に合わせて、同カテゴリのほかの候補との違いを確認できます。`;
  const related = relatedProducts(p, products).map((item) => {
    const pairSlug = pairMap.get(normalizedPairKey(p.id, item.id));
    const compare = pairSlug ? `<small><a href="${compareUrl(key, pairSlug)}">2製品を直接比較 →</a></small>` : '';
    return `<a href="${productUrl(key, item.id)}"><b>${escapeHtml(item.name)}</b><span>${escapeHtml((item.badges || []).slice(0, 2).join('・'))}</span>${compare}</a>`;
  }).join('');
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><style>.product-related{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0 28px}.product-related>a{display:block;padding:15px;border:1px solid #e1e8f1;border-radius:16px;text-decoration:none;color:inherit;background:#fff}.product-related b,.product-related span,.product-related small{display:block}.product-related span{margin-top:5px;color:#75859b;font-size:12px}.product-related small{margin-top:8px}.product-related small a{color:#0f6cf9;text-decoration:none}@media(max-width:720px){.product-related{grid-template-columns:1fr}}</style><script type="application/ld+json">${makeJsonLd(p, key, meta, canonical, description)}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.compareLabel)}</a><a href="${meta.guides[0][0]}">${escapeHtml(meta.guides[0][1])}</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › ${escapeHtml(p.name)}</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(p.name)}</h1><p class="lead">${escapeHtml(lead)}</p><div class="summary-box"><h2>主な比較仕様</h2><ul>${specs}<li>掲載価格：${escapeHtml(formatPrice(p.price))}</li></ul></div><h2>比較するときのポイント</h2><div class="criteria-grid">${criteria}</div><a class="official" href="${escapeHtml(p.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.brand)}公式仕様を確認 ↗</a><div class="cta"><h2>${escapeHtml(meta.compareLabel)}の中で比較</h2><p>${escapeHtml(meta.comparePoints)}を条件別に比較できます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div><h2>似ている商品</h2><div class="product-related">${related}</div><h2>関連ガイド</h2><div class="related">${guides}</div><p class="note">仕様・価格は変更される場合があります。購入前に${escapeHtml(p.brand)}公式情報をご確認ください。</p></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a> ｜ <a href="/affiliate-disclosure/">広告・アフィリエイト方針</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
};

const compareJsonLd = (a, b, key, meta, canonical) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {'@type': 'WebPage', name: `${a.name}と${b.name}を比較`, url: canonical},
    {'@type': 'ItemList', numberOfItems: 2, itemListElement: [
      {'@type': 'ListItem', position: 1, item: {'@type': 'Product', name: a.name, brand: {'@type': 'Brand', name: a.brand}}},
      {'@type': 'ListItem', position: 2, item: {'@type': 'Product', name: b.name, brand: {'@type': 'Brand', name: b.brand}}},
    ]},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'トップ', item: `${ORIGIN}/`},
      {'@type': 'ListItem', position: 2, name: `${meta.label}比較`, item: `${ORIGIN}/${key}/`},
      {'@type': 'ListItem', position: 3, name: `${a.name}と${b.name}を比較`, item: canonical},
    ]},
  ],
}).replace(/</g, '\\u003c');

const renderComparePage = (a, b, key, meta, slug) => {
  const canonical = `${ORIGIN}${compareUrl(key, slug)}`;
  const title = `${a.name}と${b.name}を比較 2026｜${meta.label}｜みんなの比較表`;
  const description = `${a.name}と${b.name}の${meta.specs.map(([label]) => label).join('・')}、価格、特徴を横並びで比較。どこが違うかを確認できます。`;
  const rows = [
    ['掲載価格', formatPrice(a.price), formatPrice(b.price)],
    ...meta.specs.map(([label, specKey]) => [label, a.facts?.[specKey] || '公式仕様で確認', b.facts?.[specKey] || '公式仕様で確認']),
  ].map(([label, av, bv]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(av)}</td><td>${escapeHtml(bv)}</td></tr>`).join('');
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><style>.pair-table{width:100%;border-collapse:collapse;margin:18px 0 26px}.pair-table th,.pair-table td{padding:12px;border:1px solid #dfe7f1;text-align:left;vertical-align:top}.pair-head{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.pair-head a{display:block;padding:16px;border:1px solid #dfe7f1;border-radius:16px;text-decoration:none;color:inherit;background:#fff}.pair-head b,.pair-head span{display:block}.pair-head span{margin-top:5px;color:#75859b;font-size:12px}@media(max-width:680px){.pair-head{grid-template-columns:1fr}.pair-table{font-size:13px}}</style><script type="application/ld+json">${compareJsonLd(a, b, key, meta, canonical)}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.compareLabel)}</a><a href="${meta.guides[0][0]}">${escapeHtml(meta.guides[0][1])}</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › 2製品比較</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(a.name)} と ${escapeHtml(b.name)}を比較</h1><p class="lead">どちらかを一方的におすすめするのではなく、仕様と特徴の違いを横並びで確認できる比較ページです。</p><div class="pair-head"><a href="${productUrl(key, a.id)}"><b>${escapeHtml(a.name)}</b><span>${escapeHtml((a.badges || []).slice(0, 3).join('・'))}</span></a><a href="${productUrl(key, b.id)}"><b>${escapeHtml(b.name)}</b><span>${escapeHtml((b.badges || []).slice(0, 3).join('・'))}</span></a></div><div class="table-scroll"><table class="pair-table"><thead><tr><th>比較項目</th><th>${escapeHtml(a.name)}</th><th>${escapeHtml(b.name)}</th></tr></thead><tbody>${rows}</tbody></table></div><h2>比較するときの見方</h2><div class="criteria-grid"><div class="criteria-card"><b>使う機器・用途</b><p>${escapeHtml(meta.comparePoints)}のうち、自分が重視する項目を先に決めると比較しやすくなります。</p></div><div class="criteria-card"><b>価格</b><p>販売価格は変動するため、購入時点のAmazon・楽天・メーカー公式の価格を確認してください。</p></div><div class="criteria-card"><b>公式仕様</b><p>同じシリーズでも容量・サイズ・通信方式などで仕様が異なる場合があります。</p></div></div><div class="cta"><h2>20製品の中から条件で探す</h2><p>予算や重視ポイントを変えながら、ほかの候補も比較できます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a> ｜ <a href="/affiliate-disclosure/">広告・アフィリエイト方針</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
};

const rewriteCategoryPage = (key, cfg, meta, pairMap) => {
  const file = path.join(targetDir, key, 'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  let productIndex = 0;
  html = html.replace(/(<div class="static-product-grid">)([\s\S]*?)(<\/div><\/section>)/, (whole, open, inner, close) => {
    const rewritten = inner.replace(/<a href="[^"]+" target="_blank" rel="noopener noreferrer">/g, (match) => {
      const p = cfg.products[productIndex++];
      return p ? `<a href="${productUrl(key, p.id)}">` : match;
    });
    return `${open}${rewritten}${close}`;
  });

  const cards = (meta.comparisonPairs || []).map(([aId, bId]) => {
    const a = cfg.products.find((p) => p.id === aId);
    const b = cfg.products.find((p) => p.id === bId);
    if (!a || !b) return '';
    const slug = pairMap.get(normalizedPairKey(a.id, b.id));
    return `<a class="discovery-card" href="${compareUrl(key, slug)}"><b>${escapeHtml(a.name)} vs ${escapeHtml(b.name)}</b><small>仕様を横並びで比較</small></a>`;
  }).join('');
  const comparisonSection = `<section class="discovery-block"><h2>2製品を直接比較</h2><div class="discovery-grid">${cards}</div></section>`;
  if (!html.includes('<h2>2製品を直接比較</h2>')) {
    html = html.replace('<section class="category-other">', `${comparisonSection}<section class="category-other">`);
  }

  fs.writeFileSync(file, html);
};

fs.mkdirSync(targetDir, { recursive: true });
const productUrls = [];
const comparisonUrls = [];
let productCount = 0;
let comparisonCount = 0;

for (const [key, meta] of Object.entries(categories)) {
  const cfg = loadComparisonConfig(key);
  const pairMap = new Map();
  for (const [aId, bId] of meta.comparisonPairs || []) {
    const slug = compareSlug(aId, bId);
    pairMap.set(normalizedPairKey(aId, bId), slug);
  }

  for (const product of cfg.products) {
    const dir = path.join(targetDir, key, 'products', product.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderPage(product, key, meta, cfg.products, pairMap));
    productUrls.push(`${ORIGIN}${productUrl(key, product.id)}`);
    productCount += 1;
  }

  for (const [aId, bId] of meta.comparisonPairs || []) {
    const a = cfg.products.find((p) => p.id === aId);
    const b = cfg.products.find((p) => p.id === bId);
    if (!a || !b) continue;
    const slug = pairMap.get(normalizedPairKey(a.id, b.id));
    const dir = path.join(targetDir, key, 'compare', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderComparePage(a, b, key, meta, slug));
    comparisonUrls.push(`${ORIGIN}${compareUrl(key, slug)}`);
    comparisonCount += 1;
  }

  rewriteCategoryPage(key, cfg, meta, pairMap);
}

const lastmod = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
const makeSitemap = (urls, priority) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(targetDir, 'sitemap-products.xml'), makeSitemap(productUrls, '0.7'));
fs.writeFileSync(path.join(targetDir, 'sitemap-comparisons.xml'), makeSitemap(comparisonUrls, '0.75'));

const comparisonPath = path.join(targetDir, 'category-comparison.js');
if (!fs.existsSync(comparisonPath)) throw new Error(`Missing ${comparisonPath}`);
let comparisonJs = fs.readFileSync(comparisonPath, 'utf8');
const before = comparisonJs;
comparisonJs = comparisonJs.replace(/  const detailIds = \{[\s\S]*?  const hasDetail = \(p\) => detailIds\[cfg\.categoryKey\]\?\.has\(p\.id\) \|\| false;\n/, "  const hasDetail = () => ['smartwatches','tablets','chargers'].includes(cfg.categoryKey);\n");
if (comparisonJs === before && !comparisonJs.includes("const hasDetail = () => ['smartwatches','tablets','chargers'].includes(cfg.categoryKey)")) {
  throw new Error('Could not enable detail links for all category products');
}
fs.writeFileSync(comparisonPath, comparisonJs);

const robotsPath = path.join(targetDir, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  let robots = fs.readFileSync(robotsPath, 'utf8').trimEnd();
  const sitemaps = [
    'Sitemap: https://minna-hikaku.vercel.app/sitemap-products.xml',
    'Sitemap: https://minna-hikaku.vercel.app/sitemap-comparisons.xml',
  ];
  for (const sitemap of sitemaps) if (!robots.includes(sitemap)) robots += `\n${sitemap}`;
  fs.writeFileSync(robotsPath, `${robots}\n`);
}

console.log(`Generated ${productCount} product detail pages, ${comparisonCount} comparison pages, and sitemaps in ${targetName}`);
