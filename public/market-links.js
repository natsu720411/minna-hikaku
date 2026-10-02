(() => {
  const amazonUrl = (name) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}`;
  const rakutenUrl = (name) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}/`;

  const injectUiRefresh = () => {
    if (document.getElementById('ui-refresh-2026')) return;
    const style = document.createElement('style');
    style.id = 'ui-refresh-2026';
    style.textContent = `
      :root{--ui-blue:#0f6cf9;--ui-blue-dark:#095edc;--ui-ink:#172a45;--ui-muted:#718198;--ui-line:#dfe7f1;--ui-soft:#f4f8ff;--ui-shadow:0 14px 34px rgba(27,58,99,.08)}
      body{background:linear-gradient(180deg,#f9fbff 0,#f6f9fd 420px,#f7f9fc 100%)}
      .site-header .logo::after,.guide-logo::after{content:'商品比較'!important}
      .site-header,.guide-header{border-bottom-color:rgba(214,224,238,.92)!important;box-shadow:0 10px 30px rgba(25,54,91,.06)!important}
      .site-header nav,.guide-nav{box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}

      .hero{position:relative}
      .hero h1{max-width:760px}
      .hero-text{color:#61728a}
      .primary-btn{border-radius:15px;box-shadow:0 12px 26px rgba(15,108,249,.22)}
      .primary-btn:focus-visible,.ghost-btn:focus-visible,.compare-btn:focus-visible,.choice:focus-visible,.criterion:focus-visible,.preset-card:focus-visible,.control-row button:focus-visible{outline:3px solid rgba(15,108,249,.22);outline-offset:3px}
      .quiz-wrap{border-radius:30px;border-color:#dde6f1;box-shadow:0 22px 54px rgba(29,60,100,.08)}
      .question-card h3{letter-spacing:-.025em;color:#1f3450}
      .choice,.criterion{transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
      .choice:hover,.criterion:hover{transform:translateY(-1px);border-color:#b8cdf0;background:#fff;box-shadow:0 8px 18px rgba(30,61,102,.05)}

      #categories.category-section{max-width:1180px!important;padding:22px 24px 40px!important}
      #categories .category-heading{margin-bottom:20px!important}
      #categories .category-heading h2{font-size:32px!important;letter-spacing:-.035em!important;color:#1d324d!important}
      #categories .category-grid{gap:16px!important}
      #categories .category-card{position:relative;min-height:124px;padding:22px!important;border-radius:22px!important;border-color:#dce6f2!important;background:linear-gradient(145deg,#fff,#fbfdff)!important;box-shadow:0 10px 26px rgba(31,64,105,.055)!important;overflow:hidden;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}
      #categories .category-card::before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(90deg,#0f6cf9,#7cb4ff);opacity:.7}
      #categories .category-card:hover{transform:translateY(-4px)!important;border-color:#9fc3fb!important;box-shadow:0 18px 38px rgba(27,66,123,.11)!important}
      #categories .category-icon{width:58px!important;height:58px!important;border-radius:17px!important;background:linear-gradient(145deg,#f4f8ff,#e9f3ff)!important;border:1px solid #dfebfc;box-shadow:inset 0 1px 0 #fff}
      #categories .category-card b{font-size:16px!important;color:#1f3450}
      #categories .category-card small{font-size:11px!important;color:#7a899d!important}
      #categories .category-arrow{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#edf5ff;transition:transform .2s ease,background .2s ease,color .2s ease}
      #categories .category-card:hover .category-arrow{transform:translateX(2px);background:#0f6cf9;color:#fff}
      #categories .category-new{display:none!important}

      .rank-card{border-radius:22px!important;border-color:#dde6f1!important;background:rgba(255,255,255,.96)!important;box-shadow:0 7px 20px rgba(30,61,102,.045);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}
      .rank-card:hover{transform:translateY(-3px)!important;border-color:#b9cdec!important;box-shadow:0 17px 36px rgba(29,63,108,.09)!important}
      .ranking-list .rank-card:nth-child(1){background:linear-gradient(110deg,#fff,#f3f8ff)!important;border-color:#a7c8f8!important}
      .big-product-icon{border:1px solid #e7edf5;background:linear-gradient(145deg,#f8faff,#eef4fb)!important}
      .rank-main h3{letter-spacing:-.02em;color:#203650}
      .tag-row span{border:1px solid #e7edf5;background:#f6f9fc!important}
      .match-box{box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}
      .compare-btn{min-height:40px;border-radius:12px!important}
      .rank-actions .price{background:#fbfcfe!important}
      .market-btn{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
      .market-btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(31,61,99,.07)}
      .table-scroll{box-shadow:0 9px 24px rgba(30,61,102,.045)}

      .guide-main{max-width:980px!important;padding-top:46px!important}
      .guide-main h1{color:#1b304b}
      .lead{color:#64758c!important}
      .summary-box,.product-shop-box{border-color:#dce6f2!important;box-shadow:0 9px 24px rgba(30,61,102,.045)}
      .related a{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease}
      .related a:hover{transform:translateY(-2px);border-color:#a8c7f4;background:#f8fbff;box-shadow:0 9px 20px rgba(30,61,102,.06)}
      .cta{background:linear-gradient(135deg,#10213a,#18385f)!important;box-shadow:0 18px 38px rgba(16,33,58,.16)}

      body .battery-hero,body .phone-hero{position:relative;overflow:hidden;border-radius:28px!important;border-color:#d9e5f3!important;background:linear-gradient(140deg,#f5f9ff 0%,#fff 58%,#f8fbff 100%)!important;box-shadow:0 18px 42px rgba(30,61,102,.07);padding:34px!important}
      body .battery-hero::after,body .phone-hero::after{content:'';position:absolute;width:220px;height:220px;border-radius:50%;right:-90px;top:-110px;background:radial-gradient(circle,rgba(15,108,249,.13),rgba(15,108,249,0) 70%);pointer-events:none}
      body .battery-hero h1,body .phone-hero h1{letter-spacing:-.04em;color:#1d324d}
      body .battery-trust span,body .phone-trust span{padding:7px 10px!important;border-color:#dce7f5!important;box-shadow:0 3px 9px rgba(30,61,102,.035)}
      body .finder{border-radius:24px!important;border-color:#dbe5f1!important;box-shadow:0 12px 30px rgba(30,61,102,.055);padding:26px!important}
      body .finder h2{letter-spacing:-.02em;color:#203650}
      body .control-label{color:#4f637d!important;letter-spacing:.01em}
      body .control-row button{min-height:38px;border-radius:12px!important;background:#f9fbfd!important;border-color:#dfe7f0!important;padding:9px 13px!important;transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
      body .control-row button:hover{transform:translateY(-1px);border-color:#aac6ef!important;background:#fff!important;box-shadow:0 6px 14px rgba(30,61,102,.05)}
      body .control-row button.active{background:#0f6cf9!important;border-color:#0f6cf9!important;color:#fff!important;box-shadow:0 7px 16px rgba(15,108,249,.17)}
      body .guide-main .summary{margin-top:32px!important;margin-bottom:16px!important}
      body .guide-main .summary h2{font-size:27px;letter-spacing:-.025em;color:#203650}
      body .guide-main .list{gap:14px!important}
      body .guide-main .list>.card{position:relative;border-radius:21px!important;border-color:#dfe7f1!important;background:rgba(255,255,255,.97)!important;box-shadow:0 7px 20px rgba(30,61,102,.045);padding:21px!important;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}
      body .guide-main .list>.card:hover{transform:translateY(-3px);border-color:#b7cceb!important;box-shadow:0 16px 34px rgba(29,63,108,.085)}
      body .guide-main .list>.card:first-child{border-color:#9fc3fb!important;background:linear-gradient(110deg,#fff,#f4f9ff)!important;box-shadow:0 13px 30px rgba(15,108,249,.08)}
      body .guide-main .rank{border-radius:14px!important;background:#eef5ff!important;box-shadow:inset 0 0 0 1px #dceaff}
      body .guide-main .list>.card:first-child .rank{background:#0f6cf9!important;color:#fff!important;box-shadow:0 7px 16px rgba(15,108,249,.2)}
      body .guide-main .card h3{font-size:19px!important;letter-spacing:-.018em;color:#203650}
      body .guide-main .brand{letter-spacing:.08em}
      body .guide-main .specs span{border:1px solid #e6edf5;background:#f6f9fc!important;padding:6px 8px!important}
      body .guide-main .score{border-radius:16px!important;border-color:#dce8f6!important;background:#f5f9ff!important;box-shadow:inset 0 1px 0 #fff}
      body .guide-main .score strong{letter-spacing:-.04em}
      body .guide-main .actions{margin-top:14px!important}
      body .guide-main .actions a{display:inline-flex;align-items:center;min-height:32px;padding:6px 9px;border-radius:9px;background:#eef5ff;text-decoration:none!important}
      body .guide-main .actions a:hover{background:#e1efff}
      body .guide-main .actions label{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:6px 9px;border:1px solid #e1e8f1;border-radius:9px;background:#fafbfd}
      body .guide-main input[type='checkbox']{width:16px;height:16px;accent-color:#0f6cf9}
      body .guide-main .compare{border-radius:22px!important;border-color:#dce6f2!important;box-shadow:0 11px 28px rgba(30,61,102,.055)}
      body .guide-main .table-scroll{border-radius:16px!important;border-color:#e0e7f0!important}
      body .guide-main .note{border-radius:17px!important;background:#f8fafc!important;border-color:#e3eaf2!important}
      .guide-footer{background:linear-gradient(135deg,#10213a,#162f50)!important}

      @media(max-width:900px){
        #categories .category-grid{grid-template-columns:1fr 1fr!important}
        #categories .category-grid .category-card:last-child{grid-column:1/-1!important}
        .rank-card{box-shadow:none}
      }
      @media(max-width:680px){
        #categories.category-section{padding:16px 16px 28px!important}
        #categories .category-heading h2{font-size:26px!important}
        #categories .category-grid{grid-template-columns:1fr!important;gap:11px!important}
        #categories .category-grid .category-card:last-child{grid-column:auto!important}
        #categories .category-card{min-height:104px;padding:17px!important;grid-template-columns:50px 1fr 30px!important;border-radius:18px!important}
        #categories .category-icon{width:50px!important;height:50px!important;border-radius:15px!important;font-size:22px!important}
        #categories .category-card b{font-size:15px!important}
        #categories .category-card small{font-size:10px!important}
        .hero{padding-top:38px!important}
        .quiz-wrap{border-radius:22px!important}
        .rank-card{border-radius:18px!important}
        body .guide-main{padding:32px 14px 60px!important}
        body .battery-hero,body .phone-hero{padding:23px 19px!important;border-radius:22px!important}
        body .finder{padding:19px!important;border-radius:20px!important}
        body .control-row{gap:7px!important}
        body .control-row button{font-size:11px!important;padding:8px 10px!important}
        body .guide-main .list>.card{padding:16px!important;border-radius:18px!important;gap:11px!important}
        body .guide-main .card h3{font-size:16px!important}
        body .guide-main .score{padding:8px 10px!important}
      }
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `;
    document.head.appendChild(style);
  };

  const makeLink = (label, href, cls, name) => {
    const a = document.createElement('a');
    a.className = `market-btn ${cls}`;
    a.href = href;
    a.target = '_blank';
    a.rel = 'nofollow noopener noreferrer';
    a.textContent = label;
    if (name) a.setAttribute('aria-label', `${name}を${label}`);
    return a;
  };

  const enhanceRankingCards = () => {
    document.querySelectorAll('.rank-card').forEach((card) => {
      if (card.querySelector('.market-links')) return;
      const name = card.querySelector('.rank-main h3')?.textContent?.trim();
      const actions = card.querySelector('.rank-actions');
      if (!name || !actions) return;
      const wrap = document.createElement('div');
      wrap.className = 'market-links';
      wrap.append(
        makeLink('Amazonで探す', amazonUrl(name), 'amazon', name),
        makeLink('楽天で探す', rakutenUrl(name), 'rakuten', name),
      );
      actions.appendChild(wrap);
    });
  };

  const enhanceProductPage = () => {
    if (!location.pathname.includes('/earphones/products/')) return;
    const main = document.querySelector('.guide-main');
    const heading = main?.querySelector('h1');
    if (!main || !heading || main.querySelector('.product-shop-box')) return;
    const name = heading.textContent.replace('を比較', '').trim();
    const summary = main.querySelector('.summary-box');
    const box = document.createElement('div');
    box.className = 'product-shop-box';
    box.innerHTML = `<strong>${name}の販売先を探す</strong><p>価格は販売店やセールで変動します。購入前に最新価格を確認してください。</p>`;
    const links = document.createElement('div');
    links.className = 'market-links market-links-wide';
    links.append(
      makeLink('Amazonで探す', amazonUrl(name), 'amazon', name),
      makeLink('楽天で探す', rakutenUrl(name), 'rakuten', name),
    );
    box.appendChild(links);
    summary?.insertAdjacentElement('afterend', box);
  };

  const enhanceComparePage = () => {
    if (!location.pathname.includes('/earphones/compare/')) return;
    const main = document.querySelector('.guide-main');
    const heading = main?.querySelector('h1');
    if (!main || !heading || main.querySelector('.compare-shop-box')) return;
    const raw = heading.textContent.replace(/を比較/g, '').trim();
    let names = raw.split(/\s+vs\s+/i).map((v) => v.trim()).filter(Boolean);
    if (names.length < 2 && raw.includes('と')) names = raw.split('と').map((v) => v.trim()).filter(Boolean);
    if (names.length < 2) return;
    const box = document.createElement('div');
    box.className = 'product-shop-box compare-shop-box';
    const title = document.createElement('strong');
    title.textContent = '2製品の販売先を確認';
    box.appendChild(title);
    names.slice(0, 2).forEach((name) => {
      const row = document.createElement('div');
      row.className = 'compare-market-row';
      const label = document.createElement('b');
      label.textContent = name;
      const links = document.createElement('div');
      links.className = 'market-links';
      links.append(
        makeLink('Amazon', amazonUrl(name), 'amazon', name),
        makeLink('楽天', rakutenUrl(name), 'rakuten', name),
      );
      row.append(label, links);
      box.appendChild(row);
    });
    const lead = main.querySelector('.lead');
    lead?.insertAdjacentElement('afterend', box);
  };

  const enhanceFooter = () => {
    document.querySelectorAll('footer').forEach((footer) => {
      if (footer.querySelector('.trust-footer-links') || footer.querySelector('.footer-trust-links')) return;
      const wrap = document.createElement('div');
      wrap.className = 'trust-footer-links';
      wrap.innerHTML = '<a href="/about/">サイトについて</a><a href="/methodology/">比較方法</a><a href="/affiliate-disclosure/">広告・アフィリエイト方針</a>';
      footer.appendChild(wrap);
    });
  };

  const syncEarphoneCount = () => {
    if (!location.pathname.startsWith('/earphones/')) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.nodeValue) return;
      node.nodeValue = node.nodeValue.replaceAll('11機種', '30機種').replaceAll('20機種', '30機種');
    });
  };

  const enhanceCategories = () => {
    if (location.pathname !== '/' || document.querySelector('#categories')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (!document.getElementById('category-expansion-style')) {
      const style = document.createElement('style');
      style.id = 'category-expansion-style';
      style.textContent = `.category-section{max-width:1120px;margin:0 auto;padding:32px 24px 18px}.category-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:18px}.category-heading h2{margin:3px 0 0;font-size:30px;color:#20344f}.category-heading p{margin:0;color:#7c8a9e;font-size:13px}.category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.category-card{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:12px;padding:19px;border:1px solid #dfe7f1;border-radius:20px;background:#fff;text-decoration:none;color:#263850;box-shadow:0 8px 24px rgba(30,61,102,.05);transition:.2s}.category-card:hover{transform:translateY(-2px);border-color:#a9c9fb;box-shadow:0 14px 32px rgba(30,61,102,.1)}.category-icon{width:54px;height:54px;display:grid;place-items:center;border-radius:16px;background:#eef5ff;font-size:25px}.category-card b{display:block;font-size:15px}.category-card small{display:block;margin-top:5px;color:#8190a4;line-height:1.5;font-size:10px}.category-arrow{color:#0f6cf9;font-size:20px;font-weight:900}.category-card.new{background:linear-gradient(145deg,#fff,#f5f9ff);border-color:#cfe0f7}.category-new{display:inline-flex;margin-left:6px;padding:3px 6px;border-radius:999px;background:#0f6cf9;color:#fff;font-size:8px;vertical-align:2px}@media(max-width:900px){.category-grid{grid-template-columns:1fr 1fr}.category-grid .category-card:last-child{grid-column:1/-1}}@media(max-width:680px){.category-section{padding:24px 16px 12px}.category-heading{display:block}.category-heading p{margin-top:7px}.category-grid{grid-template-columns:1fr}.category-grid .category-card:last-child{grid-column:auto}.category-card{padding:17px}.category-heading h2{font-size:25px}}`;
      document.head.appendChild(style);
    }
    const section = document.createElement('section');
    section.id = 'categories';
    section.className = 'category-section';
    section.innerHTML = `<div class="category-heading"><div><p class="eyebrow">CATEGORIES</p><h2>比較するカテゴリを選ぶ</h2></div><p>同じ「みんなの比較表」で、ほかの商品も条件別に比較できます。</p></div><div class="category-grid"><a class="category-card" href="#quiz"><span class="category-icon">🎧</span><span><b>ワイヤレスイヤホン</b><small>30機種を価格・音質・ANC・バッテリーなどで比較</small></span><span class="category-arrow">→</span></a><a class="category-card" href="/mobile-batteries/"><span class="category-icon">🔋</span><span><b>モバイルバッテリー</b><small>30製品を容量・出力・軽さ・ケーブルなどで比較</small></span><span class="category-arrow">→</span></a><a class="category-card" href="/smartphones/"><span class="category-icon">📱</span><span><b>スマートフォン</b><small>30機種を価格・カメラ・性能・バッテリー・AIで比較</small></span><span class="category-arrow">→</span></a></div>`;
    hero.insertAdjacentElement('afterend', section);
    const nav = document.querySelector('.site-header nav');
    if (nav && !nav.querySelector('[href="#categories"]')) {
      const link = document.createElement('a');
      link.href = '#categories';
      link.textContent = 'カテゴリ';
      nav.prepend(link);
    }
  };

  const run = () => {
    injectUiRefresh();
    enhanceRankingCards();
    enhanceProductPage();
    enhanceComparePage();
    enhanceFooter();
    syncEarphoneCount();
    enhanceCategories();
  };

  injectUiRefresh();

  let scheduled = false;
  const scheduleRun = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      run();
    });
  };

  window.addEventListener('DOMContentLoaded', scheduleRun, { once: true });
  const root = document.getElementById('root');
  if (root) new MutationObserver(scheduleRun).observe(root, { childList: true, subtree: true });
})();
