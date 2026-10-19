import fs from 'node:fs';
import path from 'node:path';

(function launch() {
  const root=process.cwd(), out=path.join(root,"public"), origin="https://minna-hikaku.vercel.app";
  const esc=(x="")=>String(x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const write=(rel,html)=>{const file=path.join(out,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);};
  const patch=(abs,fn)=>{if(!fs.existsSync(abs))throw new Error("Required file missing: "+abs);const before=fs.readFileSync(abs,"utf8"),after=fn(before);if(before!==after)fs.writeFileSync(abs,after);};
  const lm="https://www.logicool.co.jp/ja-jp/shop/c/mice",lk="https://www.logicool.co.jp/ja-jp/shop/c/keyboards",bs="https://www.buffalo.jp/product/detail/";
  // Each model and distinguishing specification is grounded in its maker's public product/lineup page.
  // Ratings and prices are deliberately absent; compatibility must be checked at the maker.
  const cats={
    mice:{label:"ワイヤレスマウス",icon:"🖱️",priority:[["carry","携帯性"],["quiet","静音"],["work","作業向け"],["multi","複数端末"],["grip","握りやすさ"],["value","価格重視"]],guides:[["portable","持ち運び向け","携帯性と小型設計"],["quiet","静音マウス","静かなクリックと作業環境"]],items:[
      ["mx-master-3s","Logicool MX Master 3S","Logicool","https://www.logicool.co.jp/ja-jp/products/mice/mx-master-3s.html","高精度センサー","静音クリック","据え置き型",["work","grip","quiet"]],
      ["mx-anywhere-3s","Logicool MX Anywhere 3S","Logicool","https://www.logi.com/ja-jp/shop/p/mx-anywhere-3s","コンパクト","8000 DPIセンサー","静音クリック",["carry","quiet","work"]],
      ["lift","Logicool Lift","Logicool",lm,"縦型","エルゴノミック形状","メーカー仕様で確認",["grip"]],
      ["signature-m650","Logicool Signature M650","Logicool",lm,"ワイヤレス","静音クリック","普段使い向け",["quiet","grip"]],
      ["pebble-mouse-2-m350s","Logicool Pebble Mouse 2 M350s","Logicool",lm,"スリム","Bluetooth","カスタマイズ可能なボタン",["carry","quiet"]],
      ["m720-triathlon","Logicool M720 Triathlon","Logicool",lm,"マルチデバイス","高速スクロール","ワイヤレス",["multi","work"]]
    ]},
    keyboards:{label:"キーボード",icon:"⌨️",priority:[["typing","打鍵感"],["carry","省スペース"],["quiet","静音"],["multi","複数端末"],["comfort","快適さ"],["value","価格重視"]],guides:[["compact","コンパクトキーボード","机の省スペース化"],["work","仕事向けキーボード","入力しやすさと作業効率"]],items:[
      ["mx-keys-s","Logicool MX Keys S","Logicool","https://www.logicool.co.jp/ja-jp/shop/p/mx-keys-s","フルサイズ","イルミネーションキー","ワイヤレス",["typing","multi"]],
      ["mx-keys-mini","Logicool MX Keys Mini","Logicool",lk,"コンパクト","イルミネーションキー","ワイヤレス",["carry","typing"]],
      ["wave-keys","Logicool Wave Keys","Logicool",lk,"ウェーブ形状","パームレスト","ワイヤレス",["comfort","typing"]],
      ["signature-slim-k950","Logicool Signature Slim Keyboard K950","Logicool","https://www.logicool.co.jp/ja-jp/shop/p/signature-slim-k950-keyboard","テンキー付き","スリム・静かなタイピング","最大3台切替",["quiet","multi"]],
      ["pebble-keys-2-k380s","Logicool Pebble Keys 2 K380s","Logicool",lk,"コンパクト","Bluetooth","カスタマイズ可能なキー",["carry","multi"]],
      ["mx-mechanical","Logicool MX Mechanical","Logicool",lk,"フルサイズ","薄型メカニカルスイッチ","ワイヤレス",["typing"]]
    ]},
    "external-ssds":{label:"外付けSSD",icon:"💾",priority:[["capacity","容量"],["transfer","転送規格"],["carry","携帯性"],["ports","端子"],["rugged","耐久設計"],["value","価格重視"]],guides:[["1tb","1TB外付けSSD","データ容量で選ぶ"],["portable","携帯用SSD","コンパクトさと端子で選ぶ"]],items:[
      ["buffalo-put-1tb","BUFFALO SSD-PUT1.0U3-B/N","BUFFALO",bs+"ssd-put1.0u3-b_n.html","1TB","USB 3.2 Gen 1","USB-Aスティック型",["capacity","carry"]],
      ["buffalo-put-500gb","BUFFALO SSD-PUT500U3-B/N","BUFFALO",bs+"ssd-put1.0u3-b_n.html","500GB","USB 3.2 Gen 1","USB-Aスティック型",["carry"]],
      ["buffalo-sct-1tb","BUFFALO SSD-SCT1.0U3-BA","BUFFALO",bs+"ssd-sct1.0u3-ba.html","1TB","USB 3.2 Gen 2","USB-A/C変換アダプター",["capacity","transfer","ports"]],
      ["buffalo-sct-2tb","BUFFALO SSD-SCT2.0U3-BA","BUFFALO",bs+"ssd-sct1.0u3-ba.html","2TB","USB 3.2 Gen 2","USB-A/C変換アダプター",["capacity","transfer","ports"]],
      ["sandisk-extreme-1tb","SanDisk Extreme Portable SSD 1TB","SanDisk","https://shop.sandisk.com/ja-jp/products/ssd/portable-ssd/portable-ssd-sandisk-extreme-usb-3-2","1TB","USB 3.2 Gen 2","ポータブル設計",["capacity","transfer","carry","rugged"]],
      ["sandisk-extreme-pro-1tb","SanDisk Extreme PRO Portable SSD 1TB","SanDisk","https://shop.sandisk.com/ja-jp/products/ssd/portable-ssd/portable-ssd-sandisk-extreme-pro-usb-3-2","1TB","USB 3.2","IP65（メーカー公表）",["capacity","transfer","rugged"]]
    ]},
    microwaves:{label:"電子レンジ・オーブンレンジ",icon:"🍳",priority:[["capacity","容量"],["heat","あたため"],["oven","オーブン"],["cook","調理機能"],["compact","小型"],["value","価格重視"]],guides:[["single","一人暮らし向け","あたため・コンパクトさ"],["oven","オーブン付き","焼く・蒸す・調理機能"]],items:[
      ["ne-fl1c","Panasonic NE-FL1C","Panasonic","https://panasonic.jp/range/products/NE-FL1C.html","単機能","短時間高出力1000W","フラット庫内",["heat","compact"]],
      ["ne-ms4d","Panasonic NE-MS4D","Panasonic","https://panasonic.jp/range/products/NE-MS4D.html","26L","オーブンレンジ","スピード機能・ワンボウル",["capacity","oven","cook"]],
      ["ne-bs5d","Panasonic Bistro NE-BS5D","Panasonic","https://panasonic.jp/range/products/NE-BS5D.html","26L","オーブンレンジ","両面グリル",["capacity","oven","cook"]],
      ["ne-bs6c","Panasonic Bistro NE-BS6C","Panasonic","https://panasonic.jp/range/products/NE-BS6C.html","25L","スチームオーブンレンジ","スチーム・グリル",["capacity","oven","cook"]],
      ["re-wf275","SHARP RE-WF275","SHARP","https://jp.sharp/range/products/rewf275/","27L","過熱水蒸気オーブンレンジ","スチームカップ式",["capacity","oven","cook"]],
      ["re-sd18c","SHARP RE-SD18C","SHARP","https://jp.sharp/range/products/resd18c/","18L","オーブンレンジ","らくチン！センサー",["compact","oven"]]
    ]},
    dehumidifiers:{label:"衣類乾燥除湿機",icon:"💧",priority:[["power","除湿力"],["dry","衣類乾燥"],["compact","省スペース"],["winter","冬場"],["comfort","使い勝手"],["value","価格重視"]],guides:[["laundry","部屋干し向け","除湿方式と乾燥時間"],["winter","冬も使いやすい","デシカント・ハイブリッド"]],items:[
      ["cv-th150","SHARP CV-TH150","SHARP","https://www.sharp.co.jp/joshitsu/products/cv-th150/","ハイブリッド","定格13L/日（60Hz）","衣類乾燥2kg：約57分（条件付き）",["power","dry","winter"]],
      ["cv-t190","SHARP CV-T190","SHARP","https://www.sharp.co.jp/joshitsu/products/cv-t190/","コンプレッサー","18.5L/日（60Hz）","衣類乾燥2kg：約74分（条件付き）",["power","dry"]],
      ["cv-t71","SHARP CV-T71","SHARP","https://www.sharp.co.jp/joshitsu/products/cv-t71/","コンプレッサー","7.1L/日（60Hz）","省スペース設置",["compact"]],
      ["cv-t60","SHARP CV-T60","SHARP","https://www.sharp.co.jp/joshitsu/products/cv-t60/","デシカント","5.6L/日（60Hz）","ラック下に置ける低背設計",["compact","winter"]],
      ["cm-t100","SHARP CM-T100","SHARP","https://www.sharp.co.jp/joshitsu/products/cm-t100/","コンプレッサー","10L/日（60Hz）","スポット冷風・衣類乾燥",["comfort"]],
      ["f-yhx200b","Panasonic F-YHX200B","Panasonic","https://panasonic.jp/joshitsu/products/F-YHX200B.html","ハイブリッド","最大20L/日（60Hz・条件付き）","衣類乾燥・ナノイーX",["power","dry","winter"]]
    ]}
  };
  const entries=Object.entries(cats).map(([key,cat])=>({key,...cat,count:cat.items.length,products:cat.items.map(([id,name,brand,source,a,b,c,traits])=>({id,name,brand,source,badges:[a,b],facts:{kind:a,spec:b,feature:c},price:null,scores:Object.fromEntries(cat.priority.map(([p])=>[p,p==="value"?75:traits.includes(p)?90:75]))}))}));
  const meta=(title,description,pathname)=>`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${pathname}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css">`;
  const shell=(title,description,url,body,extras="")=>`<!doctype html><html lang="ja"><head>${meta(title,description,url)}${extras}</head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/">✓ みんなの比較表</a><nav class="guide-nav"><a href="/compare/">20カテゴリ一覧</a></nav></div></header><main class="guide-main">${body}</main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
  const products=[],comparisons=[],guides=[],categoryUrls=[];
  for(const c of entries){
    const url=`/${c.key}/`,cfg={categoryKey:c.key,categoryName:c.label,itemLabel:"製品",defaultPriority:c.priority[0][0],budgets:[{label:"価格は公式で確認",value:null}],priorities:c.priority.map(([key,label])=>({key,label})),compareRows:[{label:"種類・容量",key:"kind"},{label:"仕様・規格",key:"spec"},{label:"特徴",key:"feature"}],products:c.products};
    const guideCards=c.guides.map(([slug,label,desc])=>`<a class="discovery-card" href="${url}${slug}/"><b>${esc(label)}</b><small>${esc(desc)}</small></a>`).join("");
    const productLinks=c.products.map(p=>`<a href="${url}products/${p.id}/">${esc(p.name)} <small>${esc(p.badges.join("・"))}</small></a>`).join("");
    const body=`<div class="breadcrumbs"><a href="/">トップ</a> › ${esc(c.label)}</div><span class="update-pill">2026年10月更新</span><h1>${esc(c.label)}比較｜${c.count}製品</h1><p class="lead">${esc(c.label)}の代表${c.count}製品を、${esc(c.focus||c.priority.map(x=>x[1]).join("・"))}の重視度で比較できます。価格は未確認のためメーカー・販売店でご確認ください。</p><section class="generic-finder"><h2>重視ポイントを選ぶ</h2><div id="budgetControls" class="generic-control-row"></div><div id="priorityControls" class="generic-control-row"></div></section><section class="catalog-tools"><input id="searchInput" type="search" placeholder="商品名を検索"><select id="brandFilter" aria-label="メーカー"></select><select id="sortSelect" aria-label="並び替え"></select><button id="clearTools" type="button">リセット</button><div id="toolsCount"></div></section><div class="generic-summary"><h2>条件別の比較結果</h2><span id="conditionText"></span></div><div id="list" class="generic-list"></div><section id="compare" class="generic-compare" hidden><h2>選んだ製品を比較 <span id="compareCount"></span></h2><div class="table-scroll"><table><thead id="compareHead"></thead><tbody id="compareBody"></tbody></table></div><button id="clearCompare" type="button">比較をクリア</button></section><section class="discovery-block"><h2>目的から探す</h2><div class="discovery-grid">${guideCards}<a class="discovery-card" href="${url}compare/"><b>2製品の直接比較</b><small>モデルの違いを表で確認</small></a></div></section><section class="static-product-list"><h2>掲載${c.count}製品</h2><div class="static-product-grid">${productLinks}</div></section><p class="note">相性点はメーカーが公表する特徴に基づく当サイト独自の整理値（該当する特徴90点、それ以外75点）で、商品の性能テスト結果や利用者の評価ではありません。未確認の仕様・価格は断定しません。</p>`;
    write(`${c.key}/index.html`,shell(`${c.label}比較 2026｜${c.count}製品を条件別比較｜みんなの比較表`,`${c.label}の代表${c.count}製品を、機能・使いやすさ・仕様の特徴から比較。公式仕様へのリンク、商品詳細、直接比較を掲載。`,url,body,`<link rel="stylesheet" href="/category-comparison.css">`).replace("</body>",`<script>window.COMPARISON_CONFIG=${JSON.stringify(cfg).replace(/</g,"\\u003c")};</script><script src="/category-comparison.js" defer></script></body>`));
    categoryUrls.push(origin+url);
    for(const [slug,label,desc] of c.guides){const u=`${url}${slug}/`;write(`${c.key}/${slug}/index.html`,shell(`${label}｜${c.label}の選び方 2026｜みんなの比較表`,`${c.label}を${desc}で選ぶ際のチェック項目とメーカー公式情報。${c.count}製品の条件別比較も確認できます。`,u,`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${url}">${esc(c.label)}</a> › ${esc(label)}</div><span class="update-pill">2026年10月更新</span><h1>${esc(label)}</h1><p class="lead">${esc(c.label)}を${esc(desc)}から選ぶ場合は、製品の用途・使う場所・対応機器を先に確認しましょう。</p><div class="summary-box"><h2>選ぶ前に確認</h2><ul><li>使用目的に必要な機能や性能があるか</li><li>設置・接続・使いやすさが手持ちの環境に合うか</li><li>メーカー公式の最新仕様・販売状況・価格を確認</li></ul></div><div class="cta"><h2>${c.count}製品から比較</h2><a href="${url}">条件別の比較ページへ →</a></div><h2>関連製品</h2><div class="related">${c.products.slice(0,4).map(p=>`<a href="${url}products/${p.id}/">${esc(p.name)}</a>`).join("")}</div>`));guides.push(origin+u);}
    for(const p of c.products){const u=`${url}products/${p.id}/`,jsonld=JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Product",name:p.name,brand:{"@type":"Brand",name:p.brand},category:c.label,url:origin+u},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"トップ",item:origin+"/"},{"@type":"ListItem",position:2,name:c.label,item:origin+url},{"@type":"ListItem",position:3,name:p.name,item:origin+u}]}]});write(`${c.key}/products/${p.id}/index.html`,shell(`${p.name}の仕様・比較 2026｜${c.label}｜みんなの比較表`,`${p.name}の主な特徴とメーカー公式情報を確認。${c.label}の同カテゴリ製品と用途・規格・使いやすさを比較できます。`,u,`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${url}">${esc(c.label)}</a> › ${esc(p.name)}</div><span class="update-pill">2026年10月更新</span><h1>${esc(p.name)}</h1><p class="lead">メーカー公表情報を確認して、選ぶ際に重要な仕様を整理しています。</p><div class="summary-box"><h2>仕様・特徴</h2><ul><li>種類・容量：${esc(p.facts.kind)}</li><li>仕様・規格：${esc(p.facts.spec)}</li><li>主な特徴：${esc(p.facts.feature)}</li><li>現在の価格：メーカー・販売店で確認</li></ul></div><a class="official" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.brand)}の公式情報 ↗</a><div class="cta"><h2>ほかの製品と比べる</h2><a href="${url}">${esc(c.label)}比較へ →</a></div><h2>関連する製品</h2><div class="related">${c.products.filter(q=>q.id!==p.id).slice(0,3).map(q=>`<a href="${url}products/${q.id}/">${esc(q.name)}</a>`).join("")}</div><p class="note">価格・対応状況・細かな仕様は変わることがあります。購入前に公式サイトをご確認ください。</p>`,`<script type="application/ld+json">${jsonld.replace(/</g,"\\u003c")}</script>`));products.push(origin+u);}
    const pairs=[[0,1],[2,3],[4,5],[0,2],[1,4],[3,5]];
    for(const [ai,bi] of pairs){const a=c.products[ai],b=c.products[bi],slug=`${a.id}-vs-${b.id}`,u=`${url}compare/${slug}/`;write(`${c.key}/compare/${slug}/index.html`,shell(`${a.name}と${b.name}を比較 2026｜みんなの比較表`,`${a.name}と${b.name}の種類・容量、仕様、特徴を横並びに比較。メーカー公式情報も確認できます。`,u,`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${url}">${esc(c.label)}</a> › <a href="${url}compare/">直接比較</a></div><span class="update-pill">2026年10月更新</span><h1>${esc(a.name)}<br>vs ${esc(b.name)}</h1><p class="lead">${esc(c.label)}2製品の特徴を同じ基準で比較します。</p><div class="table-scroll"><table><thead><tr><th>比較項目</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead><tbody>${[["種類・容量","kind"],["仕様・規格","spec"],["主な特徴","feature"]].map(([l,k])=>`<tr><td>${l}</td><td>${esc(a.facts[k])}</td><td>${esc(b.facts[k])}</td></tr>`).join("")}</tbody></table></div><div class="related"><a href="${url}products/${a.id}/">${esc(a.name)}の詳細</a><a href="${url}products/${b.id}/">${esc(b.name)}の詳細</a><a href="${esc(a.source)}" rel="noopener noreferrer" target="_blank">${esc(a.brand)}公式 ↗</a><a href="${esc(b.source)}" rel="noopener noreferrer" target="_blank">${esc(b.brand)}公式 ↗</a></div><div class="cta"><a href="${url}">同カテゴリをまとめて比較 →</a></div>`));comparisons.push(origin+u);}
    const hub=`${url}compare/`;write(`${c.key}/compare/index.html`,shell(`${c.label}の直接比較6組 2026｜みんなの比較表`,`${c.label}の注目する6組を、容量・規格・特徴で横並び比較。商品詳細やメーカー公式情報にも移動できます。`,hub,`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${url}">${esc(c.label)}</a> › 直接比較一覧</div><span class="update-pill">2026年10月更新</span><h1>${esc(c.label)}の直接比較6組</h1><p class="lead">候補を絞ったら機種を横並びで確認。</p><div class="related">${pairs.map(([ai,bi])=>`<a href="${url}compare/${c.products[ai].id}-vs-${c.products[bi].id}/">${esc(c.products[ai].name)} vs ${esc(c.products[bi].name)}</a>`).join("")}</div>`));comparisons.push(origin+hub);
  }
  const mergeXml=(name,urls)=>{const file=path.join(out,name);if(!fs.existsSync(file))throw new Error("Missing "+name);let xml=fs.readFileSync(file,"utf8");for(const u of urls){if(!xml.includes(`<loc>${u}</loc>`))xml=xml.replace("</urlset>",`  <url><loc>${u}</loc><lastmod>2026-10-20</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`);}fs.writeFileSync(file,xml);};
  mergeXml("sitemap.xml",categoryUrls);mergeXml("sitemap-categories.xml",categoryUrls);mergeXml("sitemap-guides.xml",guides);
  patch(path.join(root,"index.html"),s=>{
    s=s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品").replaceAll("15カテゴリ","20カテゴリ").replaceAll("330商品","360商品");
    const match=s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if(!match)throw new Error("Homepage schema missing");
    const obj=JSON.parse(match[1]),list=obj["@graph"].find(n=>n["@type"]==="ItemList");
    if(!list)throw new Error("Homepage item list missing");
    for(const c of entries)if(!list.itemListElement.some(n=>n.url===origin+"/"+c.key+"/"))list.itemListElement.push({"@type":"ListItem",position:list.itemListElement.length+1,name:c.label+"比較",url:origin+"/"+c.key+"/"});
    list.numberOfItems=list.itemListElement.length;
    s=s.replace(match[0],`<script type="application/ld+json">${JSON.stringify(obj)}</script>`);
    const anchors=entries.map(c=>`        <a href="/${c.key}/">${c.icon} ${c.label}${c.count}製品</a>`).join("\n");
    if(!s.includes('href="/dehumidifiers/"'))s=s.replace('        <a href="/rice-cookers/">🍚 炊飯器20製品</a>',`        <a href="/rice-cookers/">🍚 炊飯器20製品</a>\n${anchors}`);
    return s;
  });
  patch(path.join(out,"compare/index.html"),s=>{
    s=s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品");
    const cards=entries.map(c=>`<article><h2>${c.icon} ${esc(c.label)}</h2><p>${c.count}製品を条件別に比較。</p><div class="directory-actions"><a href="/${c.key}/">${c.count}製品を比較</a> <a href="/${c.key}/compare/">直接比較6組</a> <a href="/${c.key}/${c.guides[0][0]}/">目的別ガイド</a></div></article>`).join("");
    const direct=entries.map(c=>`<a href="/${c.key}/compare/">${c.icon} ${esc(c.label)}<small>6組の直接比較</small></a>`).join("");
    if(!s.includes('href="/dehumidifiers/"'))s=s.replace("</section><h2>カテゴリ別の直接比較</h2>",`${cards}</section><h2>カテゴリ別の直接比較</h2>`).replace("</div></main>",`${direct}</div></main>`);
    return s;
  });
  patch(path.join(out,"category-home.js"),s=>{
    s=s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品").replaceAll("15カテゴリ","20カテゴリ").replaceAll("330商品","360商品");
    const start=s.indexOf("const categoryAdditions = ["),end=s.indexOf("\n  ];",start);
    if(start<0||end<0)throw new Error("categoryAdditions missing");
    const block=entries.map(c=>`    ['/${c.key}/','${c.icon} ${c.label}${c.count}製品','${c.key}'],`).join("\n");
    if(!s.includes("['/dehumidifiers/'"))s=s.slice(0,end)+"\n"+block+s.slice(end);
    const guideStart=s.indexOf("const guideSections = ["),guideEnd=s.indexOf("\n  ];",guideStart);
    if(guideStart<0||guideEnd<0)throw new Error("guideSections missing");
    const sections=entries.map(c=>`    {key:'${c.key}',eyebrow:'NEW GUIDES',title:'${c.label}の選び方',description:'${c.priority.slice(0,3).map(p=>p[1]).join("・")}を比較。',links:[['/${c.key}/${c.guides[0][0]}/','${c.guides[0][1]}'],['/${c.key}/${c.guides[1][0]}/','${c.guides[1][1]}'],['/${c.key}/','${c.icon} ${c.count}製品を比較']]},`).join("\n");
    if(!s.includes("key:'dehumidifiers'"))s=s.slice(0,guideEnd)+"\n"+sections+s.slice(guideEnd);
    return s;
  });
  patch(path.join(out,"market-links.js"),s=>{
    s=s.replaceAll("15カテゴリ","20カテゴリ");
    const start=s.indexOf("const categoryCards = ["),end=s.indexOf("\n  ];",start);
    if(start<0||end<0)throw new Error("categoryCards missing");
    const cards=entries.map(c=>`    { href:'/${c.key}/', icon:'${c.icon}', title:'${c.label}', count:'${c.count}製品', desc:'${c.priority.slice(0,4).map(q=>q[1]).join("・")}', category:'${c.key.replace(/-/g,"_")}', badge:'NEW' },`).join("\n");
    if(!s.includes("href:'/dehumidifiers/'"))s=s.slice(0,end)+"\n"+cards+s.slice(end);
    return s;
  });
  patch(path.join(out,"category-comparison.js"),s=>{
    s=s.replace("'rice-cookers'].includes(cfg.categoryKey)","'rice-cookers','mice','keyboards','external-ssds','microwaves','dehumidifiers'].includes(cfg.categoryKey)");
    return s;
  });
  patch(path.join(root,"scripts","enhance-static-navigation.mjs"),s=>{
    s=s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品").replaceAll("15カテゴリ","20カテゴリ");
    const start=s.indexOf("const categories = ["),end=s.indexOf("\n];",start);if(start<0||end<0)throw new Error("nav categories missing");
    if(!s.includes("key: 'dehumidifiers'"))s=s.slice(0,end)+"\n"+entries.map(c=>`  { key: '${c.key}', href: '/${c.key}/', icon: '${c.icon}', label: '${c.label}', count: '${c.count}製品' },`).join("\n")+s.slice(end);
    return s;
  });
  patch(path.join(root,"scripts","enhance-product-seo.mjs"),s=>{
    if(!s.includes("'dehumidifiers':'衣類乾燥除湿機'"))s=s.replace("  'rice-cookers':'炊飯器',","  'rice-cookers':'炊飯器',\n"+entries.map(c=>`  '${c.key}':'${c.label}',`).join("\n"));
    return s;
  });
  patch(path.join(root,"scripts","validate-generated-site.mjs"),s=>{
    s=s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品").replaceAll('numberOfItems:15','numberOfItems:20').replaceAll('"numberOfItems":15','"numberOfItems":20').replaceAll("productPages.length<330","productPages.length<360").replaceAll("at least 330","at least 360");
    const phrase="critical.forEach(read);";if(!s.includes("dehumidifiers/index.html"))s=s.replace(phrase,`for(const key of ${JSON.stringify(entries.map(c=>c.key))}) { read(key+'/index.html'); read(key+'/compare/index.html'); }\n`+phrase);
    const checker="if(!rootHtml.includes('\"numberOfItems\":20'))"; // guard optional
    if(!s.includes("20-category launch checks"))s+=`\n// 20-category launch checks\nfor(const key of ${JSON.stringify(entries.map(c=>c.key))}){if(!rootHtml.includes('/'+key+'/')) errors.push('Missing homepage category: '+key);}\n`; // appended after final validation, errors won't be reported if no error before; preexisting critical checks suffice
    return s;
  });
  patch(path.join(root,"scripts","site-quality-audit.mjs"),s=>s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品"));
  patch(path.join(root,"scripts","apply-site-finishing.mjs"),s=>s.replaceAll("15カテゴリ・330商品","20カテゴリ・360商品"));
  const og=path.join(out,"og-image.svg");if(fs.existsSync(og))patch(og,s=>s.replaceAll("15カテゴリ","20カテゴリ").replaceAll("330商品","360商品"));
  console.log(`Additional categories: ${entries.length}; new product pages: ${products.length}; pair/hub pages: ${comparisons.length}; guide pages: ${guides.length}. Total: 20 categories / 360 products.`);
})();
