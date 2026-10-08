import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sourceDir = path.join(root, 'public');
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'public';
const targetDir = path.join(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';
const TARGET_PAIRS = 12;

const metas = {
  earphones: {
    targetPairs: 13,
    label: 'ワイヤレスイヤホン',
    countLabel: '30機種',
    focus: '価格・バッテリー・防水・音質・ノイズキャンセリング・装着感・コスパ',
    rows: [
      ['掲載価格', (p) => formatPrice(p.price)],
      ['バッテリー', (p) => p.batteryText || '公式仕様で確認'],
      ['防水', (p) => p.waterRating || '公式仕様で確認'],
      ['主な特徴', (p) => (p.tags || []).slice(0, 4).join('・') || '商品ページで確認'],
    ],
    seeds: [
      ['airpods-pro-3','wf-1000xm6','airpods-pro-3-vs-wf-1000xm6'],
      ['bose-qc-ultra-earbuds-2','wf-1000xm6','bose-qc-ultra-earbuds-2-vs-wf-1000xm6'],
      ['pixel-buds-pro-2','galaxy-buds4-pro','pixel-buds-pro-2-vs-galaxy-buds4-pro'],
      ['technics-eah-az100','wf-1000xm6','technics-eah-az100-vs-wf-1000xm6'],
      ['wf-1000xm6','soundcore-liberty-5','wf-1000xm6-vs-liberty-5'],
      ['soundcore-liberty-5','earfun-air-pro-4','soundcore-liberty-5-vs-earfun-air-pro-4'],
    ],
  },
  'mobile-batteries': {
    label: 'モバイルバッテリー',
    countLabel: '30製品',
    focus: '価格・容量・最大出力・重量・ケーブル内蔵・ワイヤレス充電・ポート数・コスパ',
    rows: [
      ['掲載価格', (p) => formatPrice(p.price)],
      ['容量', (p) => Number.isFinite(p.capacity) ? `${p.capacity.toLocaleString('ja-JP')}mAh` : '公式仕様で確認'],
      ['最大出力', (p) => Number.isFinite(p.power) ? `${p.power}W` : '公式仕様で確認'],
      ['重量', (p) => Number.isFinite(p.weight) ? `${p.weight}g` : '公式仕様で確認'],
      ['ケーブル', (p) => p.cable || '公式仕様で確認'],
      ['ワイヤレス', (p) => p.wireless || 'なし / 公式仕様で確認'],
      ['ポート', (p) => p.ports || '公式仕様で確認'],
    ],
    seeds: [
      ['anker-zolo-10000','cio-smartcoby-pro-slim-ss'],
      ['anker-nano-10000-45w','xiaomi-33w-10000'],
      ['xiaomi-ultrathin-magnetic-5000','anker-maggo-10000'],
    ],
  },
  smartphones: {
    targetPairs: 13,
    label: 'スマートフォン',
    countLabel: '30機種',
    focus: '価格・カメラ・処理性能・バッテリー・重量・AI機能・ディスプレイ・コスパ',
    rows: [
      ['掲載価格', (p) => formatPrice(p.price)],
      ['重量', (p) => Number.isFinite(p.weight) ? `${p.weight}g` : '公式仕様で確認'],
      ['バッテリー', (p) => p.battery || '公式仕様で確認'],
      ['ディスプレイ', (p) => p.display || '公式仕様で確認'],
    ],
    seeds: [
      ['iphone-17','pixel-10'],
      ['pixel-10','galaxy-s26'],
      ['xiaomi-15t','poco-x8-pro'],
      ['galaxy-s26-ultra','pixel-10-pro-xl','galaxy-s26-ultra-vs-pixel-10-pro-xl'],
    ],
  },
};

const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatPrice = (price) => Number.isFinite(price) ? `${price.toLocaleString('ja-JP')}円` : '販売店・公式で確認';
const compareUrl = (key, slug) => `/${key}/compare/${slug}/`;
const hubUrl = (key) => `/${key}/compare/`;
const productUrl = (key, id) => `/${key}/products/${id}/`;
const pairKey = (a,b) => [a,b].sort().join('::');

const extractArrayLiteral = (text, marker) => {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Marker not found: ${marker}`);
  const start = text.indexOf('[', markerIndex + marker.length);
  if (start < 0) throw new Error(`Array start not found: ${marker}`);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`Array end not found: ${marker}`);
};

const loadStaticProducts = (key) => {
  const html = fs.readFileSync(path.join(sourceDir, key, 'index.html'), 'utf8');
  const literal = extractArrayLiteral(html, 'const products=');
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
};

const loadEarphones = async () => {
  const moduleUrl = pathToFileURL(path.join(root, 'src', 'data', 'earphones.js')).href;
  const mod = await import(`${moduleUrl}?t=${Date.now()}`);
  return mod.earphones;
};

const scoreDistance = (a,b) => {
  const keys = [...new Set([...Object.keys(a.scores || {}), ...Object.keys(b.scores || {})])];
  const scoreGap = keys.reduce((sum,key) => sum + Math.abs(Number(a.scores?.[key] || 0) - Number(b.scores?.[key] || 0)), 0);
  const priceGap = Number.isFinite(a.price) && Number.isFinite(b.price) ? Math.abs(a.price - b.price) / 7000 : 6;
  const sameBrandPenalty = a.brand && b.brand && a.brand === b.brand ? 8 : 0;
  return scoreGap + priceGap + sameBrandPenalty;
};

const selectPairs = (products, meta) => {
  const targetPairs = meta.targetPairs || TARGET_PAIRS;
  const byId = new Map(products.map((p) => [p.id,p]));
  const selected = [];
  const used = new Set();
  const appearances = new Map();
  const add = (a,b,slug=`${a.id}-vs-${b.id}`) => {
    const key = pairKey(a.id,b.id);
    if (used.has(key)) return false;
    used.add(key);
    selected.push([a,b,slug]);
    appearances.set(a.id,(appearances.get(a.id)||0)+1);
    appearances.set(b.id,(appearances.get(b.id)||0)+1);
    return true;
  };

  for (const seed of meta.seeds || []) {
    const [aId,bId,seedSlug] = seed;
    const a = byId.get(aId), b = byId.get(bId);
    if (a && b) add(a,b,seedSlug || `${a.id}-vs-${b.id}`);
  }

  const candidates = [];
  for (let i=0;i<products.length;i+=1) {
    for (let j=i+1;j<products.length;j+=1) {
      const a=products[i], b=products[j];
      if (used.has(pairKey(a.id,b.id))) continue;
      candidates.push({a,b,score:scoreDistance(a,b)});
    }
  }
  candidates.sort((x,y)=>x.score-y.score);

  for (const maxAppearances of [2,3,4]) {
    for (const {a,b} of candidates) {
      if (selected.length >= targetPairs) break;
      if (used.has(pairKey(a.id,b.id))) continue;
      if ((appearances.get(a.id)||0) >= maxAppearances || (appearances.get(b.id)||0) >= maxAppearances) continue;
      add(a,b);
    }
    if (selected.length >= targetPairs) break;
  }
  return selected.slice(0,targetPairs);
};

const hasDetail = (key,id) => fs.existsSync(path.join(targetDir,key,'products',id,'index.html'));

const linkedProduct = (key,p) => hasDetail(key,p.id)
  ? `<a href="${productUrl(key,p.id)}"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.brand || '')}</span></a>`
  : `<div><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.brand || '')}</span></div>`;

const itemProductJson = (key,p) => {
  const item = {'@type':'Product',name:p.name,brand:{'@type':'Brand',name:p.brand || ''}};
  if (hasDetail(key,p.id)) item.url = `${ORIGIN}${productUrl(key,p.id)}`;
  return item;
};

const renderComparison = (key,meta,a,b,slug) => {
  const canonical = `${ORIGIN}${compareUrl(key,slug)}`;
  const title = `${a.name}と${b.name}を比較 2026｜${meta.label}｜みんなの比較表`;
  const description = `${a.name}と${b.name}を、${meta.focus}の主要項目で横並び比較。候補を2つまで絞った後の違い確認に使えます。`;
  const rows = meta.rows.map(([label,getValue]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(getValue(a))}</td><td>${escapeHtml(getValue(b))}</td></tr>`).join('');
  const jsonLd = JSON.stringify({
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage',name:`${a.name}と${b.name}を比較`,url:canonical,description},
      {'@type':'ItemList',numberOfItems:2,itemListElement:[
        {'@type':'ListItem',position:1,item:itemProductJson(key,a)},
        {'@type':'ListItem',position:2,item:itemProductJson(key,b)},
      ]},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'トップ',item:`${ORIGIN}/`},
        {'@type':'ListItem',position:2,name:`${meta.label}比較`,item:`${ORIGIN}/${key}/`},
        {'@type':'ListItem',position:3,name:'2製品比較一覧',item:`${ORIGIN}${hubUrl(key)}`},
        {'@type':'ListItem',position:4,name:`${a.name}と${b.name}を比較`,item:canonical},
      ]},
    ],
  }).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><style>.pair-head{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.pair-head>a,.pair-head>div{display:block;padding:16px;border:1px solid #dfe7f1;border-radius:16px;text-decoration:none;color:inherit;background:#fff}.pair-head b,.pair-head span{display:block}.pair-head span{margin-top:5px;color:#75859b;font-size:11px}.pair-table{width:100%;border-collapse:collapse;margin:18px 0 26px}.pair-table th,.pair-table td{padding:12px;border:1px solid #dfe7f1;text-align:left;vertical-align:top}.compare-hub-link{display:inline-flex;margin:0 0 18px;color:#0f6cf9;font-weight:850;text-decoration:none}.pair-note{padding:14px 16px;border-radius:14px;background:#f6f9fd;color:#66758b;line-height:1.75;font-size:13px}@media(max-width:680px){.pair-head{grid-template-columns:1fr}.pair-table{font-size:13px}}</style><script type="application/ld+json">${jsonLd}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.countLabel)}を比較</a><a href="${hubUrl(key)}">直接比較一覧</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › <a href="${hubUrl(key)}">2製品比較一覧</a> › 直接比較</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(a.name)} と ${escapeHtml(b.name)}を比較</h1><p class="lead">どちらかを一方的に選ぶのではなく、主要仕様と特徴を同じ項目で確認するための比較ページです。</p><a class="compare-hub-link" href="${hubUrl(key)}">← ${escapeHtml(meta.label)}の直接比較一覧を見る</a><div class="pair-head">${linkedProduct(key,a)}${linkedProduct(key,b)}</div><div class="table-scroll"><table class="pair-table"><thead><tr><th>比較項目</th><th>${escapeHtml(a.name)}</th><th>${escapeHtml(b.name)}</th></tr></thead><tbody>${rows}</tbody></table></div><div class="pair-note">${escapeHtml(meta.focus)}のうち、自分が優先する項目を決めて確認してください。価格や仕様は変更される場合があるため、購入前はメーカー公式情報も確認してください。</div><div class="cta"><h2>${escapeHtml(meta.countLabel)}から条件で探す</h2><p>ほかの候補も含めて、予算や重視ポイントを変えながら比較できます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a> ｜ <a href="/affiliate-disclosure/">広告・アフィリエイト方針</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
};

const renderHub = (key,meta,pairs) => {
  const canonical = `${ORIGIN}${hubUrl(key)}`;
  const cards = pairs.map(([a,b,slug]) => `<a class="compare-list-card" href="${compareUrl(key,slug)}"><b>${escapeHtml(a.name)}</b><span>vs</span><b>${escapeHtml(b.name)}</b><small>主要仕様を横並びで比較 →</small></a>`).join('');
  const jsonLd = JSON.stringify({
    '@context':'https://schema.org','@type':'ItemList',name:`${meta.label}の2製品比較一覧`,numberOfItems:pairs.length,
    itemListElement:pairs.map(([a,b,slug],i)=>({'@type':'ListItem',position:i+1,name:`${a.name} vs ${b.name}`,url:`${ORIGIN}${compareUrl(key,slug)}`})),
  }).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(meta.label)}の2製品比較一覧 2026｜みんなの比較表</title><meta name="description" content="${escapeHtml(meta.label)}の気になる2製品を、価格と主要仕様で直接比較できるページを${pairs.length}組まとめています。"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><style>.compare-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0 30px}.compare-list-card{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:18px;border:1px solid #dfe7f1;border-radius:17px;background:#fff;color:inherit;text-decoration:none}.compare-list-card>b{font-size:13px;line-height:1.45}.compare-list-card>span{font-size:10px;font-weight:900;color:#0f6cf9}.compare-list-card>small{grid-column:1/-1;color:#74849a;margin-top:4px}.compare-list-card:hover{border-color:#a8c9fb;box-shadow:0 10px 24px rgba(30,61,102,.08)}@media(max-width:700px){.compare-list{grid-template-columns:1fr}}</style><script type="application/ld+json">${jsonLd}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.countLabel)}を比較</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › 2製品比較一覧</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(meta.label)}の2製品比較一覧</h1><p class="lead">候補が2つまで絞れている人向けに、主要仕様を同じ表で直接確認できる比較ページを${pairs.length}組まとめています。</p><div class="compare-list">${cards}</div><div class="cta"><h2>条件から候補を探し直す</h2><p>${escapeHtml(meta.focus)}を重視ポイントにして、${escapeHtml(meta.countLabel)}から探せます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a></div></footer></body></html>`;
};

const replaceCategoryBlock = (key,meta,pairs) => {
  const pairCount = pairs.length;
  const file = path.join(targetDir,key,'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,'utf8');
  const cards = pairs.slice(0,6).map(([a,b,slug]) => `<a class="${key === 'earphones' ? '' : 'discovery-card'}" href="${compareUrl(key,slug)}">${key === 'earphones' ? `${escapeHtml(a.name)} vs ${escapeHtml(b.name)}` : `<b>${escapeHtml(a.name)} vs ${escapeHtml(b.name)}</b><small>主要仕様を横並びで比較</small>`}</a>`).join('');
  if (key === 'earphones') {
    const replacement = `<h2>2製品を直接比べる</h2><div class="related">${cards}<a href="${hubUrl(key)}">📊 ${pairCount}組の直接比較をすべて見る</a></div>`;
    html = html.replace(/<h2>2製品を直接比べる<\/h2><div class="related">[\s\S]*?<\/div>(?=<div class="cta">)/, replacement);
  } else {
    const replacement = `<section class="discovery-block"><h2>2製品を直接比較</h2><p class="generic-note">候補が2つまで絞れたら、価格と主要仕様を同じ表で確認できます。</p><div class="discovery-grid">${cards}</div><p><a class="official" href="${hubUrl(key)}">${pairCount}組の直接比較をすべて見る →</a></p></section>`;
    html = html.replace(/<section class="discovery-block"><h2>2(?:製品|機種)を直接比較<\/h2>[\s\S]*?<\/section>/, replacement);
  }
  fs.writeFileSync(file,html);
};

const addDetailCrossLinks = (key,meta,products,pairs) => {
  for (const product of products) {
    const file = path.join(targetDir,key,'products',product.id,'index.html');
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file,'utf8');
    const relevant = pairs.filter(([a,b]) => a.id === product.id || b.id === product.id);
    const cards = relevant.map(([a,b,slug]) => {
      const other = a.id === product.id ? b : a;
      return `<a class="product-related-card" href="${compareUrl(key,slug)}"><b>${escapeHtml(product.name)} vs ${escapeHtml(other.name)}</b><span>2製品を直接比較 →</span></a>`;
    }).join('');
    const section = `<section data-legacy-direct-comparisons="1"><h2>この製品の直接比較</h2>${cards ? `<div class="product-related">${cards}</div>` : '<p class="note">この製品を含む直接比較は、比較一覧から確認できます。</p>'}<p><a class="official" href="${hubUrl(key)}">${escapeHtml(meta.label)}の直接比較一覧を見る →</a></p></section>`;
    const existing = /<section data-legacy-direct-comparisons="1">[\s\S]*?<\/section>/;
    if (existing.test(html)) html = html.replace(existing,section);
    else if (html.includes('<h2>関連ガイド</h2>')) html = html.replace('<h2>関連ガイド</h2>',`${section}<h2>関連ガイド</h2>`);
    else if (html.includes('<div class="cta">')) html = html.replace('<div class="cta">',`${section}<div class="cta">`);
    fs.writeFileSync(file,html);
  }
};

const mergeSitemap = (urls) => {
  const file = path.join(targetDir,'sitemap-comparisons.xml');
  const existing = fs.existsSync(file) ? fs.readFileSync(file,'utf8') : '';
  const current = [...existing.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m)=>m[1]);
  const all = [...new Set([...current,...urls])];
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(({type,value})=>[type,value]));
  const lastmod = `${map.year}-${map.month}-${map.day}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map((url)=>`  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.72</priority></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(file,xml);
};

fs.mkdirSync(targetDir,{recursive:true});
const datasets = {
  earphones: await loadEarphones(),
  'mobile-batteries': loadStaticProducts('mobile-batteries'),
  smartphones: loadStaticProducts('smartphones'),
};

const urls = [];
let created = 0;
for (const [key,meta] of Object.entries(metas)) {
  const products = datasets[key];
  const pairs = selectPairs(products,meta);
  for (const [a,b,slug] of pairs) {
    const dir = path.join(targetDir,key,'compare',slug);
    fs.mkdirSync(dir,{recursive:true});
    const file = path.join(dir,'index.html');
    if (!fs.existsSync(file) || !meta.seeds.some(([x,y,s]) => pairKey(x,y) === pairKey(a.id,b.id) && (s || `${x}-vs-${y}`) === slug)) {
      fs.writeFileSync(file,renderComparison(key,meta,a,b,slug));
    }
    urls.push(`${ORIGIN}${compareUrl(key,slug)}`);
    created += 1;
  }
  const hubDir = path.join(targetDir,key,'compare');
  fs.mkdirSync(hubDir,{recursive:true});
  fs.writeFileSync(path.join(hubDir,'index.html'),renderHub(key,meta,pairs));
  urls.push(`${ORIGIN}${hubUrl(key)}`);
  replaceCategoryBlock(key,meta,pairs);
  addDetailCrossLinks(key,meta,products,pairs);
}

mergeSitemap(urls);
console.log(`Expanded legacy comparison categories to ${created} comparison pages plus 3 hubs in ${targetName}`);
