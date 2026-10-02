let amazonToken = null;
let amazonTokenExpiresAt = 0;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'no-store');
  if (status === 429) res.setHeader('Retry-After', '2');
  res.end(JSON.stringify(body));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanQuery = (value) => String(value || '').trim().slice(0, 120);
const SITE_ORIGIN = 'https://minna-hikaku.vercel.app';
const KNOWN_BRANDS = new Set([
  'apple','sony','samsung','google','jbl','bose','technics','anker','huawei','beats','nothing','earfun',
  'xiaomi','poco','motorola','sharp','cio','belkin','elecom','buffalo'
]);

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

async function searchRakutenProduct(query, applicationId, accessKey, affiliateId) {
  const keyword = buildProductKeyword(query);
  if (!keyword) return null;

  const url = new URL('https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801');
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('hits', '30');
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
    .filter((item) => item?.mediumImageUrl || item?.smallImageUrl)
    .map((item) => ({
      item,
      score: scoreText(`${item.productName || ''} ${item.productNo || ''} ${item.brandName || ''}`, query),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 30) return null;
  const item = best.item;
  return {
    provider: 'rakuten',
    sourceType: 'product',
    title: item.productName || query,
    imageUrl: item.mediumImageUrl || item.smallImageUrl,
    width: item.mediumImageUrl ? 128 : 64,
    height: item.mediumImageUrl ? 128 : 64,
    productUrl: item.affiliateUrl || item.productUrlPC || null,
    price: item.salesMinPrice ?? item.minPrice ?? null,
    searchedKeyword: keyword,
    matchScore: best.score,
    productCode: item.productCode || null,
  };
}

const rakutenItemImage = (item) => {
  const raw = item?.mediumImageUrls?.[0] || item?.smallImageUrls?.[0];
  if (!raw) return null;
  return typeof raw === 'string' ? raw : raw.imageUrl || raw.url || null;
};

async function searchRakutenItem(query, applicationId, accessKey, affiliateId) {
  const keyword = buildModelKeyword(query);
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
    .filter((item) => item && rakutenItemImage(item))
    .map((item) => ({ item, score: scoreText(item.itemName || '', query) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 30) return null;
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
