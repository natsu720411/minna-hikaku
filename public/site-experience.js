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
  let cataloguePromise=null;
  const catalogue = () => cataloguePromise ||= fetch('/product-catalog.json').then(r=>{
    if(!r.ok) throw new Error('Catalogue unavailable');
    return r.json();
  }).then(rows => rows.filter(p => isProductUrl(p.url) && p.name)).catch(()=>[]);
  const favRead=()=>{
    try {
      const rows=JSON.parse(localStorage.getItem(FAV_KEY)||'[]');
      return Array.isArray(rows) ? rows.filter(p => isProductUrl(p.url) && typeof p.name==='string').slice(0,60) : [];
    }catch{return []}
  };
  const favWrite=items=>{
    try{localStorage.setItem(FAV_KEY,JSON.stringify(items.slice(0,60)))}catch{}
    updateFavButtons();
    updateCounter();
    if(modal && !modal.hidden) renderModal();
  };
  const toggleFav=(product)=>{
    const favs=favRead();
    const existing=favs.findIndex(p=>p.url===product.url);
    if(existing>=0)favs.splice(existing,1);
    else {
      if(favs.length>=60){announce('お気に入りは60件まで保存できます');return}
      favs.unshift({url:product.url,name:product.name,categoryName:product.categoryName||'',brand:product.brand||''});
    }
    favWrite(favs);
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
      if(card.querySelector('.ux-fav-btn'))return;
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
  const enhanceDetail=()=>{
    const url=location.pathname;
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
      const siblings=rows.filter(p=>p.category===current.category && p.url!==url)
        .sort((a,b)=>Number(b.brand===current.brand)-Number(a.brand===current.brand))
        .slice(0,4);
      if(!siblings.length)return;
      const section=document.createElement('section');
      section.className='ux-related';
      section.innerHTML='<h2>同じカテゴリの類似候補も比較</h2><p>同じカテゴリの商品から、同じメーカーを優先して表示しています。性能が近いことを保証するものではありません。</p><div class="ux-related-grid">'+siblings.map(p=>'<a href="'+escapeHtml(p.url)+'"><b>'+escapeHtml(p.name)+'</b><small>'+escapeHtml(p.brand||p.categoryName)+'　詳細を見る →</small></a>').join('')+'</div>';
      main.append(section);
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
    const header=panel.querySelector('.compare-title,.summary,h2');
    if(header && !panel.querySelector('.ux-share')){
      const btn=document.createElement('button');
      btn.className='ux-share';btn.type='button';btn.textContent='↗ この比較を共有';
      header.append(btn);
    }
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
    holder.innerHTML='<button type="button" id="ux-search-launch">⌕ 430商品を検索</button><button type="button" id="ux-fav-launch">☆ 保存 <span class="ux-fav-count">0</span></button>';
    document.body.append(holder);launcher=holder;updateCount=$('.ux-fav-count',holder);updateCounter();
    $('#ux-search-launch').addEventListener('click',()=>openModal('search'));
    $('#ux-fav-launch').addEventListener('click',()=>openModal('favorites'));
  };
  const ensureModal=()=>{
    if(modal)return;
    modal=document.createElement('div');modal.className='ux-modal';modal.hidden=true;
    modal.innerHTML='<div class="ux-modal-panel" role="dialog" aria-modal="true" aria-label="商品検索とお気に入り"><div class="ux-modal-head"><strong>430商品から探す</strong><button type="button" class="ux-modal-close" aria-label="閉じる">×</button></div><div class="ux-tabs"><button type="button" data-ux-tab="search">商品を検索</button><button type="button" data-ux-tab="favorites">お気に入り</button></div><div class="ux-search-filters"><input type="search" id="ux-search-input" placeholder="商品名・型番・メーカーで検索" aria-label="全商品を検索"><select id="ux-category-filter" aria-label="カテゴリを絞り込む"><option value="">すべてのカテゴリ</option></select></div><p class="ux-search-count" aria-live="polite"></p><div class="ux-results"></div><p class="ux-modal-note">商品は公開済みの詳細ページから検索します。お気に入りはこのブラウザに保存されます。</p></div>';
    document.body.append(modal);searchBox=$('#ux-search-input',modal);resultBox=$('.ux-results',modal);categorySelect=$('#ux-category-filter',modal);
    $('.ux-modal-close',modal).addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
    $$('.ux-tabs button',modal).forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.uxTab;renderModal();if(tab==='search')searchBox.focus()}));
    searchBox.addEventListener('input',renderModal);categorySelect.addEventListener('change',renderModal);
    modal.addEventListener('click',e=>{
      const b=e.target.closest('[data-ux-fav-url]');if(!b)return;
      const url=b.dataset.uxFavUrl;
      const product={url,name:b.dataset.uxName,categoryName:b.dataset.uxCategory,brand:b.dataset.uxBrand};
      toggleFav(product);
    });
  };
  let focusBefore=null;
  const openModal=which=>{
    ensureModal();tab=which;focusBefore=document.activeElement;modal.hidden=false;
    document.body.classList.add('ux-modal-open');
    renderModal();
    (which==='search'?searchBox:$('.ux-modal-close',modal)).focus();
    catalogue().then(rows=>{
      if(!modal.hidden){
        const categories=[...new Map(rows.map(p=>[p.category,p.categoryName])).entries()];
        if(categorySelect.options.length<2)categorySelect.insertAdjacentHTML('beforeend',categories.map(([id,name])=>'<option value="'+escapeHtml(id)+'">'+escapeHtml(name)+'</option>').join(''));
        renderModal();
      }
    });
  };
  const closeModal=()=>{modal.hidden=true;document.body.classList.remove('ux-modal-open');focusBefore?.focus?.()};
  const renderModal=()=>{
    if(!modal || modal.hidden)return;
    $$('.ux-tabs button',modal).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.uxTab===tab)));
    $('.ux-search-filters',modal).hidden=tab!=='search';
    const box=$('.ux-search-count',modal);
    if(tab==='favorites'){
      const favs=favRead();box.textContent='保存済み：'+favs.length+'件';
      resultBox.innerHTML=favs.length?favs.map(p=>resultMarkup(p)).join(''):'<p class="ux-empty">保存した商品はありません。商品カードの「☆ 保存」で登録できます。</p>';
      hydrateSearchImages();
      return;
    }
    if(!cataloguePromise){box.textContent='検索データを読み込み中…';resultBox.innerHTML='';return}
    catalogue().then(rows=>{
      if(modal.hidden||tab!=='search')return;
      const needle=clean(searchBox.value);const category=categorySelect.value;
      const match=rows.filter(p=>(!category||p.category===category) && (!needle||clean([p.name,p.brand,p.description,p.categoryName].join(' ')).includes(needle)));
      box.textContent=match.length+'件の製品'+(match.length>40?'（先頭40件表示）':'');
      resultBox.innerHTML=match.slice(0,40).map(p=>resultMarkup(p)).join('')||'<p class="ux-empty">該当する商品がありません。型番やメーカー名で試してください。</p>';
      hydrateSearchImages();
    });
  };
  const resultMarkup=p=>{
    const saved=favRead().some(f=>f.url===p.url);
    return '<div class="ux-result"><div class="ux-result-photo" data-rakuten-name="'+escapeHtml(p.name)+'"><span aria-hidden="true">📦</span></div><div><small>'+escapeHtml(p.categoryName||'商品')+(p.brand?' ・ '+escapeHtml(p.brand):'')+'</small><a href="'+escapeHtml(p.url)+'">'+escapeHtml(p.name)+'</a></div><button type="button" data-ux-fav-url="'+escapeHtml(p.url)+'" data-ux-name="'+escapeHtml(p.name)+'" data-ux-category="'+escapeHtml(p.categoryName||'')+'" data-ux-brand="'+escapeHtml(p.brand||'')+'" aria-label="'+escapeHtml(p.name)+'のお気に入りを切り替える">'+(saved?'★':'☆')+'</button></div>';
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
          if(!visual.isConnected || !result?.imageUrl || result.provider!=='rakuten')return;
          let url = null;
          try { const u = new URL(result.affiliateUrl || ''); if(result.isAffiliate === true && u.protocol === 'https:' && u.hostname === 'hb.afl.rakuten.co.jp') url = u.toString(); } catch (_) {}
          if (!url) url = '/rakuten/?q=' + encodeURIComponent(name);
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
    $('.ux-result-photo',resultBox).forEach(el=>thumbObserver.observe(el));
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
    enhanceCards();enhanceDetail();updateDifferences();syncDock();ensureLegacyShare();applySharedLegacy();
  };
  const init=()=>{
    ensureLauncher();
    document.addEventListener('click',event=>{
      const fav=event.target.closest('.ux-fav-btn');
      if(fav){toggleFav({url:fav.dataset.url,name:fav.dataset.name,categoryName:fav.dataset.categoryName});return}
      if(event.target.closest('.ux-share')){compareShare();return}
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && modal && !modal.hidden)closeModal();
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