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
  <p class="lead">2機種をメーカー公式情報を基準に比較します。価格だけでなく、サイズ・重量・保存容量・充電・カメラの使い方まで見て選びます。</p>
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
  <p class="lead">iPhoneで使う時計を充電速度で選びたい人へ。Appleの公式データで、0〜80%の充電時間と短時間充電で使える時間を比較します。</p>
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
  'ロボット掃除機の主要メーカーを一覧比較。iRobot、Roborock、ECOVACS、SwitchBot、Eufyの代表モデル、吸引・水拭き・自動化・価格を2026年10月の公式情報で整理。',
  `${ORIGIN}/robot-vacuums/manufacturers/`,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/robot-vacuums/">ロボット掃除機</a> › 主要メーカー比較</div>
  <span class="update-pill">2026年10月更新</span>
  <h1>ロボット掃除機の主要メーカー<br>スペック・価格一覧</h1>
  <p class="lead">メーカーごとの違いを先に把握したい人向けに、iRobot、Roborock、ECOVACS、SwitchBot、Eufyの代表モデルと特徴を並べます。</p>

  <p>同じメーカーでもモデルによって機能は異なります。各社の代表機種を比較しています。</p>
  <h2>5メーカーの吸引・水拭き・ステーション・価格を比較</h2>
  <div class="table-scroll"><table><thead><tr><th>メーカー / モデル</th><th>最大吸引力（公表値）</th><th>水拭き方式</th><th>自動ゴミ収集</th><th>モップ洗浄・乾燥</th><th>障害物回避</th><th>価格目安（税込）</th></tr></thead><tbody>
  <tr><th><a href="https://store.irobot-jp.com/item/X285060.html" target="_blank" rel="noopener noreferrer">iRobot / Roomba Max 775 Combo ↗</a></th><td>従来比4倍（公式の比較条件）</td><td>ローラーモップ</td><td>対応</td><td>温水洗浄・温風乾燥</td><td>AI + LiDAR</td><td>通常価格199,800円（割引変動）</td></tr>
  <tr><th><a href="https://jp.roborock.com/pages/roborock-saros-20" target="_blank" rel="noopener noreferrer">Roborock / Saros 20 ↗</a></th><td>36,000Pa</td><td>デュアル回転モップ</td><td>対応</td><td>最大100℃温水洗浄・55℃温風乾燥</td><td>StarSight 2.0</td><td>販売店で確認</td></tr>
  <tr><th><a href="https://www.ecovacs.com/jp/shop/deebot-robotic-vacuum-cleaner/deebot-t90-max-omni-black" target="_blank" rel="noopener noreferrer">ECOVACS / DEEBOT T90 MAX OMNI ↗</a></th><td>30,000Pa</td><td>ローラーモップ</td><td>対応</td><td>自動洗浄・45℃温風乾燥</td><td>dToF LiDAR / TrueDetect 3D</td><td>99,800円（確認時の公式表示）</td></tr>
  <tr><th><a href="https://www.switchbot.jp/products/switchbot-robot-vacuum-cleaner-k10-pro" target="_blank" rel="noopener noreferrer">SwitchBot / K10+ Pro ↗</a></th><td>3,000Pa</td><td>使い捨て床拭きシート</td><td>対応</td><td>自動洗浄・乾燥なし</td><td>PSDセンサー + レーダー</td><td>64,800円（公式割引前）</td></tr>
  <tr><th><a href="https://www.ankerjapan.com/products/t2353" target="_blank" rel="noopener noreferrer">Eufy（Anker） / Omni E25 ↗</a></th><td>20,000Pa</td><td>HydroJetローラーモップ</td><td>対応</td><td>自動洗浄・温風乾燥</td><td>AI.See + レーザーナビ</td><td>149,900円（確認時の公式表示）</td></tr>
  </tbody></table></div>
  <p class="note">吸引力のPaや「従来比」は各社の試験条件が違うため、数字の大小だけで実際の清掃能力は決まりません。価格は2026年10月確認時の公式表示または通常価格の目安で、セール・在庫・販売先によって変わります。</p>
  <h2>メーカーごとの選び方</h2><div class="criteria-grid">
  <div class="criteria-card"><b>iRobot</b><p>Roombaブランド、障害物回避、全自動ステーションを重視する人向け。吸引力は世代間の相対表現もあるためPaだけで比較しないのがポイントです。</p></div>
  <div class="criteria-card"><b>Roborock</b><p>吸引力、障害物回避、段差対応、ドック自動化を細かく比較したい人向け。現行Saros 20は36,000Paを掲げています。</p></div>
  <div class="criteria-card"><b>ECOVACS</b><p>水拭きとOMNIステーションの自動化を重視しやすいメーカー。T90 MAX OMNIはローラーモップ方式です。</p></div>
  <div class="criteria-card"><b>SwitchBot</b><p>小型モデルやスマートホーム連携を重視する人向け。K10+ Proは直径24.8cmのコンパクトさが特徴です。</p></div>
  <div class="criteria-card"><b>Eufy（Anker）</b><p>ローラーモップと自動化を重視するならOmni E25。最大20,000Pa、ゴミ収集、モップ洗浄・温風乾燥に対応します。</p></div>
  </div>
  <h2>価格を見るときの注意</h2><p>ロボット掃除機はセール、セット内容、ステーション有無で価格差が大きいため、この一覧は公式サイトの確認時点の表示価格です。購入時は必ず各販売ページで再確認してください。</p>
  <div class="related"><a href="/robot-vacuums/">20製品を条件別比較</a><a href="/robot-vacuums/auto-empty/">自動ゴミ収集で選ぶ</a><a href="/robot-vacuums/mop/">水拭きで選ぶ</a><a href="https://irobot-jp.com/product/index.html" target="_blank" rel="noopener noreferrer">iRobot公式 ↗</a><a href="https://jp.roborock.com/pages/roborock-saros-20" target="_blank" rel="noopener noreferrer">Saros 20公式 ↗</a><a href="https://www.ecovacs.com/jp/shop/deebot-robotic-vacuum-cleaner/deebot-t90-max-omni-black" target="_blank" rel="noopener noreferrer">ECOVACS公式 ↗</a><a href="https://www.switchbot.jp/products/switchbot-robot-vacuum-cleaner-k10-pro" target="_blank" rel="noopener noreferrer">SwitchBot公式 ↗</a><a href="https://www.ankerjapan.com/products/t2353" target="_blank" rel="noopener noreferrer">Eufy公式 ↗</a></div>`
));

// Improve gym earphones CTR and answer intent immediately.
patch('earphones/sports/index.html',(html)=>{
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>ジム向けワイヤレスイヤホンおすすめ比較 2026｜汗・外れにくさ・ANC</title>');
  html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="ジム用ワイヤレスイヤホンおすすめ候補を比較。Sport X20・Powerbeats Pro 2・AeroFit 2 Pro・Liberty 5の防水、外れにくさ、ANC、外音取り込みを一覧でチェック。">');
  if(!html.includes('data-gsc-gym-summary="1"')){
    html=html.replace(/(<p class="lead">[\s\S]*?<\/p>)/i,`$1<div class="summary-box" data-gsc-gym-summary="1"><h2>ジム用ならこの3タイプから</h2><ul><li><b>外れにくさ重視：</b>イヤーフック系（Soundcore Sport X20 / Powerbeats Pro 2）</li><li><b>周囲も聞きたい：</b>オープンイヤー系（Soundcore AeroFit 2 Pro）</li><li><b>集中したい：</b>ANC搭載のカナル型を、防水・フィットと一緒に比較</li></ul></div>`);
  }
  if(!html.includes('data-gsc-gym-table="1"')){
    const table='<h2>ジム向けイヤホン4機種の比較表</h2><div class="table-scroll" data-gsc-gym-table="1"><table><thead><tr><th>モデル</th><th>イヤホン本体の耐汗・防水</th><th>装着</th><th>ANC</th><th>周囲の音</th><th>公式情報</th></tr></thead><tbody><tr><th>Soundcore Sport X20</th><td>IP68</td><td>伸縮イヤーフック</td><td>あり</td><td>外音取り込み</td><td><a href="https://www.ankerjapan.com/products/a3968" target="_blank" rel="noopener noreferrer">Anker公式 ↗</a></td></tr><tr><th>Powerbeats Pro 2</th><td>IPX4</td><td>イヤーフック</td><td>あり</td><td>外部音取り込み</td><td><a href="https://www.beatsbydre.com/jp/earbuds/powerbeats-pro-2" target="_blank" rel="noopener noreferrer">Beats公式 ↗</a></td></tr><tr><th>Soundcore AeroFit 2 Pro</th><td>IP55</td><td>フック型・オープン/インナー切替</td><td>インナーイヤー時にノイズ低減</td><td>オープンイヤーで聞きやすい</td><td><a href="https://www.ankerjapan.com/products/a3875" target="_blank" rel="noopener noreferrer">Anker公式 ↗</a></td></tr><tr><th>Soundcore Liberty 5</th><td>IP55</td><td>カナル型</td><td>あり</td><td>外音取り込み</td><td><a href="https://www.ankerjapan.com/products/a3957" target="_blank" rel="noopener noreferrer">Anker公式 ↗</a></td></tr></tbody></table></div><p class="note">等級はメーカーの表記です。IPX4のように防塵等級が示されないモデルもあります。耐水性能は永続的ではなく、水泳に使えるという意味ではありません。</p>';
    html=html.replace('<h2>スポーツ向けの注目候補</h2>',table+'<h2>スポーツ向けの注目候補</h2>');
  }
  html=html.replace('汗・雨 → IP55以上を目安に確認','汗・雨 → 防水等級とメーカーの耐汗条件を確認');
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
    html=html.replace('</main>',`<section class="discovery-block" data-gsc-manufacturer-link="1"><h2>主要メーカーから比較</h2><p class="generic-note">iRobot・Roborock・ECOVACS・SwitchBot・Eufyの代表モデル、スペック、価格目安を一覧で確認できます。</p><div class="discovery-grid"><a class="discovery-card" href="/robot-vacuums/manufacturers/"><b>🏭 ロボット掃除機の主要メーカー比較</b><small>スペック・価格を一覧で見る</small></a></div></section></main>`);
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


 // 2026-11-24: actual GSC query "earfun air pro 4+ anker soundcore liberty 5 比較" (32 impressions, 1 click).
// Separate the Plus model from the existing non-Plus comparison. Official specs checked 2026-11-24.
const plusUrl='/earphones/compare/earfun-air-pro-4-plus-vs-soundcore-liberty-5/';
write('earphones/compare/earfun-air-pro-4-plus-vs-soundcore-liberty-5/index.html',shell(
  'EarFun Air Pro 4+ vs Soundcore Liberty 5｜価格・音質機能・電池を比較',
  'EarFun Air Pro 4+（Plus）とAnker Soundcore Liberty 5の違いを、公式価格、対応コーデック、防水、再生時間、ドライバー構成から比較。Air Pro 4とは別モデルです。',
  ORIGIN+plusUrl,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/earphones/">イヤホン</a> › <a href="/earphones/compare/">直接比較</a> › Air Pro 4+ vs Liberty 5</div>
  <span class="update-pill">2026年11月24日 公式情報確認</span>
  <h1>EarFun Air Pro 4+と<br>Soundcore Liberty 5を比較</h1>
  <p class="lead">1万円台のANC対応イヤホン2機種を、メーカーおよび国内取扱元の公開情報で比較します。Air Pro 4+（Plus）はAir Pro 4とは異なる製品です。</p>
  <div class="summary-box"><h2>先に確認したい違い</h2><ul><li>確認時の税込表示価格はAir Pro 4+が13,990円、Liberty 5が14,990円。差額は1,000円です。</li><li>両機ともIP55（イヤホン本体）・LDAC対応。Air Pro 4+はaptX Losslessなどにも対応します。</li><li>通常モード相当の公称再生時間は両機ともイヤホン単体で最大12時間。ケース込みの公称値は54時間と48時間です。</li></ul></div>
  <h2>公式スペック比較表</h2><div class="table-scroll"><table><thead><tr><th>項目</th><th>EarFun Air Pro 4+</th><th>Soundcore Liberty 5</th></tr></thead><tbody>
  <tr><th>確認時の税込表示価格</th><td>13,990円</td><td>14,990円</td></tr>
  <tr><th>Bluetooth</th><td>6.0</td><td>5.4</td></tr>
  <tr><th>対応コーデック（主なもの）</th><td>LDAC / aptX Adaptive / aptX Lossless / SBC / AAC</td><td>SBC / AAC / LDAC</td></tr>
  <tr><th>ドライバー構成</th><td>BA＋10mmダイナミック</td><td>9.2mmダイナミック</td></tr>
  <tr><th>通常再生（本体 / ケース込み）</th><td>最大12時間 / 54時間（ANCオフ）</td><td>最大12時間 / 48時間（通常モード）</td></tr>
  <tr><th>防塵・防水（本体）</th><td>IP55</td><td>IP55</td></tr>
  <tr><th>ケース充電</th><td>USB-C / ワイヤレス</td><td>USB-C / ワイヤレス</td></tr>
  </tbody></table></div>
  <h2>どちらを選ぶ？</h2><div class="criteria-grid"><div class="criteria-card"><b>Androidでコーデックを重視</b><p>aptX Lossless対応端末を使うならAir Pro 4+が候補です。LDACは両機対応ですが、端末・設定・ファームウェア条件を確認してください。</p></div><div class="criteria-card"><b>iPhoneで使う</b><p>iPhoneではLDACやaptX Losslessを利用できないため、価格、装着感、操作性、アプリなどを優先すると選びやすくなります。</p></div><div class="criteria-card"><b>ANCや音質を重視</b><p>ドライバー構成や公称ANC値だけでは実際の音質・遮音性能の優劣は決まりません。共通条件での実測比較は未実施です。</p></div></div>
  <h2>メーカー公式情報と関連比較</h2><div class="related"><a href="https://www.myearfun.com/jp/headphones/earfun-air-pro-4-plus-hi-res-adaptive-anc-true-wireless-earbuds-black" target="_blank" rel="noopener noreferrer">EarFun公式｜Air Pro 4+ ↗</a><a href="https://knicom.co.jp/product/earfun-air-pro-4plus/" target="_blank" rel="noopener noreferrer">国内取扱元｜Air Pro 4+仕様 ↗</a><a href="https://www.ankerjapan.com/products/a3957" target="_blank" rel="noopener noreferrer">Anker公式｜Liberty 5 ↗</a><a href="/earphones/products/soundcore-liberty-5/">Liberty 5の商品詳細</a><a href="/earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/">Air Pro 4（Plusなし）とLiberty 5の比較</a><a href="/earphones/noise-cancelling/">ANC重視のイヤホン比較</a></div>
  <p class="note">価格・仕様は2026年11月24日に確認した公開情報です。セール、測定条件、使用状況により変動します。実機レビューではありません。</p>`
));
const plusLink='<section data-gsc-plus-link="1" class="discovery-block"><h2>Air Pro 4+（Plus）との比較</h2><p>Air Pro 4とは異なるモデルです。価格・コーデック・電池・防水を公式仕様で確認できます。</p><div class="related"><a href="'+plusUrl+'">EarFun Air Pro 4+ vs Soundcore Liberty 5 →</a></div></section>';
for(const rel of ['earphones/compare/index.html','earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/index.html','earphones/products/soundcore-liberty-5/index.html']){
  patch(rel,html=>html.includes('data-gsc-plus-link="1"')?html:html.replace('</main>',plusLink+'</main>'));
}


 // GSC screenshot: robot vacuum comparison and manufacturer/price intent.
 // Use the existing manufacturer table; do not introduce new product claims.
patch(robotPath,html=>{
  html=html.replace(/<title>[^<]*<\/title>/i,'<title>ロボット掃除機のメーカー比較｜5社のスペック・価格一覧【2026】</title>');
  html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="ロボット掃除機の主要5メーカー（iRobot・Roborock・ECOVACS・SwitchBot・Eufy）を比較。代表機種の価格目安・吸引力・水拭き・自動ゴミ収集の一覧と、部屋や予算に合う選び方を解説。">');
  if(!html.includes('data-gsc-robot-buying="1"')){
    const block='<section class="summary-box" data-gsc-robot-buying="1"><h2>ロボット掃除機は何を比較すればいい？</h2><ul><li><b>予算：</b>本体とステーションがセットか確認し、同じ購入条件で価格を比べる。</li><li><b>水拭き：</b>モップ方式だけでなく、洗浄・乾燥の自動化と床材の対応を確認する。</li><li><b>設置場所：</b>家具下の高さ、段差、ドックの寸法と周囲に必要な空間を測ってから選ぶ。</li><li><b>維持費：</b>紙パック、フィルター、ブラシ、モップの交換費用と入手性も確認する。</li></ul><p>この一覧は各社の代表機種の比較であり、メーカー全製品の性能ランキングではありません。</p></section>';
    html=html.replace(/<p class="lead">[\s\S]*?<\/p>/i,m=>m+block);
    const scenarios='<section data-gsc-robot-scenarios="1"><h2>部屋・使い方から比較対象を絞る</h2><div class="criteria-grid"><div class="criteria-card"><b>一人暮らし・狭い部屋</b><p>本体とドックの大きさ、家具下の高さ、ゴミ収集の必要性を確認します。</p><a href="/robot-vacuums/">20製品を条件別に比較 →</a></div><div class="criteria-card"><b>フローリング・水拭き重視</b><p>対応床材、モップの方式、洗浄・乾燥、カーペットへの対処を確認します。</p><a href="/robot-vacuums/mop/">水拭き重視の比較 →</a></div><div class="criteria-card"><b>ペット・髪の毛対策</b><p>ブラシへの毛絡み対策、障害物検知、集じん部のお手入れ方法を確認します。</p><a href="/robot-vacuums/pet/">ペット向けの比較 →</a></div><div class="criteria-card"><b>掃除の手間を減らしたい</b><p>ゴミ収集だけでなくモップの手入れ、給排水や消耗品交換など自分で行う作業を確認します。</p><a href="/robot-vacuums/auto-empty/">自動ゴミ収集の比較 →</a></div></div><p><a href="/robot-vacuums/compare/">候補が2つに絞れたら直接比較する →</a></p></section>';
    html=html.replace('<h2>価格を見るときの注意</h2>',scenarios+'<h2>価格を見るときの注意</h2>');
  }
  return html;
});
for(const guide of ['auto-empty','mop','pet','obstacle','compare']){
  const rel='robot-vacuums/'+guide+'/index.html';
  if(!fs.existsSync(path.join(targetDir,rel))) continue;
  patch(rel,html=>{
    if(html.includes('/robot-vacuums/manufacturers/')) return html;
    return html.replace('</main>','<section class="discovery-block" data-gsc-robot-backlink="1"><h2>メーカーごとの違いも確認</h2><p>主要5社の代表機種を、吸引・水拭き・自動化・価格目安で横並びに比較できます。</p><div class="related"><a href="/robot-vacuums/manufacturers/">ロボット掃除機のメーカー・スペック・価格一覧 →</a></div></section></main>');
  });
}


 // A new direct comparison using the two existing verified October product pages.
const p42LibertyUrl='/earphones/compare/soundcore-p42i-vs-soundcore-liberty-5/';
write('earphones/compare/soundcore-p42i-vs-soundcore-liberty-5/index.html',shell(
  'Soundcore P42i vs Liberty 5｜価格・ANC・防水の違いを比較',
  'Anker Soundcore P42iとLiberty 5を比較。2026年10月掲載の参考価格、ANCオンの公称再生時間、防塵・防水、LDAC対応を整理。',
  ORIGIN+p42LibertyUrl,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/earphones/">イヤホン</a> › <a href="/earphones/compare/">直接比較</a> › P42i vs Liberty 5</div><h1>Soundcore P42iとLiberty 5を比較</h1><p class="lead">同じAnker Soundcoreシリーズで予算を迷う場合に、公開済みの商品詳細のメーカー公称仕様を比較します。</p><div class="summary-box"><h2>主な違い</h2><ul><li>2026年10月掲載の参考価格はP42iが9,990円、Liberty 5が14,990円。</li><li>ANC使用時の公称再生時間はP42iが最大8.5時間、Liberty 5が最大8時間。測定条件が違う場合があるため実使用の電池持ちの差は断定できません。</li><li>どちらもIP55・LDAC対応。ノイズ低減や音質は実測比較していません。</li></ul></div><h2>仕様比較表</h2><div class="table-scroll"><table><thead><tr><th>比較項目</th><th>Soundcore P42i</th><th>Soundcore Liberty 5</th></tr></thead><tbody><tr><th>掲載参考価格</th><td>9,990円</td><td>14,990円</td></tr><tr><th>ANC使用時再生</th><td>最大8.5時間</td><td>最大8時間</td></tr><tr><th>防塵・防水</th><td>IP55</td><td>IP55</td></tr><tr><th>LDAC</th><td>対応</td><td>対応</td></tr></tbody></table></div><h2>購入前の確認ポイント</h2><p>価格差を基準に、イヤーチップの装着感、アプリで調整できる機能、現在の販売価格を確認してください。掲載値は2026年10月時点の情報であり、最新価格や在庫ではありません。</p><div class="related"><a href="/earphones/products/soundcore-p42i/">P42iの詳細</a><a href="/earphones/products/soundcore-liberty-5/">Liberty 5の詳細</a><a href="https://www.ankerjapan.com/products/d1205" target="_blank" rel="noopener noreferrer">P42iメーカー公式 ↗</a><a href="https://www.ankerjapan.com/products/a3957" target="_blank" rel="noopener noreferrer">Liberty 5メーカー公式 ↗</a><a href="/earphones/under-10000/">1万円以下のイヤホン比較</a></div><p class="note">公称仕様を整理した比較で、実機レビューではありません。</p>`
));
for(const rel of ['earphones/compare/index.html','earphones/products/soundcore-p42i/index.html','earphones/products/soundcore-liberty-5/index.html']){
  patch(rel,html=>html.includes('data-gsc-p42-liberty="1"')?html:html.replace('</main>','<section class="discovery-block" data-gsc-p42-liberty="1"><h2>Soundcoreの価格帯で迷ったら</h2><div class="related"><a href="'+p42LibertyUrl+'">P42i vs Liberty 5｜価格・ANC・防水比較 →</a></div></section></main>'));
}


 // Official EarFun product pages, checked 2026-11-24. Individual spec section is used for IPX5.
const earfunUpgradeUrl='/earphones/compare/earfun-air-pro-4-vs-earfun-air-pro-4-plus/';
write('earphones/compare/earfun-air-pro-4-vs-earfun-air-pro-4-plus/index.html',shell(
  'EarFun Air Pro 4と4+の違い｜価格・電池・防水・買い替え比較',
  'EarFun Air Pro 4とAir Pro 4+（Plus）を公式仕様で比較。価格、Bluetooth、ANCオン・オフ時の再生時間、ドライバーと防水表記の違いを整理。',
  ORIGIN+earfunUpgradeUrl,
  `<div class="breadcrumbs"><a href="/">トップ</a> › <a href="/earphones/">イヤホン</a> › <a href="/earphones/compare/">直接比較</a> › Air Pro 4 vs 4+</div><span class="update-pill">2026年11月24日 公式情報確認</span><h1>EarFun Air Pro 4とAir Pro 4+の違い</h1><p class="lead">既存のAir Pro 4と上位モデルAir Pro 4+を、メーカーの公開仕様で比較します。買い替えで変わる点と変わらない点を確認できます。</p><div class="summary-box"><h2>どちらを選ぶ？</h2><ul><li>価格重視：公式サイト表示はAir Pro 4が9,990円、4+が13,990円。確認時の差は4,000円です。</li><li>4+はBluetooth 6.0、BAとダイナミックの2ドライバー構成、IP55表記です。</li><li>両機ともLDACとaptX Losslessに対応。音質・ANCの実測優劣は未確認です。</li></ul></div><h2>公式仕様の比較</h2><div class="table-scroll"><table><thead><tr><th>項目</th><th>Air Pro 4</th><th>Air Pro 4+</th></tr></thead><tbody><tr><th>公式表示価格</th><td>9,990円</td><td>13,990円</td></tr><tr><th>Bluetooth</th><td>5.4</td><td>6.0</td></tr><tr><th>ドライバー</th><td>10mmダイナミック</td><td>10mmダイナミック＋BA</td></tr><tr><th>ANCオフ（本体／ケース込）</th><td>最大11／52時間</td><td>最大12／54時間</td></tr><tr><th>ANCオン（本体／ケース込）</th><td>最大7.5／35時間</td><td>最大8／36時間</td></tr><tr><th>防塵・防水（本体）</th><td>IPX5（個別仕様欄）</td><td>IP55</td></tr><tr><th>主なコーデック</th><td>LDAC・aptX Lossless</td><td>LDAC・aptX Lossless</td></tr></tbody></table></div><p class="note">Air Pro 4の公式ページには比較表と個別仕様欄で防塵表記に差があるため、ここでは個別仕様欄を採用。最新の仕様はメーカーに確認してください。</p><h2>メリットと購入前の注意点</h2><div class="criteria-grid"><div class="criteria-card"><b>Air Pro 4：予算重視</b><p>参考価格が低く、両モデルに共通する高音質コーデックを利用できます。防塵等級は個別仕様欄では確認できません。</p></div><div class="criteria-card"><b>Air Pro 4+：新しい構成</b><p>ドライバー構成とBluetooth規格、防塵表記が異なります。価格差に見合う音質・装着感かは実機で確認してください。</p></div></div><h2>買い替えを判断する</h2><p>Air Pro 4の電池持ちや装着感に不満がなければ、公称仕様の差だけで買い替えが必要とは限りません。利用端末のコーデック対応、予算、保証を合わせて確認してください。</p><div class="related"><a href="https://www.myearfun.com/jp/headphones/earfun-air-pro-4-adaptive-anc-true-wireless-earbuds-black" target="_blank" rel="noopener noreferrer">Air Pro 4 公式仕様 ↗</a><a href="https://www.myearfun.com/jp/headphones/earfun-air-pro-4-plus-hi-res-adaptive-anc-true-wireless-earbuds-black" target="_blank" rel="noopener noreferrer">Air Pro 4+ 公式仕様 ↗</a><a href="/earphones/products/earfun-air-pro-4/">Air Pro 4詳細</a><a href="/earphones/compare/earfun-air-pro-4-plus-vs-soundcore-liberty-5/">Air Pro 4+ vs Liberty 5</a><a href="/earphones/under-10000/">1万円以下の比較</a></div><p class="note">2026年11月24日時点の公式掲載情報。実売価格、再生条件、仕様は変動します。実機レビューではありません。</p>`
));
for(const rel of ['earphones/compare/index.html','earphones/products/earfun-air-pro-4/index.html','earphones/compare/earfun-air-pro-4-plus-vs-soundcore-liberty-5/index.html']){
  patch(rel,html=>html.includes('data-gsc-earfun-upgrade="1"')?html:html.replace('</main>','<section class="discovery-block" data-gsc-earfun-upgrade="1"><h2>Air Pro 4と4+の違い</h2><div class="related"><a href="'+earfunUpgradeUrl+'">Air Pro 4 vs Air Pro 4+｜買い替え・価格・電池の比較 →</a></div></section></main>'));
}

console.log('Applied GSC growth opportunities: Xperia vs iPhone, gym earphones CTR, iOS fast charging, robot vacuum manufacturer guide.');