// Read-only Rakuten affiliate/image audit. Does not generate or modify affiliate URLs.
// Sample one representative product from each category; --all audits every indexed product.
// API calls are deliberately sequential and spaced out to respect provider limits.
import fs from 'node:fs';
const base=(process.env.MEDIA_AUDIT_BASE || 'https://minna-hikaku.vercel.app').replace(/\/$/,'');
const full = process.argv.includes('--all');
const catalogPath='dist/product-catalog.json';
if(!fs.existsSync(catalogPath))throw Error('Build first: '+catalogPath);
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
if(catalog.length!==430 || new Set(catalog.map(p=>p.url)).size!==430)throw Error('All 430 products must be indexed');
const spotlight = new Map([
 ['earphones','Soundcore Liberty 5'],
 ['smartphones','iPhone 17'],
 ['mobile-batteries','Anker Zolo Power Bank 10000'],
 ['smartwatches','HUAWEI WATCH FIT 4 Pro'],
 ['mice','Logicool MX Master 3S'],
 ['keyboards','Logicool MX Keys S'],
 ['external-ssds','SanDisk Extreme Portable SSD 1TB'],
 ['microwaves','Panasonic NE-FL1C'],
 ['dehumidifiers','SHARP CV-S71'],
]);
const groups=new Map();
for(const product of catalog) {
  if(!groups.has(product.category))groups.set(product.category,[]);
  groups.get(product.category).push(product);
}
if(groups.size!==20)throw Error('Expected 20 categories; got '+groups.size);
const candidates=full?catalog:[...groups.entries()].map(([category,rows])=>
  rows.find(p=>p.name.toLocaleLowerCase('ja')===String(spotlight.get(category)||'').toLocaleLowerCase('ja'))||rows[0]
);
let images=0,affiliate=0,notFound=0,errors=0;
const rows=[];
for(const [index,p] of candidates.entries()) {
  const timeout=new AbortController();
  const handle=setTimeout(()=>timeout.abort(),24000);
  let state='not_found',http=0;
  try{
    const url=base+'/api/product-media?q='+encodeURIComponent(p.name)+'&provider=rakuten';
    const response=await fetch(url,{signal:timeout.signal,headers:{Accept:'application/json'}});
    http=response.status;
    let data={};try{data=await response.json()}catch{}
    const r=data?.result||{};
    const validImage=response.ok&&data.ok===true&&r.provider==='rakuten'&&/^https:\/\//.test(r.imageUrl||'');
    let validAffiliate=false;
    try{
      const parsed=new URL(r.affiliateUrl||'');
      validAffiliate=r.isAffiliate===true&&parsed.protocol==='https:'&&parsed.hostname==='hb.afl.rakuten.co.jp';
    }catch{}
    if(validImage)images++;
    if(validImage&&validAffiliate)affiliate++;
    state=validImage?(validAffiliate?'affiliate_ok':'image_only'):'not_found';
    if(!validImage)notFound++;
    if(!validImage&&response.status>=500)errors++;
  }catch(e){state=e?.name==='AbortError'?'timeout':'network_error';errors++}
  finally{clearTimeout(handle)}
  rows.push({category:p.category,id:p.id,state,http});
  console.log((index+1)+'/'+candidates.length+' '+p.category+' / '+p.id+' : '+state+' HTTP '+http);
  if(index<candidates.length-1)await new Promise(r=>setTimeout(r,1350));
}
const summary={examined:candidates.length,indexed:catalog.length,categories:groups.size,images,affiliate,notFound,errors};
console.log('Rakuten coverage summary: '+JSON.stringify(summary));
console.log('Success means a correctly formatted API affiliate URL was returned, not a guaranteed commission from a future purchase.');
fs.writeFileSync('rakuten-audit-result.json',JSON.stringify({summary,items:rows},null,2));
