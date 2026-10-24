(() => {
  'use strict';
  const name = (new URLSearchParams(location.search).get('q')||'').trim().slice(0,120);
  const status = document.getElementById('rakuten-status');
  const desc = document.getElementById('rakuten-help');
  const product = document.getElementById('rakuten-product');
  const retry = document.getElementById('rakuten-retry');
  if (!status || !desc || !product || !retry) return;
  product.textContent=name||'商品名が指定されていません';
  let working = false;
  const check = async () => {
    if (working || !name) return;
    const lookup=window.minnaRakutenMediaLookup;
    if (typeof lookup!=='function') {
      status.textContent='楽天の照合機能を読み込めませんでした';
      desc.textContent='通信状況を確認してから再読み込みしてください。';
      retry.hidden=false;
      return;
    }
    working=true;
    retry.hidden=true;
    status.textContent='楽天の正規アフィリエイトURLを確認しています…';
    desc.textContent='商品名と型番が一致する販売ページだけを開きます。';
    try {
      const result=await lookup(name);
      let affiliate=null;
      try {
        const url=new URL(result?.affiliateUrl||'');
        if(result?.provider==='rakuten' && result?.isAffiliate===true &&
           url.protocol==='https:' && url.hostname==='hb.afl.rakuten.co.jp') affiliate=url.toString();
      } catch {}
      if (affiliate) {
        status.textContent='正規のアフィリエイトリンクを確認しました';
        desc.textContent='楽天市場に移動します。';
        location.replace(affiliate);
        return;
      }
      status.textContent='この商品の成果報酬付きURLは確認できませんでした';
      desc.textContent='楽天の商品が見つからない、型番が一致しない、またはAPIの一時的なエラーが考えられます。別の商品への誘導や、通常リンクを成果報酬付きとして表示することはありません。';
    } catch {
      status.textContent='楽天の照合中に通信エラーが発生しました';
      desc.textContent='しばらくしてから再試行してください。';
    } finally { working=false;retry.hidden=false; }
  };
  retry.addEventListener('click',check);
  if(name)check();
  else {status.textContent='商品を指定してください';desc.textContent='比較サイトの商品ページから楽天リンクを選択してください。'}
})();