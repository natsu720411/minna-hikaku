import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const targetName=process.argv.find(a=>a.startsWith('--target='))?.split('=')[1]||'dist';
const targetDir=path.resolve(root,targetName);
const errors=[];
const read=(rel)=>{const file=path.join(targetDir,rel);if(!fs.existsSync(file)){errors.push(`Missing: ${rel}`);return '';}return fs.readFileSync(file,'utf8');};
const critical=[
  "index.html",
  "compare/index.html",
  "earphones/index.html",
  "mobile-batteries/index.html",
  "smartphones/index.html",
  "smartwatches/index.html",
  "tablets/index.html",
  "chargers/index.html",
  "laptops/index.html",
  "monitors/index.html",
  "routers/index.html",
  "electric-toothbrushes/index.html",
  "hair-dryers/index.html",
  "cordless-vacuums/index.html",
  "robot-vacuums/index.html",
  "air-purifiers/index.html",
  "rice-cookers/index.html",
  "earphones/compare/index.html",
  "mobile-batteries/compare/index.html",
  "smartphones/compare/index.html",
  "smartwatches/compare/index.html",
  "tablets/compare/index.html",
  "chargers/compare/index.html",
  "laptops/compare/index.html",
  "monitors/compare/index.html",
  "routers/compare/index.html",
  "electric-toothbrushes/compare/index.html",
  "hair-dryers/compare/index.html",
  "cordless-vacuums/compare/index.html",
  "robot-vacuums/compare/index.html",
  "air-purifiers/compare/index.html",
  "rice-cookers/compare/index.html",
  "sitemap.xml",
  "sitemap-products.xml",
  "sitemap-comparisons.xml",
  "robots.txt"
];
critical.forEach(read);
const rootHtml=read('index.html');
for(const stale of ['6カテゴリ','9カテゴリ','12カテゴリ','150商品','210商品','270商品']) if(rootHtml.includes(stale)) errors.push(`Homepage still contains stale count: ${stale}`);
if(!rootHtml.includes('15カテゴリ・330商品')) errors.push('Homepage is missing 15カテゴリ・330商品 copy.');
if(!rootHtml.includes('"numberOfItems":15')) errors.push('Homepage JSON-LD is missing numberOfItems:15.');
for(const key of ["earphones","mobile-batteries","smartphones","smartwatches","tablets","chargers","laptops","monitors","routers","electric-toothbrushes","hair-dryers","cordless-vacuums","robot-vacuums","air-purifiers","rice-cookers"]) if(!rootHtml.includes(`/${key}/`)) errors.push(`Homepage is missing /${key}/ link.`);
const compareHtml=read('compare/index.html');
for(const key of ["earphones","mobile-batteries","smartphones","smartwatches","tablets","chargers","laptops","monitors","routers","electric-toothbrushes","hair-dryers","cordless-vacuums","robot-vacuums","air-purifiers","rice-cookers"]) if(!compareHtml.includes(`/${key}/`)) errors.push(`/compare/ is missing ${key} navigation.`);
if(!compareHtml.includes('15カテゴリ・330商品')) errors.push('/compare/ is missing current totals.');
if(!compareHtml.includes('rel="canonical" href="https://minna-hikaku.vercel.app/compare/"')) errors.push('/compare/ canonical is missing.');
const walkHtml=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>{const full=path.join(dir,entry.name);if(entry.isDirectory())return walkHtml(full);return entry.isFile()&&entry.name==='index.html'?[full]:[];});
const generatedHtml=walkHtml(targetDir);
const relParts=(file)=>path.relative(targetDir,file).replaceAll('\\\\','/').split('/');
const productPages=generatedHtml.filter((file)=>{const parts=relParts(file);return parts.length===4&&parts[1]==='products'&&parts[3]==='index.html';});
const comparisonPages=generatedHtml.filter((file)=>{const parts=relParts(file);return parts[1]==='compare'&&parts.at(-1)==='index.html'&&(parts.length===3||parts.length===4);});
if(productPages.length<330) errors.push(`Expected at least 330 product detail pages, found ${productPages.length}.`);
const toUrl=(file)=>'https://minna-hikaku.vercel.app/'+path.relative(targetDir,file).replaceAll('\\\\','/').replace(/index\.html$/,'');
const comparisons=read('sitemap-comparisons.xml');
const comparisonLocs=[...comparisons.matchAll(/<loc>/g)].length;
if(comparisonLocs<comparisonPages.length) errors.push(`Comparison sitemap has ${comparisonLocs} URLs but ${comparisonPages.length} comparison pages exist.`);
for(const file of comparisonPages){const url=toUrl(file);if(!comparisons.includes(`<loc>${url}</loc>`))errors.push(`Comparison sitemap is missing ${url}`);}
const products=read('sitemap-products.xml');
const productLocs=[...products.matchAll(/<loc>/g)].length;
if(productLocs<productPages.length) errors.push(`Product sitemap has ${productLocs} URLs but ${productPages.length} product pages exist.`);
for(const file of productPages){
  const url=toUrl(file);
  if(!products.includes(`<loc>${url}</loc>`)) errors.push(`Product sitemap is missing ${url}`);
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('data-price-transparency="1"')) errors.push(`${path.relative(targetDir,file)} is missing price-transparency guidance.`);
}
const sitemap=read('sitemap.xml');
if(!sitemap.includes('<loc>https://minna-hikaku.vercel.app/compare/</loc>')) errors.push('sitemap.xml is missing /compare/.');
const robots=read('robots.txt');
for(const name of ['sitemap.xml','sitemap-guides.xml','sitemap-categories.xml','sitemap-products.xml','sitemap-comparisons.xml']) if(!robots.includes(name)) errors.push(`robots.txt is missing ${name}.`);
for(const rel of [
  "earphones/compare/airpods-pro-3-vs-wf-1000xm6/index.html",
  "smartwatches/compare/apple-watch-series-11-42-vs-pixel-watch-4-41/index.html",
  "laptops/compare/macbook-air-13-m4-vs-surface-laptop-13/index.html",
  "electric-toothbrushes/compare/panasonic-ew-dt88-vs-oralb-io9/index.html",
  "hair-dryers/compare/panasonic-eh-nc80-vs-refa-bx/index.html",
  "cordless-vacuums/compare/panasonic-mc-nx810km-vs-shark-neo2-plus-lc551j/index.html",
  "robot-vacuums/compare/roomba-max-775-combo-vs-deebot-t90-omni/index.html",
  "air-purifiers/compare/sharp-ki-wx100-vs-panasonic-f-vxw90/index.html",
  "rice-cookers/compare/zojirushi-nx-ab10-vs-tiger-jrt-a100/index.html"
]){const html=read(rel);if(html&&!html.includes('data-pair-differences="1"'))errors.push(`${rel} is missing pair-difference summary.`);if(html&&!html.includes('data-site-trust="1"'))errors.push(`${rel} is missing trust box.`);}
for(const rel of [
  "smartwatches/products/apple-watch-series-11-42/index.html",
  "laptops/products/macbook-air-13-m4/index.html",
  "electric-toothbrushes/products/panasonic-ew-dt88/index.html",
  "robot-vacuums/products/roomba-max-775-combo/index.html",
  "air-purifiers/products/sharp-ki-wx100/index.html",
  "rice-cookers/products/zojirushi-nx-ab10/index.html"
]){const html=read(rel);if(html&&!html.includes('data-site-trust="1"'))errors.push(`${rel} is missing trust box.`);if(html&&!html.includes('data-site-category-nav="1"'))errors.push(`${rel} is missing category navigation.`);}
if(errors.length){console.error('Generated-site validation failed:');errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log(`Generated-site validation passed: ${comparisonLocs}/${comparisonPages.length} comparison URLs and ${productLocs}/${productPages.length} product URLs covered; 15-category checks passed.`);
