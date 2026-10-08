(() => {
  const categoryAdditions = [
    ['/smartwatches/','⌚ スマートウォッチ20モデル','smartwatches'],
    ['/tablets/','📚 タブレット20モデル','tablets'],
    ['/chargers/','🔌 USB充電器20製品','chargers'],
    ['/laptops/','💻 ノートPC20モデル','laptops'],
    ['/monitors/','🖥️ PCモニター20製品','monitors'],
    ['/routers/','📶 Wi-Fiルーター20製品','routers'],
    ['/electric-toothbrushes/','🪥 電動歯ブラシ20製品','electric-toothbrushes'],
    ['/hair-dryers/','💨 ヘアドライヤー20製品','hair-dryers'],
    ['/cordless-vacuums/','🧹 コードレス掃除機20製品','cordless-vacuums'],
    ['/robot-vacuums/','🤖 ロボット掃除機20製品','robot-vacuums'],
    ['/air-purifiers/','🌬️ 空気清浄機20製品','air-purifiers'],
    ['/rice-cookers/','🍚 炊飯器20製品','rice-cookers'],
  ];

  const guideSections = [
    {key:'smartwatches',eyebrow:'SMARTWATCH GUIDES',title:'目的別スマートウォッチガイド',description:'スマホ連携、バッテリー、スポーツなどから選べます。',links:[['/smartwatches/iphone/','🍎 iPhone向け'],['/smartwatches/android/','🤖 Android向け'],['/smartwatches/battery/','🔋 バッテリー重視'],['/smartwatches/sports/','🏃 スポーツ向け'],['/smartwatches/swimming-cellular/','🏊 水泳・セルラー'],['/smartwatches/','⌚ 20モデルを比較']]},
    {key:'tablets',eyebrow:'TABLET GUIDES',title:'目的別タブレットガイド',description:'勉強、お絵描き、持ち運び、ゲームなどから選べます。',links:[['/tablets/student/','🎓 大学生・勉強向け'],['/tablets/drawing/','✏️ ペン・お絵描き'],['/tablets/lightweight/','🪶 軽量'],['/tablets/gaming/','🎮 ゲーム向け'],['/tablets/','📚 20モデルを比較']]},
    {key:'chargers',eyebrow:'CHARGER GUIDES',title:'目的別USB充電器ガイド',description:'iPhone、ノートPC、持ち運び、複数台充電などから選べます。',links:[['/chargers/iphone/','🍎 iPhone向け'],['/chargers/laptop/','💻 ノートPC向け'],['/chargers/compact/','🧳 小型・軽量'],['/chargers/multiport/','🔌 複数ポート'],['/chargers/','🔌 20製品を比較']]},
    {key:'laptops',eyebrow:'LAPTOP GUIDES',title:'目的別ノートPCガイド',description:'大学生、軽さ、電池持ち、制作などから選べます。',links:[['/laptops/student/','🎓 大学生向け'],['/laptops/lightweight/','🪶 軽量'],['/laptops/battery/','🔋 バッテリー'],['/laptops/creator/','🎨 クリエイター'],['/laptops/','💻 20モデルを比較']]},
    {key:'monitors',eyebrow:'MONITOR GUIDES',title:'目的別PCモニターガイド',description:'ゲーム、仕事、4K、USB-Cなどから選べます。',links:[['/monitors/gaming/','🎮 ゲーム'],['/monitors/work/','💼 仕事'],['/monitors/4k/','🔍 4K'],['/monitors/usb-c/','🔌 USB-C'],['/monitors/','🖥️ 20製品を比較']]},
    {key:'routers',eyebrow:'WIFI GUIDES',title:'目的別Wi-Fiルーターガイド',description:'マンション、戸建て、ゲーム、メッシュなどから選べます。',links:[['/routers/apartment/','🏢 マンション'],['/routers/house/','🏠 戸建て'],['/routers/gaming/','🎮 ゲーム'],['/routers/mesh/','🕸️ メッシュ'],['/routers/','📶 20製品を比較']]},
    {key:'electric-toothbrushes',eyebrow:'ORAL CARE GUIDES',title:'目的別電動歯ブラシガイド',description:'初めて、歯ぐきケア、アプリ、持ち運びなどから選べます。',links:[['/electric-toothbrushes/beginner/','🔰 初めて向け'],['/electric-toothbrushes/gums/','🦷 歯ぐきケア'],['/electric-toothbrushes/app/','📱 アプリ対応'],['/electric-toothbrushes/travel/','🧳 持ち運び'],['/electric-toothbrushes/','🪥 20製品を比較']]},
    {key:'hair-dryers',eyebrow:'HAIR DRYER GUIDES',title:'目的別ヘアドライヤーガイド',description:'速乾、髪ケア、軽さ、旅行などから選べます。',links:[['/hair-dryers/fast-drying/','⚡ 速乾'],['/hair-dryers/hair-care/','✨ ヘアケア'],['/hair-dryers/lightweight/','🪶 軽量'],['/hair-dryers/travel/','🧳 旅行・海外'],['/hair-dryers/','💨 20製品を比較']]},
    {key:'cordless-vacuums',eyebrow:'VACUUM GUIDES',title:'目的別コードレス掃除機ガイド',description:'軽さ、ペット、自動ゴミ収集などから選べます。',links:[['/cordless-vacuums/lightweight/','🪶 軽量'],['/cordless-vacuums/pet/','🐶 ペット'],['/cordless-vacuums/auto-empty/','🗑️ 自動ゴミ収集'],['/cordless-vacuums/one-person/','🏠 一人暮らし'],['/cordless-vacuums/','🧹 20製品を比較']]},
    {key:'robot-vacuums',eyebrow:'ROBOT VACUUM GUIDES',title:'目的別ロボット掃除機ガイド',description:'自動ゴミ収集、水拭き、ペット、障害物回避などから選べます。',links:[['/robot-vacuums/auto-empty/','🗑️ 自動ゴミ収集'],['/robot-vacuums/mop/','💧 水拭き'],['/robot-vacuums/pet/','🐶 ペット'],['/robot-vacuums/obstacle/','👀 障害物回避'],['/robot-vacuums/','🤖 20製品を比較']]},
    {key:'air-purifiers',eyebrow:'AIR PURIFIER GUIDES',title:'目的別空気清浄機ガイド',description:'花粉、加湿、寝室、ペットなどから選べます。',links:[['/air-purifiers/pollen/','🌸 花粉'],['/air-purifiers/humidifier/','💧 加湿付き'],['/air-purifiers/bedroom/','🌙 寝室'],['/air-purifiers/pet/','🐶 ペット'],['/air-purifiers/','🌬️ 20製品を比較']]},
    {key:'rice-cookers',eyebrow:'RICE COOKER GUIDES',title:'目的別炊飯器ガイド',description:'3合、5.5合、圧力IH、高級モデルなどから選べます。',links:[['/rice-cookers/3go/','🍙 3合前後'],['/rice-cookers/55go/','🍚 5.5合'],['/rice-cookers/pressure-ih/','🔥 圧力IH'],['/rice-cookers/premium/','👑 高級モデル'],['/rice-cookers/','🍚 20製品を比較']]},
  ];

  const directComparisons = [
    ["/earphones/compare/soundcore-liberty-5-vs-earfun-air-pro-4/","🎧 Liberty 5 vs EarFun Air Pro 4","ワイヤレスイヤホン"],
    ["/smartphones/compare/galaxy-s26-ultra-vs-pixel-10-pro-xl/","📱 Galaxy S26 Ultra vs Pixel 10 Pro XL","スマートフォン"],
    ["/smartwatches/compare/apple-watch-series-11-42-vs-pixel-watch-4-41/","⌚ Apple Watch Series 11 vs Pixel Watch 4","スマートウォッチ"],
    ["/laptops/compare/macbook-air-13-m4-vs-surface-laptop-13/","💻 MacBook Air vs Surface Laptop","ノートPC"],
    ["/electric-toothbrushes/compare/panasonic-ew-dt88-vs-oralb-io9/","🪥 ドルツ EW-DT88 vs Oral-B iO9","電動歯ブラシ"],
    ["/hair-dryers/compare/panasonic-eh-nc80-vs-refa-bx/","💨 nanocare ULTIMATE vs ReFa BX","ヘアドライヤー"],
    ["/cordless-vacuums/compare/panasonic-mc-nx810km-vs-shark-neo2-plus-lc551j/","🧹 Panasonic NX810KM vs Shark NEO II+","コードレス掃除機"],
    ["/robot-vacuums/compare/roomba-max-775-combo-vs-deebot-t90-omni/","🤖 Roomba Max 775 vs DEEBOT T90","ロボット掃除機"],
    ["/air-purifiers/compare/sharp-ki-wx100-vs-panasonic-f-vxw90/","🌬️ SHARP KI-WX100 vs Panasonic F-VXW90","空気清浄機"],
    ["/rice-cookers/compare/zojirushi-nx-ab10-vs-tiger-jrt-a100/","🍚 炎舞炊き NX-AB10 vs TIGER JRT-A100","炊飯器"],
  ];

  const comparisonHubs = [
    ['/earphones/compare/','🎧 ワイヤレスイヤホン13組'],
    ['/mobile-batteries/compare/','🔋 モバイルバッテリー12組'],
    ['/smartphones/compare/','📱 スマートフォン13組'],
    ['/smartwatches/compare/','⌚ スマートウォッチ12組'],
    ['/tablets/compare/','📚 タブレット12組'],
    ['/chargers/compare/','🔌 USB充電器12組'],
    ['/laptops/compare/','💻 ノートPC12組'],
    ['/monitors/compare/','🖥️ PCモニター12組'],
    ['/routers/compare/','📶 Wi-Fiルーター12組'],
    ['/electric-toothbrushes/compare/','🪥 電動歯ブラシ12組'],
    ['/hair-dryers/compare/','💨 ヘアドライヤー12組'],
    ['/cordless-vacuums/compare/','🧹 コードレス掃除機12組'],
    ['/robot-vacuums/compare/','🤖 ロボット掃除機12組'],
    ['/air-purifiers/compare/','🌬️ 空気清浄機12組'],
    ['/rice-cookers/compare/','🍚 炊飯器12組'],
  ];

  const addStyles = () => {
    if (document.getElementById('home-discovery-style')) return;
    const style = document.createElement('style');
    style.id = 'home-discovery-style';
    style.textContent = `
      .site-header .logo::after{content:'15カテゴリ比較'!important}
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
      .home-compare-hubs{margin-top:18px;padding-top:16px;border-top:1px solid #e7edf5}
      .home-compare-hubs>span{display:block;margin-bottom:9px;color:#6f8096;font-size:11px;font-weight:900}
      .home-compare-hub-links{display:flex;gap:7px;flex-wrap:wrap}
      .home-compare-hub-links a{display:inline-flex;align-items:center;min-height:34px;padding:0 11px;border-radius:999px;border:1px solid #dce6f1;background:#fff;color:#3c536f;text-decoration:none;font-size:10px;font-weight:900;transition:.18s ease}
      .home-compare-hub-links a:hover{border-color:#a8c9fb;color:#0f6cf9;background:#f8fbff}
      @media(max-width:900px){.home-direct-compare-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-direct-compare-head{align-items:flex-start;flex-direction:column;gap:6px}}
      @media(max-width:620px){.home-category-link{width:100%;min-height:44px}.home-hero-actions{display:grid;grid-template-columns:1fr;width:100%}.home-hero-actions .primary-btn{width:100%}.home-direct-compare{padding:14px 14px 8px}.home-direct-compare-box{padding:20px 16px;border-radius:18px}.home-direct-compare-grid{grid-template-columns:1fr}.home-direct-compare-head h2{font-size:23px}.home-compare-hub-links{display:grid;grid-template-columns:1fr 1fr}.home-compare-hub-links a{justify-content:center;text-align:center;padding:7px 8px}}
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
    if (badge) badge.textContent = '2026年10月9日更新・15カテゴリのメーカー公式情報を優先';
    const eyebrow = copy.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'PRODUCT COMPARISON';
    const heroText = copy.querySelector('.hero-text');
    if (heroText) heroText.textContent = 'ガジェット・PC・生活家電まで15カテゴリ・330商品を、価格や使い方など重視ポイントから比較できます。';

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
      categories.textContent = '15カテゴリを見る →';
      actions.appendChild(categories);
    }

    const trust = copy.querySelector('.trust-row');
    if (trust) {
      const spans = [...trust.querySelectorAll('span')];
      if (spans[1]) spans[1].textContent = '✓ 15カテゴリ・330商品';
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
    if (p) p.textContent = '15カテゴリ・330商品を、予算や重視ポイントを変えながら比較できます。';
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
    section.innerHTML = `<div class="home-direct-compare-box"><p class="eyebrow">DIRECT COMPARISON</p><div class="home-direct-compare-head"><h2>気になる2製品を直接比べる</h2><p>候補が2つまで絞れたら、価格と主要仕様を同じ表で確認できます。</p></div><div class="home-direct-compare-grid">${directComparisons.map(([href,label,category]) => `<a class="home-direct-compare-card" href="${href}"><b>${label}</b><small>${category}の違いを見る →</small></a>`).join('')}</div><div class="home-compare-hubs"><span>カテゴリ別に12組の直接比較をすべて見る</span><div class="home-compare-hub-links">${comparisonHubs.map(([href,label]) => `<a href="${href}" data-track="compare_action">${label}</a>`).join('')}</div></div></div>`;
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
