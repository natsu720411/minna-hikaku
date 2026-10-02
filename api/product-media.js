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

const cleanRakutenTokens = (value) => cleanQuery(value)
  .replace(/[()（）［］\[\]{}]/g, ' ')
  .replace(/[,，]/g, ' ')
  .split(/\s+/)
  .filter(Boolean);

const mergeSingleAsciiTokens = (tokens) => {
  const merged = [];
  tokens.forEach((token) => {
    const isSingleAscii = /^[\x00-\x7F]$/.test(token);
    if (isSingleAscii && merged.length) merged[merged.length - 1] += token;
    else merged.push(token);
  });
  return merged;
};

const validRakutenToken = (token) => {
  const asciiOnly = /^[\x00-\x7F]+$/.test(token);
  return !asciiOnly || token.length >= 2;
};

const buildRakutenKeywords = (value) => {
  const rawTokens = cleanRakutenTokens(value);
  const mergedTokens = mergeSingleAsciiTokens(rawTokens).filter(validRakutenToken);
  const compact = rawTokens.join('').replace(/[^\p{L}\p{N}\-+]/gu, '');
  const primary = mergedTokens.join(' ').trim();
  const withoutBrand = mergedTokens.length > 2 ? mergedTokens.slice(1).join(' ').trim() : '';
  const modelCompact = rawTokens.length > 1
    ? rawTokens.slice(1).join('').replace(/[^\p{L}\p{N}\-+]/gu, '')
    : '';

  return [...new Set([primary, compact, modelCompact, withoutBrand])]
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 2)
    .slice(0, 4);
};

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

const rakutenImage = (item) => {
  const raw = item?.mediumImageUrls?.[0] || item?.smallImageUrls?.[0];
  if (!raw) return null;
  return typeof raw === 'string' ? raw : raw.imageUrl || raw.url || null;
};

async function requestRakuten(keyword, applicationId, accessKey, affiliateId) {
  const url = new URL('https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701');
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('hits', '1');
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('elements', 'itemName,itemPrice,itemUrl,affiliateUrl,mediumImageUrls,smallImageUrls');
  if (affiliateId) url.searchParams.set('affiliateId', affiliateId);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Origin: SITE_ORIGIN,
        Referer: `${SITE_ORIGIN}/`,
        'User-Agent': 'minna-hikaku/1.0',
      },
    });

    if (response.status === 429) {
      if (attempt < 2) {
        const retryAfter = Number(response.headers.get('retry-after') || 1);
        await sleep(Math.max(1200, retryAfter * 1000 + 200));
        continue;
      }
      let detail = '';
      try { detail = (await response.text()).replace(/[\r\n\t]+/g, ' ').slice(0, 220); } catch (_) {}
      const error = new Error(`rakuten_rate_limited${detail ? `:${detail}` : ''}`);
      error.statusCode = 429;
      throw error;
    }

    if (!response.ok) {
      let detail = '';
      try { detail = (await response.text()).replace(/[\r\n\t]+/g, ' ').slice(0, 220); } catch (_) {}
      throw new Error(`rakuten_search_${response.status}${detail ? `:${detail}` : ''}`);
    }

    const data = await response.json();
    const item = data?.items?.[0]?.item || data?.items?.[0];
    const imageUrl = rakutenImage(item);
    if (!item || !imageUrl) return null;

    return {
      provider: 'rakuten',
      title: item.itemName || keyword,
      imageUrl,
      width: 128,
      height: 128,
      productUrl: item.affiliateUrl || item.itemUrl || null,
      price: item.itemPrice ?? null,
      searchedKeyword: keyword,
    };
  }

  return null;
}

async function searchRakuten(query) {
  const applicationId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!applicationId || !accessKey) throw new Error('rakuten_not_configured');

  const keywords = buildRakutenKeywords(query);
  if (!keywords.length) throw new Error('rakuten_invalid_keyword');

  for (let index = 0; index < keywords.length; index += 1) {
    if (index > 0) await sleep(1200);
    const result = await requestRakuten(keywords[index], applicationId, accessKey, affiliateId);
    if (result) return result;
  }

  throw new Error(`rakuten_no_result:${keywords.join('|')}`);
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
