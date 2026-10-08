import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const sourceDir = path.join(root, 'public');
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'public';
const targetDir = path.join(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatPrice = (price) => Number.isFinite(price) ? `${price.toLocaleString('ja-JP')}円` : '販売店・公式で確認';

const extractArrayLiteral = (text, marker) => {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Marker not found: ${marker}`);
  const start = text.indexOf('[', markerIndex + marker.length);
  if (start < 0) throw new Error(`Array start not found: ${marker}`);
  let depth = 0, quote = '', escaped = false;
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

const loadProducts = (key) => {
  const html = fs.readFileSync(path.join(sourceDir, key, 'index.html'), 'utf8');
  const literal = extractArrayLiteral(html, 'const products=');
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
};

const categories = {
  'mobile-batteries': {
    label: 'モバイルバッテリー',
    countLabel: '30製品',
    itemLabel: '製品',
    icon: '🔋',
    scoreLabels: {capacity:'容量',power:'高出力',portable:'携帯性',cable:'ケーブル内蔵',wireless:'ワイヤレス充電',ports:'同時充電',value:'コスパ'},
    guides: [
      ['/mobile-batteries/10000mah/','10000mAhガイド'],
      ['/mobile-batteries/lightweight/','軽量モデル'],
      ['/mobile-batteries/laptop/','ノートPC向け'],
      ['/mobile-batteries/qi2/','Qi2・マグネット'],
      ['/mobile-batteries/under-10000/','1万円以下'],
    ],
    specRows: (p) => [
      ['掲載価格', formatPrice(p.price)],
      ['容量', Number.isFinite(p.capacity) ? `${p.capacity.toLocaleString('ja-JP')}mAh` : 'メーカー公式で確認'],
      ['最大出力', Number.isFinite(p.power) ? `${p.power}W` : 'メーカー公式で確認'],
      ['重量', Number.isFinite(p.weight) ? `${p.weight}g` : 'メーカー公式で確認'],
      ['ケーブル', p.cable || 'メーカー公式で確認'],
      ['ワイヤレス充電', p.wireless || 'メーカー公式で確認'],
      ['充電系統', p.ports || 'メーカー公式で確認'],
    ],
    shortFacts: (p) => [
      Number.isFinite(p.capacity) ? `${p.capacity.toLocaleString('ja-JP')}mAh` : null,
      Number.isFinite(p.power) ? `最大${p.power}W` : null,
      Number.isFinite(p.weight) ? `${p.weight}g` : null,
      p.cable,
      p.wireless && p.wireless !== 'なし' ? p.wireless : null,
    ].filter(Boolean),
    compareText: (p) => {
      const weight = Number.isFinite(p.weight) ? `${p.weight}g` : '重量はメーカー公式で確認';
      const wireless = p.wireless && p.wireless !== 'なし' ? `ワイヤレス充電は「${p.wireless}」` : 'ワイヤレス充電は非対応または公式仕様で要確認';
      return `${Number.isFinite(p.capacity) ? p.capacity.toLocaleString('ja-JP') + 'mAh' : '容量'}、${Number.isFinite(p.power) ? '最大' + p.power + 'W' : '最大出力'}、${weight}を比較できます。ケーブルは「${p.cable || '公式で確認'}」、${wireless}です。`;
    },
    selectionText: '容量だけでなく、最大出力・重量・ケーブル内蔵・ワイヤレス充電・ポート構成まで合わせて見ると、持ち歩き方に合う候補を絞りやすくなります。',
  },
  smartphones: {
    label: 'スマートフォン',
    countLabel: '30機種',
    itemLabel: '機種',
    icon: '📱',
    scoreLabels: {camera:'カメラ',performance:'処理性能',battery:'バッテリー',light:'軽さ',ai:'AI機能',display:'画面',value:'コスパ'},
    guides: [
      ['/smartphones/camera/','カメラ重視'],
      ['/smartphones/battery/','バッテリー重視'],
      ['/smartphones/lightweight/','軽量モデル'],
      ['/smartphones/gaming/','ゲーム向け'],
      ['/smartphones/student/','大学生向け'],
      ['/smartphones/under-100000/','10万円以下'],
    ],
    specRows: (p) => [
      ['掲載価格', formatPrice(p.price)],
      ['重量', Number.isFinite(p.weight) ? `${p.weight}g` : 'メーカー公式で確認'],
      ['バッテリー', p.battery || 'メーカー公式で確認'],
      ['ディスプレイ', p.display || 'メーカー公式で確認'],
    ],
    shortFacts: (p) => [
      Number.isFinite(p.weight) ? `${p.weight}g` : null,
      p.battery,
      p.display,
    ].filter(Boolean),
    compareText: (p) => {
      const weight = Number.isFinite(p.weight) ? `${p.weight}g` : '重量はメーカー公式で確認';
      return `${weight}、バッテリーは「${p.battery || '公式で確認'}」、ディスプレイは「${p.display || '公式で確認'}」という比較データです。OSやメーカー独自機能も含めて、自分が毎日使う機能を優先して比較してください。`;
    },
    selectionText: 'スマートフォンは価格や処理性能だけでなく、カメラ・重量・バッテリー・ディスプレイ・OSやメーカー独自機能まで含めて比べると選びやすくなります。',
  },
};

const productUrl = (key, id) => `/${key}/products/${id}/`;

const renderProduct = (key, cfg, p) => {
  const canonical = `${ORIGIN}${productUrl(key,p.id)}`;
  const facts = cfg.shortFacts(p);
  const scores = Object.entries(p.scores || {})
    .map(([scoreKey,value]) => ({scoreKey,label:cfg.scoreLabels[scoreKey] || scoreKey,value:Number(value) || 0}))
    .sort((a,b) => b.value - a.value);
  const top = scores.slice(0,3);
  const description = `${p.name}の${facts.slice(0,4).join('・')}を整理。${cfg.countLabel}の中で重視ポイントを変えながら比較できます。`;
  const productNode = {
    '@type':'Product',
    name:p.name,
    brand:{'@type':'Brand',name:p.brand || ''},
    category:cfg.label,
    description,
    url:canonical,
  };
  if (Number.isFinite(p.price)) productNode.offers = {'@type':'Offer',url:canonical,priceCurrency:'JPY',price:String(p.price)};
  const schema = JSON.stringify({
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage',name:`${p.name}を比較`,url:canonical,description},
      productNode,
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'トップ',item:`${ORIGIN}/`},
        {'@type':'ListItem',position:2,name:`${cfg.label}比較`,item:`${ORIGIN}/${key}/`},
        {'@type':'ListItem',position:3,name:p.name,item:canonical},
      ]},
    ],
  }).replace(/</g,'\\u003c');
  const scoreCards = top.map((x) => `<div class="criteria-card"><b>${escapeHtml(x.label)} ${x.value}/100</b><p>サイト内の比較用編集スコアです。メーカー公式の評価ではありません。</p></div>`).join('');
  const specs = cfg.specRows(p).map(([label,value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
  const related = cfg.guides.map(([href,label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('');
  const pricePhrase = Number.isFinite(p.price) ? `掲載価格は${formatPrice(p.price)}です。` : '価格は販売店・メーカー公式で確認してください。';
  const titleFacts = facts.slice(0,3).join('・') || cfg.label;
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.name)}を比較｜${escapeHtml(titleFacts)} 2026</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"><script type="application/ld+json">${schema}</script></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/${key}/">${cfg.countLabel}を比較</a><a href="/${key}/compare/">直接比較一覧</a></nav></div></header><main class="guide-main"><div class="breadcrumbs"><a href="/">トップ</a> › <a href="/${key}/">${cfg.label}</a> › ${escapeHtml(p.name)}</div><span class="update-pill">2026年10月更新</span><div class="product-visual">${cfg.icon}</div><h1>${escapeHtml(p.name)}を比較</h1><p class="lead">${escapeHtml(p.brand || '')}の${cfg.label}。${escapeHtml(facts.slice(0,4).join('、'))}を、このサイトの比較データで確認できます。</p><table class="spec-table">${specs}</table><div class="summary-box"><h2>このページで確認できること</h2><ul><li>${escapeHtml(cfg.compareText(p))}</li><li>${escapeHtml(pricePhrase)}</li><li>メーカー公式情報へのリンクから購入前の最新仕様を確認できます。</li></ul></div><h2>比較データ上の注目ポイント</h2><div class="criteria-grid">${scoreCards}</div><p class="note">相性点・編集スコアは、サイト内で同じカテゴリを比較しやすくするために整理した値です。絶対評価やメーカー公式評価ではありません。</p><h2>選ぶときのポイント</h2><p>${escapeHtml(cfg.selectionText)}</p><div class="cta"><h2>${cfg.countLabel}から条件で比較</h2><p>予算や重視ポイントを変えるとランキングが変わります。</p><a href="/${key}/">${cfg.label}比較へ →</a></div><h2>関連ガイド</h2><div class="related">${related}<a href="/${key}/compare/">2製品の直接比較一覧</a><a href="${escapeHtml(p.source || `/${key}/`)}" target="_blank" rel="noopener noreferrer">メーカー公式情報 ↗</a></div><h2>購入前の確認</h2><div class="faq-list"><details><summary>このページの価格・仕様は最新ですか？</summary><p>2026年10月時点の比較用データです。販売価格や仕様は変更されるため、購入前にメーカー公式情報と販売ページをご確認ください。</p></details><details><summary>相性点が高い製品が必ず一番おすすめですか？</summary><p>いいえ。相性点は選んだ重視ポイントに合わせた比較用スコアです。使い方や予算によって適した製品は変わります。</p></details></div></main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/${key}/">${cfg.label}比較</a> ｜ <a href="/methodology/">比較方法</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
};

const patchCategoryIndex = (key, cfg, products) => {
  const file = path.join(targetDir, key, 'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  const detailMap = Object.fromEntries(products.map((p) => [p.id, productUrl(key,p.id)]));
  html = html.replace(/const detailMap=\{[^;]*\};/, `const detailMap=${JSON.stringify(detailMap)};`);
  const cards = products.map((p) => {
    const facts = cfg.shortFacts(p).slice(0,2).join('・') || p.brand || cfg.label;
    return `<a class="discovery-card" href="${productUrl(key,p.id)}"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(facts)}</small></a>`;
  }).join('');
  const section = `<section class="discovery-block" data-all-product-details="1"><h2>全${cfg.countLabel}の商品詳細</h2><p class="generic-note">ランキングで気になった製品は、仕様・比較ポイント・メーカー公式情報を個別ページで確認できます。</p><div class="discovery-grid">${cards}</div></section>`;
  if (/<section class="discovery-block" data-all-product-details="1">[\s\S]*?<\/section>/.test(html)) {
    html = html.replace(/<section class="discovery-block" data-all-product-details="1">[\s\S]*?<\/section>/, section);
  } else {
    const marker = '<section class="discovery-block"><h2>2製品を直接比較</h2>';
    if (html.includes(marker)) html = html.replace(marker, `${section}${marker}`);
    else html = html.replace('<div class="note">', `${section}<div class="note">`);
  }
  fs.writeFileSync(file, html);
};

let created = 0;
let preserved = 0;
for (const [key,cfg] of Object.entries(categories)) {
  const products = loadProducts(key);
  if (products.length !== 30) throw new Error(`${key}: expected 30 products, found ${products.length}`);
  for (const product of products) {
    const file = path.join(targetDir,key,'products',product.id,'index.html');
    if (fs.existsSync(file)) { preserved += 1; continue; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderProduct(key,cfg,product));
    created += 1;
  }
  patchCategoryIndex(key,cfg,products);
}

console.log(`Legacy product details: created ${created} missing pages, preserved ${preserved} existing curated pages, and linked all 60 products.`);
