import fs from 'node:fs';
import path from 'node:path';

// Prioritize pages with confirmed GSC impressions from Windsor.ai.
// The site copies public/ to dist/ during Vite build; patches run before Vite.
const root = process.cwd();
const target = process.argv.find(a => a.startsWith('--target='))?.slice('--target='.length) || 'public';
const dest = path.resolve(root,target);
const patch = (rel,fn) => {
  const file = path.join(dest,rel);
  if(!fs.existsSync(file)) throw new Error('Windsor SEO target missing: '+rel);
  const before = fs.readFileSync(file,'utf8');
  const after = fn(before);
  if(!after.includes('data-windsor-focus=')) throw new Error('Windsor SEO marker missing: '+rel);
  if(after!==before) fs.writeFileSync(file,after);
};
const meta = (html,title,description) => html
  .replace(/<title>[^<]*<\/title>/i,'<title>'+title+'</title>')
  .replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="'+description+'">');
const appendAfterLead = (html,content) => {
  const lead=/<p class="lead">[\s\S]*?<\/p>/i;
  if(!lead.test(html))throw new Error('Missing lead for Windsor optimization');
  return html.replace(lead,m=>m+content);
};
const insertBefore = (html,anchor,content) => {
  if(!html.includes(anchor))throw new Error('Windsor anchor missing: '+anchor);
  return html.replace(anchor,content+anchor);
};
// 138 impressions / 4 clicks / 2.9% CTR: explain model differences immediately.
patch('earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/index.html',html=>{
  html=meta(html,
    'Soundcore Liberty 5 vs EarFun Air Pro 4｜価格・ANC・防水を比較【2026】',
    'Liberty 5とEarFun Air Pro 4の違いをメーカー公式仕様で比較。参考価格差5,000円、ANC再生8時間と7.5時間、IP55とIPX5、高音質コーデックの違い・選ぶ目安を解説。');
  if(!html.includes('data-windsor-focus="earfun-vs-liberty"')){
    html=appendAfterLead(html,
      '<section class="summary-box" data-windsor-focus="earfun-vs-liberty"><h2>結論：価格・耐水・コーデックで選ぶ</h2><ul><li><b>価格重視：</b>比較用参考価格はEarFun Air Pro 4が9,990円、Liberty 5が14,990円（差額5,000円）。最新価格は各社公式で確認してください。</li><li><b>防塵も重視：</b>Liberty 5はIP55、Air Pro 4はIPX5（どちらもイヤホン本体の表記）。IP55は防塵等級を含みます。</li><li><b>Androidの高音質：</b>両機ともLDACに対応。Air Pro 4はaptX Adaptive・Losslessにも対応しています。再生機器側のコーデック対応が必要です。</li></ul><p>※ この表は<strong>EarFun Air Pro 4</strong>との比較です。検索で見かける「Air Pro 4+（Plus）」は製品名が異なるため、同一モデルとして扱いません。</p></section>');
    html=insertBefore(html,'<h2>よくある質問</h2>',
      '<h2>メーカー公式の仕様・販売状況を確認</h2><div class="related"><a href="https://www.ankerjapan.com/products/a3957" target="_blank" rel="noopener noreferrer">Anker公式｜Soundcore Liberty 5 ↗</a><a href="https://www.myearfun.com/jp/headphones/earfun-air-pro-4-adaptive-anc-true-wireless-earbuds-black" target="_blank" rel="noopener noreferrer">EarFun公式｜Air Pro 4 ↗</a><a href="/earphones/compare/">ほかのイヤホンの2製品比較</a></div>');
  }
  return html;
});
// 38 impressions / no clicks: make the indexed order-specific pair useful.
patch('smartphones/compare/iphone-17-pro-vs-xperia-1-viii/index.html',html=>{
  html=meta(html,
    'iPhone 17 Pro vs Xperia 1 VIII｜価格・カメラ・電池を比較【2026】',
    'iPhone 17 ProとSony Xperia 1 VIIIの違いを比較。価格・カメラ・バッテリー・重量・ストレージなどの主要仕様と、256GBモデルの詳細比較へのリンクを掲載。');
  if(!html.includes('data-windsor-focus="iphone-xperia"')){
    html=appendAfterLead(html,
      '<section class="summary-box" data-windsor-focus="iphone-xperia"><h2>最初に比較したいポイント</h2><ul><li><b>価格：</b>同じ保存容量・新品購入条件で比較。セールや販売チャネルの違いに注意。</li><li><b>カメラ：</b>画質の好み、望遠、動画機能など普段の撮影用途を確認。</li><li><b>持ちやすさ：</b>重量だけでなく本体サイズと画面の見やすさも合わせて確認。</li></ul><p><a href="/smartphones/compare/xperia-1-viii-vs-iphone-17-pro/">256GB価格・microSD・画面・充電まで含めた詳細比較を見る →</a></p></section>');
  }
  return html;
});
// 25 impressions / no clicks: answer concrete iPhone notification and charging intent.
patch('smartwatches/iphone/index.html',html=>{
  html=meta(html,
    'iPhone対応スマートウォッチ比較 2026｜通知返信・決済・急速充電',
    'iPhoneで使いやすいスマートウォッチを比較。Apple Watch・Garmin・HUAWEIの通知確認と返信、通話、決済、バッテリー、急速充電の選び方を整理。');
  if(!html.includes('data-windsor-focus="watch-iphone"')){
    html=appendAfterLead(html,
      '<section class="summary-box" data-windsor-focus="watch-iphone"><h2>使い方別に選ぶなら</h2><ul><li><b>LINE・メールを手首で操作：</b>返信などのiPhone連携を重視するならApple Watchから確認。返信対応はアプリごとに異なります。</li><li><b>充電回数を減らす：</b>Garmin・HUAWEIなどのiOS対応モデルも候補。通話や通知への返信は機種別に確認。</li><li><b>短時間で充電：</b><a href="/smartwatches/fast-charging-ios/">Apple Watchの0〜80%急速充電比較</a>で充電時間を比べられます。</li></ul></section>');
    html=insertBefore(html,'<h2>選ぶ流れ</h2>',
      '<h2>よくある疑問</h2><div class="faq-list"><details><summary>iPhone 15でも新しいスマートウォッチを使える？</summary><p>購入時の対応iOSバージョンとiPhoneのOSを確認してください。モデルや機能によって利用条件が異なります。</p></details><details><summary>Apple Watch以外でLINEの返信はできる？</summary><p>通知表示と返信機能は別です。iOS向けアプリの機能や制限が機種によって異なるため、メーカーの対応表を確認してください。</p></details></div>');
  }
  return html;
});
// 22 impressions / no clicks: provide choice between time-to-charge and days-to-charge.
patch('smartwatches/battery/index.html',html=>{
  html=meta(html,
    'スマートウォッチの電池持ち比較 2026｜充電頻度・GPS・急速充電',
    'スマートウォッチの電池持ちを比較。Apple Watch・Garmin・HUAWEIなどの公称時間、常時表示、GPS利用、充電頻度と急速充電の違いを解説。');
  if(!html.includes('data-windsor-focus="watch-battery"')){
    html=appendAfterLead(html,
      '<section class="summary-box" data-windsor-focus="watch-battery"><h2>先に決めたいのは「長持ち」か「充電の速さ」</h2><ul><li><b>毎日の充電を減らす：</b>通常使用・常時表示・GPSで公称時間の測定条件が違うため、同じ使い方で比べます。</li><li><b>朝の支度中に充電：</b><a href="/smartwatches/fast-charging-ios/">iPhone対応モデルの急速充電比較</a>で0〜80%の所要時間を確認。</li><li><b>iPhoneと連携：</b><a href="/smartwatches/iphone/">iPhoneの通知・返信・決済の比較</a>も合わせて確認します。</li></ul></section>');
  }
  return html;
});
// Help a user coming from the category page find the high-impression direct comparison.
patch('earphones/index.html',html=>{
  if(!html.includes('data-windsor-focus="earphone-discovery"')){
    html=insertBefore(html,'<h2>30機種の商品ページ</h2>',
      '<section data-windsor-focus="earphone-discovery"><h2>迷ったら2機種を直接比較</h2><p>音質だけでなく、価格・ANC・防水・バッテリーの違いを表で確認できます。</p><div class="related"><a href="/earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/">Soundcore Liberty 5 vs EarFun Air Pro 4｜価格・ANC・防水</a><a href="/earphones/compare/earfun-air-pro-4-vs-soundcore-p42i/">EarFun Air Pro 4 vs Soundcore P42i｜主要仕様の比較</a></div></section>');
  }
  return html;
});

// 2026-10-26 GSC: Galaxy Watch8 40mm vs 44mm (40 impressions, 2 clicks, position 6.65).
// Both sizes' facts were verified against Samsung's published Watch8 specifications.
patch('smartwatches/compare/galaxy-watch8-40-vs-galaxy-watch8-44/index.html',html=>{
  html=meta(html,
    'Galaxy Watch8 40mmと44mmの違い｜重さ・画面・電池を比較【2026】',
    'Galaxy Watch8の40mmと44mmを比較。約30g対34g、画面1.34型対1.47型、バッテリー325mAh対435mAh。選び方と公式仕様を整理。');
  if(!html.includes('data-windsor-focus="watch8-size-comparison"')){
    html=appendAfterLead(html,
      '<section class="summary-box" data-windsor-focus="watch8-size-comparison"><h2>Galaxy Watch8 40mmと44mmの主な違い</h2><ul><li><b>本体重量：</b>40mmは約30g、44mmは約34g（いずれもバンドを除くメーカー公称値）。</li><li><b>画面：</b>40mmは約1.34型、44mmは約1.47型。文字の見やすさと装着感のどちらを優先するかで選びます。</li><li><b>電池容量：</b>40mmは325mAh、44mmは435mAh。ただしSamsung公称の使用時間は両サイズともAODオフ最大40時間、AODオン最大30時間です。容量だけで実際の駆動時間は判断できません。</li></ul><p>どちらもAndroid向けのGalaxy Watch8です。価格は容量・通信方式・販売先で異なるため、購入時点のメーカー公式表示を確認してください。</p></section>');
    html=insertBefore(html,'<div class="cta">',
      '<h2>40mmと44mmはどちらを選ぶ？</h2><p>軽さや手首への収まりを優先するなら40mm、画面の見やすさを優先するなら44mmから試すと選びやすくなります。装着感は個人差があるため、可能なら実機で確認してください。</p><div class="related"><a href="https://www.samsung.com/jp/watches/galaxy-watch/galaxy-watch8-40mm-silver-bluetooth-sm-l320nzsjxjp/" target="_blank" rel="noopener noreferrer">Samsung公式｜40mmの仕様 ↗</a><a href="https://www.samsung.com/jp/watches/galaxy-watch/galaxy-watch8-44mm-silver-bluetooth-sm-l330nzsjxjp/" target="_blank" rel="noopener noreferrer">Samsung公式｜44mmの仕様 ↗</a><a href="/smartwatches/battery/">スマートウォッチの電池持ちを比較</a><a href="/smartwatches/android/">Android向けの選び方</a></div>');
  }
  return html;
});
patch('smartwatches/index.html',html=>{
  if(!html.includes('data-windsor-focus="watch8-size-discovery"')){
    html=insertBefore(html,'<section class="static-product-list">',
      '<section class="discovery-block" data-windsor-focus="watch8-size-discovery"><h2>Galaxy Watch8のサイズで迷ったら</h2><p>40mmと44mmの重量・画面・電池容量をメーカー公称値で比較できます。</p><div class="discovery-grid"><a class="discovery-card" href="/smartwatches/compare/galaxy-watch8-40-vs-galaxy-watch8-44/"><b>Galaxy Watch8 40mm vs 44mm</b><small>約30gと34g、画面・電池の違いを見る →</small></a></div></section>');
  }
  return html;
});

// 2026-10-26 GSC: AQUOS sense10 vs motorola edge 60 pro (20 impressions, 0 clicks, position 9.75).
// Specs below are from SHARP and Motorola official product specifications; no unverified price claim.
patch('smartphones/compare/aquos-sense10-vs-motorola-edge-60-pro/index.html',html=>{
  html=meta(html,
    'AQUOS sense10 vs motorola edge 60 pro｜重さ・画面・充電を比較【2026】',
    'AQUOS sense10とmotorola edge 60 proの違いを比較。166g対184g、6.1型対6.7型、5000mAh、急速充電、microSD対応の選び分けを公式仕様で解説。');
  if(!html.includes('data-windsor-focus="aquos-motorola-comparison"')){
    html=appendAfterLead(html,
      '<section class="summary-box" data-windsor-focus="aquos-motorola-comparison"><h2>最初に確認したい違い</h2><ul><li><b>軽さ・画面：</b>AQUOS sense10は約166g・約6.1型、edge 60 proは約184g・約6.7型。軽さを優先するか、大きな画面を優先するかが分かれ目です。</li><li><b>バッテリー：</b>どちらも公称5,000mAh。電池持ちは画面や使い方によって変わるため、容量だけで優劣は断定できません。</li><li><b>充電・保存：</b>AQUOS sense10は最大36W給電・microSDXC対応、edge 60 proは125W TurboPower対応・microSD非対応。充電出力は対応充電器や条件で変わります。</li></ul></section>');
    html=insertBefore(html,'<div class="cta">',
      '<h2>購入前に確認すること</h2><p>本体価格は容量・販売店・セールによって変動します。掲載価格だけでなく、保存容量と充電器の付属条件をそろえて比較してください。カメラ画質や実使用の電池持ちは、仕様値だけでは優劣を決められません。</p><div class="related"><a href="https://jp.sharp/k-tai/products/aquos-sense10/specs/" target="_blank" rel="noopener noreferrer">SHARP公式｜AQUOS sense10仕様 ↗</a><a href="https://store.motorola.co.jp/item/EDGE60PRO.html" target="_blank" rel="noopener noreferrer">Motorola公式｜edge 60 pro仕様 ↗</a><a href="/smartphones/under-100000/">10万円以下のスマホ比較</a><a href="/smartphones/compare/">ほかの2機種比較</a></div>');
  }
  return html;
});
patch('smartphones/index.html',html=>{
  if(!html.includes('data-windsor-focus="aquos-motorola-discovery"')){
    html=insertBefore(html,'<section class="discovery-block"><h2>人気機種の詳細</h2>',
      '<section class="discovery-block" data-windsor-focus="aquos-motorola-discovery"><h2>軽さと大画面で迷う2機種</h2><div class="discovery-grid"><a class="discovery-card" href="/smartphones/compare/aquos-sense10-vs-motorola-edge-60-pro/"><b>AQUOS sense10 vs motorola edge 60 pro</b><small>166gと184g・画面・充電を直接比較 →</small></a></div></section>');
  }
  return html;
});

console.log('Windsor/GSC SEO: enhanced 5 established pages, with answer-first comparisons and internal links.');
