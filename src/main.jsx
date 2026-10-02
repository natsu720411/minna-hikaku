import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { earphones, criteria } from './data/earphones';
import './style.css';

const budgets = [
  { label: '5,000円以下', value: 5000 },
  { label: '10,000円以下', value: 10000 },
  { label: '20,000円以下', value: 20000 },
  { label: '30,000円以下', value: 30000 },
  { label: '予算は決めていない', value: Infinity },
];

const quickPresets = [
  { label: 'コスパ重視', icon: '💰', primary: 'value', budget: 20000 },
  { label: '通勤・通学', icon: '🚃', primary: 'noiseCancel', budget: Infinity },
  { label: '音質重視', icon: '🎵', primary: 'sound', budget: Infinity },
  { label: 'バッテリー重視', icon: '🔋', primary: 'battery', budget: Infinity },
  { label: '1万円以下', icon: '🏷️', primary: 'value', budget: 10000 },
  { label: '運動向け', icon: '🏃', primary: 'fit', budget: Infinity },
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

  const startPreset = (preset) => {
    setPrimary(preset.primary);
    setBudget(preset.budget);
    setWeights(initialWeights);
    setStep(4);
    setTimeout(() => document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' }), 30);
  };

  const toggleCompare = (id) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const selectedItems = earphones.filter((item) => selected.includes(item.id));

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
          <a href="#results">比較結果</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">EARPHONES COMPARISON</p>
            <h1>あなたの重視ポイントで、<br /><span>ランキングが変わる。</span></h1>
            <p className="hero-text">価格・音質・ノイキャン・バッテリー。人によって「いいイヤホン」は違うから、あなたの条件から比較します。</p>
            <button className="primary-btn" onClick={() => { setStep(1); document.querySelector('#quiz')?.scrollIntoView({ behavior: 'smooth' }); }}>
              3問で比較をはじめる <span>→</span>
            </button>
            <div className="trust-row"><span>✓ 登録不要</span><span>✓ 約30秒</span><span>✓ 条件で順位が変化</span></div>
          </div>
          <div className="hero-card">
            <div className="mini-label">あなた向け TOP 3</div>
            {ranking.slice(0, 3).map((item, index) => (
              <div className="mini-rank" key={item.id}>
                <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                <div className="product-icon">{item.accent}</div>
                <div><b>{item.name}</b><small>{item.brand}</small></div>
                <strong>{item.match}<small>点</small></strong>
              </div>
            ))}
            <div className="mini-note">条件を変えるとランキングもリアルタイムで変わります。</div>
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

          {step === 3 && <div className="question-card"><p className="question-number">QUESTION 3</p><h3>ほかの条件も調整する</h3><p className="subcopy">重要度を0〜3で調整できます。迷ったらそのままでOK。</p><div className="weight-list">{criteria.map((c) => <div className="weight-row" key={c.key}><span>{c.icon} {c.label}</span><div className="weight-buttons">{[0,1,2,3].map((value) => <button key={value} className={weights[c.key] === value ? 'active' : ''} onClick={() => setWeights((w) => ({ ...w, [c.key]: value }))}>{['不要','普通','重視','最重視'][value]}</button>)}</div></div>)}</div><div className="quiz-actions"><button className="ghost-btn" onClick={() => setStep(2)}>戻る</button><button className="primary-btn" onClick={() => { setStep(4); setTimeout(() => document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' }), 30); }}>結果を見る →</button></div></div>}
        </section>

        <section id="results" className="section results-section">
          <div className="result-intro">
            <p className="eyebrow">YOUR RANKING</p>
            <h2>あなたは「<span>{primaryLabel}重視</span>」タイプ</h2>
            <p>選んだ条件をもとに比較しました。点数は製品の絶対評価ではなく、あなたの条件との相性です。</p>
          </div>

          <div className="ranking-list">
            {ranking.length ? ranking.map((item, index) => (
              <article className="rank-card" key={item.id}>
                <div className="rank-index"><span>{index + 1}</span><small>位</small></div>
                <div className="big-product-icon">{item.accent}</div>
                <div className="rank-main">
                  <div className="brand">{item.brand}</div>
                  <h3>{item.name}</h3>
                  <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <p className="reason">{primaryLabel}を重視した条件で高得点。{item.price <= 10000 ? '価格も抑えやすく、初めての1台にも候補です。' : '総合バランスも高く、長く使いやすい候補です。'}</p>
                </div>
                <div className="match-box"><strong>{item.match}</strong><span>/ 100</span><small>あなたとの相性</small></div>
                <div className="rank-actions"><button className={selected.includes(item.id) ? 'compare-btn selected' : 'compare-btn'} onClick={() => toggleCompare(item.id)}>{selected.includes(item.id) ? '✓ 比較中' : '+ 比較する'}</button><div className="price">¥{item.price.toLocaleString()}<small>参考価格</small></div></div>
              </article>
            )) : <div className="no-result"><h3>この予算に合う商品がありません</h3><p>予算を上げてもう一度試してください。</p></div>}
          </div>
        </section>

        {selectedItems.length > 0 && <section className="compare-panel"><div className="compare-title"><div><p className="eyebrow">COMPARE</p><h2>選んだ商品を比較</h2></div><span>{selectedItems.length}/3商品</span></div><div className="table-scroll"><table><thead><tr><th>比較項目</th>{selectedItems.map((item) => <th key={item.id}>{item.name}</th>)}</tr></thead><tbody><tr><td>参考価格</td>{selectedItems.map((item) => <td key={item.id}>¥{item.price.toLocaleString()}</td>)}</tr><tr><td>音質</td>{selectedItems.map((item) => <td key={item.id}>{item.scores.sound}点</td>)}</tr><tr><td>ノイキャン</td>{selectedItems.map((item) => <td key={item.id}>{item.scores.noiseCancel}点</td>)}</tr><tr><td>バッテリー</td>{selectedItems.map((item) => <td key={item.id}>{item.batteryHours}時間</td>)}</tr><tr><td>防水</td>{selectedItems.map((item) => <td key={item.id}>{item.waterRating}</td>)}</tr><tr><td>コスパ</td>{selectedItems.map((item) => <td key={item.id}>{item.scores.value}点</td>)}</tr></tbody></table></div></section>}

        <section id="how" className="section how-section">
          <div className="section-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>比較の仕組み</h2></div></div>
          <div className="how-grid"><div><span>01</span><h3>予算を決める</h3><p>候補を予算内の商品に絞り込みます。</p></div><div><span>02</span><h3>重視ポイントを選ぶ</h3><p>あなたが大事にする項目の比重を高くします。</p></div><div><span>03</span><h3>相性順に並べる</h3><p>条件ごとのスコアから、あなた向けの順番を作ります。</p></div></div>
        </section>
      </main>

      <footer><div className="logo"><span className="logo-mark">✓</span><span>みんなの比較表</span></div><p>あなたの「重視」で、比較をもっと自分向けに。</p><small>※ 表示価格・評価はデモデータです。実際の商品情報は今後更新予定です。</small></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
