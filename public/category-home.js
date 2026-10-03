(() => {
  const additions = [
    ['/smartwatches/','⌚ スマートウォッチ20モデル'],
    ['/tablets/','📚 タブレット20モデル'],
    ['/chargers/','🔌 USB充電器20製品'],
  ];
  const enhance = () => {
    const section = document.getElementById('categories');
    const grid = section?.querySelector('.home-guide-grid');
    if (!grid) return false;
    const p = section.querySelector('.home-guide-box > p:not(.eyebrow)');
    if (p) p.textContent = 'イヤホン、モバイルバッテリー、スマートフォンに加えて、スマートウォッチ・タブレット・USB充電器も条件別に比較できます。';
    additions.forEach(([href,label]) => {
      let a = grid.querySelector(`a[href="${href}"]`);
      if (!a) {
        a = document.createElement('a');
        a.href = href;
        a.dataset.track = 'category_click';
        a.dataset.category = href.split('/').filter(Boolean)[0];
        grid.appendChild(a);
      }
      a.textContent = label;
    });
    return true;
  };
  const start = () => {
    if (enhance()) return;
    const root = document.getElementById('root');
    if (!root) return;
    const observer = new MutationObserver(() => { if (enhance()) observer.disconnect(); });
    observer.observe(root,{childList:true,subtree:true});
    setTimeout(() => observer.disconnect(),5000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();