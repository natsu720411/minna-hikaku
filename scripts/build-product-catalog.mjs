import fs from 'node:fs';
import path from 'node:path';

// Build the cross-category catalogue from actual generated detail pages.
const dest = path.resolve(process.argv.find(a=>a.startsWith('--target='))?.slice(9)||'public');
const categoryNames = {
  earphones:'ワイヤレスイヤホン','mobile-batteries':'モバイルバッテリー',
  smartphones:'スマートフォン',smartwatches:'スマートウォッチ',
  tablets:'タブレット',chargers:'USB充電器',laptops:'ノートPC',
  monitors:'PCモニター',routers:'Wi-Fiルーター',
  'electric-toothbrushes':'電動歯ブラシ','hair-dryers':'ヘアドライヤー',
  'cordless-vacuums':'コードレス掃除機','robot-vacuums':'ロボット掃除機',
  'air-purifiers':'空気清浄機','rice-cookers':'炊飯器',mice:'ワイヤレスマウス',
  keyboards:'キーボード','external-ssds':'外付けSSD',microwaves:'電子レンジ・オーブンレンジ',
  dehumidifiers:'衣類乾燥除湿機'
};
const attr=(s,k)=>s.match(new RegExp('<meta\\s+name="'+k+'"\\s+content="([^"]*)"','i'))?.[1]||'';
const decode=(s)=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const output=[];
for(const [key,label] of Object.entries(categoryNames)){
  const dir=path.join(dest,key,'products');
  if(!fs.existsSync(dir))throw new Error('Missing category product details: '+key);
  for(const id of fs.readdirSync(dir).sort()){
    const file=path.join(dir,id,'index.html');
    if(!fs.existsSync(file)) continue;
    const html=fs.readFileSync(file,'utf8');
    const structured=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    let product=null;
    for(const [,raw] of structured){
      try{
        const json=JSON.parse(raw);
        const graph=json['@graph']||[json];
        product=graph.find(p=>p['@type']==='Product')||product;
      }catch{}
    }
    const heading=decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,' ')||'').trim();
    const name=String(product?.name||heading).trim();
    const brand=String(typeof product?.brand==='string'?product.brand:product?.brand?.name||'').trim();
    if(!name) throw new Error('Product name missing: '+file);
    output.push({id,category:key,categoryName:label,name,brand,url:'/'+key+'/products/'+id+'/',description:decode(attr(html,'description')).slice(0,200)});
  }
}
const urls=new Set(output.map(p=>p.url));
if(urls.size!==output.length)throw new Error('Duplicate catalogue URLs');
if(output.length!==430)throw new Error('Expected 430 details in cross-category index; found '+output.length);
fs.writeFileSync(path.join(dest,'product-catalog.json'),JSON.stringify(output));
console.log('Cross-category catalogue: '+output.length+' verified product detail links from '+Object.keys(categoryNames).length+' categories.');
