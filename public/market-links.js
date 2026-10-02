(() => {
  const amazonUrl = (name) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}`;
  const rakutenUrl = (name) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}/`;

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

  const run = () => {
    enhanceRankingCards();
    enhanceProductPage();
    enhanceComparePage();
    enhanceFooter();
  };

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
