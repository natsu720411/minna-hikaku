import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'dist';
const patchRootSource = process.argv.includes('--root');
const targetDir = path.resolve(root, targetName);
const ORIGIN = 'https://minna-hikaku.vercel.app';
const OGP = `${ORIGIN}/og-image.svg`;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
});

const ogMarkup = `\n  <meta property="og:image" content="${OGP}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="みんなの比較表｜6カテゴリ・150商品を条件別比較">\n  <meta name="twitter:image" content="${OGP}">`;

const patchHtml = (html, { runtime = false } = {}) => {
  if (html.includes('<meta name="twitter:card" content="summary"')) html = html.replace('<meta name="twitter:card" content="summary"', '<meta name="twitter:card" content="summary_large_image"');
  if (!html.includes('name="twitter:card"') && html.includes('</head>')) html = html.replace('</head>', '  <meta name="twitter:card" content="summary_large_image">\n</head>');
  if (!html.includes('property="og:image"') && html.includes('</head>')) html = html.replace('</head>', `${ogMarkup}\n</head>`);
  if (html.includes('class="guide-footer-inner"') && !html.includes('href="/privacy/"')) {
    html = html.replace(/(<div class="guide-footer-inner">[\s\S]*?)(<\/div><\/footer>)/, '$1 ｜ <a href="/privacy/">プライバシーポリシー</a>$2');
  }
  if (runtime && !html.includes('src="/site-finishing.js"')) {
    html = html.replace('</body>', '  <script src="/site-finishing.js" defer></script>\n</body>');
  }
  return html;
};

const ensureSitemapPrivacy = () => {
  const sitemap = path.join(targetDir, 'sitemap.xml');
  if (!fs.existsSync(sitemap)) return;
  let xml = fs.readFileSync(sitemap, 'utf8');
  const url = `${ORIGIN}/privacy/`;
  if (!xml.includes(`<loc>${url}</loc>`)) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const date = `${map.year}-${map.month}-${map.day}`;
    xml = xml.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.4</priority></url>\n</urlset>`);
    fs.writeFileSync(sitemap, xml);
  }
};

if (patchRootSource) {
  const source = path.join(root, 'index.html');
  let html = fs.readFileSync(source, 'utf8');
  const next = patchHtml(html, { runtime: true });
  if (next !== html) fs.writeFileSync(source, next);
}

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);
let changed = 0;
for (const file of walk(targetDir)) {
  const before = fs.readFileSync(file, 'utf8');
  const runtime = path.relative(targetDir, file).replace(/\\/g, '/') === 'index.html';
  const after = patchHtml(before, { runtime });
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}
ensureSitemapPrivacy();
console.log(`Applied social/privacy finishing to ${changed} HTML files (${targetName}).`);
