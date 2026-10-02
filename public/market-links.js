(() => {
  const amazonUrl = (name) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}`;
  const rakutenUrl = (name) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}/`;

  const makeLink = (label, href, cls) => {
    const a = document.createElement('a');
    a.className = `market-btn ${cls}`;
    a.href = href;
    a.target = '_blank';
    a.rel = 'nofollow noopener noreferrer';
    a.textContent = label;
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
        makeLink('Amazonで探す', amazonUrl(name), 'amazon'),
        makeLink('楽天で探す', rakutenUrl(name), 'rakuten')
      );
      actions.appendChild(wrap);
    });
  };

  const injectProductSchema = (main, name) => {
    if (document.getElementById('dynamic-product-schema')) return;
    const items = [...main.querySelectorAll('.summary-box li')].map((el) => el.textContent.trim());
    const priceText = items.find((text) => text.includes('価格：') || text.includes('参考価格：')) || '';
    const brandText = items.find((text) => text.includes('メーカー：')) || '';
    const price = priceText.replace(/[^0-9]/g, '');
    const brand = brandText.split('：')[1]?.trim();
    const official = main.querySelector('.official')?.href;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
      url: location.href,
      ...(official ? { sameAs: official } : {}),
      ...(price ? {
        offers: {
          '@type': 'Offer',
          priceCurrency: 'JPY',
          price,
          url: official || location.href
        }
      } : {})
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'dynamic-product-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  };

  const enhanceProductPage = () => {
    if (!location.pathname.includes('/earphones/products/')) return;
    const main = document.querySelector('.guide-main');
    const heading = main?.querySelector('h1');
    if (!main || !heading) return;
    const name = heading.textContent.replace('を比較', '').trim();
    injectProductSchema(main, name);
    if (main.querySelector('.product-shop-box')) return;
    const summary = main.querySelector('.summary-box');
    const box = document.createElement('div');
    box.className = 'product-shop-box';
    box.innerHTML = `<strong>${name}の販売先を探す</strong><p>価格は販売店やセールで変動します。購入前に最新価格を確認してください。</p>`;
    const links = document.createElement('div');
    links.className = 'market-links market-links-wide';
    links.append(
      makeLink('Amazonで探す', amazonUrl(name), 'amazon'),
      makeLink('楽天で探す', rakutenUrl(name), 'rakuten')
    );
    box.appendChild(links);
    summary?.insertAdjacentElement('afterend', box);
  };

  const addAndroidGuide = () => {
    const grid = document.querySelector('.home-guide-grid');
    if (!grid || grid.querySelector('[href="/earphones/android/"]')) return;
    const link = document.createElement('a');
    link.href = '/earphones/android/';
    link.textContent = '🤖 Android・Pixel向け';
    const allLink = grid.querySelector('[href="/earphones/"]');
    grid.insertBefore(link, allLink || null);
  };

  const run = () => {
    enhanceRankingCards();
    enhanceProductPage();
    addAndroidGuide();
  };

  window.addEventListener('DOMContentLoaded', run);
  const root = document.getElementById('root');
  if (root) new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
