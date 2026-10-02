import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { earphones, criteria } from './data/earphones';
import './style.css';
import './enhancements.css';

const LAST_UPDATED = '2026年10月2日';

const budgets = [
  { label: '5,000円以下', value: 5000 },
  { label: '10,000円以下', value: 10000 },
  { label: '20,000円以下', value: 20000 },
  { label: '30,000円以下', value: 30000 },
  { label: '50,000円以下', value: 50000 },
  { label: '予算は決めていない', value: Infinity },
];

const quickPresets = [
  { label: 'コスパ重視', icon: '💰', primary: 'value', budget: 20000 },
  { label: '通勤・通学', icon: '🚃', primary: 'noiseCancel', budget: 50000 },
  { label: '音質重視', icon: '🎵', primary: 'sound', budget: 50000 },
  { label: 'バッテリー重視', icon: '🔋', primary: 'battery', budget: 30000 },
  { label: '1万円以下', icon: '🏷️', primary: 'value', budget: 10000 },
  { label: '最新フラッグシップ', icon: '✨', primary: 'sound', budget: 50000 },
];

const initialWeights = criteria.reduce((acc, item) => ({ ...acc, [item.key]: 1 }), {});

function App() {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(Infinity);
  const [primary, setPrimary] = useState('value');
  const [weights, setWeights] = useState(initialWeights);
  const [selected, setSelected] = useState([]);

  const ranking = useMemo(() => {
    const filtered = earphones.filter((item) => item.price <= budget);
    return filtered
      .map((item) => {
        let score = 0;
        let totalWeight = 0;
        criteria.forEach(({ key }) => {
          const base = weights[key] || 0;
          const weight = base + (key === primary ? 2 : 0);
          score += item.scores[key] * weight;
          totalWeight += weight;
        });
        return { ...item, match: Math.round(score / Math.max(totalWeight, 1)) };
      })
      .sort((a, b) => b.match - a.match);
  }, [budget, primary, weights]);

  const primaryLabel = criteria.find((c) => c.key === primary)?.label;

  const showResults = () => {
    setStep(4);
    setSelected([]);
    setTimeout(() => document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' }), 30);
  };

  const startPreset = (preset) => {
    setPrimary(preset.primary);
    setBudget(preset.budget);
    setWeights(initialWeights);
    showResults();
  };

  const toggleCompare = (id) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const selectedItems = earphones.filter((item) => selected.includes(item.id));
  const previewRanking = earphones
    .map((item) => ({ ...item, match: Math.round((item.scores.value * 3 + item.scores.sound + item.scores.noiseCancel) / 5) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 3);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="logo" href="#top" aria-label="みんなの比較表トップ">
          <span className="logo-mark">✓</span>
          <span>みんなの比較表</span>
        </a>
        <nav>
          <a href="#popular">人気の比較</a>
          <a href="#how">使い方</a>
          <a href="#method">比較基準</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="update-badge">2026年10月更新・公式仕様を確認</div>
            <p className="eyebrow">EARPHONES COMPARISON</p>
            <h1>あなたの重視ポイントで、<br /><span>ランキングが変わる。</span></h1>
            <p className="hero-text">価格・音質・ノイキャン・バッテリー。人によって「いいイヤホン」は違うから、あなたの条件から比較します。</p>
            <button className="primary-btn" onClick={() => { setStep(1); document.querySelector('#quiz')?.scrollIntoView({ behavior: 'smooth' }); }}>
              3問で比較をはじめる <span>→</span>
            </button>
            <div className="trust-row"><span>✓ 登録不要</span><span>✓ 約30秒</span><span>✓ 7製品を比較</span><span>✓ 公式情報リンク付き</span></div>
          </div>
          <div className="hero-card">
            <div className="mini-label">コスパ寄りの初期設定 TOP 3</div>
            {previewRanking.map((item, index) => (
              <div className="mini-rank" key={item.id}>
                <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                <div className="product-icon">{item.accent}</div>
                <div><b>{item.name}</b><small>{item.brand}</small></div>
                <strong>{item.match}<small>点</small></strong>
              </div>
            ))}
            <div className="mini-note">これは初期設定の例です。あなたの条件を選ぶと、順位と相性点が変わります。</div>
          </div>
        </section>

        <section id="popular" className="section">
          <div className="section-heading"><div><p className="eyebrow">POPULAR</p><h2>人気の比較から探す</h2></div><p>目的からすぐにランキングを見られます。</p></div>
          <div className="preset-grid">
            {quickPresets.map((item) => (
              <button className="preset-card" key={item.label} onClick={() => startPreset(item)}>
                <span className="preset-icon">{item.icon}</span><span>{item.label}</span><b>→</b>
              </button>
            ))}
          </div>
        </section>

        <section id="quiz" className="quiz-wrap">
          <div className="quiz-head">
            <div><p className="eyebrow">PERSONAL FINDER</p><h2>3問であなた向けを探す</h2></div>
            <div className="step-dots">{[1,2,3].map((n) => <span key={n} className={step >= n ? 'active' : ''}>{n}</span>)}</div>
          </div>

          {step === 0 && <div className="quiz-empty"><span>🎧</span><h3>比較を始める準備ができました</h3><p>たった3問で、あなた向けのランキングを作ります。</p><button className="primary-btn" onClick={() => setStep(1)}>スタート</button></div>}

          {step === 1 && <div className="question-card"><p className="question-number">QUESTION 1</p><h3>イヤホンの予算は？</h3><div className="choice-grid">{budgets.map((b) => <button key={b.label} className={budget === b.value ? 'choice active' : 'choice'} onClick={() => setBudget(b.value)}>{b.label}</button>)}</div><div className="quiz-actions"><button className="ghost-btn" onClick={() => setStep(0)}>戻る</button><button className="primary-btn" onClick={() => setStep(2)}>次へ →</button></div></div>}

          {step === 2 && <div className="question-card"><p className="question-number">QUESTION 2</p><h3>一番重視するポイントは？</h3><div className="criteria-grid">{criteria.map((c) => <button key={c.key} className={primary === c.key ? 'criterion active' : 'criterion'} onClick={() => setPrimary(c.key)}><span>{c.icon}</span><b>{c.label}</b></button>)}</div><div className="quiz-actions"><button className="ghost-btn" onClick={() => setStep(1)}>戻る</button><button className="primary-btn" onClick={() => setStep(3)}>次へ →</button></div></div>}

          {step === 3 && <div className="question-card"><p className="question-number">QUESTION 3</p><h3>ほかの条件も調整する</h3><p className="subcopy">重要度を0〜3で調整できます。迷ったらそのままでOK。</p><div className="weight-list">{criteria.map((c) => <div className="weight-row" key={c.key}><span>{c.icon} {c.label}</span><div className="weight-buttons">{[0,1,2,3].map((value) => <button key={value} className={weights[c.key] === value ? 'active' : ''} onClick={() => setWeights((w) => ({ ...w, [c.key]: value }))}>{['不要','普通','重視','最重視'][value]}</button>)}</div></div>)}</div><div className="quiz-actions"><button className="ghost-btn" onClick={() => setStep(2)}>戻る</button><button className="primary-btn" onClick={showResults}>結果を見る →</button></div></div>}
        </section>

        {step === 4 && <section id="results" className="section results-section">
          <div className="result-intro">
            <p className="eyebrow">YOUR RANKING</p>
            <h2>あなたは「<span>{primaryLabel}重視</span>」タイプ</h2>
            <p>公式公称スペックと編集スコアを、あなたが選んだ重要度で重み付けしています。相性点は絶対的な製品評価ではありません。</p>
          </div>

          <div className="ranking-list">
            {ranking.length ? ranking.map((item, index) => (
              <article className="rank-card" key={item.id}>
                <div className="rank-index"><span>{index + 1}</span><small>位</small></div>
                <div className="big-product-icon">{item.accent}</div>
                <div className="rank-main">
                  <div className="brand-row"><span className="brand">{item.brand}</span><span className="verified-badge">✓ 公式仕様確認</span></div>
                  <h3>{item.name}</h3>
                  <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <p className="reason">{primaryLabel}を重視した条件で高得点。{item.price <= 20000 ? '価格とのバランスも取りやすい候補です。' : '上位機能を重視する人向けの候補です。'}</p>
                  <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceLabel}で仕様を見る ↗</a>
                </div>
                <div className="match-box"><strong>{item.match}</strong><span>/ 100</span><small>あなたとの相性</small></div>
                <div className="rank-actions"><button className={selected.includes(item.id) ? 'compare-btn selected' : 'compare-btn'} onClick={() => toggleCompare(item.id)}>{selected.includes(item.id) ? '✓ 比較中' : '+ 比較する'}</button><div className="price">¥{item.price.toLocaleString()}<small>公式参考価格</small></div></div>
              </article>
            )) : <div className="no-result"><h3>この予算に合う商品がありません</h3><p>予算を上げてもう一度試してください。</p></div>}
          </div>
        </section>}

        {step === 4 && selectedItems.length > 0 && <section className="compare-panel"><div className="compare-title"><div><p className="eyebrow">COMPARE</p><h2>選んだ商品を比較</h2></div><span>{selectedItems.length}/3商品</span></div><div className="table-scroll"><table><thead><tr><th>比較項目</th>{selectedItems.map((item) => <th key={item.id}>{item.name}</th>)}</tr></thead><tbody><tr><td>公式参考価格</td>{selectedItems.map((item) => <td key={item.id}>¥{item.price.toLocaleString()}</td>)}</tr><tr><td>音質スコア</td>{selectedItems.map((item) => <td key={item.id}>{item.scores.sound}点</td>)}</tr><tr><td>ノイキャンスコア</td>{selectedItems.map((item) => <td key={item.id}>{item.scores.noiseCancel}点</td>)}</tr><tr><td>バッテリー</td>{selectedItems.map((item) => <td key={item.id}>{item.batteryText}</td>)}</tr><tr><td>防水・防塵</td>{selectedItems.map((item) => <td key={item.id}>{item.waterRating}</td>)}</tr><tr><td>コスパスコア</td>{selectedItems.map((item) => <td key={item.id}>{item.scores.value}点</td>)}</tr></tbody></table></div></section>}

        <section id="how" className="section how-section">
          <div className="section-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>比較の仕組み</h2></div></div>
          <div className="how-grid"><div><span>01</span><h3>予算を決める</h3><p>候補を予算内の商品に絞り込みます。</p></div><div><span>02</span><h3>重視ポイントを選ぶ</h3><p>あなたが大事にする項目の比重を高くします。</p></div><div><span>03</span><h3>相性順に並べる</h3><p>条件ごとのスコアから、あなた向けの順番を作ります。</p></div></div>
        </section>

        <section id="method" className="section method-section">
          <div className="section-heading"><div><p className="eyebrow">METHODOLOGY</p><h2>比較基準について</h2></div><p>最終更新：{LAST_UPDATED}</p></div>
          <div className="method-grid">
            <div><span>公式データ</span><h3>価格・バッテリー・防水</h3><p>メーカー公式サイトに掲載されている公称値を優先して確認しています。価格はセール等で変動する場合があります。</p></div>
            <div><span>編集スコア</span><h3>音質・ANC・装着感など</h3><p>比較しやすいよう100点満点の編集スコアに整理しています。メーカー公式の採点ではありません。</p></div>
            <div><span>ランキング</span><h3>あなたの条件で重み付け</h3><p>選んだ重要度に応じて各スコアの比重を変えます。広告掲載の有無で相性点を変えない設計です。</p></div>
          </div>
        </section>

        <section className="section faq-section">
          <div className="section-heading"><div><p className="eyebrow">FAQ</p><h2>よくある質問</h2></div></div>
          <div className="faq-list">
            <details><summary>相性点は商品の絶対評価ですか？</summary><p>いいえ。あなたが選んだ重視ポイントとの相性を表す点数です。同じ商品でも条件によって点数や順位が変わります。</p></details>
            <details><summary>表示価格は実際の販売価格と同じですか？</summary><p>メーカー公式サイトの参考価格を基準にしていますが、セールや販売店によって実売価格は変動します。購入前に販売先で最新価格を確認してください。</p></details>
            <details><summary>ランキングは広告で変わりますか？</summary><p>相性点の計算には広告掲載の有無を使いません。将来アフィリエイトリンクを設置する場合も、ランキング計算とは分離します。</p></details>
          </div>
        </section>
      </main>

      <footer><div className="logo"><span className="logo-mark">✓</span><span>みんなの比較表</span></div><p>あなたの「重視」で、比較をもっと自分向けに。</p><small>最終更新：{LAST_UPDATED}。価格・仕様は変更される場合があります。購入前に各メーカー・販売店の最新情報をご確認ください。</small></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
