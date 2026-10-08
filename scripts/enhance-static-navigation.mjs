import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const targetDir = path.resolve(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';
const dateParts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
const dateMap = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
const TODAY = `${dateMap.year}-${dateMap.month}-${dateMap.day}`;

const categories = [
  { key: 'earphones', href: '/earphones/', icon: '🎧', label: 'ワイヤレスイヤホン', count: '30機種' },
  { key: 'mobile-batteries', href: '/mobile-batteries/', icon: '🔋', label: 'モバイルバッテリー', count: '30製品' },
  { key: 'smartphones', href: '/smartphones/', icon: '📱', label: 'スマートフォン', count: '30機種' },
  { key: 'smartwatches', href: '/smartwatches/', icon: '⌚', label: 'スマートウォッチ', count: '20モデル' },
  { key: 'tablets', href: '/tablets/', icon: '📚', label: 'タブレット', count: '20モデル' },
  { key: 'chargers', href: '/chargers/', icon: '🔌', label: 'USB充電器', count: '20製品' },
  { key: 'laptops', href: '/laptops/', icon: '💻', label: 'ノートPC', count: '20モデル' },
  { key: 'monitors', href: '/monitors/', icon: '🖥️', label: 'PCモニター', count: '20製品' },
  { key: 'routers', href: '/routers/', icon: '📶', label: 'Wi-Fiルーター', count: '20製品' },
  { key: 'electric-toothbrushes', href: '/electric-toothbrushes/', icon: '🪥', label: '電動歯ブラシ', count: '20製品' },
  { key: 'hair-dryers', href: '/hair-dryers/', icon: '💨', label: 'ヘアドライヤー', count: '20製品' },
  { key: 'cordless-vacuums', href: '/cordless-vacuums/', icon: '🧹', label: 'コードレス掃除機', count: '20製品' },
  { key: 'robot-vacuums', href: '/robot-vacuums/', icon: '🤖', label: 'ロボット掃除機', count: '20製品' },
  { key: 'air-purifiers', href: '/air-purifiers/', icon: '🌬️', label: '空気清浄機', count: '20製品' },
  { key: 'rice-cookers', href: '/rice-cookers/', icon: '🍚', label: '炊飯器', count: '20製品' },
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
});

const pathnameFor = (file) => {
  const rel = path.relative(targetDir, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return `/${rel.replace(/index\.html$/, '')}`;
};

const currentCategory = (pathname) => categories.find((item) => pathname.startsWith(item.href))?.key || '';
const isProductPage = (pathname) => /\/products\/[^/]+\/$/.test(pathname);
const isPairPage = (pathname) => /\/compare\/[^/]+\/$/.test(pathname);

const navStyle = `<style id="site-category-nav-style">
.site-category-nav{margin:34px 0 8px;padding:22px;border:1px solid #e1e8f1;border-radius:20px;background:linear-gradient(145deg,#fff,#f8fbff);content-visibility:auto;contain-intrinsic-size:420px}
.site-category-nav h2{margin:0 0 6px;font-size:20px}.site-category-nav>p{margin:0 0 14px;color:#6f8096;font-size:12px;line-height:1.7}
.site-category-nav-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.site-category-nav-grid a{display:block;padding:12px 13px;border:1px solid #dfe7f1;border-radius:13px;background:#fff;color:#304a69;text-decoration:none;font-size:12px;font-weight:850;line-height:1.5}.site-category-nav-grid a:hover{border-color:#a8c9fb;color:#0f6cf9}.site-category-nav-grid small{display:block;margin-top:2px;color:#8290a4;font-size:9px}.site-category-nav-all{grid-column:1/-1;text-align:center;background:#eef5ff!important;border-color:#d4e4fb!important;color:#155cb9!important}
.site-trust-box{margin:30px 0 8px;padding:18px;border:1px solid #dfe7f1;border-radius:17px;background:#f8fafc;content-visibility:auto;contain-intrinsic-size:220px}.site-trust-box h2{margin:0 0 10px!important;font-size:18px!important}.site-trust-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.site-trust-grid>div{padding:11px;border-radius:12px;background:#fff;border:1px solid #e5ebf2}.site-trust-grid b{display:block;font-size:10px;color:#65768c;margin-bottom:3px}.site-trust-grid span{font-size:12px;font-weight:850;color:#2c425f}.site-trust-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.site-trust-links a{font-size:11px;font-weight:850;color:#0f6cf9;text-decoration:none}
.pair-difference-summary{margin:24px 0;padding:20px;border:1px solid #dfe7f1;border-radius:18px;background:linear-gradient(145deg,#fff,#f8fbff);content-visibility:auto;contain-intrinsic-size:300px}.pair-difference-summary h2{margin:0 0 8px!important;font-size:21px!important}.pair-difference-summary>p{margin:0 0 12px;color:#6e7e93;font-size:12px;line-height:1.7}.pair-difference-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}.pair-difference-list li{padding:11px 13px;border-radius:12px;background:#fff;border:1px solid #e5ebf2;font-size:12px;line-height:1.65}.pair-difference-list b{color:#203650}.pair-difference-list span{color:#64758b}
.discovery-block,.criteria-grid,.related,.cta{content-visibility:auto;contain-intrinsic-size:420px}
@media(max-width:760px){.site-category-nav{padding:17px 14px}.site-category-nav-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.site-trust-grid{grid-template-columns:1fr}.pair-difference-summary{padding:16px 14px}}@media(max-width:460px){.site-category-nav-grid{grid-template-columns:1fr}}
</style>`;

const navMarkup = (current) => {
  const links = categories.map((item) => {
    const suffix = item.key === current ? '（現在のカテゴリ）' : '';
    return `<a href="${item.href}" data-track="category_click" data-category="${item.key}">${item.icon} ${item.label}<small>${item.count}${suffix}</small></a>`;
  }).join('');
  return `<section class="site-category-nav" data-site-category-nav="1" aria-label="ほかの商品カテゴリ"><h2>ほかのカテゴリも比較</h2><p>15カテゴリ・330商品を、予算や重視ポイントを変えながら比較できます。</p><div class="site-category-nav-grid">${links}<a class="site-category-nav-all" href="/compare/">15カテゴリの比較・直接比較一覧をまとめて見る →</a></div></section>`;
};

const trustMarkup = () => `<section class="site-trust-box" data-site-trust="1" aria-label="掲載情報の確認方針"><h2>掲載情報の確認方針</h2><div class="site-trust-grid"><div><b>最終生成・確認日</b><span>${TODAY}</span></div><div><b>仕様の出典</b><span>メーカー公式情報を優先</span></div><div><b>ランキング</b><span>広告掲載の有無と分離</span></div></div><div class="site-trust-links"><a href="/methodology/">比較方法・スコアの考え方 →</a><a href="/affiliate-disclosure/">広告・アフィリエイト方針 →</a></div></section>`;

const cleanText = (value = '') => String(value)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const pairDifferenceMarkup = (html) => {
  const rows = [...html.matchAll(/<tr><(?:th|td)>([\s\S]*?)<\/(?:th|td)><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)]
    .map((match) => ({ label: cleanText(match[1]), a: cleanText(match[2]), b: cleanText(match[3]) }))
    .filter((row) => row.label && row.a && row.b && row.a !== row.b)
    .slice(0, 5);
  if (!rows.length) return '';
  const items = rows.map((row) => `<li><b>${row.label}</b><br><span>左：${row.a} ／ 右：${row.b}</span></li>`).join('');
  return `<section class="pair-difference-summary" data-pair-differences="1"><h2>表から分かる主な違い</h2><p>優劣を決めるのではなく、仕様表のうち差がある項目を抜き出しています。自分が重視する項目から確認してください。</p><ul class="pair-difference-list">${items}</ul></section>`;
};

const patchRoot = (html) => {
  html = html
    .replace('みんなの比較表｜イヤホン・スマホ・スマートウォッチ・タブレット・USB充電器を比較 2026', 'みんなの比較表｜15カテゴリ・330商品を条件別比較 2026')
    .replace('⌚ スマートウォッチ主要8モデル', '⌚ スマートウォッチ20モデル')
    .replace('📚 タブレット主要8モデル', '📚 タブレット20モデル')
    .replace('🔌 USB充電器主要8製品', '🔌 USB充電器20製品');

  if (!html.includes('aria-label="スマートウォッチ目的別ガイド"')) {
    const newerGuides = `\n      <h2>スマートウォッチを目的から選ぶ</h2>\n      <nav class="initial-links" aria-label="スマートウォッチ目的別ガイド"><a href="/smartwatches/">20モデルを比較</a><a href="/smartwatches/iphone/">iPhone向け</a><a href="/smartwatches/android/">Android向け</a><a href="/smartwatches/battery/">バッテリー重視</a><a href="/smartwatches/sports/">スポーツ向け</a></nav>\n      <h2>タブレットを目的から選ぶ</h2>\n      <nav class="initial-links" aria-label="タブレット目的別ガイド"><a href="/tablets/">20モデルを比較</a><a href="/tablets/student/">大学生・勉強向け</a><a href="/tablets/drawing/">ペン・お絵描き向け</a><a href="/tablets/lightweight/">軽量モデル</a><a href="/tablets/gaming/">ゲーム向け</a></nav>\n      <h2>USB充電器を目的から選ぶ</h2>\n      <nav class="initial-links" aria-label="USB充電器目的別ガイド"><a href="/chargers/">20製品を比較</a><a href="/chargers/iphone/">iPhone向け</a><a href="/chargers/laptop/">ノートPC向け</a><a href="/chargers/compact/">小型・軽量</a><a href="/chargers/multiport/">複数ポート</a></nav>\n`;
    html = html.replace('\n      <h2>イヤホン30機種の詳細</h2>', `${newerGuides}\n      <h2>イヤホン30機種の詳細</h2>`);
  }

  if (!html.includes('aria-label="カテゴリ別の直接比較一覧"')) {
    const block = `\n      <h2>カテゴリ別の直接比較一覧</h2>\n      <nav class="initial-links" aria-label="カテゴリ別の直接比較一覧"><a href="/compare/">📊 15カテゴリの比較一覧</a><a href="/earphones/compare/">🎧 イヤホン12組</a><a href="/mobile-batteries/compare/">🔋 モバイルバッテリー12組</a><a href="/smartphones/compare/">📱 スマホ12組</a><a href="/smartwatches/compare/">⌚ スマートウォッチ12組</a><a href="/tablets/compare/">📚 タブレット12組</a><a href="/chargers/compare/">🔌 USB充電器12組</a></nav>\n`;
    html = html.replace('\n      <h2>比較方針</h2>', `${block}\n      <h2>比較方針</h2>`);
  }
  return html;
};

const patchPairPage = (html) => {
  if (!html.includes('data-pair-differences="1"')) {
    const summary = pairDifferenceMarkup(html);
    if (summary) html = html.replace(/<\/table><\/div>/, `</table></div>${summary}`);
  }
  return html;
};

const ensureSitemapEntry = () => {
  const file = path.join(targetDir, 'sitemap.xml');
  if (!fs.existsSync(file)) return;
  let xml = fs.readFileSync(file, 'utf8');
  const url = `${ORIGIN}/compare/`;
  if (xml.includes(`<loc>${url}</loc>`)) return;
  const entry = `  <url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
  xml = xml.replace('</urlset>', `${entry}</urlset>`);
  fs.writeFileSync(file, xml);
};

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);
let changed = 0;
let pairSummaries = 0;
let trustBoxes = 0;
for (const file of walk(targetDir)) {
  const pathname = pathnameFor(file);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  if (pathname === '/') {
    html = patchRoot(html);
  } else if (pathname !== '/compare/') {
    if (!html.includes('id="site-category-nav-style"') && html.includes('</head>')) html = html.replace('</head>', `${navStyle}</head>`);
    if (isPairPage(pathname)) {
      const hadSummary = html.includes('data-pair-differences="1"');
      html = patchPairPage(html);
      if (!hadSummary && html.includes('data-pair-differences="1"')) pairSummaries += 1;
    }
    if ((isProductPage(pathname) || isPairPage(pathname)) && !html.includes('data-site-trust="1"') && html.includes('</main>')) {
      html = html.replace('</main>', `${trustMarkup()}</main>`);
      trustBoxes += 1;
    }
    if (!html.includes('data-site-category-nav="1"') && html.includes('</main>')) html = html.replace('</main>', `${navMarkup(currentCategory(pathname))}</main>`);
    if (html.includes('class="guide-nav"') && !html.includes('href="/compare/"')) {
      html = html.replace('<nav class="guide-nav">', '<nav class="guide-nav"><a href="/compare/">全カテゴリ</a>');
    }
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}
ensureSitemapEntry();
console.log(`Enhanced ${changed} HTML files (${targetName}); pair summaries: ${pairSummaries}; trust boxes: ${trustBoxes}.`);
