(() => {
  const categoryAdditions = [
    ['/smartwatches/','⌚ スマートウォッチ20モデル','smartwatches'],
    ['/tablets/','📚 タブレット20モデル','tablets'],
    ['/chargers/','🔌 USB充電器20製品','chargers'],
  ];

  const guideSections = [
    {
      key:'smartwatches', eyebrow:'SMARTWATCH GUIDES', title:'目的別スマートウォッチガイド',
      description:'使うスマホ、バッテリー、スポーツなど目的から候補を絞れます。',
      links:[
        ['/smartwatches/iphone/','🍎 iPhone向け'],
        ['/smartwatches/android/','🤖 Android向け'],
        ['/smartwatches/battery/','🔋 バッテリー重視'],
        ['/smartwatches/sports/','🏃 スポーツ向け'],
        ['/smartwatches/','📚 20モデルを比較'],
      ],
    },
    {
      key:'tablets', eyebrow:'TABLET GUIDES', title:'目的別タブレットガイド',
      description:'勉強、お絵描き、持ち運び、ゲームなど使い方から比較できます。',
      links:[
        ['/tablets/student/','🎓 大学生・勉強向け'],
        ['/tablets/drawing/','✏️ ペン・お絵描き向け'],
        ['/tablets/lightweight/','🪶 軽量モデル'],
        ['/tablets/gaming/','🎮 ゲーム向け'],
        ['/tablets/','📚 20モデルを比較'],
      ],
    },
    {
      key:'chargers', eyebrow:'CHARGER GUIDES', title:'目的別USB充電器ガイド',
      description:'iPhone、ノートPC、持ち運び、複数台充電など用途から選べます。',
      links:[
        ['/chargers/iphone/','🍎 iPhone向け'],
        ['/chargers/laptop/','💻 ノートPC向け'],
        ['/chargers/compact/','🧳 小型・軽量'],
        ['/chargers/multiport/','🔌 複数ポート'],
        ['/chargers/','📚 20製品を比較'],
      ],
    },
  ];

  const directComparisons = [
    ['/smartwatches/compare/apple-watch-series-11-42-vs-pixel-watch-4-41/','⌚ Apple Watch Series 11 vs Pixel Watch 4','スマートウォッチ'],
    ['/smartwatches/compare/garmin-venu-4-41-vs-huawei-watch-fit-4-pro/','⌚ Garmin Venu 4 vs HUAWEI WATCH FIT 4 Pro','スマートウォッチ'],
    ['/tablets/compare/ipad-pro-m5-11-vs-galaxy-tab-s11/','📚 iPad Pro 11 vs Galaxy Tab S11','タブレット'],
    ['/tablets/compare/xiaomi-pad-7-vs-huawei-matepad-115/','📚 Xiaomi Pad 7 vs HUAWEI MatePad 11.5','タブレット'],
    ['/chargers/compare/anker-nano-70-3port-vs-cio-trio-67/','🔌 Anker Nano 70W vs CIO 67W','USB充電器'],
    ['/chargers/compare/ugreen-nexode-pro-65-vs-belkin-boostcharge-pro-65-dual/','🔌 UGREEN 65W vs Belkin 65W','USB充電器'],
  ];

  const addStyles = () => {
    if (document.getElementById('home-discovery-style')) return;
    const style = document.createElement('style');
    style.id = 'home-discovery-style';
    style.textContent = `
      .site-header .logo::after{content:'6カテゴリ比較'!important}
      .home-hero-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:2px}
      .home-hero-actions .primary-btn{margin:0}
      .home-category-link{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border:1px solid #d8e3f0;border-radius:14px;background:#fff;color:#31506f;text-decoration:none;font-size:13px;font-weight:900;transition:.18s ease}
      .home-category-link:hover{border-color:#a8c9fb;color:#0f6cf9;transform:translateY(-1px);box-shadow:0 7px 18px rgba(27,67,117,.07)}
      .home-new-guides{scroll-margin-top:90px}
      .home-direct-compare{max-width:1180px;margin:0 auto;padding:22px 24px 18px}
      .home-direct-compare-box{padding:28px;border:1px solid #e1e8f1;border-radius:22px;background:linear-gradient(145deg,#fff 0%,#f9fbfe 100%);box-shadow:0 8px 26px rgba(31,63,105,.05)}
      .home-direct-compare-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:16px}
      .home-direct-compare-head h2{margin:0;font-size:27px;letter-spacing:-.03em}
      .home-direct-compare-head p{margin:0;color:#7b899d;font-size:12px;line-height:1.7;max-width:430px}
      .home-direct-compare-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .home-direct-compare-card{display:block;padding:15px;border:1px solid #e0e7f0;border-radius:15px;background:#fff;color:#2c425f;text-decoration:none;transition:.18s ease}
      .home-direct-compare-card:hover{border-color:#aacafb;transform:translateY(-2px);box-shadow:0 9px 22px rgba(29,67,117,.07)}
      .home-direct-compare-card b{display:block;font-size:12px;line-height:1.5}
      .home-direct-compare-card small{display:block;margin-top:6px;color:#8290a4;font-size:9px;font-weight:800}
      @media(max-width:900px){.home-direct-compare-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-direct-compare-head{align-items:flex-start;flex-direction:column;gap:6px}}
      @media(max-width:620px){.home-category-link{width:100%;min-height:44px}.home-hero-actions{display:grid;grid-template-columns:1fr;width:100%}.home-hero-actions .primary-btn{width:100%}.home-direct-compare{padding:14px 14px 8px}.home-direct-compare-box{padding:20px 16px;border-radius:18px}.home-direct-compare-grid{grid-template-columns:1fr}.home-direct-compare-head h2{font-size:23px}}
    `;
    document.head.appendChild(style);
  };

  const enhanceHero = () => {
    if (location.pathname !== '/') return false;
    const hero = document.querySelector('.hero');
    if (!hero) return false;
    const copy = hero.querySelector('.hero-copy');
    if (!copy) return false;

    const badge = copy.querySelector('.update-badge');
    if (badge) badge.textContent = '2026年10月4日更新・6カテゴリの公式仕様を確認';
    const eyebrow = copy.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'PRODUCT COMPARISON';
    const heroText = copy.querySelector('.hero-text');
    if (heroText) heroText.textContent = 'イヤホン・モバイルバッテリー・スマートフォン・スマートウォッチ・タブレット・USB充電器を、価格や使い方など重視ポイントから比較できます。';

    const primary = copy.querySelector('.primary-btn');
    if (primary) primary.childNodes[0].nodeValue = 'イヤホンを3問で比較 ';
    if (primary && !copy.querySelector('.home-hero-actions')) {
      const actions = document.createElement('div');
      actions.className = 'home-hero-actions';
      primary.insertAdjacentElement('beforebegin', actions);
      actions.appendChild(primary);
      const categories = document.createElement('a');
      categories.className = 'home-category-link';
      categories.href = '#categories';
      categories.textContent = '6カテゴリを見る →';
      actions.appendChild(categories);
    }

    const trust = copy.querySelector('.trust-row');
    if (trust) {
      const spans = [...trust.querySelectorAll('span')];
      if (spans[1]) spans[1].textContent = '✓ 6カテゴリ・150商品';
      if (spans[2]) spans[2].textContent = '✓ 条件別ランキング';
    }
    const miniLabel = hero.querySelector('.mini-label');
    if (miniLabel) miniLabel.textContent = 'イヤホン診断の例｜コスパ寄り TOP 3';
    return true;
  };

  const enhanceCategoryLinks = () => {
    const section = document.getElementById('categories');
    const grid = section?.querySelector('.home-guide-grid');
    if (!grid) return false;
    const p = section.querySelector('.home-guide-box > p:not(.eyebrow)');
    if (p) p.textContent = '6カテゴリ・150商品を、予算や重視ポイントを変えながら比較できます。';
    categoryAdditions.forEach(([href,label,category]) => {
      let a = grid.querySelector(`a[href="${href}"]`);
      if (!a) {
        a = document.createElement('a');
        a.href = href;
        grid.appendChild(a);
      }
      a.textContent = label;
      a.dataset.track = 'category_click';
      a.dataset.category = category;
    });
    return true;
  };

  const createGuideSection = (data) => {
    const section = document.createElement('section');
    section.className = 'home-guide-section home-new-guides';
    section.dataset.homeCategoryGuides = data.key;
    section.innerHTML = `<div class="home-guide-box"><p class="eyebrow">${data.eyebrow}</p><h2>${data.title}</h2><p>${data.description}</p><div class="home-guide-grid">${data.links.map(([href,label]) => `<a href="${href}">${label}</a>`).join('')}</div></div>`;
    return section;
  };

  const ensureGuideSections = () => {
    if (location.pathname !== '/') return false;
    const quiz = document.getElementById('quiz');
    if (!quiz) return false;
    guideSections.forEach((data) => {
      if (document.querySelector(`[data-home-category-guides="${data.key}"]`)) return;
      quiz.insertAdjacentElement('beforebegin', createGuideSection(data));
    });
    return true;
  };

  const ensureDirectComparisons = () => {
    if (location.pathname !== '/') return false;
    const quiz = document.getElementById('quiz');
    if (!quiz) return false;
    if (document.querySelector('[data-home-direct-comparisons]')) return true;
    const section = document.createElement('section');
    section.className = 'home-direct-compare';
    section.dataset.homeDirectComparisons = '1';
    section.innerHTML = `<div class="home-direct-compare-box"><p class="eyebrow">DIRECT COMPARISON</p><div class="home-direct-compare-head"><h2>気になる2製品を直接比べる</h2><p>候補が2つまで絞れたら、価格と主要仕様を同じ表で確認できます。</p></div><div class="home-direct-compare-grid">${directComparisons.map(([href,label,category]) => `<a class="home-direct-compare-card" href="${href}"><b>${label}</b><small>${category}の違いを見る →</small></a>`).join('')}</div></div>`;
    quiz.insertAdjacentElement('beforebegin', section);
    return true;
  };

  const enhance = () => {
    addStyles();
    const a = enhanceHero();
    const b = enhanceCategoryLinks();
    const c = ensureGuideSections();
    const d = ensureDirectComparisons();
    return a && b && c && d;
  };

  const start = () => {
    if (enhance()) return;
    const root = document.getElementById('root');
    if (!root) return;
    const observer = new MutationObserver(() => { if (enhance()) observer.disconnect(); });
    observer.observe(root,{childList:true,subtree:true});
    setTimeout(() => observer.disconnect(),7000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
