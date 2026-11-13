import fs from 'node:fs';
import path from 'node:path';
(function addFiveMore(){
  // This function is serialized into an ES module, where fs and path are imported above.
  const ROOT=process.cwd(),OUT=path.join(ROOT,"public"),ORIGIN="https://minna-hikaku.vercel.app";
  const TODAY=(()=>{const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());let m=Object.fromEntries(p.map(x=>[x.type,x.value]));return `${m.year}-${m.month}-${m.day}`;})();
  const MONTH=(()=>{const d=TODAY.split("-");return `${d[0]}年${Number(d[1])}月`;})();
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const write=(rel,txt)=>{const f=path.join(OUT,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,txt);};
  const patch=(file,fn)=>{if(!fs.existsSync(file))throw Error("Missing file: "+file);let old=fs.readFileSync(file,"utf8"),out=fn(old);if(old!==out)fs.writeFileSync(file,out);};
  const L="https://www.logicool.co.jp/ja-jp/shop/c/webcams";
  const S="https://www.sony.jp/headphone/compare/";
  const K="https://www.zojirushi.co.jp/syohin/pot_kettle/";
  const P="https://panasonic.jp/toaster/products.html";
  const B="https://www.balmuda.com/jp/toaster/spec/";
  const H="https://panasonic.jp/shaver/comparison.html";
  const cats=[
    {key:"webcams",label:"Webカメラ",icon:"📷",focus:"画質・配信・プライバシー・接続",priority:[["resolution","解像度"],["stream","配信"],["privacy","プライバシー"],["meeting","会議用途"]],guides:[["online-meetings","オンライン会議向け","画角と映り方"],["streaming","配信向け","解像度とフレームレート"]],items:[
      ["mx-brio","Logicool MX Brio","Logicool",L,"4K対応","USB接続","高解像度Webカメラ",["resolution","meeting"]],
      ["brio-530","Logicool Brio 530","Logicool",L,"フルHD 1080p","自動フレーミング","オンライン会議向け",["meeting"]],
      ["c920s-pro","Logicool C920s PRO HD","Logicool",L,"フルHD 1080p","ステレオマイク","Web会議向け",["meeting"]],
      ["c922n-pro","Logicool C922n PRO HD","Logicool",L,"フルHD 1080p","1080p/30fps（メーカー表記）","配信用モデル",["stream","meeting"]],
      ["brio-100","Logicool Brio 100","Logicool",L,"フルHD 1080p","内蔵マイク","プライバシーシャッター",["privacy","meeting"]],
      ["c270","Logicool C270 HD","Logicool",L,"HD 720p","USB接続","ベーシックモデル",["meeting"]]
    ]},
    {key:"over-ear-headphones",label:"ワイヤレスヘッドホン",icon:"🎧",focus:"ノイズキャンセリング・音質・装着タイプ・携帯性",priority:[["anc","ノイズキャンセリング"],["audio","音楽用途"],["light","軽さ"],["everyday","普段使い"]],guides:[["noise-cancelling","ノイキャン重視","対応機能と装着感"],["daily","普段使い向け","価格と重さの確認"]],items:[
      ["wh-1000xm6","Sony WH-1000XM6","Sony",S,"ワイヤレス","ノイズキャンセリング対応","オーバーイヤー",["anc","audio"]],
      ["wh-1000xm5","Sony WH-1000XM5","Sony",S,"ワイヤレス","ノイズキャンセリング対応","オーバーイヤー",["anc","audio"]],
      ["wh-ch720n","Sony WH-CH720N","Sony",S,"ワイヤレス","ノイズキャンセリング対応","ヘッドバンド型",["anc","light","everyday"]],
      ["wh-ch520","Sony WH-CH520","Sony",S,"ワイヤレス","ノイズキャンセリング非搭載","オンイヤー型",["light","everyday"]],
      ["wh-ult900n","Sony ULT WEAR（WH-ULT900N）","Sony",S,"ワイヤレス","ノイズキャンセリング対応","重低音を重視したシリーズ",["anc","audio"]],
      ["wh-ch730n","Sony WH-CH730N","Sony",S,"ワイヤレス","ノイズキャンセリング対応","ヘッドバンド型",["anc","everyday"]]
    ]},
    {key:"electric-kettles",label:"電気ケトル",icon:"🫖",focus:"容量・注ぎやすさ・設置性・安全機能",priority:[["small","少量"],["capacity","大容量"],["pour","注ぎやすさ"],["safety","安全機能"]],guides:[["single","一人暮らし向け","容量と使いやすさ"],["large","大容量ケトル","必要な湯量と収納"]],items:[
      ["ck-ja08","象印 CK-JA08","象印",K,"0.8L","2026年モデル","安全性と注ぎやすさを重視したシリーズ",["small","pour","safety"]],
      ["ck-ja10","象印 CK-JA10","象印",K,"1.0L","2026年モデル","安全性と注ぎやすさを重視したシリーズ",["capacity","pour","safety"]],
      ["ck-vb12","象印 CK-VB12","象印",K,"1.2L","大容量タイプ","メーカー公式で詳細仕様を確認",["capacity"]],
      ["ck-vb15","象印 CK-VB15","象印",K,"1.5L","大容量タイプ","メーカー公式で詳細仕様を確認",["capacity"]],
      ["ck-pa08","象印 CK-PA08","象印",K,"0.8L","STAN.シリーズ","用途に合わせて注ぐ量を選べる",["small","pour"]],
      ["ck-dc08","象印 CK-DC08","象印",K,"0.8L","電気ケトル","メーカー公式で詳細仕様を確認",["small"]]
    ]},
    {key:"toasters",label:"オーブントースター",icon:"🍞",focus:"焼ける枚数・加熱方式・調理機能・サイズ",priority:[["toast","トースト"],["cook","調理機能"],["large","枚数"],["compact","設置性"]],guides:[["bread","食パン・冷凍パン向け","焼き方と加熱方式"],["oven","調理向け","温度調節とメニュー"]],items:[
      ["nt-d530","Panasonic NT-D530","Panasonic",P,"オーブントースター","2026年発売モデル","メーカー公式で詳細仕様を確認",["toast"]],
      ["nt-d700","Panasonic Bistro NT-D700","Panasonic","https://panasonic.jp/toaster/products/NT-D700/spec.html","2枚焼き","自動トーストメニュー","温度調節120〜260℃",["toast","cook"]],
      ["nt-t501","Panasonic NT-T501","Panasonic","https://panasonic.jp/toaster/products/NT-T501/spec.html","4枚焼き","5段階火力切換","タイマー付き",["toast","large"]],
      ["ktt02jp","BALMUDA The Toaster KTT02JP","BALMUDA",B,"2026年発売モデル","スチーム式トースターシリーズ","仕様はメーカーで確認",["toast"]],
      ["k11a","BALMUDA The Toaster K11A","BALMUDA","https://www.balmuda.com/jp/support/products/toaster/k11a","2023年発売モデル","1300W","トーストモードなどを搭載",["toast","cook"]],
      ["k05a","BALMUDA The Toaster K05A","BALMUDA",B,"2020年発売モデル","スチーム式トースターシリーズ","販売状況はメーカーで確認",["toast"]]
    ]},
    {key:"electric-shavers",label:"電動シェーバー",icon:"🪒",focus:"刃の構成・携帯性・お手入れ・本体サイズ",priority:[["blades","多枚刃"],["travel","携帯性"],["care","お手入れ"],["everyday","普段使い"]],guides:[["palm","パームイン型","持ち方と携帯性"],["six-blades","6枚刃モデル","刃の構成と使い方"]],items:[
      ["es-p690u","Panasonic ラムダッシュ パームインPRO ES-P690U","Panasonic",H,"6枚刃","パームインPRO","METAL EDITION",["blades","travel"]],
      ["es-p680u","Panasonic ラムダッシュ パームインPRO ES-P680U","Panasonic",H,"6枚刃","パームインPRO","METAL EDITION",["blades","travel"]],
      ["es-p650u","Panasonic ラムダッシュ パームインPRO ES-P650U","Panasonic",H,"6枚刃","パームインPRO","モデルごとの洗浄方法は公式で確認",["blades","travel"]],
      ["es-p550u","Panasonic ラムダッシュ パームイン ES-P550U","Panasonic",H,"パームイン型","2026年発売シリーズ","刃の構成はメーカーで確認",["travel","everyday"]],
      ["es-p530u","Panasonic ラムダッシュ パームイン ES-P530U","Panasonic",H,"パームイン型","2026年発売シリーズ","刃の構成はメーカーで確認",["travel","everyday"]],
      ["es-p330u","Panasonic ラムダッシュ パームイン LITE ES-P330U","Panasonic",H,"パームイン LITE","2025年発売モデル","詳細仕様はメーカーで確認",["travel","everyday"]]
    ]}
  ];
  // Additional models confirmed from official product catalogues (November 2026). Prices remain unknown.
  const additionalModels = JSON.parse(fs.readFileSync(path.join(ROOT,'scripts','product-expansion-2026.json'),'utf8'));
  for (const c of cats) {
    const rows=additionalModels[c.key];
    if(!Array.isArray(rows)||rows.length!==14)throw Error('Expected 14 additions: '+c.key);
    const ids=new Set(c.items.map(x=>x[0]));
    for(const x of rows){
      if(x.length!==8||ids.has(x[0])||!x[3].startsWith('https://'))throw Error('Invalid model: '+c.key+'/'+x[0]);
      ids.add(x[0]);c.items.push(x);
    }
  }
  if(cats.length!==5||cats.some(c=>c.items.length!==20))throw Error("Expected 5 groups with 20 confirmed models each");
  const totals={categories:25,products:530};
  const entries=cats.map(c=>({...c,count:c.items.length,products:c.items.map(([id,name,brand,source,kind,spec,feature,traits])=>({id,name,brand,source,badges:[kind,spec],facts:{kind,spec,feature},price:null,scores:Object.fromEntries(c.priority.map(([key])=>[key,traits.includes(key)?90:75]))}))}));
  const meta=(title,description,href)=>`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${ORIGIN}${href}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/guides.css"><link rel="stylesheet" href="/site-ui.css">`;
  const shell=(title,description,href,body,extras="")=>`<!doctype html><html lang="ja"><head>${meta(title,description,href)}${extras}</head><body><header class="guide-header"><div class="guide-header-inner"><a class="guide-logo" href="/">✓ みんなの比較表</a><nav class="guide-nav"><a href="/compare/">全カテゴリ</a></nav></div></header><main class="guide-main">${body}</main><footer class="guide-footer"><div class="guide-footer-inner"><a href="/">みんなの比較表</a> ｜ <a href="/methodology/">比較方法</a></div></footer><script src="/market-links.js" defer></script></body></html>`;
  const urls={categories:[],guides:[]};
  for(const c of entries){
    const base=`/${c.key}/`;
    const cfg={categoryKey:c.key,categoryName:c.label,itemLabel:"製品",defaultPriority:c.priority[0][0],budgets:[{label:"価格は公式で確認",value:null}],priorities:c.priority.map(([key,label])=>({key,label})),compareRows:[{label:"種類・容量",key:"kind"},{label:"仕様・規格",key:"spec"},{label:"特徴",key:"feature"}],products:c.products};
    const guideLinks=c.guides.map(([slug,label,desc])=>`<a class="discovery-card" href="${base}${slug}/"><b>${esc(label)}</b><small>${esc(desc)}</small></a>`).join("");
    const productLinks=c.products.map(p=>`<a href="${base}products/${p.id}/">${esc(p.name)} <small>${esc(p.badges.join("・"))}</small></a>`).join("");
    const body=`<div class="breadcrumbs"><a href="/">トップ</a> › ${esc(c.label)}</div><span class="update-pill">${MONTH}更新</span><h1>${esc(c.label)}比較｜20製品</h1><p class="lead">${esc(c.label)}の実在を確認した20製品を、${esc(c.focus)}で見比べます。現在の販売価格・在庫は未確認です。対応状況や細かな仕様は必ずメーカー公式で確認してください。</p><section class="generic-finder"><h2>重視ポイントから探す</h2><div id="budgetControls" class="generic-control-row"></div><div id="priorityControls" class="generic-control-row"></div></section><section class="catalog-tools"><input id="searchInput" type="search" placeholder="製品名を検索"><select id="brandFilter" aria-label="メーカーで絞り込み"></select><select id="sortSelect" aria-label="並び替え"></select><button id="clearTools" type="button">リセット</button><div id="toolsCount"></div></section><div class="generic-summary"><h2>条件別の比較結果</h2><span id="conditionText"></span></div><div id="list" class="generic-list" aria-live="polite"></div><section id="compare" class="generic-compare" hidden><h2>選んだ製品を比較 <span id="compareCount"></span></h2><div class="table-scroll"><table><thead id="compareHead"></thead><tbody id="compareBody"></tbody></table></div><button id="clearCompare" type="button">比較をクリア</button></section><section class="discovery-block"><h2>用途から選ぶ</h2><div class="discovery-grid">${guideLinks}<a class="discovery-card" href="${base}compare/"><b>2製品の直接比較</b><small>仕様の違いを表で確認</small></a></div></section><section class="static-product-list"><h2>掲載20製品</h2><div class="static-product-grid">${productLinks}</div></section><p class="note">掲載順と条件との相性点は、メーカー公表の特徴の有無を便宜的に点数化した当サイト独自の整理値（対応項目90点、その他75点）です。性能測定や実際の品質を保証するものではありません。価格未確認のため価格重視の順位付けは行いません。</p>`;
    write(`${c.key}/index.html`,shell(`${c.label}比較｜20製品の特徴と選び方【2026】`,`${c.label}20製品を条件別に比較。特徴・仕様・メーカー公式リンクと2製品比較、用途別の選び方を掲載。価格・在庫は公式でご確認ください。`,base,body,`<link rel="stylesheet" href="/category-comparison.css">`).replace("</body>",`<script>window.COMPARISON_CONFIG=${JSON.stringify(cfg).replace(/</g,"\\u003c")};</script><script src="/category-comparison.js" defer></script></body>`));
    urls.categories.push(ORIGIN+base);
    for(const [slug,label,desc] of c.guides){
      const href=base+slug+"/";urls.guides.push(ORIGIN+href);
      const body=`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${base}">${esc(c.label)}</a> › ${esc(label)}</div><span class="update-pill">${MONTH}更新</span><h1>${esc(c.label)}｜${esc(label)}</h1><p class="lead">${esc(desc)}を重視する場合は、使う環境・必要な機能・製品の仕様を先に確認しましょう。メーカー公表情報を基準に候補を絞れます。</p><div class="summary-box"><h2>チェックしたい3点</h2><ul><li>使う場所と用途に適しているか</li><li>必要な機能がメーカー仕様に明記されているか</li><li>現在の価格・販売状況・保証条件を確認したか</li></ul></div><div class="cta"><h2>候補を比較する</h2><a href="${base}">20製品の比較ページへ →</a></div><h2>関連製品</h2><div class="related">${c.products.slice(0,4).map(p=>`<a href="${base}products/${p.id}/">${esc(p.name)}</a>`).join("")}</div>`;
      write(`${c.key}/${slug}/index.html`,shell(`${c.label}｜${label}の選び方【2026】`,`${c.label}の${label}を選ぶ際に確認したい用途、必要な仕様、設置・接続条件を解説。20製品の比較表と公式情報へ案内します。`,href,body));
    }
    for(const p of c.products){
      const href=base+`products/${p.id}/`;
      const structured={"@context":"https://schema.org","@graph":[{"@type":"Product",name:p.name,brand:{"@type":"Brand",name:p.brand},category:c.label,url:ORIGIN+href},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"トップ",item:ORIGIN+"/"},{"@type":"ListItem",position:2,name:c.label,item:ORIGIN+base},{"@type":"ListItem",position:3,name:p.name,item:ORIGIN+href}]}]};
      const body=`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${base}">${esc(c.label)}</a> › ${esc(p.name)}</div><span class="update-pill">${MONTH}情報確認</span><h1>${esc(p.name)}</h1><div class="product-visual catalog-detail-visual"><span class="catalog-fallback-icon" aria-hidden="true">${c.icon}</span><small>商品画像未取得</small></div><p class="lead">メーカー公開情報をもとにモデル名と比較に役立つ特徴を整理しました。</p><div class="summary-box"><h2>確認できた特徴</h2><ul><li>種類・容量：${esc(p.facts.kind)}</li><li>仕様・規格：${esc(p.facts.spec)}</li><li>特徴：${esc(p.facts.feature)}</li><li>価格・在庫：未確認（メーカー・販売店で確認）</li></ul></div><p>※ 旧型モデルは在庫終了の可能性があります。最新の正確な仕様、対応機器、保証内容は公式ページで確認してください。</p><div class="related"><a href="${esc(p.source)}" rel="noopener noreferrer" target="_blank">${esc(p.brand)}の公式情報を確認 ↗</a><a href="${base}">${esc(c.label)}の一覧に戻る</a></div><h2>同カテゴリの候補</h2><div class="related">${c.products.filter(x=>x.id!==p.id).slice(0,4).map(x=>`<a href="${base}products/${x.id}/">${esc(x.name)}</a>`).join("")}</div>`;
      write(`${c.key}/products/${p.id}/index.html`,shell(`${p.name}の特徴・仕様を比較 2026｜${c.label}`,`${p.name}のメーカー公開情報と主な特徴を整理。種類・規格・用途を比べ、公式サイトで価格や詳細仕様を確認できます。${c.label}の比較ガイドも掲載。`,href,body,`<script type="application/ld+json">${JSON.stringify(structured)}</script>`));
    }
    const pairs=[[0,1],[2,3],[4,5],[0,2],[1,4],[3,5],[6,7],[8,9],[10,11],[12,13],[0,6],[2,8],[4,10],[6,12],[14,15],[16,17],[18,19],[0,14],[4,16],[8,18]];
    for(const [ai,bi] of pairs){
      const a=c.products[ai],b=c.products[bi],href=`${base}compare/${a.id}-vs-${b.id}/`;
      const rows=[["種類・容量","kind"],["仕様・規格","spec"],["主な特徴","feature"]];
      const body=`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${base}">${esc(c.label)}</a> › <a href="${base}compare/">直接比較</a></div><span class="update-pill">${MONTH}更新</span><h1>${esc(a.name)}と${esc(b.name)}を比較</h1><p class="lead">${esc(c.label)}2製品のメーカー公表情報を、同じ項目で比べます。価格は未確認、性能の優劣は断定しません。</p><div class="table-scroll"><table><thead><tr><th>比較項目</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead><tbody>${rows.map(([label,key])=>`<tr><td>${label}</td><td>${esc(a.facts[key])}</td><td>${esc(b.facts[key])}</td></tr>`).join("")}</tbody></table></div><h2>選ぶ前に確認したいこと</h2><p>用途・必要な仕様を確認し、最新の販売価格や対応条件をメーカー・販売店で比較してください。</p><div class="related"><a href="${base}products/${a.id}/">${esc(a.name)}の詳細</a><a href="${base}products/${b.id}/">${esc(b.name)}の詳細</a><a href="${esc(a.source)}" target="_blank" rel="noopener noreferrer">公式：${esc(a.brand)} ↗</a><a href="${esc(b.source)}" target="_blank" rel="noopener noreferrer">公式：${esc(b.brand)} ↗</a></div>`;
      write(`${c.key}/compare/${a.id}-vs-${b.id}/index.html`,shell(`${a.name}と${b.name}の違い・仕様比較【2026】`,`${a.name}と${b.name}の種類・規格・特徴を比較。現在の価格は未確認のため公式サイトで確認してください。`,href,body));
    }
    const href=`${base}compare/`;
    write(`${c.key}/compare/index.html`,shell(`${c.label}の2製品比較20組【2026】`,`${c.label}の20組を仕様・特徴から直接比較。メーカー公式情報と商品詳細へのリンクを掲載しています。`,href,`<div class="breadcrumbs"><a href="/">トップ</a> › <a href="${base}">${esc(c.label)}</a> › 2製品比較</div><h1>${esc(c.label)}の2製品比較20組</h1><p class="lead">気になる候補を選び、同じ項目で比較できます。</p><div class="related">${pairs.map(([ai,bi])=>`<a href="${base}compare/${c.products[ai].id}-vs-${c.products[bi].id}/">${esc(c.products[ai].name)} vs ${esc(c.products[bi].name)}</a>`).join("")}</div>`));
  }
  const mergeXml=(name,values)=>{const file=path.join(OUT,name);patch(file,s=>{for(const u of values){if(!s.includes(`<loc>${u}</loc>`))s=s.replace("</urlset>",`  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`)}return s;});};
  mergeXml("sitemap.xml",urls.categories);
  mergeXml("sitemap-categories.xml",urls.categories);
  mergeXml("sitemap-guides.xml",urls.guides);
  const newLinks=entries.map(c=>`        <a href="/${c.key}/">${c.icon} ${c.label}20製品</a>`).join("\n");
  patch(path.join(ROOT,"index.html"),s=>{
    s=s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品").replaceAll("20カテゴリ","25カテゴリ").replaceAll("430商品","530商品");
    const match=s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);if(!match)throw Error("Missing homepage schema");
    const obj=JSON.parse(match[1]),list=obj["@graph"].find(x=>x["@type"]==="ItemList");if(!list)throw Error("Missing homepage ItemList");
    for(const c of entries) if(!list.itemListElement.some(x=>x.url===ORIGIN+`/${c.key}/`)) list.itemListElement.push({"@type":"ListItem",position:list.itemListElement.length+1,name:c.label+"比較",url:ORIGIN+`/${c.key}/`});
    list.numberOfItems=list.itemListElement.length;if(list.numberOfItems!==25)throw Error("Unexpected homepage category count: "+list.numberOfItems);
    s=s.replace(match[0],`<script type="application/ld+json">${JSON.stringify(obj)}</script>`);
    if(!s.includes('href="/webcams/"')){const marker=/<a href="\/dehumidifiers\/">[^<]*<\/a>/;if(!marker.test(s))throw Error("New homepage navigation anchor missing");s=s.replace(marker,m=>m+"\n"+newLinks);}
    return s;
  });
  patch(path.join(OUT,"compare/index.html"),s=>{
    s=s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品").replaceAll("20カテゴリ","25カテゴリ").replaceAll("430商品","530商品");
    if(!s.includes('href="/webcams/"')){const cards=entries.map(c=>`<article><h2>${c.icon} ${esc(c.label)}</h2><p>20製品の特徴・用途を比較。</p><div class="directory-actions"><a href="/${c.key}/">20製品を比較</a> <a href="/${c.key}/compare/">直接比較20組</a> <a href="/${c.key}/${c.guides[0][0]}/">選び方</a></div></article>`).join("");
      const direct=entries.map(c=>`<a href="/${c.key}/compare/">${c.icon} ${esc(c.label)}<small>20組の比較</small></a>`).join("");
      const marker="</section><h2>カテゴリ別の直接比較</h2>";if(!s.includes(marker))throw Error("Compare directory insertion missing");s=s.replace(marker,cards+marker).replace("</div></main>",direct+"</div></main>");
    }return s;
  });
  const insertArray=(s,key,content)=>{const st=s.indexOf(key),end=s.indexOf("\n  ];",st);if(st<0||end<0)throw Error("Array anchor missing: "+key);return s.slice(0,end)+"\n"+content+s.slice(end);};
  patch(path.join(OUT,"category-home.js"),s=>{
    s=s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品").replaceAll("20カテゴリ","25カテゴリ").replaceAll("430商品","530商品");
    if(!s.includes("['/webcams/'"))s=insertArray(s,"const categoryAdditions = [",entries.map(c=>`    ['/${c.key}/','${c.icon} ${c.label}20製品','${c.key}'],`).join("\n"));
    if(!s.includes("key:'webcams'"))s=insertArray(s,"const guideSections = [",entries.map(c=>`    {key:'${c.key}',eyebrow:'NEW GUIDES',title:'${c.label}の選び方',description:'${c.focus}で比較。',links:[['/${c.key}/${c.guides[0][0]}/','${c.guides[0][1]}'],['/${c.key}/${c.guides[1][0]}/','${c.guides[1][1]}'],['/${c.key}/','20製品を比較']]},`).join("\n"));
    return s;
  });
  patch(path.join(OUT,"market-links.js"),s=>{
    s=s.replaceAll("20カテゴリから比較する","25カテゴリから比較する").replaceAll("20カテゴリ・430商品","25カテゴリ・530商品");
    if(!s.includes("href:'/webcams/'"))s=insertArray(s,"const categoryCards = [",entries.map(c=>`    { href:'/${c.key}/',icon:'${c.icon}',title:'${c.label}',count:'20製品',desc:'${c.focus}',category:'${c.key.replaceAll("-","_")}',badge:'NEW' },`).join("\n"));
    return s;
  });
  patch(path.join(OUT,"category-comparison.js"),s=>{
    const found=s.match(/const hasDetail = \(\) => \[([^\]]+)\]\.includes\(cfg\.categoryKey\);/);if(!found)throw Error("Category comparison detail guard changed");
    for(const c of entries)if(!found[1].includes("'"+c.key+"'"))found[1]+=",'"+c.key+"'";
    s=s.replace(found[0],`const hasDetail = () => [${found[1]}].includes(cfg.categoryKey);`);
    const iconLine=s.match(/const imageIcons = \{([^}]+)\};/);if(!iconLine)throw Error("Category comparison icons missing");
    let icons=iconLine[1];for(const c of entries)if(!icons.includes("'"+c.key+"'"))icons+=`,'${c.key}':'${c.icon}'`;
    return s.replace(iconLine[0],`const imageIcons = {${icons}};`);
  });
  patch(path.join(ROOT,"scripts/enhance-static-navigation.mjs"),s=>{
    s=s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品").replaceAll("20カテゴリの比較","25カテゴリの比較");
    if(!s.includes("key: 'webcams'")){const st=s.indexOf("const categories = ["),end=s.indexOf("\n];",st);if(st<0||end<0)throw Error("Missing navigation category array");s=s.slice(0,end)+"\n"+entries.map(c=>`  { key: '${c.key}',href: '/${c.key}/',icon: '${c.icon}',label: '${c.label}',count: '20製品' },`).join("\n")+s.slice(end);}return s;
  });
  patch(path.join(ROOT,"scripts/enhance-product-seo.mjs"),s=>{
    if(!s.includes("'webcams':'Webカメラ'")){const match=s.match(/'dehumidifiers':'衣類乾燥除湿機',?/);if(!match)throw Error("Product SEO category map missing");s=s.replace(match[0],match[0]+"\n"+entries.map(c=>`  '${c.key}':'${c.label}',`).join("\n"));}return s;
  });
  patch(path.join(ROOT,"scripts/build-product-catalog.mjs"),s=>{
    if(!s.includes("webcams:'Webカメラ'")){const match=s.match(/(dehumidifiers:'衣類乾燥除湿機')(\s*\n\};)/);if(!match)throw Error("Product catalog category map missing");s=s.replace(match[0],match[1]+",\n  "+entries.map(c=>`'${c.key}':'${c.label}'`).join(",\n  ")+match[2]);}
    s=s.replaceAll("output.length!==430","output.length!==530").replaceAll("Expected 430 details","Expected 530 details");
    return s;
  });
  patch(path.join(ROOT,"scripts/validate-generated-site.mjs"),s=>s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品").replaceAll('"numberOfItems":20','"numberOfItems":25').replaceAll("20-category launch checks","25-category launch checks"));
  patch(path.join(ROOT,"scripts/validate-added-categories.mjs"),s=>{
    s=s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品").replaceAll('"numberOfItems":20','"numberOfItems":25').replaceAll("!== 430","!== 530").replaceAll("430 products","530 products").replaceAll("430 product","530 product").replaceAll("all 430","all 530").replaceAll("the 430","the 530").replaceAll("must contain 430","must contain 530").replaceAll("!== 20) fail('Global search","!== 25) fail('Global search").replaceAll("must include 20 categories","must include 25 categories").replaceAll("20-category regression","25-category regression").replaceAll("20-category smoke checks passed: 20 categories, 430","25-category smoke checks passed: 25 categories, 530");
    const newChecks=`\n// Verify every new category appears in navigation, searchable product catalogue and all sitemaps.\nfor(const key of ${JSON.stringify(entries.map(c=>c.key))}){\n  const categoryHtml=read(key+'/index.html');\n  const m=categoryHtml.match(/window\\.COMPARISON_CONFIG\\s*=\\s*(\\{[^<]+\\});\\s*<\\/script>/);\n  if(!m)fail('Missing new category config: '+key);\n  const cfg=JSON.parse(m[1]);\n  if(cfg.products.length!==20||cfg.categoryKey!==key)fail('Invalid new category item count: '+key);\n  if(!root.includes('/'+key+'/')||!directory.includes('/'+key+'/'))fail('Missing new category internal navigation: '+key);\n  if(!categorySitemap.includes('<loc>'+origin+'/'+key+'/</loc>'))fail('New category omitted from sitemap: '+key);\n  for(const p of cfg.products){const file=key+'/products/'+p.id+'/index.html';const detail=read(file);if(!detail.includes(p.name)||!detail.includes('/market-links.js'))fail('Missing new product: '+file);if(!productSitemap.includes('<loc>'+origin+'/'+key+'/products/'+p.id+'/</loc>'))fail('New product omitted from sitemap: '+file);}\n  const comparison=read(key+'/compare/'+cfg.products[0].id+'-vs-'+cfg.products[1].id+'/index.html');if(!comparison.includes(cfg.products[0].name))fail('Missing new pair comparison: '+key);\n}\n`;
    if(!s.includes("Verify every new category appears"))s=s.replace(/console\.log\('20-category smoke checks passed:[^\n]+\);|console\.log\('25-category smoke checks passed:[^\n]+\);/,m=>newChecks+m);
    return s;
  });
  patch(path.join(ROOT,"scripts/apply-site-finishing.mjs"),s=>s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品"));
  patch(path.join(ROOT,"scripts/site-quality-audit.mjs"),s=>s.replaceAll("20カテゴリ・430商品","25カテゴリ・530商品"));
  patch(path.join(OUT,"og-image.svg"),s=>s.replaceAll("20カテゴリ","25カテゴリ").replaceAll("430商品","530商品"));
  console.log(`Product expansion generated: 5 categories, 100 product pages, 100 direct comparisons, 10 purpose guides; site targets ${totals.categories} categories and ${totals.products} products.`);
})();
