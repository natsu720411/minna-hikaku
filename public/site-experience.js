(() => {
  'use strict';
  if (window.__minnaExperience) return;
  window.__minnaExperience = true;
  const FAV_KEY = 'minna-hikaku:favorites:v1';
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const escapeHtml = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = s => String(s||'').normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();
  const isProductUrl = url => /^\/[^/?#]+\/products\/[^/?#]+\/?$/.test(url||'');
  let cataloguePromise=null, catalogueFailed=false;
  const PAGE_SIZE=40;
  let resultLimit=PAGE_SIZE;
  const compact = value => clean(value).replace(/[\s\p{Pd}_]+/gu,'');
  const catalogue = () => cataloguePromise ||= fetch('/product-catalog.json').then(r=>{
    if(!r.ok) throw new Error('Catalogue unavailable');
    return r.json();
  }).then(rows => {
    if(!Array.isArray(rows)) throw new Error('Invalid catalogue');
    const valid=rows.filter(p => isProductUrl(p.url) && p.name);
    if(!valid.length) throw new Error('Empty catalogue');
    catalogueFailed=false;
    return valid;
  }).catch(()=>{catalogueFailed=true;return []});
  const trackUX=(event,params={})=>{try{window.minnaTrack?.(event,{path:location.pathname,...params})}catch{}};
  const RECENT_KEY='minna-hikaku:recent:v1';
  const recentRead=()=>{try{const a=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(a)?a.filter(p=>p&&isProductUrl(p.url)&&typeof p.name==='string').slice(0,20):[]}catch{return []}};
  const recentSave=p=>{try{localStorage.setItem(RECENT_KEY,JSON.stringify([p,...recentRead().filter(x=>x.url!==p.url)].slice(0,20)))}catch{}};
  const groups=[
    ['スマホ・オーディオ',['earphones','smartphones','smartwatches','tablets','mobile-batteries','chargers']],
    ['PC・周辺機器',['laptops','monitors','routers','mice','keyboards','external-ssds','webcams']],
    ['生活・調理家電',['cordless-vacuums','robot-vacuums','air-purifiers','rice-cookers','microwaves','dehumidifiers','toasters','kettles','electric-kettles']],
    ['美容・健康',['electric-toothbrushes','hair-dryers','electric-shavers','shavers']]
  ];
  const groupedOptions=rows=>{
    const cats=[...new Map(rows.map(p=>[p.category,p.categoryName])).entries()];
    const used=new Set(), option=([id,name])=>'<option value="'+escapeHtml(id)+'">'+escapeHtml(name)+'</option>';
    const html=groups.map(([label,ids])=>{const items=cats.filter(([id])=>ids.includes(id));items.forEach(([id])=>used.add(id));return items.length?'<optgroup label="'+escapeHtml(label)+'">'+items.map(option).join('')+'</optgroup>':''}).join('');
    const rest=cats.filter(([id])=>!used.has(id));return html+(rest.length?'<optgroup label="その他">'+rest.map(option).join('')+'</optgroup>':'');
  };
  let compareTray=[];
  const categoryOf=url=>url.split('/')[1];
  const updateTray=()=>{
    const tray=modal?.querySelector('.ux-selection');if(!tray)return;
    tray.hidden=!compareTray.length||!['search','favorites','recent'].includes(tab);
    tray.querySelector('.ux-selection-count').textContent=compareTray.length+'/3件：'+compareTray.map(p=>p.name).join(' ・ ');
    tray.querySelector('[data-ux-start-compare]').disabled=compareTray.length<2;
    modal.querySelectorAll('[data-ux-select]').forEach(b=>{const active=compareTray.some(p=>p.url===b.dataset.uxSelect);b.setAttribute('aria-pressed',String(active));b.textContent=active?'選択済み':'比較'});
  };
  const favRead=()=>{
    try {
      const rows=JSON.parse(localStorage.getItem(FAV_KEY)||'[]');
      return Array.isArray(rows) ? rows.filter(p => isProductUrl(p.url) && typeof p.name==='string').slice(0,60) : [];
    }catch{return []}
  };
  const favWrite=items=>{
    try{localStorage.setItem(FAV_KEY,JSON.stringify(items.slice(0,60)))}catch{announce('お気に入りを保存できませんでした');return false}
    window.dispatchEvent(new Event('minna:favorites-changed'));return true;
  };
  const toggleFav=(product)=>{
    const favs=favRead();
    const existing=favs.findIndex(p=>p.url===product.url);
    if(existing>=0)favs.splice(existing,1);
    else {
      if(favs.length>=60){announce('お気に入りは60件まで保存できます');return}
      favs.unshift({url:product.url,name:product.name,categoryName:product.categoryName||'',brand:product.brand||''});
    }
    if(!favWrite(favs))return;
    announce(existing>=0?'お気に入りから削除しました':'お気に入りに保存しました');
  };
  let modal=null,searchBox=null,resultBox=null,categorySelect=null,tab='search',launcher=null,updateCount=null,toastTimer=0;
  const announce = message=>{
    let toast=$('#ux-toast');
    if(!toast){toast=document.createElement('div');toast.id='ux-toast';toast.className='ux-toast';toast.setAttribute('role','status');document.body.append(toast)}
    toast.textContent=message;toast.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3000);
  };
  const updateCounter=()=>{if(updateCount)updateCount.textContent=String(favRead().length)};
  const updateFavButtons=()=>{
    const favs=new Set(favRead().map(p=>p.url));
    $$('.ux-fav-btn[data-url]').forEach(b=>{
      const saved=favs.has(b.dataset.url);
      b.textContent=saved?'★ 保存済み':'☆ 保存';
      b.setAttribute('aria-pressed',String(saved));
      b.title=saved?'お気に入りから削除':'お気に入りに保存';
    });
  };
  const buttonFor=(url,name,container,categoryName='')=>{
    if(!isProductUrl(url)||container.querySelector('.ux-fav-btn'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='ux-fav-btn';btn.dataset.url=url;btn.dataset.name=name;
    btn.dataset.categoryName=categoryName;
    container.append(btn);
    const saved=favRead().some(p=>p.url===url);
    btn.textContent=saved?'★ 保存済み':'☆ 保存';
    btn.setAttribute('aria-pressed',String(saved));
    btn.setAttribute('aria-label',name+'をお気に入りに'+(saved?'保存済み':'保存'));
  };
  const enhanceCards=()=>{
    $$('.rank-card,#list > article.card').forEach(card=>{
      if(card.querySelector('.ux-fav-btn,[data-react-favorite]'))return;
      const link=card.querySelector('a[href*="/products/"]');
      const url=link?.getAttribute('href')?.split(/[?#]/)[0]||'';
      const name=card.querySelector('h3')?.textContent?.trim()||'';
      const actions=card.querySelector('.rank-actions,.actions,.rank-links');
      if(url && name && actions) buttonFor(url,name,actions);
      // Show a concrete specification instead of presenting editorial points as test results.
      if(card.matches('#list > article.card') && !card.querySelector('.ux-evidence')) {
        const facts=$$('.specs span',card).map(n=>n.textContent.trim()).filter(Boolean);
        const brand=card.querySelector('.brand');
        if(facts.length && brand){
          const note=document.createElement('small');
          note.className='ux-evidence';note.textContent='仕様の確認ポイント：'+facts.slice(0,3).join('・')+'（相性点は編集上の目安）';
          card.querySelector('.legacy-product-content')?.append(note);
        }
      }
    });
  };
  const HISTORY_KEY='minna-hikaku:comparisons:v1';
  const historyRead=()=>{try{const a=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(a)?a.filter(p=>p && typeof p.url==='string' && /^\/(?:[a-z0-9-]+\/)?\?compare=[a-z0-9,%_-]+(?:&[a-z0-9_%=-]+)*$/i.test(p.url) && Array.isArray(p.names) && p.names.every(n=>typeof n==='string')).slice(0,20):[]}catch{return []}};
  const historyWrite=items=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,20)))}catch{}};
  const remember=(url,names)=>{if(names.length<2)return;const key=url.split('?')[0]+'?'+new URLSearchParams(url.split('?')[1]).get('compare')?.split(',').sort().join(',');const rows=historyRead();if(rows[0]?.key===key)return;historyWrite([{key,url,names},...rows.filter(r=>r.key!==key)])};
  const compareHref=(category,ids)=> (category==='earphones'?'/':'/'+category+'/')+'?compare='+encodeURIComponent(ids.join(','));
  const enhanceDetail=()=>{
    const url=location.pathname.replace(/\/?$/,'/');
    if(!isProductUrl(url))return;
    const main=$('.guide-main');
    const h1=$('h1',main||document);
    if(!main||!h1)return;
    if(!main.querySelector('.ux-detail-fav')){
      const slot=document.createElement('div');slot.className='ux-detail-fav';
      buttonFor(url,h1.textContent.trim(),slot);
      h1.insertAdjacentElement('afterend',slot);
    }
    if(main.querySelector('.ux-related'))return;
    catalogue().then(rows=>{
      if(!main.isConnected||main.querySelector('.ux-related'))return;
      const current=rows.find(p=>p.url===url);
      if(!current)return;
      recentSave({url:current.url,name:current.name,categoryName:current.categoryName,brand:current.brand});
      const candidates=rows.filter(p=>p.category===current.category && p.url!==url);
      const terms=p=>new Set(clean(p.description).split(/[\s、。・／,.:：()（）]+/).filter(t=>t.length>=3));
      const base=terms(current);
      const score=p=>Number(!!current.brand && p.brand===current.brand)*3+[...terms(p)].filter(t=>base.has(t)).length;
      const siblings=[...candidates].sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name,'ja')).slice(0,4);
      if(!siblings.length)return;
      const section=document.createElement('section');
      section.className='ux-related';
      section.innerHTML='<h2>同じカテゴリの類似候補も比較</h2><p>同じカテゴリの商品から、メーカーと掲載説明の共通点を参考に表示しています。性能が近いことを保証するものではありません。</p><div class="ux-related-grid">'+siblings.map(p=>'<a href="'+escapeHtml(p.url)+'"><b>'+escapeHtml(p.name)+'</b><small>'+escapeHtml(p.brand||p.categoryName)+'　詳細を見る →</small></a>').join('')+'</div>';
      const chooser=document.createElement('div');chooser.className='ux-detail-compare';
      chooser.innerHTML='<h2>この商品と直接比較する</h2><label>比較相手を選択<select><option value="">商品を選ぶ</option>'+candidates.sort((a,b)=>a.name.localeCompare(b.name,'ja')).map(p=>'<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.name)+'</option>').join('')+'</select></label><button type="button" class="ux-fav-btn" disabled>2商品を比較 →</button>';
      const select=$('select',chooser), button=$('button',chooser);
      select.addEventListener('change',()=>{button.disabled=!select.value});
      button.addEventListener('click',()=>{const other=candidates.find(p=>p.id===select.value);if(!other)return;const href=compareHref(current.category,[current.id,other.id]);remember(href,[current.name,other.name]);location.assign(href)});
      const slot=main.querySelector('.ux-detail-fav');if(slot)slot.after(chooser);else main.append(chooser);main.append(section);
    });
  };
  const getCompare=()=>$('#compare:not([hidden])')||$('.compare-panel');
  const updateDifferences=()=>{
    const panel=getCompare();
    const table=panel?.querySelector('table');
    if(!table)return;
    $$('tbody tr',table).forEach(row=>{
      const cells=[...row.cells].slice(1);
      if(cells.length<2)return;
      const texts=cells.map(c=>clean(c.textContent));
      const varied=new Set(texts).size>1;
      row.classList.toggle('ux-different',varied);
      cells.forEach(c=>c.classList.toggle('ux-diff-cell',varied));
      if(varied && !row.cells[0].querySelector('.ux-diff-label')){
        const tag=document.createElement('span');tag.className='ux-diff-label';tag.textContent='違いあり';row.cells[0].append(tag);
      }else if(!varied){row.cells[0].querySelector('.ux-diff-label')?.remove()}
    });
    if(panel.id==='compare' && !panel.querySelector('[data-ux-differences]')){
      const label=document.createElement('label');label.className='ux-differences-control';label.innerHTML='<input type="checkbox" data-ux-differences> 違いがある項目だけ表示';
      table.closest('.table-scroll')?.before(label);
      label.addEventListener('change',()=>updateDifferences());
    }
    const diff=panel.querySelector('[data-ux-differences]');
    if(diff){const multi=(table.tHead?.rows[0]?.cells.length||0)>2;diff.disabled=!multi;$$('tbody tr',table).forEach(row=>{row.hidden=multi&&diff.checked&&!row.classList.contains('ux-different')})}
    const header=panel.querySelector('.compare-title,.summary,h2');
    if(header && !panel.querySelector('.ux-image-save')){
      const save=document.createElement('button');save.type='button';save.className='ux-share ux-image-save';save.textContent='比較表を画像保存';
      save.addEventListener('click',event=>{event.stopPropagation();saveTableImage(panel.querySelector('table'))});header.append(save);
    }
    if(header && !panel.querySelector('.ux-share:not(.ux-image-save)')){
      const btn=document.createElement('button');
      btn.className='ux-share';btn.type='button';btn.textContent='↗ この比較を共有';
      header.append(btn);
    }
  };
  const saveTableImage=async table=>{
    if(!table)return;
    const rows=[...table.rows].filter(r=>!r.hidden&&getComputedStyle(r).display!=='none').map(r=>[...r.cells].map(c=>{const clone=c.cloneNode(true);clone.querySelectorAll('.ux-diff-label').forEach(n=>n.remove());return clone.textContent.trim().replace(/\s+/g,' ')}));
    if(!rows.length)return;
    const cols=Math.max(...rows.map(r=>r.length));if(cols<2||cols>8||rows.length>80){announce('この表は画像保存の対象外です');return}
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
    if(document.fonts?.ready)await document.fonts.ready;
    const w=260,p=14,font=17,lh=25;ctx.font='bold '+font+'px sans-serif';
    const wrap=text=>{const lines=[];let line='';for(const c of Array.from(text.slice(0,600))){if(line&&ctx.measureText(line+c).width>w-p*2){lines.push(line);line=''}line+=c}if(line||!lines.length)lines.push(line);return lines};
    const cells=rows.map(r=>Array.from({length:cols},(_,i)=>wrap(r[i]||''))), heights=cells.map(r=>Math.max(...r.map(l=>l.length))*lh+p*2);
    const height=133+heights.reduce((a,b)=>a+b,0);if(height>12000){announce('表が長すぎます。違いだけ表示してお試しください');return}
    canvas.width=cols*w+40;canvas.height=height;
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='bold 25px sans-serif';ctx.fillStyle='#173b6a';ctx.fillText('みんなの比較表',20,37);ctx.font='15px sans-serif';ctx.fillText('掲載情報・参考価格の比較（実測評価ではありません）',20,65);
    let y=85;cells.forEach((r,ri)=>{r.forEach((lines,ci)=>{const x=20+ci*w;ctx.fillStyle=ri===0?'#e1edfc':ri%2?'#f6f9fd':'#fff';ctx.fillRect(x,y,w,heights[ri]);ctx.strokeStyle='#d5e1ef';ctx.strokeRect(x,y,w,heights[ri]);ctx.fillStyle='#203650';ctx.font=(ri===0?'bold ':'')+font+'px sans-serif';lines.forEach((line,k)=>ctx.fillText(line,x+p,y+p+font+k*lh))});y+=heights[ri]});
    ctx.font='14px sans-serif';ctx.fillStyle='#53657a';ctx.fillText('minna-hikaku.vercel.app ｜ 購入前にメーカー・販売店で確認',20,y+30);
    canvas.toBlob(blob=>{if(!blob){announce('画像を作成できませんでした');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='minna-comparison.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);trackUX('comparison_image_save',{products:cols-1})},'image/png');
  };
  const selectedNames=()=>{
    const panel=getCompare(),row=panel?.querySelector('table thead tr');
    return row?[...row.cells].slice(1).map(c=>c.textContent.trim()).filter(Boolean):[];
  };
  const currentCategory=()=>location.pathname.split('/').filter(Boolean)[0]||'earphones';
  const compareShare=async()=>{
    const names=selectedNames();
    if(!names.length){announce('比較する商品を選択してください');return}
    const rows=await catalogue(),category=currentCategory();
    const ids=names.map(name=>rows.find(p=>p.category===category && clean(p.name)===clean(name))?.id);
    if(ids.some(x=>!x)){announce('この組み合わせは共有できません。商品詳細からご確認ください');return}
    const url=new URL(location.href);
    url.searchParams.set('compare',ids.join(','));
    const categoryCfg=window.COMPARISON_CONFIG;
    if(categoryCfg){
      const active=$('#priorityControls button.active');
      if(active?.dataset.key)url.searchParams.set('priority',active.dataset.key);
      const b=$('#budgetControls button.active');
      if(b?.dataset.value && b.dataset.value!=='none')url.searchParams.set('budget',b.dataset.value);
    }else if($('#results')?.dataset.uxPriority){
      url.searchParams.set('priority',$('#results').dataset.uxPriority);
      const budget=$('#results').dataset.uxBudget;
      if(budget && budget!=='Infinity')url.searchParams.set('budget',budget);
    }else if(getCompare()?.dataset.uxPriority){
      url.searchParams.set('priority',getCompare().dataset.uxPriority);
      const budget=getCompare().dataset.uxBudget;
      if(budget && budget!=='Infinity')url.searchParams.set('budget',budget);
    }
    try{
      if(navigator.share){await navigator.share({title:'みんなの比較表｜商品比較',url:url.toString()});return}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url.toString());announce('比較結果のURLをコピーしました');return}
    }catch(e){if(e.name==='AbortError')return}
    const input=document.createElement('textarea');input.value=url.toString();input.style.position='fixed';input.style.left='-9999px';
    document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();
    announce(copied?'比較結果のURLをコピーしました':'URLのコピーに失敗しました');
  };
  let lastCompared='';
  const saveCurrentComparison=()=>{
    const names=selectedNames();if(names.length<2){lastCompared='';return}
    const category=currentCategory(), signature=category+'|'+names.join('|');
    if(signature===lastCompared)return;lastCompared=signature;
    catalogue().then(rows=>{if(lastCompared!==signature)return;const ids=names.map(n=>rows.find(p=>p.category===category && clean(p.name)===clean(n))?.id);if(ids.every(Boolean))remember(compareHref(category,ids),names)});
  };
  const syncDock=()=>{
    if(!window.COMPARISON_CONFIG)return;
    const panel=$('#compare'),names=selectedNames();
    let dock=$('#ux-compare-dock');
    if(!dock){
      dock=document.createElement('div');dock.id='ux-compare-dock';dock.className='ux-compare-dock';
      dock.innerHTML='<strong class="ux-dock-count"></strong><div class="ux-dock-names"></div><button type="button" class="ux-dock-view">比較表を見る →</button><button type="button" class="ux-dock-clear">クリア</button>';
      document.body.append(dock);
      $('.ux-dock-view',dock).addEventListener('click',()=>panel?.scrollIntoView({behavior:'smooth',block:'start'}));
      $('.ux-dock-clear',dock).addEventListener('click',()=>$('#clearCompare')?.click());
    }
    dock.hidden=names.length===0;
    document.body.classList.toggle('ux-dock-present',names.length>0);
    if(!names.length)return;
    $('.ux-dock-count',dock).textContent='比較中 '+names.length+'/3';
    $('.ux-dock-names',dock).textContent=names.map(n=>n.length>22?n.slice(0,22)+'…':n).join(' ・ ');
  };
  const ensureLegacyShare=()=>{
    const dock=$('.compare-dock:not([hidden]),.compare-dock-generic:not([hidden])');
    if(dock && !dock.querySelector('.ux-share')){
      const box=dock.querySelector('.compare-dock-actions,.dock-actions')||dock;
      const btn=document.createElement('button');btn.type='button';btn.className='ux-share';btn.textContent='共有';box.append(btn);
    }
  };
  const ensureLauncher=()=>{
    if(launcher)return;
    const holder=document.createElement('div');holder.className='ux-launcher';holder.setAttribute('aria-label','商品検索とお気に入り');
    holder.innerHTML='<button type="button" id="ux-search-launch">⌕ 全商品を検索</button><button type="button" id="ux-fav-launch">☆ 保存 <span class="ux-fav-count">0</span></button>';
    document.body.append(holder);launcher=holder;updateCount=$('.ux-fav-count',holder);updateCounter();
    $('#ux-search-launch').addEventListener('click',()=>openModal('search'));
    $('#ux-fav-launch').addEventListener('click',()=>openModal('favorites'));
  };
  const ensureModal=()=>{
    if(modal)return;
    modal=document.createElement('div');modal.className='ux-modal';modal.hidden=true;
    modal.innerHTML='<div class="ux-modal-panel" role="dialog" aria-modal="true" aria-label="商品検索とお気に入り"><div class="ux-modal-head"><strong>全商品から探す</strong><button type="button" class="ux-modal-close" aria-label="閉じる">×</button></div><div class="ux-tabs"><button type="button" data-ux-tab="search">商品を検索</button><button type="button" data-ux-tab="favorites">お気に入り</button><button type="button" data-ux-tab="history">比較履歴</button><button type="button" data-ux-tab="recent">最近見た商品</button><button type="button" data-ux-tab="guide">商品選び</button></div><div class="ux-search-filters"><input type="search" id="ux-search-input" placeholder="商品名・型番・メーカーで検索" aria-label="全商品を検索"><select id="ux-category-filter" aria-label="カテゴリを絞り込む"><option value="">すべてのカテゴリ</option></select></div><p class="ux-search-count" aria-live="polite"></p><div class="ux-selection" hidden><span class="ux-selection-count"></span><div><button type="button" data-ux-start-compare disabled>比較する →</button><button type="button" data-ux-clear-selection>解除</button></div></div><div class="ux-results"></div><p class="ux-modal-note">商品は公開済みの詳細ページから検索します。お気に入りはこのブラウザに保存されます。</p></div>';
    document.body.append(modal);searchBox=$('#ux-search-input',modal);resultBox=$('.ux-results',modal);categorySelect=$('#ux-category-filter',modal);
    $('.ux-modal-close',modal).addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
    $$('.ux-tabs button',modal).forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.uxTab;renderModal();if(tab==='search')searchBox.focus()}));
    let searchTimer=0,trackTimer=0;
    const resetResults=()=>{resultLimit=PAGE_SIZE;resultBox.scrollTop=0;clearTimeout(searchTimer);searchTimer=setTimeout(renderModal,140);clearTimeout(trackTimer);trackTimer=setTimeout(()=>{if(!modal.hidden&&tab==='search')trackUX('finder_filter',{category:categorySelect.value||'all',has_query:!!searchBox.value.trim()})},800)};
    searchBox.addEventListener('input',resetResults);categorySelect.addEventListener('change',resetResults);
    modal.addEventListener('click',e=>{
      const add=e.target.closest('[data-ux-select]');
      if(add){const url=add.dataset.uxSelect;if(!isProductUrl(url))return;const i=compareTray.findIndex(p=>p.url===url);
        if(i>=0)compareTray.splice(i,1);else{if(compareTray.length>=3){announce('最大3商品まで比較できます');return}if(compareTray.length&&categoryOf(compareTray[0].url)!==categoryOf(url)){announce('同じカテゴリの商品を選んでください');return}compareTray.push({url,name:add.dataset.uxSelectName})}updateTray();return}
      if(e.target.closest('[data-ux-clear-selection]')){compareTray=[];updateTray();return}
      if(e.target.closest('[data-ux-start-compare]')){
        if(compareTray.length<2)return;const ids=compareTray.map(p=>p.url.split('/')[3]),category=categoryOf(compareTray[0].url),href=compareHref(category,ids);
        remember(href,compareTray.map(p=>p.name));trackUX('finder_compare_start',{category,products:ids.length});location.assign(href);return}
      if(e.target.closest('[data-ux-recent-clear]')){try{localStorage.removeItem(RECENT_KEY)}catch{}renderModal();return}
      if(e.target.closest('[data-ux-history-clear]')){historyWrite([]);renderModal();return}
      if(e.target.closest('[data-ux-more]')){resultLimit+=PAGE_SIZE;renderModal();return}
      if(e.target.closest('[data-ux-retry]')){cataloguePromise=null;catalogueFailed=false;catalogue();renderModal();return}
      const b=e.target.closest('[data-ux-fav-url]');if(!b)return;
      const url=b.dataset.uxFavUrl;
      const product={url,name:b.dataset.uxName,categoryName:b.dataset.uxCategory,brand:b.dataset.uxBrand};
      toggleFav(product);
    });
  };
  let focusBefore=null;
  const openModal=which=>{
    ensureModal();tab=which;resultLimit=PAGE_SIZE;focusBefore=document.activeElement;modal.hidden=false;
    document.body.classList.add('ux-modal-open');
    if(catalogueFailed){cataloguePromise=null;catalogueFailed=false}
    catalogue();
    trackUX('finder_open',{tab:which});renderModal();
    (which==='search'?searchBox:$('.ux-modal-close',modal)).focus();
    catalogue().then(rows=>{
      if(!modal.hidden){
        
        if(categorySelect.options.length<2)categorySelect.insertAdjacentHTML('beforeend',groupedOptions(rows));
        renderModal();
      }
    });
  };
  const closeModal=()=>{modal.hidden=true;document.body.classList.remove('ux-modal-open');focusBefore?.focus?.()};
  const renderModal=()=>{
    if(!modal || modal.hidden)return;
    $$('.ux-tabs button',modal).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.uxTab===tab)));
    $('.ux-search-filters',modal).hidden=tab!=='search';
    const box=$('.ux-search-count',modal);updateTray();
    if(tab==='guide'){
      box.textContent='カテゴリを選び、予算と重視条件を決める';
      resultBox.innerHTML='<p class="ux-empty">既存の診断・条件比較へ案内します。価格未確認の商品は予算内と断定しません。</p>';
      catalogue().then(rows=>{if(modal.hidden||tab!=='guide'||resultBox.querySelector('.ux-guide-select'))return;
        const form=document.createElement('div');form.className='ux-guide-select';
        form.innerHTML='<label>1. 探したい商品<select aria-label="商品カテゴリ"><option value="">選択してください</option>'+groupedOptions(rows)+'</select></label><p>2. 移動先で予算を選択</p><p>3. カテゴリごとの重視条件を指定</p><button type="button" disabled>条件比較へ進む →</button>';
        const select=form.querySelector('select'),button=form.querySelector('button');select.addEventListener('change',()=>button.disabled=!select.value);
        button.addEventListener('click',()=>{if(!rows.some(p=>p.category===select.value))return;trackUX('finder_guide_start',{category:select.value});location.assign(select.value==='earphones'?'/#quiz':'/'+select.value+'/')});resultBox.append(form)});
      return;
    }
    if(tab==='recent'){
      const rows=recentRead();box.textContent='最近見た商品：'+rows.length+'件';
      resultBox.innerHTML=rows.length?rows.map(resultMarkup).join('')+'<button type="button" class="ux-fav-btn" data-ux-recent-clear>閲覧履歴を消去</button>':'<p class="ux-empty">商品詳細を見ると、ここに履歴が残ります。</p>';updateTray();hydrateSearchImages();return;
    }
    if(tab==='history'){
      const rows=historyRead();box.textContent='最近の比較：'+rows.length+'件';
      resultBox.innerHTML=rows.length?rows.map(p=>'<div class="ux-result"><div><small>保存した商品比較</small><a href="'+escapeHtml(p.url)+'">'+escapeHtml(p.names.join(' vs '))+'</a></div></div>').join('')+'<button type="button" class="ux-fav-btn" data-ux-history-clear>履歴を消去</button>':'<p class="ux-empty">2商品以上を比較すると履歴が保存されます。</p>';return;
    }
    if(tab==='favorites'){
      const favs=favRead();box.textContent='保存済み：'+favs.length+'件';
      resultBox.innerHTML=favs.length?favs.map(p=>resultMarkup(p)).join(''):'<p class="ux-empty">保存した商品はありません。商品カードの「☆ 保存」で登録できます。</p>';
      updateTray();hydrateSearchImages();
      return;
    }
    if(!cataloguePromise){box.textContent='検索データを読み込み中…';resultBox.innerHTML='';catalogue()}
    catalogue().then(rows=>{
      if(modal.hidden||tab!=='search')return;
      if(catalogueFailed){box.textContent='商品データを取得できませんでした';resultBox.innerHTML='<p class="ux-empty">通信状況を確認して、もう一度お試しください。</p><button type="button" class="ux-fav-btn" data-ux-retry>再読み込み</button>';return}
      
      if(categorySelect.options.length<2)categorySelect.insertAdjacentHTML('beforeend',groupedOptions(rows));
      const needle=clean(searchBox.value), category=categorySelect.value;
      const tokens=needle.split(' ').filter(Boolean).map(compact).filter(Boolean);
      const match=rows.filter(p=>{
        if(category && p.category!==category)return false;
        const haystack=compact([p.name,p.id,p.brand,p.description,p.categoryName].join(' '));
        return tokens.every(t=>haystack.includes(t));
      });
      if(tokens.length){
        const rank=p=>{const name=compact(p.name),id=compact(p.id),q=compact(needle);return name===q||id===q?0:name.startsWith(q)||id.startsWith(q)?1:tokens.every(t=>name.includes(t)||id.includes(t))?2:3};
        match.sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,'ja'));
      }
      const shown=Math.min(resultLimit,match.length);
      const previousScroll=resultBox.scrollTop;
      box.textContent=match.length+'件の製品'+(shown<match.length?'（'+shown+'件表示）':'');
      resultBox.innerHTML=match.slice(0,shown).map(p=>resultMarkup(p)).join('')||'<p class="ux-empty">該当する商品がありません。型番やメーカー名で試してください。</p>';
      if(shown<match.length)resultBox.insertAdjacentHTML('beforeend','<button type="button" class="ux-fav-btn" data-ux-more>さらに'+Math.min(PAGE_SIZE,match.length-shown)+'件表示する（残り'+(match.length-shown)+'件）</button>');
      resultBox.scrollTop=previousScroll;
      updateTray();hydrateSearchImages();
    });
  };
  const resultMarkup=p=>{
    const saved=favRead().some(f=>f.url===p.url);
    return '<div class="ux-result"><div class="ux-result-photo" data-rakuten-name="'+escapeHtml(p.name)+'"><span aria-hidden="true">📦</span></div><div><small>'+escapeHtml(p.categoryName||'商品')+(p.brand?' ・ '+escapeHtml(p.brand):'')+'</small><a href="'+escapeHtml(p.url)+'">'+escapeHtml(p.name)+'</a><small class="ux-result-price">楽天参考価格：未取得</small><a class="ux-rakuten-link" href="/rakuten/?q='+encodeURIComponent(p.name)+'" target="_blank" rel="nofollow noopener noreferrer" data-track="rakuten_click" data-product="'+escapeHtml(p.name)+'">楽天の販売先を確認（PR）</a></div><button type="button" class="ux-select-btn" data-ux-select="'+escapeHtml(p.url)+'" data-ux-select-name="'+escapeHtml(p.name)+'" aria-pressed="false">比較</button><button type="button" data-ux-fav-url="'+escapeHtml(p.url)+'" data-ux-name="'+escapeHtml(p.name)+'" data-ux-category="'+escapeHtml(p.categoryName||'')+'" data-ux-brand="'+escapeHtml(p.brand||'')+'" aria-label="'+escapeHtml(p.name)+'のお気に入りを切り替える">'+(saved?'★':'☆')+'</button></div>';
  };
  // Lazily load Rakuten's original API images for visible search results only.
  let thumbObserver=null;
  const hydrateSearchImages=()=>{
    thumbObserver?.disconnect();
    thumbObserver=null;
    if(!modal || modal.hidden) return;
    if(typeof window.minnaRakutenMediaLookup !== 'function'){
      let script=document.querySelector('script[src="/product-media.js"]');
      if(!script){
        script=document.createElement('script');
        script.src='/product-media.js';
        script.defer=true;
        document.head.append(script);
      }
      script.addEventListener('load',()=>{if(modal && !modal.hidden)hydrateSearchImages()},{once:true});
      return;
    }
    if(typeof IntersectionObserver==='undefined')return;
    thumbObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        thumbObserver?.unobserve(entry.target);
        const visual=entry.target,name=visual.dataset.rakutenName;
        window.minnaRakutenMediaLookup(name).then(result=>{
          if(!visual.isConnected || !result || result.provider!=='rakuten')return;
          const price=Number(result.price),priceLabel=visual.closest('.ux-result')?.querySelector('.ux-result-price');
          if(priceLabel&&Number.isFinite(price)&&price>0){const date=Number(result.observedAt);priceLabel.textContent='楽天参考 ¥'+Math.round(price).toLocaleString('ja-JP')+(Number.isFinite(date)&&date>0?'（'+new Date(date).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'取得）':'（取得日時不明）')}
          if(!result.imageUrl)return;
          let url = null;
          try { const u = new URL(result.affiliateUrl || ''); if(result.isAffiliate === true && u.protocol === 'https:' && u.hostname === 'hb.afl.rakuten.co.jp') url = u.toString(); } catch (_) {}
          if (!url) url = '/rakuten/?q=' + encodeURIComponent(name);
          const merchant=visual.closest('.ux-result')?.querySelector('.ux-rakuten-link');
          if(merchant&&url.startsWith('https://hb.afl.rakuten.co.jp/')){merchant.href=url;merchant.rel='nofollow noopener noreferrer sponsored';merchant.dataset.affiliate='rakuten';merchant.textContent='楽天で見る（PR）'}
          const a=document.createElement('a');
          a.href=url;
          a.target='_blank';
          a.rel=url.startsWith('https://hb.afl.rakuten.co.jp/')?'nofollow noopener noreferrer sponsored':'noopener noreferrer';
          a.title='楽天で'+name+'の商品情報を見る';
          const img=document.createElement('img');
          img.alt=name+'の商品画像';
          img.loading='lazy';
          img.width=64;img.height=64;
          img.src=result.imageUrl;
          img.addEventListener('error',()=>{a.remove();visual.textContent='📦'},{once:true});
          a.append(img);
          visual.replaceChildren(a);
        }).catch(()=>{});
      }
    },{root:resultBox,rootMargin:'100px 0px'});
    $$('.ux-result-photo',resultBox).forEach(el=>thumbObserver.observe(el));
  };
  const applySharedLegacy=()=>{
    if(!['/smartphones/','/mobile-batteries/'].includes(location.pathname))return;
    if(document.documentElement.dataset.uxSharedRestore)return;
    document.documentElement.dataset.uxSharedRestore='1';
    const raw=new URLSearchParams(location.search).get('compare')||'';
    const ids=[...new Set(raw.split(',').filter(Boolean))].slice(0,3);
    if(ids.length && typeof window.toggle==='function') ids.forEach(id=>{
      const details=$$('.discovery-card[href*="/products/"],.product-title-link,[href*="/products/"]');
      if(details.some(n=>n.getAttribute('href')?.endsWith('/'+id+'/')))window.toggle(id);
    });
  };
  const run=()=>{
    enhanceCards();enhanceDetail();updateDifferences();syncDock();ensureLegacyShare();applySharedLegacy();saveCurrentComparison();
  };
  const init=()=>{
    ensureLauncher();
    const refreshFavorites=()=>{updateFavButtons();updateCounter();if(modal&&!modal.hidden){if(tab==='favorites')renderModal();else if(tab==='search'||tab==='recent'){const saved=new Set(favRead().map(p=>p.url));$$('[data-ux-fav-url]',modal).forEach(btn=>{btn.textContent=saved.has(btn.dataset.uxFavUrl)?'★':'☆';btn.setAttribute('aria-pressed',String(saved.has(btn.dataset.uxFavUrl)))})}}};
    window.addEventListener('minna:favorites-changed',refreshFavorites);
    window.addEventListener('storage',e=>{if(e.key===FAV_KEY||e.key===null)refreshFavorites()});
    document.addEventListener('click',event=>{
      const fav=event.target.closest('.ux-fav-btn[data-url]');
      if(fav){toggleFav({url:fav.dataset.url,name:fav.dataset.name,categoryName:fav.dataset.categoryName});return}
      if(event.target.closest('.ux-share:not(.ux-image-save)')){compareShare();return}
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && modal && !modal.hidden)closeModal();
      if(event.key==='Tab' && modal && !modal.hidden){
        const focusable=$$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled])',modal).filter(el=>el.getClientRects().length>0);
        if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
      }
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!event.altKey){
        event.preventDefault();openModal('search');
      }
    });
    let scheduled=false;
    const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run()})};
    const observer=new MutationObserver(records=>{
      if(records.every(r=>r.target.nodeType===1 && r.target.closest?.('.ux-modal,.ux-related,.ux-launcher,.ux-toast,.ux-compare-dock')))return;
      schedule();
    });
    observer.observe(document.body,{subtree:true,childList:true});
    run();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();