import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const targetName=process.argv.find((arg)=>arg.startsWith('--target='))?.split('=')[1]||'public';
const targetDir=path.resolve(root,targetName);
const ORIGIN='https://minna-hikaku.vercel.app';
const today=()=>{
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const m=Object.fromEntries(p.map(({type,value})=>[type,value]));
  return `${m.year}-${m.month}-${m.day}`;
};
const write=(rel,html)=>{const file=path.join(targetDir,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);};
const patch=(rel,fn)=>{const file=path.join(targetDir,rel);if(!fs.existsSync(file)) return false;const before=fs.readFileSync(file,'utf8');const after=fn(before);if(after!==before)fs.writeFileSync(file,after);return after!==before;};
const addSitemapUrl=(name,url,priority='0.85')=>{
  const file=path.join(targetDir,name);if(!fs.existsSync(file))return;
  let xml=fs.readFileSync(file,'utf8');
  if(xml.includes(`<loc>${url}</loc>`))return;
  xml=xml.replace('</urlset>',`  <url><loc>${url}</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>\n</urlset>`);
  fs.writeFileSync(file,xml);
};
const shell=(title,description,canonical,body)=>`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css"></head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/"><span>✓</span><span>みんなの比較表</span></a><nav class="guide-nav"><a href="/">トップ</a><a href="/compare/">比較一覧</a></nav></div></header><main class="guide-main">${body}</main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a></div></footer><script src="/market-links.js" defer></script></body></html>`;

// Search Console opportunity: Xperia 1 VIII vs iPhone 17 Pro.
const phonePath='smartphones/compare/xperia-1-viii-vs-iphone-17-pro/index.html';
write(phonePath,shell(
  'Xperia 1 VIIIとiPhone 17 Proを比較 2026｜価格・カメラ・電池・重量',
  'Xperia 1 VIIIとiPhone 17 Proを比較。256GB価格、重量、画面、バッテリー、充電、microSD、カメラの選び分けをメーカー公式情報で整理。',
  `${ORIGIN}/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/`,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/smartphones/">スマートフォン</a> › <a href="/smartphones/compare/">直接比較</a> › Xperia 1 VIII vs iPhone 17 Pro</div>
  <span class="update-pill">2026年10月更新</span>
  <h1>Xperia 1 VIIIと<br>iPhone 17 Proを比較</h1>
  <p class="lead">Google検索で実際に表示が増えている2機種を、メーカー公式情報を基準に比較します。価格だけでなく、サイズ・重量・保存容量・充電・カメラの使い方まで見て選びます。</p>
  <div class="summary-box"><h2>先に結論</h2><ul><li><b>Xperia 1 VIII：</b>microSD、5000mAh、6.5型、Androidの自由度を重視する人向け</li><li><b>iPhone 17 Pro：</b>6.3型、A19 Pro、Apple製品との連携、高速充電を重視する人向け</li><li>256GBのメーカー直販価格は、確認時点でXperia 1 VIIIが235,400円、iPhone 17 Pro SIMフリーが194,800円です。</li></ul></div>
  <h2>スペック・価格比較</h2>
  <div class="table-scroll"><table><thead><tr><th>項目</th><th>Xperia 1 VIII</th><th>iPhone 17 Pro</th></tr></thead><tbody>
  <tr><td>256GB公式価格</td><td>235,400円</td><td>194,800円</td></tr>
  <tr><td>重量</td><td>約200g</td><td>206g</td></tr>
  <tr><td>ディスプレイ</td><td>約6.5型 OLED / 1〜120Hz</td><td>6.3型 Super Retina XDR OLED</td></tr>
  <tr><td>バッテリー公称</td><td>5000mAh</td><td>ビデオ再生 最大33時間</td></tr>
  <tr><td>充電</td><td>ワイヤレス充電対応</td><td>20分で最大50%（条件あり）</td></tr>
  <tr><td>ストレージ</td><td>256GB〜 / microSDXC 最大2TB</td><td>256GB〜 / microSD非対応</td></tr>
  <tr><td>チップ</td><td>Snapdragon 8 Elite Gen 5</td><td>A19 Pro</td></tr>
  </tbody></table></div>
  <h2>どちらを選ぶ？</h2><div class="criteria-grid">
  <div class="criteria-card"><b>写真・動画を大量保存</b><p>microSDを使いたいならXperia 1 VIIIが分かりやすい選択肢です。iPhoneは内蔵容量を購入時に選びます。</p></div>
  <div class="criteria-card"><b>Apple連携</b><p>Mac、AirPods、Apple Watchなどを日常的に使う場合はiPhone 17 Proの連携性を確認すると選びやすくなります。</p></div>
  <div class="criteria-card"><b>価格</b><p>メーカー直販の256GBではiPhone 17 Proが低いですが、キャリア施策・下取り・容量で実支払額は変わります。</p></div>
  </div>
  <h2>メーカー公式で確認</h2><div class="related"><a href="https://www.sony.jp/xperia/products/xperia1m8/spec.html" target="_blank" rel="noopener noreferrer">Xperia 1 VIII 仕様 ↗</a><a href="https://pur.store.sony.jp/xperia/products/xperia1m8/xperia1m8_purchase/" target="_blank" rel="noopener noreferrer">Xperia 1 VIII 価格 ↗</a><a href="https://www.apple.com/jp/iphone-17-pro/specs/" target="_blank" rel="noopener noreferrer">iPhone 17 Pro 仕様 ↗</a><a href="/smartphones/">30機種を条件別比較</a><a href="/smartphones/camera/">カメラ重視で選ぶ</a></div>
  <p class="note">価格は2026年10月確認時のメーカー直販表示です。キャンペーン、容量、通信事業者で変動します。バッテリー公称値は両社で測定指標が異なるため単純比較できません。</p>`
));

// Search Console opportunity: iOS compatible smartwatch fast charging.
const watchPath='smartwatches/fast-charging-ios/index.html';
write(watchPath,shell(
  '充電が速いiPhone対応スマートウォッチ比較 2026｜Apple Watch急速充電',
  '充電が速いiPhone対応スマートウォッチを比較。Apple Watch Series 12、Ultra 3、SE 3の0〜80%充電時間と15分充電後の駆動時間を公式情報で整理。',
  `${ORIGIN}/smartwatches/fast-charging-ios/`,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/smartwatches/">スマートウォッチ</a> › <a href="/smartwatches/iphone/">iPhone向け</a> › 急速充電</div>
  <span class="update-pill">2026年10月更新</span>
  <h1>充電が速いiPhone対応<br>スマートウォッチ比較</h1>
  <p class="lead">「充電が速いiOS対応スマートウォッチはどれ？」という検索向けに、Appleが同じ基準で公開している高速充電データを比較します。</p>
  <div class="summary-box"><h2>結論</h2><ul><li><b>0%→80%の速さ：</b>Apple Watch Series 12が約30分で最短</li><li><b>15分だけ充電：</b>Series 12は最大12時間、Ultra 3は最大12時間、SE 3は最大8時間の通常使用</li><li>充電時間はアダプタ、温度、残量、設定などで変わります。</li></ul></div>
  <h2>高速充電を比較</h2><div class="table-scroll"><table><thead><tr><th>モデル</th><th>0→80%</th><th>15分充電</th><th>通常使用</th></tr></thead><tbody>
  <tr><td>Apple Watch Series 12</td><td>約30分</td><td>最大12時間</td><td>最大24時間</td></tr>
  <tr><td>Apple Watch Ultra 3</td><td>約45分</td><td>最大12時間</td><td>最大42時間</td></tr>
  <tr><td>Apple Watch SE 3</td><td>約45分</td><td>最大8時間</td><td>最大18時間</td></tr>
  </tbody></table></div>
  <h2>速さだけで選ばないポイント</h2><div class="criteria-grid">
  <div class="criteria-card"><b>短時間で戻したい</b><p>朝の支度中など短時間充電が多いならSeries 12の約30分で80%が分かりやすいメリットです。</p></div>
  <div class="criteria-card"><b>そもそも長く使いたい</b><p>Ultra 3は80%まで約45分ですが、通常使用時は最大42時間。充電頻度まで含めて比較します。</p></div>
  <div class="criteria-card"><b>価格も重視</b><p>SE 3も高速充電に対応します。健康機能や画面、価格とのバランスで選ぶと無駄がありません。</p></div>
  </div>
  <div class="related"><a href="https://www.apple.com/jp/apple-watch-series-12/specs/" target="_blank" rel="noopener noreferrer">Series 12 仕様 ↗</a><a href="https://support.apple.com/ja-jp/125095" target="_blank" rel="noopener noreferrer">Ultra 3 仕様 ↗</a><a href="https://www.apple.com/jp/apple-watch-se-3/specs/" target="_blank" rel="noopener noreferrer">SE 3 仕様 ↗</a><a href="/smartwatches/iphone/">iPhone向けスマートウォッチ</a><a href="/smartwatches/battery/">バッテリー重視</a></div>
  <p class="note">ここではiPhoneとの互換性が明確で、Appleが同一系統の高速充電指標を公開しているApple Watch現行モデルを比較しています。</p>`
));

// Search Console opportunity: robot vacuum manufacturer/spec/price overview.
const robotPath='robot-vacuums/manufacturers/index.html';
write(robotPath,shell(
  'ロボット掃除機の主要メーカー比較 2026｜スペック・価格一覧',
  'ロボット掃除機の主要メーカーを一覧比較。iRobot、Roborock、ECOVACS、SwitchBotの代表モデル、吸引・水拭き・自動化・価格を2026年10月の公式情報で整理。',
  `${ORIGIN}/robot-vacuums/manufacturers/`,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/robot-vacuums/">ロボット掃除機</a> › 主要メーカー比較</div>
  <span class="update-pill">2026年10月更新</span>
  <h1>ロボット掃除機の主要メーカー<br>スペック・価格一覧</h1>
  <p class="lead">メーカーごとの違いを先に把握したい人向けに、iRobot、Roborock、ECOVACS、SwitchBotの代表モデルと特徴を並べます。</p>
  <div class="table-scroll"><table><thead><tr><th>メーカー</th><th>代表モデル</th><th>主な特徴</th><th>公式価格の目安</th></tr></thead><tbody>
  <tr><td>iRobot</td><td>Roomba Max 775 Combo</td><td>AI障害物回避 / LiDAR / ローラーモップ / AutoWash</td><td>179,800円（公式表示・取得時）</td></tr>
  <tr><td>Roborock</td><td>Saros 20</td><td>36,000Pa / StarSight 2.0 / 100℃温水モップ洗浄</td><td>販売店で確認</td></tr>
  <tr><td>ECOVACS</td><td>DEEBOT T90 MAX OMNI</td><td>ローラーモップ / 自動給水・洗浄・乾燥 / 最大295分</td><td>99,800円（公式表示・取得時）</td></tr>
  <tr><td>SwitchBot</td><td>K10+ Pro</td><td>直径24.8cmの小型 / 自動ゴミ収集 / レーダーナビ</td><td>64,800円（公式表示・取得時）</td></tr>
  </tbody></table></div>
  <h2>メーカーごとの選び方</h2><div class="criteria-grid">
  <div class="criteria-card"><b>iRobot</b><p>Roombaブランド、障害物回避、全自動ステーションを重視する人向け。吸引力は世代間の相対表現もあるためPaだけで比較しないのがポイントです。</p></div>
  <div class="criteria-card"><b>Roborock</b><p>吸引力、障害物回避、段差対応、ドック自動化を細かく比較したい人向け。現行Saros 20は36,000Paを掲げています。</p></div>
  <div class="criteria-card"><b>ECOVACS</b><p>水拭きとOMNIステーションの自動化を重視しやすいメーカー。T90 MAX OMNIはローラーモップ方式です。</p></div>
  <div class="criteria-card"><b>SwitchBot</b><p>小型モデルやスマートホーム連携を重視する人向け。K10+ Proは直径24.8cmのコンパクトさが特徴です。</p></div>
  </div>
  <h2>価格を見るときの注意</h2><p>ロボット掃除機はセール、セット内容、ステーション有無で価格差が大きいため、この一覧は公式サイトの確認時点の表示価格です。購入時は必ず各販売ページで再確認してください。</p>
  <div class="related"><a href="/robot-vacuums/">20製品を条件別比較</a><a href="/robot-vacuums/auto-empty/">自動ゴミ収集で選ぶ</a><a href="/robot-vacuums/mop/">水拭きで選ぶ</a><a href="https://irobot-jp.com/product/index.html" target="_blank" rel="noopener noreferrer">iRobot公式 ↗</a><a href="https://www.roborock.jp/" target="_blank" rel="noopener noreferrer">Roborock公式 ↗</a><a href="https://www.ecovacs.com/jp/shop/deebot-robotic-vacuum-cleaner/deebot-t90-max-omni-black" target="_blank" rel="noopener noreferrer">ECOVACS公式 ↗</a><a href="https://www.switchbot.jp/products/switchbot-robot-vacuum-cleaner-k10-pro" target="_blank" rel="noopener noreferrer">SwitchBot公式 ↗</a></div>`
));

// Improve gym earphones CTR and answer intent immediately.
patch('earphones/sports/index.html',(html)=>{
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>ジム向けワイヤレスイヤホンおすすめ比較 2026｜汗・外れにくさ・ANC</title>');
  html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="ジム・スポーツジム向けワイヤレスイヤホンを比較。汗への強さ、外れにくさ、ANC、外音取り込みで選び、Sport X20・Powerbeats Pro 2・AeroFit 2 Proなどの向きを整理。">');
  if(!html.includes('data-gsc-gym-summary="1"')){
    html=html.replace(/(<p class="lead">[\s\S]*?<\/p>)/i,`$1<div class="summary-box" data-gsc-gym-summary="1"><h2>ジム用ならこの3タイプから</h2><ul><li><b>外れにくさ重視：</b>イヤーフック系（Soundcore Sport X20 / Powerbeats Pro 2）</li><li><b>周囲も聞きたい：</b>オープンイヤー系（Soundcore AeroFit 2 Pro）</li><li><b>集中したい：</b>ANC搭載のカナル型を、防水・フィットと一緒に比較</li></ul></div>`);
  }
  return html;
});

// Add internal links from the pages that already rank.
patch('smartwatches/iphone/index.html',(html)=>{
  if(!html.includes('/smartwatches/fast-charging-ios/')){
    html=html.replace('<div class="related"><a href="/smartwatches/swimming-cellular/">🏊 水泳・セルラー対応で比較</a></div>','<div class="related"><a href="/smartwatches/swimming-cellular/">🏊 水泳・セルラー対応で比較</a><a href="/smartwatches/fast-charging-ios/">⚡ 充電が速いiPhone対応モデル</a></div>');
  }
  return html;
});
patch('robot-vacuums/index.html',(html)=>{
  if(!html.includes('/robot-vacuums/manufacturers/')){
    html=html.replace('</main>',`<section class="discovery-block" data-gsc-manufacturer-link="1"><h2>主要メーカーから比較</h2><p class="generic-note">iRobot・Roborock・ECOVACS・SwitchBotの代表モデル、スペック、価格目安を一覧で確認できます。</p><div class="discovery-grid"><a class="discovery-card" href="/robot-vacuums/manufacturers/"><b>🏭 ロボット掃除機の主要メーカー比較</b><small>スペック・価格を一覧で見る</small></a></div></section></main>`);
  }
  return html;
});
patch('smartphones/index.html',(html)=>{
  if(!html.includes('/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/')){
    html=html.replace('</main>',`<section class="discovery-block" data-gsc-phone-link="1"><h2>検索で注目されている直接比較</h2><div class="discovery-grid"><a class="discovery-card" href="/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/"><b>Xperia 1 VIII vs iPhone 17 Pro</b><small>価格・重量・画面・充電を比較</small></a></div></section></main>`);
  }
  return html;
});
patch('smartphones/compare/index.html',(html)=>{
  if(!html.includes('/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/')){
    html=html.replace('</main>',`<section class="discovery-block" data-gsc-phone-compare="1"><h2>Search Consoleで表示が増えている比較</h2><div class="discovery-grid"><a class="discovery-card" href="/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/"><b>Xperia 1 VIII vs iPhone 17 Pro</b><small>2026年モデルを直接比較 →</small></a></div></section></main>`);
  }
  return html.replace(/13組/g,'14組');
});
patch('compare/index.html',(html)=>html.replace(/スマートフォン<small>13組/g,'スマートフォン<small>14組').replace(/スマートフォン[^<]{0,20}13組/g,(m)=>m.replace('13組','14組')));
patch('category-home.js',(js)=>{
  if(!js.includes('/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/')){
    js=js.replace('  const directComparisons = [','  const directComparisons = [\n    ["/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/","📱 Xperia 1 VIII vs iPhone 17 Pro","スマートフォン"],');
  }
  js=js.replace("['/smartwatches/iphone/','🍎 iPhone向け']","['/smartwatches/iphone/','🍎 iPhone向け'],['/smartwatches/fast-charging-ios/','⚡ 急速充電']");
  js=js.replace("['/robot-vacuums/obstacle/','👀 障害物回避']","['/robot-vacuums/obstacle/','👀 障害物回避'],['/robot-vacuums/manufacturers/','🏭 メーカー比較']");
  return js.replace('📱 スマートフォン13組','📱 スマートフォン14組');
});

addSitemapUrl('sitemap-guides.xml',`${ORIGIN}/smartwatches/fast-charging-ios/`,'0.86');
addSitemapUrl('sitemap-guides.xml',`${ORIGIN}/robot-vacuums/manufacturers/`,'0.86');

console.log('Applied GSC growth opportunities: Xperia vs iPhone, gym earphones CTR, iOS fast charging, robot vacuum manufacturer guide.');