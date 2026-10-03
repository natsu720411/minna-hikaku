import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.join(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';
const TARGET_PAIRS_PER_CATEGORY = 12;

const categories = {
  smartwatches: {
    label: 'スマートウォッチ',
    compareLabel: '20モデルを比較',
    specs: [['ケース・サイズ','size'],['重量','weight'],['バッテリー','batteryText'],['対応スマホ','compat']],
    focus: '健康管理・スポーツ・バッテリー・軽さ・スマート機能・コスパ',
  },
  tablets: {
    label: 'タブレット',
    compareLabel: '20モデルを比較',
    specs: [['画面','displayText'],['重量','weight'],['ストレージ','storageText'],['ペン','penText']],
    focus: '性能・画面・軽さ・ストレージ・ペン対応・コスパ',
  },
  chargers: {
    label: 'USB充電器',
    compareLabel: '20製品を比較',
    specs: [['最大出力','powerText'],['ポート','portsText'],['重量','weight'],['特徴','feature']],
    focus: '最大出力・ポート数・軽さ・コンパクトさ・対応力・コスパ',
  },
};

const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatPrice = (price) => Number.isFinite(price) ? `${price.toLocaleString('ja-JP')}円` : 'メーカー公式で確認';
const productUrl = (key, id) => `/${key}/products/${encodeURIComponent(id)}/`;
const compareUrl = (key, slug) => `/${key}/compare/${slug}/`;
const compareHubUrl = (key) => `/${key}/compare/`;
const pairKey = (a, b) => [a, b].sort().join('::');

const loadConfig = (key) => {
  const html = fs.readFileSync(path.join(publicDir, key, 'index.html'), 'utf8');
  const match = html.match(/window\.COMPARISON_CONFIG=({[\s\S]*?});<\/script>/);
  if (!match) throw new Error(`COMPARISON_CONFIG not found: ${key}`);
  return vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 1000 });
};

const scoreDistance = (a, b) => {
  const scoreKeys = [...new Set([...Object.keys(a.scores || {}), ...Object.keys(b.scores || {})])];
  const scoreGap = scoreKeys.reduce((sum, key) => sum + Math.abs(Number(a.scores?.[key] || 0) - Number(b.scores?.[key] || 0)), 0);
  const priceGap = Number.isFinite(a.price) && Number.isFinite(b.price) ? Math.abs(a.price - b.price) / 6000 : 5;
  const brandBias = a.brand === b.brand ? -4 : 0;
  return scoreGap + priceGap + brandBias;
};

const existingSlugsFor = (key) => {
  const sitemapPath = path.join(targetDir, 'sitemap-comparisons.xml');
  if (!fs.existsSync(sitemapPath)) return [];
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const re = new RegExp(`${ORIGIN.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/${key}/compare/([^/<]+)/`, 'g');
  const slugs = [];
  let match;
  while ((match = re.exec(xml))) slugs.push(match[1]);
  return [...new Set(slugs)];
};

const pairFromSlug = (slug, products) => {
  for (let i = 0; i < products.length; i += 1) {
    for (let j = i + 1; j < products.length; j += 1) {
      const a = products[i], b = products[j];
      if (`${a.id}-vs-${b.id}` === slug) return [a,b,slug];
      if (`${b.id}-vs-${a.id}` === slug) return [b,a,slug];
    }
  }
  return null;
};

const selectPairs = (key, products) => {
  const selected = [];
  const used = new Set();
  const appearances = new Map();
  const add = (a,b,slug=`${a.id}-vs-${b.id}`) => {
    const keyPair = pairKey(a.id,b.id);
    if (used.has(keyPair)) return false;
    used.add(keyPair);
    selected.push([a,b,slug]);
    appearances.set(a.id, (appearances.get(a.id)||0)+1);
    appearances.set(b.id, (appearances.get(b.id)||0)+1);
    return true;
  };

  for (const slug of existingSlugsFor(key)) {
    const pair = pairFromSlug(slug, products);
    if (pair) add(...pair);
  }

  const candidates = [];
  for (let i = 0; i < products.length; i += 1) {
    for (let j = i + 1; j < products.length; j += 1) {
      const a = products[i], b = products[j];
      if (used.has(pairKey(a.id,b.id))) continue;
      candidates.push({a,b,score:scoreDistance(a,b)});
    }
  }
  candidates.sort((x,y) => x.score - y.score);

  for (const {a,b} of candidates) {
    if (selected.length >= TARGET_PAIRS_PER_CATEGORY) break;
    const aCount = appearances.get(a.id)||0;
    const bCount = appearances.get(b.id)||0;
    if (aCount >= 2 || bCount >= 2) continue;
    add(a,b);
  }
  if (selected.length < TARGET_PAIRS_PER_CATEGORY) {
    for (const {a,b} of candidates) {
      if (selected.length >= TARGET_PAIRS_PER_CATEGORY) break;
      if (used.has(pairKey(a.id,b.id))) continue;
      const aCount = appearances.get(a.id)||0;
      const bCount = appearances.get(b.id)||0;
      if (aCount >= 3 || bCount >= 3) continue;
      add(a,b);
    }
  }
  return selected.slice(0, TARGET_PAIRS_PER_CATEGORY);
};

const jsonLd = (a,b,key,meta,canonical) => JSON.stringify({
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'WebPage',name:`${a.name}と${b.name}を比較`,url:canonical,description:`${meta.label}の2製品比較`},
    {'@type':'ItemList',numberOfItems:2,itemListElement:[
      {'@type':'ListItem',position:1,item:{'@type':'Product',name:a.name,brand:{'@type':'Brand',name:a.brand},url:`${ORIGIN}${productUrl(key,a.id)}`}},
      {'@type':'ListItem',position:2,item:{'@type':'Product',name:b.name,brand:{'@type':'Brand',name:b.brand},url:`${ORIGIN}${productUrl(key,b.id)}`}},
    ]},
    {'@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'トップ',item:`${ORIGIN}/`},
      {'@type':'ListItem',position:2,name:`${meta.label}比較`,item:`${ORIGIN}/${key}/`},
      {'@type':'ListItem',position:3,name:'2製品比較一覧',item:`${ORIGIN}${compareHubUrl(key)}`},
      {'@type':'ListItem',position:4,name:`${a.name}と${b.name}を比較`,item:canonical},
    ]},
  ],
}).replace(/</g,'\\u003c');

const renderPage = (a,b,key,meta,slug) => {
  const canonical = `${ORIGIN}${compareUrl(key,slug)}`;
  const title = `${a.name}と${b.name}を比較 2026｜${meta.label}｜みんなの比較表`;
  const description = `${a.name}と${b.name}を、${meta.specs.map(([label])=>label).join('・')}、価格、特徴で横並び比較。自分の使い方に合う違いを確認できます。`;
  const rows = [
    ['掲載価格',formatPrice(a.price),formatPrice(b.price)],
    ...meta.specs.map(([label,keyName]) => [label,a.facts?.[keyName]||'公式仕様で確認',b.facts?.[keyName]||'公式仕様で確認']),
  ].map(([label,av,bv]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(av)}</td><td>${escapeHtml(bv)}</td></tr>`).join('');
  const aBadges = escapeHtml((a.badges||[]).slice(0,3).join('・'));
  const bBadges = escapeHtml((b.badges||[]).slice(0,3).join('・'));
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><style>.pair-table{width:100%;border-collapse:collapse;margin:18px 0 26px}.pair-table th,.pair-table td{padding:12px;border:1px solid #dfe7f1;text-align:left;vertical-align:top}.pair-head{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.pair-head a{display:block;padding:16px;border:1px solid #dfe7f1;border-radius:16px;text-decoration:none;color:inherit;background:#fff}.pair-head b,.pair-head span{display:block}.pair-head span{margin-top:5px;color:#75859b;font-size:12px}.pair-note{padding:14px 16px;border-radius:14px;background:#f6f9fd;color:#66758b;line-height:1.75;font-size:13px;margin:18px 0}.compare-hub-link{display:inline-flex;margin:0 0 20px;color:#0f6cf9;font-weight:850;text-decoration:none}@media(max-width:680px){.pair-head{grid-template-columns:1fr}.pair-table{font-size:13px}}</style><script type="application/ld+json">${jsonLd(a,b,key,meta,canonical)}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.compareLabel)}</a><a href="${compareHubUrl(key)}">直接比較一覧</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › <a href="${compareHubUrl(key)}">2製品比較一覧</a> › 直接比較</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(a.name)} と ${escapeHtml(b.name)}を比較</h1><p class="lead">一方をおすすめするのではなく、仕様と特徴の違いを同じ項目で確認するための比較ページです。</p><a class="compare-hub-link" href="${compareHubUrl(key)}">← ${escapeHtml(meta.label)}の直接比較一覧を見る</a><div class="pair-head"><a href="${productUrl(key,a.id)}"><b>${escapeHtml(a.name)}</b><span>${aBadges}</span></a><a href="${productUrl(key,b.id)}"><b>${escapeHtml(b.name)}</b><span>${bBadges}</span></a></div><div class="table-scroll"><table class="pair-table"><thead><tr><th>比較項目</th><th>${escapeHtml(a.name)}</th><th>${escapeHtml(b.name)}</th></tr></thead><tbody>${rows}</tbody></table></div><div class="pair-note">${escapeHtml(meta.focus)}の中で、自分が優先する項目を決めて見ると違いを整理しやすくなります。価格は変動するため購入時点の販売価格も確認してください。</div><h2>比較するときのポイント</h2><div class="criteria-grid"><div class="criteria-card"><b>用途を先に決める</b><p>毎日持ち歩くのか、自宅中心なのか、仕事・勉強・スポーツなど何に使うかで優先項目が変わります。</p></div><div class="criteria-card"><b>価格と仕様を分けて見る</b><p>セール価格だけではなく、必要な仕様を満たしたうえで価格差に納得できるかを確認します。</p></div><div class="criteria-card"><b>最新仕様を確認</b><p>容量・サイズ・通信方式などの違いがあるため、購入前はメーカー公式情報も確認してください。</p></div></div><div class="cta"><h2>${escapeHtml(meta.compareLabel)}から条件で探す</h2><p>予算や重視ポイントを変えながら、ほかの候補も比較できます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a> ｜ <a href="/affiliate-disclosure/">広告・アフィリエイト方針</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
};

const renderHubPage = (key, meta, pairs) => {
  const canonical = `${ORIGIN}${compareHubUrl(key)}`;
  const title = `${meta.label}の2製品比較一覧 2026｜みんなの比較表`;
  const description = `${meta.label}の気になる2製品を、価格と主要仕様で直接比較できるページを一覧で確認できます。`;
  const cards = pairs.map(([a,b,slug]) => `<a class="compare-list-card" href="${compareUrl(key,slug)}"><b>${escapeHtml(a.name)}</b><span>vs</span><b>${escapeHtml(b.name)}</b><small>価格・主要仕様を横並びで比較 →</small></a>`).join('');
  const listJson = JSON.stringify({
    '@context':'https://schema.org',
    '@type':'ItemList',
    name:`${meta.label}の2製品比較一覧`,
    numberOfItems:pairs.length,
    itemListElement:pairs.map(([a,b,slug],i)=>({'@type':'ListItem',position:i+1,name:`${a.name} vs ${b.name}`,url:`${ORIGIN}${compareUrl(key,slug)}`})),
  }).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><style>.compare-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0 30px}.compare-list-card{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:18px;border:1px solid #dfe7f1;border-radius:17px;background:#fff;color:inherit;text-decoration:none}.compare-list-card>b{font-size:13px;line-height:1.45}.compare-list-card>span{font-size:10px;font-weight:900;color:#0f6cf9}.compare-list-card>small{grid-column:1/-1;color:#74849a;margin-top:4px}.compare-list-card:hover{border-color:#a8c9fb;box-shadow:0 10px 24px rgba(30,61,102,.08)}@media(max-width:700px){.compare-list{grid-template-columns:1fr}}</style><script type="application/ld+json">${listJson}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${escapeHtml(meta.compareLabel)}</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${escapeHtml(meta.label)}</a> › 2製品比較一覧</div><span class="update-pill">2026年10月更新</span><h1>${escapeHtml(meta.label)}の2製品比較一覧</h1><p class="lead">候補が2つまで絞れている人向けに、価格と主要仕様を同じ表で直接確認できる比較ページをまとめています。</p><div class="compare-list">${cards}</div><div class="cta"><h2>条件から候補を探し直す</h2><p>${escapeHtml(meta.focus)}を重視ポイントにして、${escapeHtml(meta.compareLabel)}から探せます。</p><a href="/${key}/">${escapeHtml(meta.label)}比較へ →</a></div></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a> ｜ <a href="/affiliate-disclosure/">広告・アフィリエイト方針</a></div></footer></body></html>`;
};

const replaceCategoryComparisonSection = (key, pairs) => {
  const file = path.join(targetDir,key,'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,'utf8');
  const cards = pairs.slice(0,6).map(([a,b,slug]) => `<a class="discovery-card" href="${compareUrl(key,slug)}"><b>${escapeHtml(a.name)} vs ${escapeHtml(b.name)}</b><small>価格・仕様を横並びで比較</small></a>`).join('');
  const section = `<section class="discovery-block"><h2>2製品を直接比較</h2><p class="generic-note">気になる2製品が決まっている人向けに、同じ項目で違いを確認できます。</p><div class="discovery-grid">${cards}</div><p><a class="official" href="${compareHubUrl(key)}">${pairs.length}組の直接比較をすべて見る →</a></p></section>`;
  const re = /<section class="discovery-block"><h2>2製品を直接比較<\/h2>[\s\S]*?<\/section>/;
  if (re.test(html)) html = html.replace(re,section);
  else html = html.replace('<section class="category-other">',`${section}<section class="category-other">`);
  fs.writeFileSync(file,html);
};

const addProductComparisonLinks = (key, product, pairs) => {
  const file = path.join(targetDir,key,'products',product.id,'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,'utf8');
  const relevant = pairs.filter(([a,b]) => a.id === product.id || b.id === product.id);
  const cards = relevant.map(([a,b,slug]) => {
    const other = a.id === product.id ? b : a;
    return `<a class="product-related-card" href="${compareUrl(key,slug)}"><b>${escapeHtml(product.name)} vs ${escapeHtml(other.name)}</b><span>2製品を直接比較 →</span></a>`;
  }).join('');
  const section = `<section data-generated-direct-comparisons="1"><h2>この製品の直接比較</h2>${relevant.length ? `<div class="product-related">${cards}</div>` : `<p class="note">この製品を含む直接比較は、比較一覧から確認できます。</p>`}<p><a class="official" href="${compareHubUrl(key)}">${escapeHtml(categories[key].label)}の直接比較一覧を見る →</a></p></section>`;
  const re = /<section data-generated-direct-comparisons="1">[\s\S]*?<\/section>/;
  if (re.test(html)) html = html.replace(re,section);
  else if (html.includes('<h2>関連ガイド</h2>')) html = html.replace('<h2>関連ガイド</h2>',`${section}<h2>関連ガイド</h2>`);
  else html = html.replace('</main>',`${section}</main>`);
  fs.writeFileSync(file,html);
};

fs.mkdirSync(targetDir,{recursive:true});
const allUrls = [];
let total = 0;
let hubs = 0;
for (const [key,meta] of Object.entries(categories)) {
  const cfg = loadConfig(key);
  const pairs = selectPairs(key,cfg.products);

  for (const [a,b,slug] of pairs) {
    const dir = path.join(targetDir,key,'compare',slug);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'),renderPage(a,b,key,meta,slug));
    allUrls.push(`${ORIGIN}${compareUrl(key,slug)}`);
    total += 1;
  }

  const hubDir = path.join(targetDir,key,'compare');
  fs.mkdirSync(hubDir,{recursive:true});
  fs.writeFileSync(path.join(hubDir,'index.html'),renderHubPage(key,meta,pairs));
  allUrls.unshift(`${ORIGIN}${compareHubUrl(key)}`);
  hubs += 1;

  replaceCategoryComparisonSection(key,pairs);
  for (const product of cfg.products) addProductComparisonLinks(key,product,pairs);
}

const lastmod = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map((url)=>`  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.72</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(targetDir,'sitemap-comparisons.xml'),sitemap);
console.log(`Expanded category comparison pages to ${total} pair pages plus ${hubs} comparison hubs in ${targetName}`);
