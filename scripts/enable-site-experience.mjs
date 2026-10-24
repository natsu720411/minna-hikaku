import fs from 'node:fs';
import path from 'node:path';

// Attach the same navigation/favorites/comparison UX to all generated HTML pages.
// Some comparison hubs do not load market-links.js; this avoids leaving them behind.
const dir=path.resolve(process.argv.find(a=>a.startsWith('--target='))?.slice(9)||'public');
let changed=0,visited=0;
const walk=folder=>{
  for(const item of fs.readdirSync(folder,{withFileTypes:true})){
    const full=path.join(folder,item.name);
    if(item.isDirectory()){walk(full);continue}
    if(!item.isFile()||!item.name.endsWith('.html'))continue;
    visited++;
    let html=fs.readFileSync(full,'utf8'),next=html;
    if(!next.includes('href="/site-experience.css"')&&next.includes('</head>')) next=next.replace('</head>','<link rel="stylesheet" href="/site-experience.css"></head>');
    if(!next.includes('src="/site-experience.js"')&&next.includes('</body>')) next=next.replace('</body>','<script src="/site-experience.js" defer></script></body>');
    // Product photo + merchant actions are available on every one of the 430
    // detail pages, main category pages, and pair comparison pages.
    const rel=path.relative(dir,full).split(path.sep).join('/');
    const onCatalogue = /^[^/]+\/index\.html$/.test(rel);
    const onProduct = /^[^/]+\/products\/[^/]+\/index\.html$/.test(rel);
    const onComparison = /^[^/]+\/compare\/[^/]+\/index\.html$/.test(rel);
    if ((onCatalogue||onProduct||onComparison) && !next.includes('src="/market-links.js"') && next.includes('</body>')) {
      next=next.replace('</body>','<script src="/market-links.js" defer></script></body>');
    }
    if(onProduct && !next.includes('class="product-visual') && !next.includes(' catalog-detail-visual')) {
      const icons={earphones:'🎧',smartphones:'📱','mobile-batteries':'🔋',smartwatches:'⌚',tablets:'📱',chargers:'🔌',laptops:'💻',monitors:'🖥️',routers:'📶','electric-toothbrushes':'🪥','hair-dryers':'💨','cordless-vacuums':'🧹','robot-vacuums':'🤖','air-purifiers':'🌬️','rice-cookers':'🍚',mice:'🖱️',keyboards:'⌨️','external-ssds':'💾',microwaves:'🍳',dehumidifiers:'💧'};
      const icon=icons[rel.split('/')[0]]||'📦';
      next=next.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/i,(full,attrs,title)=>full+'<div class="product-visual catalog-detail-visual" aria-label="楽天の商品画像を確認中"><span aria-hidden="true" class="catalog-fallback-icon">'+icon+'</span><small>画像は確認中</small></div>');
    }
    if(next!==html){fs.writeFileSync(full,next);changed++}
  }
};
walk(dir);
console.log('Universal comparison UX attached: '+changed+' of '+visited+' HTML pages.');
