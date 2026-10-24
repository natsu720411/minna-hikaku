// Read-only coverage sample: never print API secrets or affiliate URLs.
const base=(process.env.MEDIA_AUDIT_BASE||'https://minna-hikaku.vercel.app').replace(/\/$/,'');
const samples=[['イヤホン','Soundcore Liberty 5'],['スマートフォン','iPhone 17'],['モバイルバッテリー','Anker Zolo Power Bank 10000'],['スマートウォッチ','HUAWEI WATCH FIT 4 Pro'],['マウス','Logicool MX Master 3S'],['キーボード','Logicool MX Keys S'],['外付けSSD','SanDisk Extreme Portable SSD 1TB'],['電子レンジ','Panasonic NE-FL1C'],['除湿機','SHARP CV-S71']];
let images=0,affiliates=0;
for(const [category,name] of samples){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),22000);
  try{
    const response=await fetch(base+'/api/product-media?q='+encodeURIComponent(name)+'&provider=rakuten',{headers:{Accept:'application/json'},signal:controller.signal});
    let data={};try{data=await response.json()}catch{}
    const result=data?.result;
    const image=response.ok&&data.ok===true&&result?.provider==='rakuten'&&/^https:\/\//.test(result.imageUrl||'');
    const affiliate=image&&result.isAffiliate===true&&/^https:\/\//.test(result.affiliateUrl||'');
    if(image)images++;
    if(affiliate)affiliates++;
    console.log(category+': '+(image?'画像OK':'画像未取得')+' / '+(affiliate?'アフィリエイトURLあり':'成果報酬URL未確認')+' / HTTP '+response.status+' / API ID='+(data?.configured?.rakutenAffiliate===true?'設定あり':'設定なし')+(!image?' / '+String(data.error||'no_match').slice(0,38):''));
  }catch(e){console.warn(category+': 接続確認不可 ('+String(e.name||'error')+')')}
  finally{clearTimeout(timeout)}
  await new Promise(resolve=>setTimeout(resolve,1250));
}
console.log('Rakuten sample coverage: image '+images+'/'+samples.length+'; affiliate '+affiliates+'/'+samples.length+'.');
console.log('Samples do not establish 430/430 availability or commission.');
if(!affiliates)console.warn('No affiliate result; inspect production affiliate ID configuration.');
