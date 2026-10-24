// Exhaustive read-only audit of Rakuten API-backed affiliate links.
// npm run build first.  --all checks all 430 items; --shard N --shards M splits work.
// Never log affiliate URL values, API credentials, or API response content.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const key = '--' + name;
  const ix = args.indexOf(key);
  if (ix >= 0 && args[ix+1] != null) return args[ix+1];
  const inline = args.find(a => a.startsWith(key + '='));
  return inline ? inline.slice(key.length + 1) : fallback;
};
const shardCount = Number(arg('shards', 1));
const shardIndex = Number(arg('shard', 0));
const minInterval = Number(arg('interval-ms', 2600));
if (!Number.isInteger(shardCount) || shardCount < 1 || shardCount > 20 ||
    !Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount ||
    minInterval < 1000) throw Error('Invalid shard settings');
const base = (process.env.MEDIA_AUDIT_BASE || 'https://minna-hikaku.vercel.app').replace(/\/$/, '');
const catalog = JSON.parse(fs.readFileSync('dist/product-catalog.json', 'utf8'));
if (catalog.length !== 430 || new Set(catalog.map(p=>p.url)).size !== 430) {
  throw Error('Expected 430 unique published products');
}
if (new Set(catalog.map(p=>p.category)).size !== 20) throw Error('Expected 20 product categories');
const items = catalog.filter((_,index)=>index % shardCount === shardIndex);
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
const records = [];
const counter = { affiliate_with_image:0, affiliate_without_image:0, image_without_affiliate:0, no_match:0, rate_limited:0, api_error:0, network_error:0 };
function classify(resp, data) {
  const x = data?.result || {};
  let valid=false;
  try{
    const url=new URL(x.affiliateUrl||'');
    valid=resp.ok && data?.ok===true && x.provider==='rakuten' &&
      x.isAffiliate===true && url.protocol==='https:' &&
      url.hostname==='hb.afl.rakuten.co.jp';
  }catch{}
  const image = resp.ok && data?.ok===true && x.provider==='rakuten' &&
    /^https:\/\//.test(x.imageUrl||'');
  if(valid) return {state:image?'affiliate_with_image':'affiliate_without_image',image,affiliate:true};
  if(image) return {state:'image_without_affiliate',image,affiliate:false};
  const code=String(data?.error||'');
  if(resp.status===429||code.includes('rate_limited'))return {state:'rate_limited',image:false,affiliate:false};
  if(code==='rakuten_no_result'||code==='rakuten_no_safe_result')return {state:'no_match',image:false,affiliate:false};
  return {state:'api_error',image:false,affiliate:false};
}
const output = 'rakuten-audit-shard-'+shardIndex+'.json';
for(let j=0;j<items.length;j++){
  const product=items[j];
  const item={category:product.category,id:product.id,name:product.name,url:product.url,state:'network_error',http:0};
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),26000);
  try{
    const url=base+'/api/product-media?q='+encodeURIComponent(product.name)+'&provider=rakuten';
    const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
    item.http=response.status;
    let data={};
    try{data=await response.json()}catch{}
    const result=classify(response,data);
    item.state=result.state;
    // Deliberately do not save merchant URLs or API tracking IDs.
    item.hasImage=result.image;item.hasAffiliate=result.affiliate;
  }catch(e){
    item.state='network_error';item.error=e?.name==='AbortError'?'timeout':'network';
  }finally{clearTimeout(timeout)}
  counter[item.state]++;
  records.push(item);
  if(j%10===9 || j===items.length-1){
    const summary={total:catalog.length,shards:shardCount,shard:shardIndex,checked:records.length,counters:counter,complete:j===items.length-1};
    fs.writeFileSync(output,JSON.stringify({summary,records},null,2));
    console.log('Progress '+(j+1)+'/'+items.length+', categories checked '+new Set(records.map(r=>r.category)).size+', affiliate='+ (counter.affiliate_with_image+counter.affiliate_without_image)+', missing='+counter.no_match+', errors='+counter.api_error+', throttled='+counter.rate_limited);
  }
  if(j<items.length-1)await sleep(minInterval);
}
console.log('Completed shard '+shardIndex+'/'+shardCount+': '+JSON.stringify(counter));
