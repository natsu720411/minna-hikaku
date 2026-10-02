(() => {
  if (window.__minnaProductMediaLoaded) return;
  window.__minnaProductMediaLoaded = true;

  const cache = new Map();
  const pending = new Map();
  let queueTail = Promise.resolve();
  let lastApiRequestAt = 0;
  const MIN_API_INTERVAL_MS = 1200;
  const MEDIA_API_VERSION = '20261003-3';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const enqueueApiRequest = (task) => {
    const run = queueTail.then(async () => {
      const waitMs = Math.max(0, MIN_API_INTERVAL_MS - (Date.now() - lastApiRequestAt));
      if (waitMs) await sleep(waitMs);
      lastApiRequestAt = Date.now();
      return task();
    });
    queueTail = run.catch(() => null);
    return run;
  };

  const addStyles = () => {
    if (document.getElementById('affiliate-product-media-style')) return;
    const style = document.createElement('style');
    style.id = 'affiliate-product-media-style';
    style.textContent = `
      .api-product-thumb{display:flex;align-items:center;justify-content:center;width:86px;height:86px;border:1px solid #e1e8f1;border-radius:18px;background:#fff;overflow:hidden;text-decoration:none;box-shadow:0 6px 18px rgba(30,61,102,.05)}
      .api-product-thumb img{display:block;width:100%;height:100%;object-fit:contain;background:#fff}
      .api-product-thumb[data-provider="amazon"]::after,.api-product-thumb[data-provider="rakuten"]::after{content:attr(data-label);position:absolute;clip:rect(0 0 0 0);clip-path:inset(50%);width:1px;height:1px;overflow:hidden;white-space:nowrap}
      .big-product-icon.api-media-ready{padding:0!important;overflow:hidden;background:#fff!important}
      .big-product-icon.api-media-ready a{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
      .big-product-icon.api-media-ready img{width:100%;height:100%;object-fit:contain;background:#fff}
      .catalog-api-media{float:left;margin:0 12px 8px 0;width:82px;height:82px}
      .product-visual.api-media-ready{font-size:0!important;padding:0!important;overflow:hidden;background:#fff!important}
      .product-visual.api-media-ready a,.product-visual.api-media-ready img{display:block;width:100%;height:100%}
      .product-visual.api-media-ready img{object-fit:contain;background:#fff}
      .api-detail-media{margin:8px 0 20px;width:150px;height:150px}
      .api-affiliate-note{font-size:10px;color:#7f8da0;line-height:1.55;margin:8px 0 0}
      .api-credit{margin-top:8px;font-size:10px}
      .api-credit a{color:inherit}
      @media(max-width:680px){.api-product-thumb{width:70px;height:70px;border-radius:15px}.catalog-api-media{width:68px;height:68px;margin-right:9px}.api-detail-media{width:120px;height:120px}}
    `;
    document.head.appendChild(style);
  };

  const fetchLookup = async (key, attempt = 0) => {
    const url = `/api/product-media?q=${encodeURIComponent(key)}&v=${encodeURIComponent(MEDIA_API_VERSION)}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 429 && attempt < 2) {
      await sleep(1400 * (attempt + 1));
      return fetchLookup(key, attempt + 1);
    }
    if (!response.ok) return null;
    const data = await response.json();
    return data?.ok ? data.result : null;
  };

  const lookup = async (name) => {
    const key = name.trim();
    if (!key) return null;
    if (cache.has(key)) return cache.get(key);
    if (pending.has(key)) return pending.get(key);

    const request = enqueueApiRequest(() => fetchLookup(key))
      .then((result) => {
        cache.set(key, result);
        return result;
      })
      .catch(() => null)
      .finally(() => pending.delete(key));

    pending.set(key, request);
    return request;
  };

  const affiliateDisclosure = (provider) => {
    const footer = document.querySelector('footer');
    const target = footer?.firstElementChild || footer || document.body;

    if (provider === 'amazon' && !document.getElementById('amazon-associate-disclosure')) {
      const note = document.createElement('p');
      note.id = 'amazon-associate-disclosure';
      note.className = 'api-affiliate-note';
      note.textContent = 'Amazonのアソシエイトとして、みんなの比較表は適格販売により収入を得ています。';
      target.appendChild(note);
    }

    if (provider === 'rakuten' && !document.querySelector('a[href="https://developers.rakuten.com/"]')) {
      const wrap = document.createElement('div');
      wrap.className = 'api-credit';
      wrap.insertAdjacentHTML('beforeend', '<a href="https://developers.rakuten.com/" target="_blank" rel="noopener noreferrer">Supported by Rakuten Developers</a>');
      target.appendChild(wrap);
    }
  };

  const imageLink = (result, name, extraClass = '') => {
    const link = document.createElement('a');
    link.className = `api-product-thumb ${extraClass}`.trim();
    link.href = result.productUrl || '#';
    link.target = '_blank';
    link.rel = 'nofollow noopener noreferrer';
    link.dataset.provider = result.provider;
    link.dataset.label = `${result.provider === 'amazon' ? 'Amazon' : '楽天'}の商品画像`;
    link.dataset.track = result.provider === 'amazon' ? 'amazon_click' : 'rakuten_click';
    link.dataset.product = name;
    link.setAttribute('aria-label', `${name}を${result.provider === 'amazon' ? 'Amazon' : '楽天'}で見る`);
    const img = document.createElement('img');
    img.src = result.imageUrl;
    img.alt = `${name} 商品画像`;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (result.width) img.width = result.width;
    if (result.height) img.height = result.height;
    link.appendChild(img);
    affiliateDisclosure(result.provider);
    return link;
  };

  const applyRakutenAffiliateLink = (scope, result, name) => {
    if (!scope || result?.provider !== 'rakuten' || !result?.productUrl) return;
    const button = scope.querySelector?.('.market-btn.rakuten');
    if (!button) return;
    button.href = result.productUrl;
    button.dataset.track = 'rakuten_click';
    button.dataset.product = name || '';
    button.dataset.affiliate = 'rakuten';
    button.rel = 'nofollow noopener noreferrer sponsored';
  };

  const enhanceReactCard = async (card) => {
    if (card.dataset.apiMediaProcessed) return;
    card.dataset.apiMediaProcessed = '1';
    const name = card.querySelector('.rank-main h3')?.textContent?.trim();
    const visual = card.querySelector('.big-product-icon');
    if (!name || !visual) return;
    const result = await lookup(name);
    if (!result) return;
    applyRakutenAffiliateLink(card, result, name);
    if (!result.imageUrl) return;
    visual.textContent = '';
    visual.classList.add('api-media-ready');
    visual.appendChild(imageLink(result, name));
  };

  const enhanceCatalogCard = async (card) => {
    if (card.dataset.apiMediaProcessed) return;
    card.dataset.apiMediaProcessed = '1';
    const name = card.querySelector('h3')?.textContent?.trim();
    const content = card.children?.[1];
    if (!name || !content) return;
    const result = await lookup(name);
    if (!result) return;
    applyRakutenAffiliateLink(card, result, name);
    if (!result.imageUrl) return;
    const media = imageLink(result, name, 'catalog-api-media');
    const brand = content.querySelector('.brand');
    if (brand) brand.insertAdjacentElement('afterend', media);
    else content.prepend(media);
  };

  const enhanceDetailPage = async () => {
    if (!location.pathname.includes('/products/')) return;
    const main = document.querySelector('.guide-main');
    const heading = main?.querySelector('h1');
    if (!main || !heading || main.dataset.apiMediaProcessed) return;
    main.dataset.apiMediaProcessed = '1';
    const name = heading.textContent.replace(/を比較.*$/,'').replace(/詳細.*$/,'').trim();
    if (!name) return;
    const result = await lookup(name);
    if (!result) return;
    applyRakutenAffiliateLink(main, result, name);
    if (!result.imageUrl) return;
    const existing = main.querySelector('.product-visual');
    if (existing) {
      existing.textContent = '';
      existing.classList.add('api-media-ready');
      existing.appendChild(imageLink(result, name));
    } else {
      heading.insertAdjacentElement('afterend', imageLink(result, name, 'api-detail-media'));
    }
  };

  const observeCards = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.matches('.rank-card')) enhanceReactCard(entry.target);
        else enhanceCatalogCard(entry.target);
      });
    }, { rootMargin: '250px 0px' });

    const scan = () => {
      document.querySelectorAll('.rank-card:not([data-api-media-processed]), .guide-main .list>.card:not([data-api-media-processed])').forEach((card) => observer.observe(card));
    };
    scan();
    const targets = [document.getElementById('root'), document.getElementById('list')].filter(Boolean);
    targets.forEach((target) => new MutationObserver(scan).observe(target, { childList: true, subtree: true }));
  };

  const start = () => {
    addStyles();
    enhanceDetailPage();
    observeCards();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();