import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'public';
const targetDir = path.resolve(root, targetName);

const CATEGORY_LABELS = {
  'earphones':'ワイヤレスイヤホン',
  'mobile-batteries':'モバイルバッテリー',
  'smartphones':'スマートフォン',
  'smartwatches':'スマートウォッチ',
  'tablets':'タブレット',
  'chargers':'USB充電器',
  'laptops':'ノートPC',
  'monitors':'PCモニター',
  'routers':'Wi-Fiルーター',
  'electric-toothbrushes':'電動歯ブラシ',
  'hair-dryers':'ヘアドライヤー',
  'cordless-vacuums':'コードレス掃除機',
  'robot-vacuums':'ロボット掃除機',
  'air-purifiers':'空気清浄機',
  'rice-cookers':'炊飯器',
};

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name === 'index.html' ? [full] : [];
});

const rel = (file) => path.relative(targetDir, file).replace(/\\/g, '/');
const strip = (html) => String(html || '')
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

const cap = (text, max) => text.length <= max ? text : text.slice(0, Math.max(1, max - 1)).replace(/[・、\s]+$/, '') + '…';

const productFiles = walk(targetDir).filter((file) => {
  const parts = rel(file).split('/');
  return parts.length === 4 && parts[1] === 'products' && parts[3] === 'index.html';
});

const jsonLdBlocks = (html) => {
  const nodes = [];
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { nodes.push(JSON.parse(match[1].trim())); } catch (_) {}
  }
  return nodes;
};

const findProductNode = (node) => {
  if (Array.isArray(node)) {
    for (const value of node) {
      const found = findProductNode(value);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  const type = node['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return node;
  for (const value of Object.values(node)) {
    const found = findProductNode(value);
    if (found) return found;
  }
  return null;
};

const getName = (html) => strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '')
  .replace(/\s*を比較\s*$/, '')
  .replace(/\s*詳細\s*$/, '')
  .trim();

const getBrand = (html) => {
  for (const block of jsonLdBlocks(html)) {
    const product = findProductNode(block);
    if (!product?.brand) continue;
    const brand = typeof product.brand === 'string' ? product.brand : product.brand.name;
    if (brand) return String(brand).trim();
  }
  const official = strip((html.match(/<a[^>]+class=["'][^"']*official[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) || [])[1] || '');
  return official.replace(/公式.*$/, '').trim();
};

const getSpecs = (html) => {
  const values = [];
  for (const match of html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = strip(match[1]);
    if (!text || /価格|公式仕様で確認|メーカー公式で確認|販売店/.test(text)) continue;
    const value = text.includes('：') ? text.split('：').slice(1).join('：').trim() : text;
    if (value && value.length <= 50 && !values.includes(value)) values.push(value);
  }
  for (const match of html.matchAll(/<tr[^>]*>\s*<t[hd][^>]*>([\s\S]*?)<\/t[hd]>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    const label = strip(match[1]);
    const value = strip(match[2]);
    if (!value || /価格/.test(label) || /公式仕様で確認|メーカー公式で確認|販売店/.test(value)) continue;
    if (value.length <= 50 && !values.includes(value)) values.push(value);
  }
  return values.slice(0, 3);
};

const hasNumericPrice = (html) => /比較用掲載価格[^0-9]{0,20}[0-9][0-9,]{2,}|(?:公式掲載価格|掲載価格|参考価格)[^0-9]{0,20}[0-9][0-9,]{2,}/.test(strip(html));

const upsertNameMeta = (html, name, content) => {
  const regex = new RegExp('<meta\\s+name=["\\\']' + name + '["\\\'][^>]*>', 'i');
  const tag = '<meta name="' + name + '" content="' + esc(content) + '">';
  return regex.test(html) ? html.replace(regex, tag) : html.replace('</head>', tag + '</head>');
};

const upsertPropertyMeta = (html, property, content) => {
  const regex = new RegExp('<meta\\s+property=["\\\']' + property + '["\\\'][^>]*>', 'i');
  const tag = '<meta property="' + property + '" content="' + esc(content) + '">';
  return regex.test(html) ? html.replace(regex, tag) : html.replace('</head>', tag + '</head>');
};

const items = productFiles.map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const parts = rel(file).split('/');
  const key = parts[0];
  return {
    file,
    key,
    id: parts[2],
    html,
    name: getName(html),
    brand: getBrand(html),
    category: CATEGORY_LABELS[key] || '商品',
    specs: getSpecs(html),
  };
});

const byCategory = new Map();
for (const item of items) {
  if (!byCategory.has(item.key)) byCategory.set(item.key, []);
  byCategory.get(item.key).push(item);
}
for (const list of byCategory.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

const relatedItems = (item) => {
  const pool = byCategory.get(item.key) || [];
  const sameBrand = pool.filter((candidate) => candidate.id !== item.id && item.brand && candidate.brand === item.brand);
  const index = pool.findIndex((candidate) => candidate.id === item.id);
  const others = pool
    .filter((candidate) => candidate.id !== item.id && !sameBrand.includes(candidate))
    .sort((a, b) => Math.abs(pool.indexOf(a) - index) - Math.abs(pool.indexOf(b) - index));
  return [...sameBrand, ...others].slice(0, 5);
};

const pairLinks = (item) => {
  const dir = path.join(targetDir, item.key, 'compare');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.includes(item.id))
    .slice(0, 2)
    .map((entry) => {
      const file = path.join(dir, entry.name, 'index.html');
      if (!fs.existsSync(file)) return null;
      const html = fs.readFileSync(file, 'utf8');
      const heading = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
      return { href: '/' + item.key + '/compare/' + entry.name + '/', label: heading || '2製品を直接比較' };
    })
    .filter(Boolean);
};

let changed = 0;
const titles = new Set();
const descriptions = new Set();

for (const item of items) {
  let html = item.html;
  const specText = item.specs.slice(0, 2).join('・');
  const priceWord = hasNumericPrice(html) ? '価格・' : '価格確認・';
  const title = cap(item.name + '｜2026 ' + priceWord + 'スペック比較｜' + item.category, 68);
  const brandPart = item.brand ? item.brand + 'の' : '';
  const specPart = specText ? specText + 'などの仕様、' : '主な仕様、';
  const description = cap(
    brandPart + item.name + 'の' + specPart + '価格情報と比較ポイントを整理。同じ' + item.category + 'の似ている商品や直接比較、目的別ガイドも確認できます。購入前はメーカー・販売店の最新情報をご確認ください。',
    155
  );

  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(title) + '</title>');
  html = upsertNameMeta(html, 'description', description);
  html = upsertNameMeta(html, 'twitter:title', title);
  html = upsertNameMeta(html, 'twitter:description', description);
  html = upsertPropertyMeta(html, 'og:title', title);
  html = upsertPropertyMeta(html, 'og:description', description);

  const related = relatedItems(item);
  const comparisons = pairLinks(item);
  const links = related.map((candidate) =>
    '<a href="/' + candidate.key + '/products/' + candidate.id + '/">' + esc(candidate.name) + 'も比較</a>'
  ).join('')
    + comparisons.map((comparison) =>
      '<a href="' + comparison.href + '">' + esc(comparison.label) + '</a>'
    ).join('')
    + '<a href="/' + item.key + '/">' + esc(item.category) + 'のランキング・条件比較</a>'
    + '<a href="/' + item.key + '/compare/">' + esc(item.category) + 'の直接比較一覧</a>';

  const block = '<section class="product-seo-links" data-product-seo-links="1"><h2>'
    + esc(item.name)
    + 'を検討中の人へ</h2><p>'
    + esc(item.category)
    + 'の中で近い候補や、2製品を直接比べるページへ移動できます。</p><div class="related">'
    + links
    + '</div></section>';

  const existing = /<section class="product-seo-links" data-product-seo-links="1">[\s\S]*?<\/section>/;
  if (existing.test(html)) html = html.replace(existing, block);
  else html = html.replace('</main>', block + '</main>');

  if (html !== item.html) {
    fs.writeFileSync(item.file, html);
    changed += 1;
  }
  if (titles.has(title)) console.warn('Duplicate SEO title: ' + title);
  else titles.add(title);
  if (descriptions.has(description)) console.warn('Duplicate meta description: ' + description);
  else descriptions.add(description);
}

console.log('Product SEO enhancement: ' + changed + '/' + items.length + ' pages updated; ' + titles.size + ' unique titles and ' + descriptions.size + ' unique descriptions (' + targetName + ').');
