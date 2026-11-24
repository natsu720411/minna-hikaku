# みんなの比較表｜無料の週次SEO点検
くらし予報と同じGoogle公式API＋GitHub Actions方式。毎週月曜08:37（日本時間、実行時刻は遅れることがあります）および手動実行。Windsor.aiの有料契約不要。読み取り専用で、自動コミットはしません。

1. くらし予報で使ったGoogleサービスアカウントと手元のJSON鍵を再利用できます。Google CloudでSearch Console APIを有効にしていることを確認。
2. Search Consoleの https://minna-hikaku.vercel.app/ を選び、設定→ユーザーと権限で同サービスアカウントのメールを閲覧権限で追加します。
3. https://github.com/natsu720411/minna-hikaku/settings/secrets/actions で New repository secret を選び、名前 GOOGLE_SERVICE_ACCOUNT_JSON、値にJSON鍵の全内容を登録します。鍵はコード・チャットに貼らないでください。別リポジトリのSecretsは自動共有されません。
4. GA4は任意。同じサービスアカウントを対象プロパティの閲覧者にし、Variablesに数字の GA4_PROPERTY_ID を登録。Analytics Data APIを有効化。G-から始まる測定IDではありません。
5. https://github.com/natsu720411/minna-hikaku/actions/workflows/minna-hikaku-free-seo-audit.yml の Run workflow で手動テスト。認証未設定は設定待ち、APIエラーは失敗として表示します。
6. 公開リポジトリのため、初期設定では検索語・詳細数値は出力せず、公開ページの改善候補のみ表示します。詳細を第三者が閲覧してもよい場合のみ Variables の SEO_PUBLISH_DETAILS=true を設定してください。秘密鍵はどちらの場合も出力しません。

直近3日を除く28日と前28日をサイト全体・クエリ・ページ・クエリ×ページで比較。表示30回以上・順位5〜20位・低CTRまたは表示増の候補を最大5件抽出。GA4は対象ホストの検索・比較・楽天クリックなどのイベント数を集計。成果報酬ではありません。少数表示・公開直後・最近編集したページは慎重に扱い、コード変更は実データと公式商品情報を確認してから行います。GoogleやGitHubが課金を要求する場合は中断してください。
