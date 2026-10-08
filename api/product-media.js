let amazonToken = null;
let amazonTokenExpiresAt = 0;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (status === 429) res.setHeader('Retry-After', '2');
  res.end(JSON.stringify(body));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanQuery = (value) => String(value || '').trim().slice(0, 120);
const SITE_ORIGIN = 'https://minna-hikaku.vercel.app';
const KNOWN_BRANDS = new Set(["apple","samsung","google","huawei","xiaomi","redmi","garmin","lenovo","anker","cio","ugreen","belkin","sony","jbl","bose","technics","nothing","earfun","beats","soundcore","pixel","galaxy","microsoft","dell","hp","asus","acer","msi","lg","panasonic","dynabook","fujitsu","vaio","benq","eizo","iodata","japannext","philips","gigabyte","tp-link","tplink","buffalo","nec","aterm","netgear","eero","elecom","oral-b","oralb","braun","refa","salonia","dyson","shark","hitachi","toshiba","irobot","roomba","switchbot","roborock","ecovacs","eufy","daikin","tiger","zojirushi"]);
const ACCESSORY_TERMS = [
  '保護フィルム','液晶保護','保護シート','保護ガラス','強化ガラス','ガラスフィルム','カメラフィルム','レンズ保護',
  'ケース用','充電ケース用','収納ケース','保護ケース','ケースカバー','シリコンケース','クリアケース','レザーケース',
  'ハードケース','ソフトケース','イヤホンケース','キャリングケース','専用ケース','スキンシール','ステッカー',
  'イヤーピース','イヤーチップ','交換用イヤー','ストラップ','ホルダー','バンパー','保護カバー',
  '保護プロテクター','専用ポーチ','交換パーツ','ダストプラグ','防塵シール','デコレーション',
  'screen protector','protective film','tempered glass','case cover','silicone case','protective case',
  'replacement tips','ear tips','skin sticker','carrying case','dust plug','替えブラシ','交換ブラシ','ブラシヘッド','ドライヤーホルダー','掃除機スタンド','交換フィルター','交換バッテリー','ロボット掃除機用モップ','モップパッド','紙パック','ダストバッグ','空気清浄機フィルター','加湿フィルター','炊飯器内釜','内ぶた','しゃもじ'
];
const SEARCH_OVERRIDES = {
  jbllivebeam3: {
    productCode: '4968929221707',
    keyword: 'JBLLIVEBEAM3',
    fallbackKeyword: 'JBL Live Beam3',
    requiredTerms: ['完全ワイヤレス', 'ワイヤレスイヤホン', 'イヤホン'],
  },
  soundcoreliberty5: {
    productCode: '4571411228452',
    keyword: 'A3957N11',
    fallbackKeyword: 'Soundcore Liberty 5',
    requiredTerms: ['完全ワイヤレス', 'ワイヤレスイヤホン', 'イヤホン'],
  },
};

const normalizeComparable = (value) => String(value || '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

const cleanTokens = (value) => cleanQuery(value)
  .normalize('NFKC')
  .replace(/[()（）［］\[\]{}]/g, ' ')
  .replace(/[,，/]/g, ' ')
  .split(/\s+/)
  .map((token) => token.trim())
  .filter(Boolean);

const buildSearchTokens = (value) => {
  const tokens = cleanTokens(value);
  return tokens.filter((token) => !/^\d$/.test(token));
};

const buildProductKeyword = (value) => {
  const tokens = buildSearchTokens(value);
  return tokens.join(' ').slice(0, 128);
};

const buildModelKeyword = (value) => {
  let tokens = buildSearchTokens(value);
  if (tokens.length > 1 && KNOWN_BRANDS.has(tokens[0].toLowerCase())) tokens = tokens.slice(1);
  const keyword = tokens.join(' ').trim();
  return (keyword || buildProductKeyword(value)).slice(0, 128);
};

const expectedBrand = (query) => {
  const first = cleanTokens(query)[0]?.toLowerCase() || '';
  return KNOWN_BRANDS.has(first) ? first : '';
};

const getSearchOverride = (query) => SEARCH_OVERRIDES[normalizeComparable(query)] || null;

const isAccessory = (text) => {
  const compact = normalizeComparable(text);
  return ACCESSORY_TERMS.some((term) => compact.includes(normalizeComparable(term)));
};

const matchesRequiredTerms = (text, terms = []) => {
  if (!terms.length) return true;
  const compact = normalizeComparable(text);
  return terms.some((term) => compact.includes(normalizeComparable(term)));
};

const brandIsCompatible = (item, query) => {
  const brand = expectedBrand(query);
  if (!brand) return true;
  const itemBrand = normalizeComparable(item?.brandName || '');
  if (!itemBrand) return true;
  return itemBrand.includes(normalizeComparable(brand));
};

const rakutenHeaders = {
  Accept: 'application/json',
  Origin: SITE_ORIGIN,
  Referer: `${SITE_ORIGIN}/`,
  'User-Agent': 'minna-hikaku/1.0',
};

async function fetchRakuten(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { headers: rakutenHeaders });
    if (response.status !== 429) return response;
    if (attempt < 2) {
      const retryAfter = Number(response.headers.get('retry-after') || 1);
      await sleep(Math.max(1300, retryAfter * 1000 + 250));
      continue;
    }
    const error = new Error('rakuten_rate_limited');
    error.statusCode = 429;
    throw error;
  }
}

async function getAmazonToken() {
  if (amazonToken && Date.now() < amazonTokenExpiresAt - 60_000) return amazonToken;
  const clientId = process.env.AMAZON_CREATORS_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CREATORS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('amazon_not_configured');

  const response = await fetch('https://api.amazon.co.jp/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'creatorsapi::default',
    }),
  });
  if (!response.ok) throw new Error(`amazon_token_${response.status}`);
  const data = await response.json();
  amazonToken = data.access_token;
  amazonTokenExpiresAt = Date.now() + (Number(data.expires_in || 3600) * 1000);
  return amazonToken;
}

async function searchAmazon(query) {
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  if (!process.env.AMAZON_CREATORS_CLIENT_ID || !process.env.AMAZON_CREATORS_CLIENT_SECRET || !partnerTag) {
    throw new Error('amazon_not_configured');
  }
  const token = await getAmazonToken();
  const response = await fetch('https://creatorsapi.amazon/catalog/v1/searchItems', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-marketplace': 'www.amazon.co.jp',
    },
    body: JSON.stringify({
      marketplace: 'www.amazon.co.jp',
      partnerTag,
      keywords: query,
      itemCount: 1,
      searchIndex: 'All',
      resources: ['images.primary.medium', 'itemInfo.title'],
    }),
  });
  if (!response.ok) throw new Error(`amazon_search_${response.status}`);
  const data = await response.json();
  const item = data?.searchResult?.items?.[0];
  const image = item?.images?.primary?.medium;
  if (!item || !image?.url) throw new Error('amazon_no_result');
  return {
    provider: 'amazon',
    title: item?.itemInfo?.title?.displayValue || query,
    imageUrl: image.url,
    width: image.width || null,
    height: image.height || null,
    productUrl: item.detailPageURL || data?.searchResult?.searchURL || null,
    asin: item.asin || null,
  };
}

const scoreText = (text, query) => {
  const haystack = normalizeComparable(text);
  const full = normalizeComparable(query);
  const tokens = cleanTokens(query).map(normalizeComparable).filter(Boolean);
  let score = 0;
  if (full && haystack.includes(full)) score += 160;
  tokens.forEach((token, index) => {
    if (token.length < 2 && /^\d$/.test(token)) return;
    if (haystack.includes(token)) score += index === 0 ? 24 : 30;
  });
  return score;
};

const scoreProduct = (item, query) => {
  const title = `${item.productName || ''} ${item.productNo || ''} ${item.brandName || ''}`;
  let score = scoreText(title, query);
  const brand = expectedBrand(query);
  if (brand) {
    const itemBrand = normalizeComparable(item.brandName || '');
    const itemTitle = normalizeComparable(item.productName || '');
    const targetBrand = normalizeComparable(brand);
    if (itemBrand && itemBrand.includes(targetBrand)) score += 180;
    else if (itemTitle.startsWith(targetBrand)) score += 80;
  }
  return score;
};

const scoreItem = (item, query) => {
  const title = item.itemName || '';
  let score = scoreText(title, query);
  const brand = expectedBrand(query);
  if (brand && normalizeComparable(title).includes(normalizeComparable(brand))) score += 50;
  return score;
};

async function searchRakutenProduct(query, applicationId, accessKey, affiliateId, options = {}) {
  const keyword = options.keyword || buildProductKeyword(query);
  const productCode = options.productCode || '';
  if (!keyword && !productCode) return null;

  const url = new URL('https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801');
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
  if (productCode) {
    url.searchParams.set('productCode', productCode);
  } else {
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('hits', '30');
  }
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('elements', 'productName,productNo,brandName,productUrlPC,affiliateUrl,mediumImageUrl,smallImageUrl,salesMinPrice,productCode');
  if (affiliateId) url.searchParams.set('affiliateId', affiliateId);

  const response = await fetchRakuten(url);
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.text()).replace(/[\r\n\t]+/g, ' ').slice(0, 220); } catch (_) {}
    if (response.status === 404) return null;
    throw new Error(`rakuten_product_${response.status}${detail ? `:${detail}` : ''}`);
  }

  const data = await response.json();
  const rawEntries = Array.isArray(data?.Products)
    ? data.Products
    : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.items)
        ? data.items
        : [];
  const items = rawEntries
    .map((entry) => entry?.Product || entry?.product || entry)
    .filter(Boolean);

  const ranked = items
    .filter((item) => {
      if (!item?.mediumImageUrl && !item?.smallImageUrl) return false;
      const text = `${item.productName || ''} ${item.productNo || ''} ${item.brandName || ''}`;
      if (isAccessory(text)) return false;
      if (!brandIsCompatible(item, query)) return false;
      return true;
    })
    .map((item) => ({ item, score: productCode ? 999 : scoreProduct(item, query) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 80) return null;
  const item = best.item;
  return {
    provider: 'rakuten',
    sourceType: productCode ? 'product-code' : 'product',
    title: item.productName || query,
    imageUrl: item.mediumImageUrl || item.smallImageUrl,
    width: item.mediumImageUrl ? 128 : 64,
    height: item.mediumImageUrl ? 128 : 64,
    productUrl: item.affiliateUrl || item.productUrlPC || null,
    price: item.salesMinPrice ?? item.minPrice ?? null,
    searchedKeyword: productCode || keyword,
    matchScore: best.score,
    productCode: item.productCode || productCode || null,
  };
}

const rakutenItemImage = (item) => {
  const raw = item?.mediumImageUrls?.[0] || item?.smallImageUrls?.[0];
  if (!raw) return null;
  return typeof raw === 'string' ? raw : raw.imageUrl || raw.url || null;
};

async function searchRakutenItem(query, applicationId, accessKey, affiliateId, options = {}) {
  const keyword = options.keyword || buildModelKeyword(query);
  if (!keyword) return null;

  const url = new URL('https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701');
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('hits', '30');
  url.searchParams.set('availability', '0');
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('field', '0');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('elements', 'itemName,itemPrice,itemUrl,affiliateUrl,mediumImageUrls,smallImageUrls');
  if (affiliateId) url.searchParams.set('affiliateId', affiliateId);

  const response = await fetchRakuten(url);
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.text()).replace(/[\r\n\t]+/g, ' ').slice(0, 220); } catch (_) {}
    if (response.status === 404) return null;
    throw new Error(`rakuten_item_${response.status}${detail ? `:${detail}` : ''}`);
  }

  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const ranked = items
    .map((entry) => entry?.item || entry)
    .filter((item) => {
      if (!item || !rakutenItemImage(item)) return false;
      const title = item.itemName || '';
      if (isAccessory(title)) return false;
      if (!matchesRequiredTerms(title, options.requiredTerms || [])) return false;
      return true;
    })
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 60) return null;
  const item = best.item;
  return {
    provider: 'rakuten',
    sourceType: 'item',
    title: item.itemName || query,
    imageUrl: rakutenItemImage(item),
    width: 128,
    height: 128,
    productUrl: item.affiliateUrl || item.itemUrl || null,
    price: item.itemPrice ?? null,
    searchedKeyword: keyword,
    matchScore: best.score,
  };
}

async function searchRakuten(query) {
  const applicationId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!applicationId || !accessKey) throw new Error('rakuten_not_configured');

  const override = getSearchOverride(query);
  if (override) {
    if (override.productCode) {
      const exactProduct = await searchRakutenProduct(query, applicationId, accessKey, affiliateId, {
        productCode: override.productCode,
      });
      if (exactProduct) return exactProduct;
    }

    await sleep(1300);
    const exact = await searchRakutenItem(query, applicationId, accessKey, affiliateId, {
      keyword: override.keyword,
      requiredTerms: override.requiredTerms,
    });
    if (exact) return exact;

    if (override.fallbackKeyword) {
      await sleep(1300);
      const fallback = await searchRakutenItem(query, applicationId, accessKey, affiliateId, {
        keyword: override.fallbackKeyword,
        requiredTerms: override.requiredTerms,
      });
      if (fallback) return fallback;
    }

    throw new Error('rakuten_no_safe_result');
  }

  const product = await searchRakutenProduct(query, applicationId, accessKey, affiliateId);
  if (product) return product;

  await sleep(1300);
  const item = await searchRakutenItem(query, applicationId, accessKey, affiliateId);
  if (item) return item;

  throw new Error('rakuten_no_result');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method_not_allowed' });
  const query = cleanQuery(req.query?.q);
  const provider = cleanQuery(req.query?.provider || 'auto').toLowerCase();
  if (!query) return json(res, 400, { ok: false, error: 'missing_query' });

  const configured = {
    amazon: Boolean(process.env.AMAZON_CREATORS_CLIENT_ID && process.env.AMAZON_CREATORS_CLIENT_SECRET && process.env.AMAZON_PARTNER_TAG),
    rakuten: Boolean(process.env.RAKUTEN_APP_ID && process.env.RAKUTEN_ACCESS_KEY),
  };

  try {
    let result;
    if (provider === 'amazon') result = await searchAmazon(query);
    else if (provider === 'rakuten') result = await searchRakuten(query);
    else {
      if (configured.amazon) {
        try { result = await searchAmazon(query); } catch (_) {}
      }
      if (!result && configured.rakuten) result = await searchRakuten(query);
      if (!result) throw new Error('not_configured');
    }
    return json(res, 200, { ok: true, configured, result });
  } catch (error) {
    const code = error?.message || 'lookup_failed';
    if (error?.statusCode === 429 || code.startsWith('rakuten_rate_limited')) {
      return json(res, 429, { ok: false, configured, error: code });
    }
    const status = code === 'not_configured' || code.endsWith('_not_configured') ? 503 : 502;
    return json(res, status, { ok: false, configured, error: code });
  }
}
