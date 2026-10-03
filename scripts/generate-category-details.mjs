import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.join(root, targetName);

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

const makeJsonLd = (p, key, meta, canonical, description) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {'@type': 'Product', name: p.name, brand: {'@type': 'Brand', name: p.brand}, category: meta.label, description, url: canonical},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'トップ', item: 'https://minna-hikaku.vercel.app/'},
      {'@type': 'ListItem', position: 2, name: `${meta.label}比較`, item: `https://minna-hikaku.vercel.app/${key}/`},
      {'@type': 'ListItem', position: 3, name: p.name, item: canonical},
    ]},
  ],
}).replace(/</g, '\\u003c');

const renderPage = (p, key, meta) => {
  const canonical = `https://minna-hikaku.vercel.app/${key}/products/${encodeURIComponent(p.id)}/`;
  const description = productDescription(p, meta);
  const specValues = meta.specs.map(([, specKey]) => p.facts?.[specKey]).filter(Boolean);
  const titleBits = specValues.slice(0, 2).join('・');
  const title = `${p.name}を比較${titleBits ? `｜${titleBits}` : ''} 2026｜みんなの比較表`;
  const specs = meta.specs.map(([label, specKey]) => `<li>${escapeHtml(label)}：${escapeHtml(p.facts?.[specKey] || '公式仕様で確認')}</li>`).join('');
  const criteria = meta.criteria.map(([label, copy]) => `<div class="criteria-card"><b>${escapeHtml(label)}</b><p>${escapeHtml(copy(p))}</p></div>`).join('');
  const guides = meta.guides.slice(0, 3).map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('');
  const badges = (p.badges || []).slice(0, 3).join('・');
  const lead = `${p.name}は、${badges || specValues.slice(0, 3).join('・')}を比較材料にできる${meta.label}です。重視する条件に合わせて、同カテゴリのほかの候補との違いを確認できます。`;
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><script type="application/ld+json">${makeJsonLd(p, key, meta, canonical, description)}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.compareLabel)}</a><a href="${meta.guides[0][0]}">${escapeHtml(meta.guides[0][1])}</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › ${escapeHtml(p.name)}</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(p.name)}</h1><p class="lead">${escapeHtml(lead)}</p><div class="summary-box"><h2>主な比較仕様</h2><ul>${specs}<li>掲載価格：${escapeHtml(formatPrice(p.price))}</li></ul></div><h2>比較するときのポイント</h2><div class="criteria-grid">${criteria}</div><a class="official" href="${escapeHtml(p.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.brand)}公式仕様を確認 ↗</a><div class="cta"><h2>${escapeHtml(meta.compareLabel)}の中で比較</h2><p>${escapeHtml(meta.comparePoints)}を条件別に比較できます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div><h2>関連ガイド</h2><div class="related">${guides}</div><p class="note">仕様・価格は変更される場合があります。購入前に${escapeHtml(p.brand)}公式情報をご確認ください。</p></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a> ｜ <a href="/affiliate-disclosure/">広告・アフィリエイト方針</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
};

fs.mkdirSync(targetDir, { recursive: true });
const productUrls = [];
let count = 0;
for (const [key, meta] of Object.entries(categories)) {
  const cfg = loadComparisonConfig(key);
  for (const product of cfg.products) {
    const dir = path.join(targetDir, key, 'products', product.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderPage(product, key, meta));
    productUrls.push(`https://minna-hikaku.vercel.app/${key}/products/${product.id}/`);
    count += 1;
  }
}

const lastmod = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${productUrls.map((url) => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(targetDir, 'sitemap-products.xml'), sitemap);

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
  const productsSitemap = 'Sitemap: https://minna-hikaku.vercel.app/sitemap-products.xml';
  if (!robots.includes(productsSitemap)) robots += `\n${productsSitemap}`;
  fs.writeFileSync(robotsPath, `${robots}\n`);
}

console.log(`Generated ${count} category product detail pages and sitemap-products.xml in ${targetName}`);
