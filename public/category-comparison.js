(() => {
  const cfg = window.COMPARISON_CONFIG;
  if (!cfg) return;
  const $ = (s) => document.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yen = (v) => Number.isFinite(v) ? `¥${v.toLocaleString('ja-JP')}` : '公式で確認';
  const hasDetail = () => ['smartwatches','tablets','chargers','laptops','monitors','routers','electric-toothbrushes','hair-dryers','cordless-vacuums','robot-vacuums','air-purifiers','rice-cookers'].includes(cfg.categoryKey);
  const detailUrl = (p) => `/${cfg.categoryKey}/products/${encodeURIComponent(p.id)}/`;
  const state = { budget:null, priority:cfg.defaultPriority || cfg.priorities[0].key, query:'', brand:'all', sort:'match', selected:[] };
  const budgetControls = $('#budgetControls');
  const priorityControls = $('#priorityControls');
  const searchInput = $('#searchInput');
  const brandFilter = $('#brandFilter');
  const sortSelect = $('#sortSelect');
  const list = $('#list');
  const conditionText = $('#conditionText');
  const toolsCount = $('#toolsCount');
  const compare = $('#compare');
  const compareHead = $('#compareHead');
  const compareBody = $('#compareBody');
  const compareCount = $('#compareCount');

  const budgetLabel = () => cfg.budgets.find((b) => b.value === state.budget)?.label || '予算指定なし';
  const priorityLabel = () => cfg.priorities.find((p) => p.key === state.priority)?.label || '';
  const scoreProduct = (p) => {
    let total = 0, weight = 0;
    cfg.priorities.forEach(({key}) => {
      const w = key === state.priority ? 3 : 1;
      total += (p.scores[key] || 0) * w;
      weight += w;
    });
    return Math.round(total / Math.max(weight, 1));
  };
  const filtered = () => {
    const needle = state.query.trim().toLocaleLowerCase('ja');
    let items = cfg.products.filter((p) => {
      if (state.budget !== null && (!Number.isFinite(p.price) || p.price > state.budget)) return false;
      if (state.brand !== 'all' && p.brand !== state.brand) return false;
      const hay = [p.name,p.brand,...(p.badges||[]),...Object.values(p.facts||{})].join(' ').toLocaleLowerCase('ja');
      return !needle || hay.includes(needle);
    }).map((p) => ({...p, match:scoreProduct(p)}));
    if (state.sort === 'price-asc') items.sort((a,b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (state.sort === 'price-desc') items.sort((a,b) => (b.price ?? -1) - (a.price ?? -1));
    else if (state.sort === 'name') items.sort((a,b) => a.name.localeCompare(b.name,'ja'));
    else if (state.sort !== 'match') {
      const spec = cfg.sorts?.find((s) => s.value === state.sort);
      if (spec?.key) items.sort((a,b) => (spec.direction === 'asc' ? 1 : -1) * ((Number(a.facts?.[spec.key]) || 0) - (Number(b.facts?.[spec.key]) || 0)));
    } else items.sort((a,b) => b.match - a.match);
    return items;
  };
  const tags = (p) => (p.badges || []).slice(0,4).map((x) => `<span>${esc(x)}</span>`).join('');
  const reason = (p) => `${priorityLabel()}を重視した条件で相性点を算出。${(p.badges||[]).slice(0,2).join('・')}を比較材料にできます。`;
  const renderList = () => {
    const items = filtered();
    conditionText.textContent = `${budgetLabel()}・${priorityLabel()}重視`;
    toolsCount.textContent = `${items.length}/${cfg.products.length}${cfg.itemLabel}を表示`;
    if (!items.length) {
      list.innerHTML = '<div class="no-result"><b>条件に合う製品がありません</b><p>予算・メーカー・検索語を変更してください。</p></div>';
      return;
    }
    list.innerHTML = items.map((p,i) => {
      const detail = hasDetail(p) ? `<a class="detail-link detail-mini" href="${esc(detailUrl(p))}">詳しく見る →</a>` : '';
      return `<article class="rank-card" data-id="${esc(p.id)}"><div class="rank-index"><span>${i+1}</span><small>位</small></div><div class="rank-main"><div class="brand-row"><span class="brand">${esc(p.brand)}</span><span class="verified-badge">✓ 公式情報を参照</span></div><h3>${hasDetail(p)?`<a class="product-title-link" href="${esc(detailUrl(p))}">${esc(p.name)}</a>`:esc(p.name)}</h3><div class="tag-row">${tags(p)}</div><p class="reason">${esc(reason(p))}</p><div class="rank-links">${detail}<a class="source-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">メーカー公式で仕様を見る ↗</a></div></div><div class="match-box"><strong>${p.match}</strong><span>/100</span><small>条件との相性</small></div><div class="rank-actions"><button type="button" class="compare-btn${state.selected.includes(p.id)?' selected':''}" data-id="${esc(p.id)}">${state.selected.includes(p.id)?'✓ 比較中':'+ 比較する'}</button><div class="price">${yen(p.price)}<small>${Number.isFinite(p.price)?'公式掲載価格':'価格は公式で確認'}</small></div></div></article>`;
    }).join('');
    list.querySelectorAll('.compare-btn').forEach((btn) => btn.addEventListener('click', () => toggle(btn.dataset.id)));
  };
  const toggle = (id) => {
    if (state.selected.includes(id)) state.selected = state.selected.filter((x) => x !== id);
    else if (state.selected.length < 3) state.selected.push(id);
    renderList(); renderCompare();
  };
  const renderCompare = () => {
    const items = state.selected.map((id) => cfg.products.find((p) => p.id === id)).filter(Boolean);
    compare.hidden = !items.length;
    if (!items.length) return;
    compareCount.textContent = `${items.length}/3${cfg.itemLabel}`;
    compareHead.innerHTML = `<tr><th>比較項目</th>${items.map((p) => `<th>${hasDetail(p)?`<a href="${esc(detailUrl(p))}">${esc(p.name)}</a>`:esc(p.name)}</th>`).join('')}</tr>`;
    const rows = [{label:'公式掲載価格',render:(p)=>yen(p.price)}, ...(cfg.compareRows||[]).map((r) => ({label:r.label,render:(p)=>p.facts?.[r.key] ?? '—'}))];
    compareBody.innerHTML = rows.map((r) => `<tr><td>${esc(r.label)}</td>${items.map((p) => `<td>${esc(r.render(p))}</td>`).join('')}</tr>`).join('');
  };
  const renderControls = () => {
    budgetControls.innerHTML = cfg.budgets.map((b) => `<button type="button" data-value="${b.value===null?'none':b.value}" class="${state.budget===b.value?'active':''}">${esc(b.label)}</button>`).join('');
    budgetControls.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { state.budget = b.dataset.value === 'none' ? null : Number(b.dataset.value); renderControls(); renderList(); }));
    priorityControls.innerHTML = cfg.priorities.map((p) => `<button type="button" data-key="${esc(p.key)}" class="${state.priority===p.key?'active':''}">${esc(p.label)}</button>`).join('');
    priorityControls.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { state.priority=b.dataset.key; renderControls(); renderList(); }));
  };
  const brands = [...new Set(cfg.products.map((p) => p.brand))].sort((a,b)=>a.localeCompare(b,'ja'));
  brandFilter.innerHTML = '<option value="all">すべてのメーカー</option>' + brands.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
  sortSelect.innerHTML = '<option value="match">相性順</option><option value="price-asc">価格が安い順</option><option value="price-desc">価格が高い順</option>' + (cfg.sorts||[]).map((s) => `<option value="${esc(s.value)}">${esc(s.label)}</option>`).join('') + '<option value="name">商品名順</option>';
  searchInput.addEventListener('input', () => { state.query=searchInput.value; renderList(); });
  brandFilter.addEventListener('change', () => { state.brand=brandFilter.value; renderList(); });
  sortSelect.addEventListener('change', () => { state.sort=sortSelect.value; renderList(); });
  $('#clearTools')?.addEventListener('click', () => { state.query='';state.brand='all';state.sort='match';searchInput.value='';brandFilter.value='all';sortSelect.value='match';renderList(); });
  $('#clearCompare')?.addEventListener('click', () => { state.selected=[];renderList();renderCompare(); });
  renderControls(); renderList(); renderCompare();
})();