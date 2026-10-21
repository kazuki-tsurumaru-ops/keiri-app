# REConos 経理

請求書の発行状況・外注の請求書・カードと口座の明細をまとめて見る Web アプリ（スマホ優先、PC 対応）。

- ログイン: Google のみ（`ALLOWED_EMAILS` で会社のドメインに限定）
- 実行環境: Cloudflare Workers（画面も同じ Worker から配信）
- データ: Cloudflare D1
- AI: Cloudflare Workers AI（既定 `@cf/meta/llama-3.3-70b-instruct-fp8-fast`、`wrangler.toml` の `AI_MODEL` で変更可）

## 画面

| 画面 | できること |
|---|---|
| ホーム | 期（7月始まり）ごとの売上・外注費・経費・残り、目標の達成率、前期比、月ごとのグラフ（押すと内訳）、要対応、経費の科目別 |
| 請求書 | 「株式会社ABCに25万円」のような文から請求書の依頼を作る（AI が読み取り）。作成待ち → 作成済み → 送付待ち → 請求済 → 入金済 の状態管理。口座の入金と請求額が一致したものを入金済の候補に出す |
| 明細 | 法人AMEX・兼用AMEX・法人口座・デビットの明細を月・種類で絞り込み、科目を選ぶ（同じ利用先に次から当てる）。AI で科目の候補を出す |
| 外注 | 外注先からの請求書（何月分・税抜の本体・Drive のリンク） |
| その他 | CSV・集計（data.json）・科目のルールの取り込み、目標、ログアウト |
| AI に聞く | 期の数字だけを根拠に答える |

全画面スケルトンローディング、リキッドグラスの素材、ばねの動き（タブ・切り替え・下から出る板をつまんで閉じる）、数字のカウントアップ、グラフの伸び、視差を抑える設定（`prefers-reduced-motion`）への対応を入れている。

## 数字の決まり

- 期: 第1期 = 2023年7月〜2024年6月
- 月ごとの数字は、取り込んだ集計（売上ダッシュボードの数字 data.json）がある月はそれを使い、無い月だけアプリに入った請求書・外注・明細から計算する
- 売上は税抜・発行日の月。外注費は請求書に書かれた「何月分」
- 経費は「経費合計（科目別）」の21科目だけ。私用・税金・役員への支払い・借入金の返済・貸付金・口座からの外注費は入れない
- 明細の重なり: 同じファイル内の同じ行は別の行、別のファイルどうしで重なった行は一度だけ数える

## 請求書の作成とメールの下書き（Mac 側）

INVOY での作成・PDF・Drive への保存・info@ の Gmail 下書きは、これまでどおり Mac の仕組み（Claude Code の請求書くん）が行う。アプリで依頼すると「作成待ち」に入り、Mac 側は次の API で受け取って結果を書き戻す。

```
GET  /api/agent/requests          作成待ちの一覧
PUT  /api/agent/invoices/:id      {"status":"draft","number":"…","drive_url":"…"} など
POST /api/agent/vendors           外注の請求書を足す
POST /api/agent/summary           data.json を取り込む
```

`Authorization: Bearer <AGENT_TOKEN>` が要る（`wrangler secret put AGENT_TOKEN`）。

## 公開手順

```bash
npm install
npx wrangler d1 create keiri-app        # 出てきた database_id を wrangler.toml に書く
npm run db:remote
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put AGENT_TOKEN
npm run deploy
```

Google Cloud Console の OAuth クライアント（ウェブアプリケーション）で、承認済みのリダイレクト URI に `https://<公開URL>/auth/callback` を足す。

## 手元で動かす

```bash
npm install
npm run db:local
echo "DEV_LOGIN=1" > .dev.vars
node tools/demo-seed.mjs > .wrangler/demo.sql && npx wrangler d1 execute keiri-app --local -c wrangler.local.toml --file .wrangler/demo.sql
npm run dev
```

`http://localhost:8788/auth/dev` で確認用ログイン（手元で `DEV_LOGIN=1` のときだけ有効）。架空のデータで画面を確かめられる。手元では AI をつながない。

## 科目のルール

利用先ごとの科目と口座のルールは、利用先や振込先の名前を含むのでリポジトリに入れない。`python3 -I tools/export-rules.py` で `private/rules.json` に書き出し、アプリの「その他 → 科目のルール」から取り込む。
