"""Weekly read-only Google Search Console / GA4 audit for みんなの比較表."""
import json, os, sys
from datetime import datetime, timedelta, date
from pathlib import Path
from collections import defaultdict
from urllib.parse import quote, urlsplit
from urllib.request import Request as HttpRequest, urlopen
from urllib.error import HTTPError, URLError
from zoneinfo import ZoneInfo

SITE="https://minna-hikaku.vercel.app/"
HOST="minna-hikaku.vercel.app"
EVENTS=("finder_open","finder_filter","finder_compare_start","finder_guide_start","comparison_image_save","compare_action","detail_click","rakuten_click","amazon_click","category_click","catalog_filter")
def windows(today=None):
    today=today or datetime.now(ZoneInfo("Asia/Tokyo")).date()
    end=today-timedelta(days=3)
    start=end-timedelta(days=27)
    prev_end=start-timedelta(days=1)
    return ((start,end),(prev_end-timedelta(days=27),prev_end))
def number(x):
    try:return float(x)
    except (ValueError,TypeError):return 0.
def totals(response):
    rows=response.get("rows") or []
    r=rows[0] if rows else {}
    return {k:number(r.get(k)) for k in ("clicks","impressions","ctr","position")}
def indexed(response):
    return {tuple(map(str,row.get("keys") or [])):{k:number(row.get(k)) for k in ("clicks","impressions","ctr","position")}
            for row in response.get("rows") or [] if row.get("keys")}
def candidates(current, previous):
    out=[]
    for keys,now in current.items():
        before=previous.get(keys,{"impressions":0})
        impr=now["impressions"];pos=now["position"]
        if impr<30 or not 5<=pos<=20:continue
        increase=impr-before["impressions"]>=15 and impr>=1.5*max(1,before["impressions"])
        low_ctr=now["ctr"]*100<(2 if pos<=10 else 1)
        if increase or low_ctr:out.append((keys,now,before,"低CTR" if low_ctr else "表示増加"))
    return sorted(out,key=lambda x:-x[1]["impressions"])[:5]
def table(headers, rows):
    return "| "+" | ".join(headers)+" |\n| "+" | ".join(["---"]*len(headers))+" |\n"+"\n".join("| "+" | ".join(map(str,r))+" |" for r in rows)+"\n"
def overview(current,previous):
    return table(["指標","直近28日","前28日"],[
        ["クリック数",round(current["clicks"]),round(previous["clicks"])],
        ["表示回数",round(current["impressions"]),round(previous["impressions"])],
        ["CTR",f'{current["ctr"]*100:.2f}%',f'{previous["ctr"]*100:.2f}%'],
        ["平均掲載順位",f'{current["position"]:.1f}',f'{previous["position"]:.1f}']])
def report_top(current,previous):
    if not current:return "この期間の表示データはありません。\n"
    rows=[]
    for key,val in sorted(current.items(),key=lambda x:-x[1]["impressions"])[:8]:
        before=previous.get(key,{"impressions":0,"clicks":0,"ctr":0,"position":0})
        rows.append([" × ".join(key).replace("|","/"),int(val["clicks"]),int(before["clicks"]),int(val["impressions"]),int(before["impressions"]),f'{val["ctr"]*100:.1f}%',f'{before["ctr"]*100:.1f}%' if before["impressions"] else "—",f'{val["position"]:.1f}',f'{before["position"]:.1f}' if before["impressions"] else "—"])
    return table(["対象","クリック","前期クリック","直近表示","前期表示","CTR","前期CTR","平均順位","前期順位"],rows)
def report_candidates(current,previous):
    hits=candidates(current,previous)
    if not hits:return "基準（表示30回以上・平均順位5〜20位・低CTRまたは表示増加）を満たす候補なし。\n"
    return table(["候補","表示","CTR","順位","理由"],[
       [" × ".join(keys).replace("|","/"),int(val["impressions"]),f'{val["ctr"]*100:.1f}%',f'{val["position"]:.1f}',why] for keys,val,old,why in hits])
def api(url,body,token):
    request=HttpRequest(url,data=json.dumps(body).encode(),method="POST",headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"})
    try:
        with urlopen(request,timeout=45) as r:return json.load(r)
    except HTTPError as e:
        # Never log response bodies, URLs, tokens, JSON credentials or private Google data.
        # Google returns a safe machine-readable failure reason, which narrows down
        # a missing API enablement versus property access without exposing secrets.
        import re
        service = "Search Console" if "/webmasters/v3/" in url else "GA4 Data API"
        reason = ""
        try:
            payload = json.loads(e.read().decode("utf-8"))
            problem = payload.get("error", {})
            errors = problem.get("errors") or []
            details = problem.get("details") or []
            candidates = ([problem.get("status")] +
                [item.get("reason") for item in errors if isinstance(item,dict)] +
                [item.get("reason") for item in details if isinstance(item,dict)])
            reason = next((value for value in candidates
                           if isinstance(value,str) and re.fullmatch(r"[A-Za-z][A-Za-z_]{1,63}",value)), "")
        except (ValueError, UnicodeDecodeError, OSError, TypeError, AttributeError):
            pass
        reason_text = f"（コード: {reason}）" if reason else ""
        if service == "Search Console":
            action = "Search Consoleの対象プロパティ、サービスアカウントの閲覧権限、Search Console APIの有効化を確認してください。"
        else:
            action = "GA4のプロパティ閲覧権限とGoogle Analytics Data APIの有効化を確認してください。"
        raise RuntimeError(f"{service} HTTP {e.code}{reason_text}。{action}") from None
    except URLError:
        service = "Search Console" if "/webmasters/v3/" in url else "GA4 Data API"
        raise RuntimeError(f"{service} に接続できませんでした。") from None
def gsc(token,site,period,dimensions):
    url="https://www.googleapis.com/webmasters/v3/sites/"+quote(site,safe="")+"/searchAnalytics/query"
    return api(url,{"startDate":period[0].isoformat(),"endDate":period[1].isoformat(),"dimensions":dimensions,"type":"web","dataState":"final","rowLimit":2000},token)
def ga4(token,property_id,period,dimensions):
    url=f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"
    return api(url,{"dateRanges":[{"startDate":period[0].isoformat(),"endDate":period[1].isoformat()}],
        "dimensions":[{"name":x} for x in dimensions],"metrics":[{"name":"eventCount"}],"limit":"500",
        "dimensionFilter":{"filter":{"fieldName":"hostName","stringFilter":{"matchType":"EXACT","value":HOST}}}},token)
def ga_rows(resp):
    dims=[x["name"] for x in resp.get("dimensionHeaders") or []]
    data=[]
    for row in resp.get("rows") or []:
        d={k:v.get("value","") for k,v in zip(dims,row.get("dimensionValues") or [])}
        d["eventCount"]=int(number((row.get("metricValues") or [{}])[0].get("value")))
        data.append(d)
    return data
def authenticate():
    encoded=os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON","").strip()
    if not encoded:raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON がGitHub Secretsに未設定です。設定ガイドを確認してください。")
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
        creds=service_account.Credentials.from_service_account_info(json.loads(encoded),scopes=[
            "https://www.googleapis.com/auth/webmasters.readonly","https://www.googleapis.com/auth/analytics.readonly"])
        creds.refresh(Request())
        return str(creds.token)
    except Exception:
        raise RuntimeError("Google認証に失敗しました。JSON形式・API有効化・アカウント権限を確認してください。") from None
def render(cur,prev,whole,data,analytics=None,analytics_error=None):
    output=["# みんなの比較表｜Google公式API 週次SEO点検",
      f"対象：{cur[0]} ～ {cur[1]}（直近3日を除く28日）",
      f"比較：{prev[0]} ～ {prev[1]}（前28日）",
      "検索タイプ：Google ウェブ検索。取得件数にはGoogle側の匿名化・行数制限があります。",
      "## サイト全体",overview(*whole)]
    output.append("公開直後のページは公開前データを含む期間では成果を判定できません。")
    for label,(now,older) in data.items():
        output.extend([f"## {label}｜上位（表示回数順）",report_top(now,older),
            f"### {label}｜検証候補（自動編集しない）",report_candidates(now,older)])
    output.append("少数表示や短期変動だけで本文・タイトルを変更しません。直近14日以内に編集したページは再編集を見送ります。")
    if analytics is None:
        if analytics_error:
            output.append("## GA4｜未取得（Search Consoleの集計は取得済み）\n"+analytics_error+"\nGA4のアクセス権限またはAPI設定が未完了のため、比較・検索イベント数は集計していません。")
        else:
            output.append("## GA4\n未設定のため取得していません。数字のGA4_PROPERTY_IDをGitHub Variablesに追加してください。")
    else:
        now,older=analytics["events"]
        def counts(items):
            r=defaultdict(int)
            for item in ga_rows(items):
                if item.get("eventName") in EVENTS:r[item["eventName"]]+=item["eventCount"]
            return r
        nc,pc=counts(now),counts(older)
        output.extend(["## GA4｜検索・比較・購入先クリック（対象ホスト限定）",
          table(["イベント","直近28日","前28日"],[[event,nc[event],pc[event]] for event in EVENTS])])
        by_page=defaultdict(int)
        for item in ga_rows(analytics["page"]):
            if item.get("eventName")=="rakuten_click":
                by_page[item.get("pagePath","")]+=item["eventCount"]
        output.extend(["### ページ別楽天クリックイベント（上位10件）",
          table(["ページ","イベント数"],sorted(by_page.items(),key=lambda x:-x[1])[:10]),
          "クリックイベントは成果報酬・購入件数ではありません。"])
    output.extend(["## 判断","このワークフローは読み取り専用です。改善候補は人が確認し、必要最小限の編集・テスト・本番確認を経て反映してください。",
       "公開GitHubリポジトリではActionsレポートが第三者に閲覧される可能性があります。個人情報やAPI認証鍵は出力しません。"])
    return "\n\n".join(output)+"\n"
def safe_report(cur,prev,data,analytics,analytics_error):
    # Actions logs and artifacts of a public repository may be publicly visible.
    # Do not print private queries or numerical search/analytics performance by default.
    output=["# みんなの比較表｜週次SEO点検（公開用）",
      f"対象：{cur[0]} ～ {cur[1]} / 比較：{prev[0]} ～ {prev[1]}",
      "Search Consoleの取得成功。詳細な検索語・数値は公開しません。",
      "## 改善候補（最大5ページ）"]
    hits=candidates(*data["ページ"])
    seen=set()
    for keys,_,__,why in hits:
        u=urlsplit(keys[0])
        if u.scheme=="https" and u.netloc==HOST and not u.query and not u.fragment and u.path!="/rakuten/" and u.path not in seen:
            if not __import__("re").fullmatch(r"/[a-zA-Z0-9/_-]*",u.path):continue
            seen.add(u.path)
            output.append(f"- {u.path}：{why}。既存内容と検索意図を確認してから編集。")
    if not seen:output.append("基準を満たす公開ページ候補なし。無理な変更は不要です。")
    output.append("GA4："+("取得成功" if analytics is not None else "未取得（設定または権限を確認）" if analytics_error else "未設定"))
    output.append("読み取り専用。直近14日以内の変更は再編集を見送り、商品情報の確認・ビルド・公開確認を経て改善します。")
    output.append("詳細レポートを公開Actionsに出すには SEO_PUBLISH_DETAILS=true を明示設定してください。検索語や数値が第三者に見える可能性があります。")
    return "\n\n".join(output)+"\n"
def main():
    step=os.environ.get("GITHUB_STEP_SUMMARY")
    try:
        cur,prev=windows()
        token=authenticate()
        site=os.environ.get("GSC_SITE_URL",SITE)
        whole=(totals(gsc(token,site,cur,[])),totals(gsc(token,site,prev,[])))
        data={}
        for name,dims in (("クエリ",["query"]),("ページ",["page"]),("クエリ×ページ",["query","page"])):
            data[name]=(indexed(gsc(token,site,cur,dims)),indexed(gsc(token,site,prev,dims)))
        analytics=None
        analytics_error=None
        prop=os.environ.get("GA4_PROPERTY_ID","").strip()
        if prop:
            if not prop.isdigit():
                analytics_error="GA4_PROPERTY_IDにはG-で始まる測定IDではなく数字のプロパティIDを指定してください。"
            else:
                try:
                    analytics={"events":(ga4(token,prop,cur,["eventName"]),ga4(token,prop,prev,["eventName"])),
                        "page":ga4(token,prop,cur,["eventName","pagePath"])}
                except RuntimeError as e:
                    analytics_error=str(e)
                    print("Search Consoleの取得は成功。GA4は未取得: "+analytics_error,file=sys.stderr)
        report=(render(cur,prev,whole,data,analytics,analytics_error) if os.environ.get('SEO_PUBLISH_DETAILS','').lower()=='true' else safe_report(cur,prev,data,analytics,analytics_error))
        filename=Path(os.environ.get("REPORT_PATH","seo-report.md"))
        filename.write_text(report,encoding="utf-8")
        if step:
            with open(step,"a",encoding="utf-8") as f:f.write(report)
        print("週次SEO点検完了。レポートをGitHub Actionsに保存しました。")
        return 0
    except RuntimeError as e:
        message="## 週次SEO点検：データ取得不可\n\n"+str(e)+"\n\n今回は実データが得られず、サイトの変更も行っていません。\n"
        if step:
            with open(step,"a",encoding="utf-8") as f:f.write(message)
        print(str(e),file=sys.stderr)
        return 1
if __name__=="__main__":raise SystemExit(main())
