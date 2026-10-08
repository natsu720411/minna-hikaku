import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetName = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] || 'public';
const targetDir = path.resolve(root, targetName);
const CHECKED_LABEL = '2026年10月確認';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.isFile() && entry.name === 'index.html' ? [full] : [];
});

const isProductPage = (file) => {
  const rel = path.relative(targetDir, file).replace(/\\/g, '/');
  return /(^|\/)products\/[^/]+\/index\.html$/.test(rel);
};

const visibleText = (html) => html
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&yen;|&#165;/gi, '¥')
  .replace(/\s+/g, ' ');

const numericPrice = (html) => {
  const text = visibleText(html);
  const labelled = text.match(/(?:比較用掲載価格|公式掲載価格|掲載価格|参考価格|価格)\s*[:：]?\s*[¥￥]?\s*([0-9][0-9,]{2,})\s*円?/);
  if (labelled) return Number(labelled[1].replace(/,/g, ''));
  const yen = text.match(/([0-9][0-9,]{2,})\s*円/);
  return yen ? Number(yen[1].replace(/,/g, '')) : null;
};

if (!fs.existsSync(targetDir)) throw new Error(`Target directory not found: ${targetDir}`);

let changed = 0;
let withNumericPrice = 0;
let withoutNumericPrice = 0;

for (const file of walk(targetDir).filter(isProductPage)) {
  let html = fs.readFileSync(file, 'utf8');
  const price = numericPrice(html);
  if (Number.isFinite(price) && price > 0) withNumericPrice += 1;
  else withoutNumericPrice += 1;

  html = html
    .replace(/<th>公式掲載価格<\/th>/g, '<th>比較用掲載価格</th>')
    .replace(/<th>参考価格<\/th>/g, '<th>比較用掲載価格</th>')
    .replace(/<th>掲載価格<\/th>/g, '<th>比較用掲載価格</th>')
    .replace(/<li>掲載価格：/g, '<li>比較用掲載価格：');

  const message = Number.isFinite(price) && price > 0
    ? `<p class="note price-transparency" data-price-transparency="1" data-price-checked="2026-10"><b>価格について：</b>ページ内の価格は${CHECKED_LABEL}の比較用掲載価格です。セール・販売店・容量やカラーによって現在価格は変わるため、購入前に販売先の最新価格をご確認ください。</p>`
    : '<p class="note price-transparency" data-price-transparency="1" data-price-checked="2026-10"><b>価格について：</b>固定価格を掲載していない製品です。メーカー公式または販売店で現在価格をご確認ください。</p>';

  const existing = /<p class="note price-transparency" data-price-transparency="1"[\s\S]*?<\/p>/;
  const before = html;
  if (existing.test(html)) {
    html = html.replace(existing, message);
  } else if (/<p class="lead">[\s\S]*?<\/p>/.test(html)) {
    html = html.replace(/(<p class="lead">[\s\S]*?<\/p>)/, `$1${message}`);
  } else if (html.includes('<main')) {
    html = html.replace(/(<main[^>]*>)/, `$1${message}`);
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(`Price transparency: ${changed} product pages updated; ${withNumericPrice} with comparison prices, ${withoutNumericPrice} requiring current-price confirmation (${targetName}).`);
