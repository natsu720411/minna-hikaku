(() => {
  const amazonUrl = (name) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}`;
  const rakutenUrl = (name) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}/`;

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

  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', event, params);
      else window.dataLayer.push({ event, ...params });
    } catch (_) {}
  };
  window.minnaTrack = track;

  const makeLink = (label, href, cls, name) => {
    const a = document.createElement('a');
    a.className = `market-btn ${cls}`;
    a.href = href;
    a.target = '_blank';
    a.rel = 'nofollow noopener noreferrer';
    a.textContent = label;
    a.dataset.track = cls === 'amazon' ? 'amazon_click' : 'rakuten_click';
    a.dataset.product = name || '';
    if (name) a.setAttribute('aria-label', `${name}を${label}`);
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
      node.nodeValue = node.nodeValue.replaceAll('11機種','30機種').replaceAll('20機種','30機種');
    });
  };

  const enhanceCategories = () => {
    if (location.pathname !== '/' || document.querySelector('#categories')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (!document.getElementById('category-expansion-style')) {
      const style = document.createElement('style');
      style.id = 'category-expansion-style';
      style.textContent = '.category-section{max-width:1120px;margin:0 auto;padding:32px 24px 18px}.category-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:18px}.category-heading h2{margin:3px 0 0;font-size:30px}.category-heading p{margin:0;color:#7c8a9e;font-size:13px}.category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.category-card{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:12px;padding:19px;border:1px solid #dfe7f1;border-radius:20px;background:#fff;text-decoration:none;color:#263850}.category-icon{width:54px;height:54px;display:grid;place-items:center;border-radius:16px;background:#eef5ff;font-size:25px}.category-card b{display:block;font-size:15px}.category-card small{display:block;margin-top:5px;color:#8190a4;line-height:1.5;font-size:10px}.category-arrow{color:#0f6cf9;font-size:20px;font-weight:900}@media(max-width:900px){.category-grid{grid-template-columns:1fr 1fr}.category-grid .category-card:last-child{grid-column:1/-1}}@media(max-width:680px){.category-section{padding:24px 16px 12px}.category-heading{display:block}.category-grid{grid-template-columns:1fr}.category-grid .category-card:last-child{grid-column:auto}}';
      document.head.appendChild(style);
    }
    const section = document.createElement('section');
    section.id = 'categories';
    section.className = 'category-section';
    section.innerHTML = '<div class="category-heading"><div><p class="eyebrow">CATEGORIES</p><h2>比較するカテゴリを選ぶ</h2></div><p>同じ「みんなの比較表」で、ほかの商品も条件別に比較できます。</p></div><div class="category-grid"><a class="category-card" href="#quiz" data-track="category_click" data-category="earphones"><span class="category-icon">🎧</span><span><b>ワイヤレスイヤホン</b><small>30機種を価格・音質・ANC・バッテリーなどで比較</small></span><span class="category-arrow">→</span></a><a class="category-card" href="/mobile-batteries/" data-track="category_click" data-category="mobile_batteries"><span class="category-icon">🔋</span><span><b>モバイルバッテリー</b><small>30製品を容量・出力・軽さ・ケーブルなどで比較</small></span><span class="category-arrow">→</span></a><a class="category-card" href="/smartphones/" data-track="category_click" data-category="smartphones"><span class="category-icon">📱</span><span><b>スマートフォン</b><small>30機種を価格・カメラ・性能・バッテリー・AIで比較</small></span><span class="category-arrow">→</span></a></div>';
    hero.insertAdjacentElement('afterend', section);
    const nav = document.querySelector('.site-header nav');
    if (nav && !nav.querySelector('[href="#categories"]')) {
      const link = document.createElement('a'); link.href = '#categories'; link.textContent = 'カテゴリ'; nav.prepend(link);
    }
  };

  const bindTracking = () => {
    if (document.documentElement.dataset.trackingBound) return;
    document.documentElement.dataset.trackingBound = '1';
    document.addEventListener('click', (event) => {
      const el = event.target.closest('[data-track],a[target="_blank"],.compare-btn,.dock-btn,.detail-link');
      if (!el) return;
      if (el.dataset.track) track(el.dataset.track, { product: el.dataset.product || '', category: el.dataset.category || '', path: location.pathname });
      else if (el.matches('a[target="_blank"]')) track('official_or_external_click', { label: el.textContent.trim(), path: location.pathname });
      else if (el.matches('.compare-btn,.dock-btn')) track('compare_action', { label: el.textContent.trim(), path: location.pathname });
      else if (el.matches('.detail-link')) track('detail_click', { label: el.textContent.trim(), path: location.pathname });
    });
    document.addEventListener('change', (event) => {
      const el = event.target;
      if (el.matches('.catalog-tools select')) track('catalog_filter', { control: el.name || el.id, value: el.value, path: location.pathname });
    });
  };

  const run = () => {
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