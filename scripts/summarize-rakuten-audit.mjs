import fs from 'node:fs';
import path from 'node:path';
const dir=process.argv[2]||'rakuten-bulk-results';
const files=fs.readdirSync(dir).filter(f=>/^rakuten-audit-shard-\d+\.json$/.test(f)).sort();
if(files.length!==4)throw Error('Expected four complete shard reports; got '+files.length);
const data=files.map(file=>JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')));
for(const shard of data)if(!shard.summary.complete)throw Error('An audit shard was incomplete');
const entries=data.flatMap(d=>d.records);
if(entries.length!==430||new Set(entries.map(r=>r.url)).size!==430)throw Error('Incomplete or duplicate product coverage: '+entries.length);
entries.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name,'ja'));
const categories=Object.fromEntries([...new Set(entries.map(r=>r.category))].sort().map(cat=>{
  const rows=entries.filter(r=>r.category===cat);
  return [cat,{
    total:rows.length,
    tracked:rows.filter(r=>r.hasAffiliate).length,
    image:rows.filter(r=>r.hasImage).length,
    no_match:rows.filter(r=>r.state==='no_match').length,
    errors:rows.filter(r=>/^(api_error|network_error|rate_limited)$/.test(r.state)).length,
  }];
}));
const status=Object.fromEntries([...new Set(entries.map(x=>x.state))].sort().map(state=>[state,entries.filter(x=>x.state===state).length]));
const summary={date:new Date().toISOString(),total:entries.length,confirmedAffiliate:entries.filter(r=>r.hasAffiliate).length,confirmedImage:entries.filter(r=>r.hasImage).length,unconfirmedAffiliate:entries.filter(r=>!r.hasAffiliate).length,status,categories};
fs.writeFileSync('rakuten-full-audit.json',JSON.stringify({summary,items:entries},null,2));
const csvEscape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const columns=['category','id','name','url','state','http','hasImage','hasAffiliate'];
fs.writeFileSync('rakuten-full-audit.csv',columns.join(',')+'\n'+entries.map(item=>columns.map(key=>csvEscape(item[key])).join(',')).join('\n')+'\n');
let md='# 楽天アフィリエイト全430商品監査\n\n';
md+='確認日: '+summary.date+'\n\n';
md+='| 項目 | 件数 |\n|---|---:|\n| 全商品 | '+summary.total+' |\n| アフィリエイトURL確認 | '+summary.confirmedAffiliate+' |\n| 商品画像確認 | '+summary.confirmedImage+' |\n| アフィリエイトURL未確認 | '+summary.unconfirmedAffiliate+' |\n\n';
md+='※ アフィリエイトURLの取得成功は、実際の成果報酬発生を保証しません。\n\n';
md+='| カテゴリ | 商品数 | リンク取得 | 画像取得 | 一致なし | API/通信エラー |\n|---|---:|---:|---:|---:|---:|\n';
for(const [name,row] of Object.entries(categories))md+='| '+name+' | '+row.total+' | '+row.tracked+' | '+row.image+' | '+row.no_match+' | '+row.errors+' |\n';
md+='\n## 未取得商品（商品名 / 状態）\n\n';
for(const item of entries.filter(r=>!r.hasAffiliate))md+='- '+item.category+'：'+item.name+' — '+item.state+'\n';
fs.writeFileSync('rakuten-full-audit.md',md);
console.log(JSON.stringify(summary,null,2));
const step=process.env.GITHUB_STEP_SUMMARY;
if(step)fs.appendFileSync(step,md.slice(0,60_000));
