(() => {
  if (window.__minnaProductMediaLoaded) return;
  window.__minnaProductMediaLoaded = true;

  const cache = new Map();
  const pending = new Map();
  let queueTail = Promise.resolve();
  let lastApiRequestAt = 0;
  const MIN_API_INTERVAL_MS = 1200;
  const MEDIA_API_VERSION = '20261009-2';

  const ACCESSORY_TERMS = [
    '保護フィルム','液晶保護','保護シート','保護ガラス','強化ガラス','ガラスフィルム','カメラフィルム','レンズ保護',
    'ケース','カバー','収納ケース','保護ケース','シリコンケース','クリアケース','レザーケース','ハードケース','ソフトケース','キャリングケース','専用ケース',
    'バンド','ベルト','交換バンド','ウォッチバンド','ストラップ','ホルダー','スタンド','充電台','充電スタンド','ドック',
    'イヤーピース','イヤーチップ','交換用','スキンシール','ステッカー','バンパー','専用ポーチ','交換パーツ','ダストプラグ','防塵シール',
    'タッチペン','スタイラス','キーボードケース','キーボードカバー','ペン先','替え芯','保護プロテクター',
    'ケーブル','usbケーブル','usb-cケーブル','type-cケーブル','延長コード','電源コード','変換アダプタ','変換アダプター','変換プラグ',
    'screen protector','protective film','tempered glass','case cover','silicone case','protective case','carrying case','watch band','replacement band','strap',
    'keyboard case','stylus','pencil case','charging stand','charging dock','usb cable','type-c cable','power cable','adapter cable','replacement tips','ear tips',
    'モニターアーム','モニタースタンド','壁掛け金具','vesaマウント','ノートパソコンケース','ノートpcケース','パソコンバッグ','pcバッグ','スリーブケース','キーボードカバー','lanケーブル','イーサネットケーブル','ルータースタンド','ルーター収納','交換アンテナ','monitor arm','monitor stand','wall mount','vesa mount','laptop sleeve','laptop bag','router stand','ethernet cable','lan cable','replacement antenna','替えブラシ','交換ブラシ','ブラシヘッド','ドライヤーホルダー','掃除機スタンド','交換フィルター','交換バッテリー','ロボット掃除機用モップ','モップパッド','紙パック','ダストバッグ','空気清浄機フィルター','加湿フィルター','炊飯器内釜','内ぶた','しゃもじ','交換モップ','交換用モップ','サイドブラシ','メインブラシ','ローラーブラシ','ブラシローラー','フィルターセット','ダストボックス','集じん袋','集塵袋','ノズル','アタッチメント','脱臭フィルター','集じんフィルター','蒸気キャップ','パッキン','電源アダプター','ACアダプター','専用充電器','replacement filter','side brush','main brush','roller brush','mop cloth','dust bag','replacement mop','power adapter'
  ];
  const GENERIC_TOKENS = new Set([
    'wifi','wi-fi','gps','bluetooth','モデル','製品','充電器','charger','watch','ウォッチ','tablet','タブレット','ipad','galaxy','google','apple','samsung','huawei','xiaomi','garmin','lenovo','anker','cio','ugreen','belkin',
    'gb','mah','usb','type','ports','port','インチ','inch','laptop','notebook','ノートpc','ノートパソコン','monitor','display','モニター','ディスプレイ','router','ルーター'
  ]);
  const BRAND_TOKENS = ["apple","samsung","google","huawei","xiaomi","redmi","garmin","lenovo","anker","cio","ugreen","belkin","sony","jbl","bose","technics","nothing","earfun","beats","soundcore","pixel","galaxy","microsoft","dell","hp","asus","acer","msi","lg","panasonic","dynabook","fujitsu","vaio","benq","eizo","iodata","japannext","philips","gigabyte","tp-link","tplink","buffalo","nec","aterm","netgear","eero","elecom","oral-b","oralb","braun","refa","salonia","dyson","shark","hitachi","toshiba","irobot","roomba","switchbot","roborock","ecovacs","eufy","daikin","tiger","zojirushi"];
  const BRAND_ALIAS_GROUPS = [
    ['apple','アップル'],['samsung','サムスン','galaxy','ギャラクシー'],['google','グーグル','pixel','ピクセル'],
    ['sony','ソニー','xperia','エクスペリア'],['sharp','シャープ','aquos'],['motorola','モトローラ'],['xiaomi','シャオミ','redmi','poco'],
    ['panasonic','パナソニック'],['oral-b','oralb','オーラルb','braun','ブラウン'],['philips','フィリップス'],
    ['refa','リファ'],['salonia','サロニア'],['dyson','ダイソン'],['shark','シャーク'],['hitachi','日立'],['toshiba','東芝'],
    ['irobot','アイロボット','roomba','ルンバ'],['switchbot','スイッチボット'],['roborock','ロボロック'],
    ['ecovacs','エコバックス','deebot'],['eufy','ユーフィー'],['daikin','ダイキン'],['zojirushi','象印'],['tiger','タイガー']
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const tokenize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[()（）［］\[\]{}]/g, ' ').split(/[^\p{L}\p{N}+.-]+/u).map((x) => x.trim()).filter(Boolean);
  const isAccessoryTitle = (title) => {
    const compact = normalize(title);
    return ACCESSORY_TERMS.some((term) => compact.includes(normalize(term)));
  };
  const expectedBrandAliases = (query) => {
    const compact = normalize(query);
    const aliases = BRAND_ALIAS_GROUPS.find((group) => group.some((brand) => compact.includes(normalize(brand))));
    if (aliases) return aliases;
    const direct = BRAND_TOKENS.find((brand) => compact.includes(normalize(brand)));
    return direct ? [direct] : [];
  };
  const meaningfulTokens = (value) => tokenize(value).filter((token) => {
    const clean = token.replace(/^\d+(gb|mah|w|mm)$/i, '$1').toLowerCase();
    if (!token || GENERIC_TOKENS.has(token) || GENERIC_TOKENS.has(clean)) return false;
    if (/^\d+$/.test(token) && token.length < 2) return false;
    return token.length >= 2 || /\d/.test(token);
  });
  const isLikelyProductMatch = (result, query) => {
    const title = result?.title || '';
    if (!title || isAccessoryTitle(title)) return false;
    const q = normalize(query);
    const t = normalize(title);
    if (q && t.includes(q)) return true;

    const brandAliases = expectedBrandAliases(query);
    if (brandAliases.length && !brandAliases.some((brand) => t.includes(normalize(brand)))) return false;

    const tokens = meaningfulTokens(query);
    const modelTokens = tokens.filter((token) => /\d/.test(token) && normalize(token).length >= 2);
    if (modelTokens.length && !modelTokens.every((token) => t.includes(normalize(token)))) return false;
    if (!tokens.length) return true;
    const matched = tokens.filter((token) => t.includes(normalize(token)));
    const distinctive = tokens.filter((token) => /\d/.test(token) || token.length >= 4);
    const distinctiveMatched = distinctive.filter((token) => t.includes(normalize(token)));

    if (tokens.length <= 2) return matched.length >= 1 && (!distinctive.length || distinctiveMatched.length >= 1);
    const ratio = matched.length / tokens.length;
    return ratio >= 0.55 && (!distinctive.length || distinctiveMatched.length >= Math.min(2, distinctive.length));
  };

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
      .api-credit{margin-top:8px;font-size:10px}.api-credit a{color:inherit}
      .api-market-price{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;margin:8px 0 14px;font-size:11px;color:#6f7f92}
      .api-market-price strong{font-size:17px;color:#173b6a}.api-market-price small{font-size:10px;color:#8492a5}
      .api-market-price-inline{font-weight:800!important;color:#0f6cf9!important}
      @media(max-width:680px){.api-product-thumb{width:70px;height:70px;border-radius:15px}.catalog-api-media{width:68px;height:68px;margin-right:9px}.api-detail-media{width:120px;height:120px}}
    `;
    document.head.appendChild(style);
  };

  const fetchLookup = async (key, provider = 'auto', attempt = 0) => {
    const providerPart = provider === 'auto' ? '' : `&provider=${encodeURIComponent(provider)}`;
    const url = `/api/product-media?q=${encodeURIComponent(key)}&v=${encodeURIComponent(MEDIA_API_VERSION)}${providerPart}`;
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (response.status === 429 && attempt < 2) {
      await sleep(1400 * (attempt + 1));
      return fetchLookup(key, provider, attempt + 1);
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

    const request = enqueueApiRequest(async () => {
      const first = await fetchLookup(key, 'auto');
      if (first && isLikelyProductMatch(first, key)) return first;
      const rakuten = await fetchLookup(key, 'rakuten');
      if (rakuten && isLikelyProductMatch(rakuten, key)) return rakuten;
      return null;
    }).then((result) => {
      cache.set(key, result);
      return result;
    }).catch(() => null).finally(() => pending.delete(key));

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
    link.rel = result.provider === 'rakuten' ? 'nofollow noopener noreferrer sponsored' : 'nofollow noopener noreferrer';
    link.dataset.provider = result.provider;
    link.dataset.label = `${result.provider === 'amazon' ? 'Amazon' : '楽天'}の商品画像`;
    link.dataset.track = result.provider === 'amazon' ? 'amazon_click' : 'rakuten_click';
    link.dataset.product = name;
    if (result.provider === 'rakuten') link.dataset.affiliate = 'rakuten';
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

  const marketPrice = (result) => {
    const value = Number(result?.price);
    return result?.provider === 'rakuten' && Number.isFinite(value) && value > 0 ? value : null;
  };

  const marketPriceText = (result) => {
    const value = marketPrice(result);
    return value ? `¥${Math.round(value).toLocaleString('ja-JP')}` : '';
  };

  const addMarketPrice = (scope, result, mode = 'detail') => {
    const value = marketPrice(result);
    if (!scope || !value || scope.querySelector?.('[data-live-market-price="1"]')) return;
    if (mode === 'catalog') {
      const specs = scope.querySelector?.('.specs');
      if (!specs) return;
      const chip = document.createElement('span');
      chip.className = 'api-market-price-inline';
      chip.dataset.liveMarketPrice = '1';
      chip.textContent = `楽天参考 ${marketPriceText(result)}`;
      chip.title = '楽天市場API取得時の参考価格。販売店・セール等で変動します。';
      specs.appendChild(chip);
      return;
    }
    const row = document.createElement('div');
    row.className = 'api-market-price';
    row.dataset.liveMarketPrice = '1';
    row.innerHTML = `<span>楽天市場参考価格</span><strong>${marketPriceText(result)}</strong><small>取得時・販売店やセールで変動</small>`;
    const anchor = scope.querySelector?.('.product-visual, .api-detail-media, h1');
    if (anchor) anchor.insertAdjacentElement('afterend', row);
  };

  const replaceVisualSafely = (visual, result, name) => {
    if (!visual || !result?.imageUrl) return;
    const fallback = visual.innerHTML;
    const link = imageLink(result, name);
    const img = link.querySelector('img');
    img?.addEventListener('error', () => {
      visual.classList.remove('api-media-ready');
      visual.innerHTML = fallback;
    }, { once: true });
    visual.textContent = '';
    visual.classList.add('api-media-ready');
    visual.appendChild(link);
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
    addMarketPrice(card, result, 'catalog');
    if (!result.imageUrl) return;
    replaceVisualSafely(visual, result, name);
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
    addMarketPrice(card, result, 'catalog');
    if (!result.imageUrl) return;
    const media = imageLink(result, name, 'catalog-api-media');
    const img = media.querySelector('img');
    img?.addEventListener('error', () => media.remove(), { once: true });
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
    addMarketPrice(main, result, 'detail');
    if (!result.imageUrl) return;
    const existing = main.querySelector('.product-visual');
    if (existing) {
      replaceVisualSafely(existing, result, name);
    } else {
      const media = imageLink(result, name, 'api-detail-media');
      const img = media.querySelector('img');
      img?.addEventListener('error', () => media.remove(), { once: true });
      heading.insertAdjacentElement('afterend', media);
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
