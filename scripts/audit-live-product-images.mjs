// Public read-only image availability samples. Never log credentials.
const base = (process.env.MEDIA_AUDIT_BASE || 'https://minna-hikaku.vercel.app').replace(/\/$/,'');
const samples = [
  ['スマートウォッチ','HUAWEI WATCH FIT 4 Pro'],
  ['スマートフォン','iPhone 17'],
  ['モバイルバッテリー','Anker Zolo Power Bank 10000'],
  ['イヤホン','Soundcore Liberty 5'],
];
let found=0;
for(const [category,name] of samples) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetch(base+'/api/product-media?q='+encodeURIComponent(name),{headers:{Accept:'application/json'},signal:controller.signal});
    let data={};
    try {data=await response.json()}catch(_){}
    const hasImage=data.ok===true && /^https:\/\//.test(data.result?.imageUrl||'');
    if(hasImage) found++;
    console.log(category+': '+(hasImage ? ('画像取得OK ('+data.result.provider+')') : ('未取得 HTTP '+response.status+' / '+String(data.error||'no_match')))+', API設定='+JSON.stringify(data.configured??'不明'));
  } catch(err) { console.warn(category+': 接続確認不可 ('+String(err.name||'error')+')'); }
  finally {clearTimeout(timer)}
  await new Promise(resolve=>setTimeout(resolve,1250));
}
console.log('Live product media audit: '+found+'/'+samples.length+' representative product-image API responses succeeded.');
if(!found)console.warn('No image found in sample. Investigate API setup and providers before claiming images display.');
