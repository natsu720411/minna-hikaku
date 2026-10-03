(() => {
  const AMAZON_ASSOCIATE_TAG = 'minnahikaku-22';
  const GA_MEASUREMENT_ID = 'G-CZLLRFVS45';
  const amazonUrl = (name) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}&tag=${encodeURIComponent(AMAZON_ASSOCIATE_TAG)}`;
  const rakutenUrl = (name) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}/`;

  const loadAnalytics = () => {
    if (document.documentElement.dataset.gaMeasurementId === GA_MEASUREMENT_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: true });
    document.documentElement.dataset.gaMeasurementId = GA_MEASUREMENT_ID;
  };

  const loadUi = () => {
    if (document.querySelector('link[href="/site-ui.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/site-ui.css';
    document.head.appendChild(link);
  };

  const loadProductMedia = () => {
    if (document.querySelector('script[src="/product-media.js"]')) return;
    const script = document.createElement('script');
    script.src = '/product-media.js';
    script.defer = true;
    document.head.appendChild(script);
  };

  const track = (event, params = {}) => {
    try {
      loadAnalytics();
      window.gtag('event', event, params);
    } catch (_) {}
  };
  window.minnaTrack = track;

  const makeLink = (label, href, cls, name) => {
    const a = document.createElement('a');
    a.className = `market-btn ${cls}`;
    a.href = href;
    a.target = '_blank';
    a.rel = cls === 'amazon' ? 'nofollow noopener noreferrer sponsored' : 'nofollow noopener noreferrer';
    a.textContent = label;
    a.dataset.track = cls === 'amazon' ? 'amazon_click' : 'rakuten_click';
    a.dataset.product = name || '';
    if (cls === 'amazon') a.dataset.affiliate = 'amazon';
    if (name) a.setAttribute('aria-label', cls === 'amazon' ? `${name}をAmazonで見る（アフィリエイトリンク）` : `${name}を${label}`);
    return a;
  };

  const syncRakutenAffiliateLinks = () => {
    document.querySelectorAll('.api-product-thumb[data-provider="rakuten"][data-product]').forEach((media) => {
      const name = media.dataset.product || '';
      const href = media.getAttribute('href') || '';
      if (!name || !href || href === '#') return;
      document.querySelectorAll('.market-btn.rakuten[data-product]').forEach((link) => {
        if (link.dataset.product !== name) return;
        link.href = href;
        link.dataset.affiliate = 'rakuten';
        link.rel = 'nofollow noopener noreferrer sponsored';
        link.setAttribute('aria-label', `${name}を楽天で見る（アフィリエイトリンク）`);
      });
    });
  };

  const observeAffiliateMedia = () => {
    if (!document.body || document.documentElement.dataset.rakutenAffiliateObserver) return;
    document.documentElement.dataset.rakutenAffiliateObserver = '1';
    new MutationObserver(syncRakutenAffiliateLinks).observe(document.body, { childList: true, subtree: true });
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
    if (!location.pathname.includes('/products/')) return;
    const main = document.querySelector('.guide-main');
    const heading = main?.querySelector('h1');
    if (!main || !heading || main.querySelector('.product-shop-box')) return;
    const name = heading.textContent.replace(/を比較.*$/,'').replace(/詳細.*$/,'').trim();
    const summary = main.querySelector('.summary-box,.spec-table');
    const box = document.createElement('div');
    box.className = 'product-shop-box';
    box.innerHTML = `<strong>${name}の販売先を探す</strong><p>価格は販売店やセールで変動します。購入前に最新価格を確認してください。</p>`;
    const links = document.createElement('div');
    links.className = 'market-links market-links-wide';
    links.append(makeLink('Amazonで探す', amazonUrl(name), 'amazon', name), makeLink('楽天で探す', rakutenUrl(name), 'rakuten', name));
    box.appendChild(links);
    if (summary) summary.insertAdjacentElement('afterend', box);
  };

  const enhanceComparePage = () => {
    if (!location.pathname.includes('/compare/')) return;
    const main = document.querySelector('.guide-main');
    const heading = main?.querySelector('h1');
    if (!main || !heading || main.querySelector('.compare-shop-box')) return;
    const raw = heading.textContent.replace(/を比較.*$/,'').trim();
    let names = raw.split(/\s+vs\s+/i).map((v) => v.trim()).filter(Boolean);
    if (names.length < 2 && raw.includes('と')) names = raw.split('と').map((v) => v.trim()).filter(Boolean);
    if (names.length < 2) return;
    const box = document.createElement('div');
    box.className = 'product-shop-box compare-shop-box';
    box.innerHTML = '<strong>2製品の販売先を確認</strong>';
    names.slice(0,2).forEach((name) => {
      const row = document.createElement('div');
      row.className = 'compare-market-row';
      const label = document.createElement('b');
      label.textContent = name;
      const links = document.createElement('div');
      links.className = 'market-links';
      links.append(makeLink('Amazon', amazonUrl(name), 'amazon', name), makeLink('楽天', rakutenUrl(name), 'rakuten', name));
      row.append(label, links);
      box.appendChild(row);
    });
    (main.querySelector('.lead') || heading).insertAdjacentElement('afterend', box);
  };

  const enhanceFooter = () => {
    document.querySelectorAll('footer').forEach((footer) => {
      if (!footer.querySelector('.trust-footer-links') && !footer.querySelector('.footer-trust-links')) {
        const wrap = document.createElement('div');
        wrap.className = 'trust-footer-links';
        wrap.innerHTML = '<a href="/about/">サイトについて</a><a href="/methodology/">比較方法</a><a href="/affiliate-disclosure/">広告・アフィリエイト方針</a>';
        footer.appendChild(wrap);
      }
      if (!footer.querySelector('[data-amazon-associate-disclosure]')) {
        const note = document.createElement('p');
        note.dataset.amazonAssociateDisclosure = '1';
        note.className = 'api-affiliate-note';
        note.textContent = 'Amazonのアソシエイトとして、みんなの比較表は適格販売により収入を得ています。';
        footer.appendChild(note);
      }
    });
  };

  const syncEarphoneCount = () => {
    if (!location.pathname.startsWith('/earphones/')) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.nodeValue) return;
      node.nodeValue = node.nodeValue.replaceAll('11機種','30機種').replaceAll('20機種','30機種');
    });
  };

  const categoryCards = [
    { href:'/earphones/', icon:'🎧', title:'ワイヤレスイヤホン', count:'30機種', desc:'音質・ノイキャン・価格・電池持ち', category:'earphones', badge:'診断あり' },
    { href:'/mobile-batteries/', icon:'🔋', title:'モバイルバッテリー', count:'30製品', desc:'容量・出力・軽さ・Qi2・ケーブル', category:'mobile_batteries' },
    { href:'/smartphones/', icon:'📱', title:'スマートフォン', count:'30機種', desc:'カメラ・性能・バッテリー・価格', category:'smartphones' },
    { href:'/smartwatches/', icon:'⌚', title:'スマートウォッチ', count:'20モデル', desc:'健康管理・スポーツ・電池・軽さ', category:'smartwatches', badge:'NEW' },
    { href:'/tablets/', icon:'📚', title:'タブレット', count:'20モデル', desc:'性能・画面・ペン・持ち運び', category:'tablets', badge:'NEW' },
    { href:'/chargers/', icon:'🔌', title:'USB充電器', count:'20製品', desc:'最大出力・ポート数・小型・PC対応', category:'chargers', badge:'NEW' },
  ];

  const categoryStyle = () => {
    if (document.getElementById('category-showcase-style')) return;
    const style = document.createElement('style');
    style.id = 'category-showcase-style';
    style.textContent = `
      #categories{scroll-margin-top:96px}
      #categories .home-guide-box{max-width:1180px;margin:0 auto;padding:34px 24px 18px}
      .category-showcase-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:20px}
      .category-showcase-head h2{margin:0;font-size:32px;letter-spacing:-.035em}
      .category-showcase-head>p{margin:0;color:#7a889c;font-size:13px;max-width:430px;line-height:1.7}
      .category-showcase-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .category-showcase-card{position:relative;display:grid;grid-template-columns:58px 1fr auto;gap:13px;align-items:center;min-height:118px;padding:18px;border:1px solid #dfe7f1;border-radius:20px;background:linear-gradient(145deg,#fff 0%,#fbfdff 100%);color:#22364f;text-decoration:none;box-shadow:0 7px 22px rgba(30,61,102,.045);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
      .category-showcase-card:hover{transform:translateY(-3px);border-color:#a8c9fb;box-shadow:0 16px 34px rgba(28,72,130,.1)}
      .category-showcase-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:17px;background:#eef5ff;border:1px solid #deebff;font-size:27px}
      .category-showcase-main{min-width:0}.category-showcase-title{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.category-showcase-title b{font-size:15px;line-height:1.35}.category-showcase-count{display:inline-flex;align-items:center;border-radius:999px;background:#eff4fa;color:#61748d;padding:4px 7px;font-size:9px;font-weight:900}.category-showcase-desc{display:block;margin-top:7px;color:#8190a4;font-size:10px;line-height:1.55;font-weight:700}.category-showcase-arrow{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#f0f5fc;color:#0f6cf9;font-size:16px;font-weight:950}.category-showcase-card:hover .category-showcase-arrow{background:#0f6cf9;color:#fff}.category-showcase-badge{position:absolute;right:12px;top:10px;border-radius:999px;padding:4px 7px;background:#eaf3ff;color:#0b5fd7;font-size:8px;font-weight:950;letter-spacing:.04em}
      @media(max-width:900px){#categories .home-guide-box{padding-left:18px;padding-right:18px}.category-showcase-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.category-showcase-head{align-items:flex-start;flex-direction:column;gap:8px}}
      @media(max-width:620px){#categories{scroll-margin-top:76px}.category-showcase-grid{grid-template-columns:1fr;gap:10px}.category-showcase-card{min-height:98px;padding:14px;grid-template-columns:50px 1fr 30px;border-radius:17px}.category-showcase-icon{width:50px;height:50px;border-radius:14px;font-size:23px}.category-showcase-title b{font-size:14px}.category-showcase-desc{font-size:9px}.category-showcase-head h2{font-size:26px}.category-showcase-badge{right:10px;top:8px}}
    `;
    document.head.appendChild(style);
  };

  const enhanceCategories = () => {
    if (location.pathname !== '/') return;
    categoryStyle();
    let section = document.querySelector('#categories');
    if (!section) {
      const hero = document.querySelector('.hero');
      if (!hero) return;
      section = document.createElement('section');
      section.id = 'categories';
      section.className = 'home-guide-section';
      hero.insertAdjacentElement('afterend', section);
    }
    if (section.dataset.categoryShowcase === '1') return;
    section.dataset.categoryShowcase = '1';
    const cards = categoryCards.map((item) => `<a class="category-showcase-card" href="${item.href}" data-track="category_click" data-category="${item.category}">${item.badge ? `<span class="category-showcase-badge">${item.badge}</span>` : ''}<span class="category-showcase-icon">${item.icon}</span><span class="category-showcase-main"><span class="category-showcase-title"><b>${item.title}</b><span class="category-showcase-count">${item.count}</span></span><span class="category-showcase-desc">${item.desc}</span></span><span class="category-showcase-arrow">→</span></a>`).join('');
    section.innerHTML = `<div class="home-guide-box"><p class="eyebrow">CATEGORIES</p><div class="category-showcase-head"><div><h2>6カテゴリから比較する</h2></div><p>価格だけでなく、使い方や重視ポイントを変えながら自分に合う候補を探せます。</p></div><div class="category-showcase-grid">${cards}</div></div>`;
    const nav = document.querySelector('.site-header nav');
    if (nav && !nav.querySelector('[href="#categories"]')) {
      const link = document.createElement('a');
      link.href = '#categories';
      link.textContent = 'カテゴリ';
      nav.prepend(link);
    }
  };

  const bindTracking = () => {
    if (document.documentElement.dataset.trackingBound) return;
    document.documentElement.dataset.trackingBound = '1';
    document.addEventListener('click', (event) => {
      const el = event.target.closest('[data-track],a[target="_blank"],.compare-btn,.dock-btn,.detail-link');
      if (!el) return;
      if (el.dataset.track) track(el.dataset.track, {
        product: el.dataset.product || '',
        category: el.dataset.category || '',
        path: location.pathname,
        affiliate: el.dataset.affiliate || '',
        link_url: el.href || '',
        link_text: el.textContent?.trim() || '',
      });
      else if (el.matches('a[target="_blank"]')) track('official_or_external_click', { label: el.textContent.trim(), path: location.pathname, link_url: el.href || '' });
      else if (el.matches('.compare-btn,.dock-btn')) track('compare_action', { label: el.textContent.trim(), path: location.pathname });
      else if (el.matches('.detail-link')) track('detail_click', { label: el.textContent.trim(), path: location.pathname });
    });
    document.addEventListener('change', (event) => {
      const el = event.target;
      if (el.matches('.catalog-tools select')) track('catalog_filter', { control: el.name || el.id, value: el.value, path: location.pathname });
    });
  };

  const run = () => {
    loadAnalytics();
    loadUi();
    loadProductMedia();
    enhanceRankingCards();
    enhanceProductPage();
    enhanceComparePage();
    enhanceFooter();
    syncEarphoneCount();
    enhanceCategories();
    syncRakutenAffiliateLinks();
    observeAffiliateMedia();
    bindTracking();
  };

  loadAnalytics();
  loadUi();
  loadProductMedia();
  let scheduled = false;
  const scheduleRun = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; run(); });
  };
  window.addEventListener('DOMContentLoaded', scheduleRun, { once:true });
  const root = document.getElementById('root');
  if (root) new MutationObserver(scheduleRun).observe(root, { childList:true, subtree:true });
})();
