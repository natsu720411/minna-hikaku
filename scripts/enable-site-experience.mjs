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
    if(next!==html){fs.writeFileSync(full,next);changed++}
  }
};
walk(dir);
console.log('Universal comparison UX attached: '+changed+' of '+visited+' HTML pages.');
