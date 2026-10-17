# OKstyle LAB & PLAY — ワクワクPlayground

okstyle-tokyo.jp（WordPress「IOTだよ/OKstyle」）を静的サイトに作り直すプロジェクト。
仕様は `DESIGN.md`。記事データは `content/`、画像は `images/`。

- 公開先（当面）: https://okstyle-tokyo.github.io/okstyle-tokyo-site/
- 静的サイトジェネレーター: [Eleventy](https://www.11ty.dev/) 3
- `main` に push すると GitHub Actions でビルドされ、GitHub Pages に公開されます（`.github/workflows/deploy.yml`）

---

## ローカルで見る方法

必要なもの: **Node.js 20.11 以上**（22 推奨）。Windows の PowerShell でも同じコマンドで動きます。

```bash
npm ci          # 初回だけ（依存パッケージのインストール）
npm start       # 開発サーバーを起動
```

起動したらブラウザで **http://localhost:8080/okstyle-tokyo-site/** を開きます
（GitHub Pages と同じサブパス付きで表示されます）。ファイルを保存すると自動で再読み込みされます。終了は `Ctrl + C`。

そのほかのコマンド:

| コマンド | 内容 |
|---|---|
| `npm run build` | `_site/` に本番と同じファイルを書き出す |
| `npm run check` | `_site/` を点検（全記事ページの有無・本文が元のまま出ているか・内部リンクと画像の切れ） |
| `npm run docs` | `docs/category-mapping.md` `docs/redirects.md` `docs/missing-images.md` を作り直す |

> `npm run build` を繰り返すと、消した記事の古いページが `_site/` に残ることがあります。気になるときは `_site/` を消してからビルドしてください（GitHub Actions では毎回まっさらな状態でビルドされます）。

---

## 記事の足し方

1. `content/_template.md` をコピーして `content/posts/<id>.md` を作る（例: `content/posts/6001.md`）
2. front matter（先頭の `---` で囲まれた部分）を書き換える
   - `id` … URL が `/posts/<id>/` になる。他と重ならない数字（旧記事は最大 5048 なので、6001 から順に使うのがおすすめ）
   - `title` / `date`（日本時間, 例 `"2026-10-18T21:00:00"`）
   - `section` … 載せる場所。`iot` / `monozukuri` / `vr`（LAB）、`splatoon`（PLAY）
   - `format: markdown` … 本文を Markdown で書くとき。消すと本文は HTML としてそのまま出力されます
   - `featured` … 一覧カードのサムネイル（任意）、`tags`、`excerpt`（一覧に出る短い説明）
3. 画像は `images/<年>/` に置き、本文では `/images/<年>/<ファイル名>` と書く（サブパスは自動で付きます）
4. YouTube は URL だけの行（段落）を書くと埋め込みになります
5. `npm start` で確認 → commit → `main` に push で公開

記事を足したら `npm run docs` で docs の対応表も更新しておくと便利です。

### PLAY のジャンル（LAB のカテゴリ）を増やすとき

`lib/taxonomy.js` の `SECTIONS` に1件足すだけで、`/play/<genre>/` のページと PLAY トップの入口が増えます。
その後、記事の front matter に `section: <新しいslug>` と書きます。

---

## 独自ドメインに切り替えるときに変える箇所

URL の設定は **`src/_data/site.js` の2行だけ**にまとめてあります。

```js
// いま（GitHub Pages のサブパス配信）
url: "https://okstyle-tokyo.github.io",
pathPrefix: "/okstyle-tokyo-site/",

// 独自ドメインに切り替えた後
url: "https://okstyle-tokyo.jp",
pathPrefix: "/",
```

テンプレートは Eleventy の `url` フィルタ、記事本文はビルド時の変換（`lib/content.js`）で pathPrefix を付けているので、
ここを変えれば全ページのリンク・画像・CSS の URL が切り替わります。ほかに必要な作業:

1. GitHub のリポジトリ → **Settings → Pages → Custom domain** に `okstyle-tokyo.jp` を入れて保存し、「Enforce HTTPS」をオンにする
2. ドメインの DNS を GitHub Pages に向ける（GitHub のドキュメント「Managing a custom domain for your GitHub Pages site」の値を使う）
3. 旧 WordPress の URL（`https://okstyle-tokyo.jp/<slug>`）から新 URL（`/posts/<id>/`）への転送を用意する。対応表は `docs/redirects.md`
   （GitHub Pages はサーバー側のリダイレクトができないので、転送用ページを生成するか、Cloudflare などの転送ルールを使う。方式は未決定）
4. `npm run docs` で `docs/redirects.md` を作り直す（表に出る URL が新しいドメインになる）

---

## ディレクトリ構成

```
content/posts/*.md          記事（front matter ＋ WordPress の HTML 本文そのまま）
content/posts/posts.11tydata.js  記事共通の設定（URL・レイアウト・LAB/PLAY の振り分け）
content/_template.md        新しい記事のテンプレート（ビルド対象外）
content/pages/              旧サイトの固定ページ（参考資料。ビルド対象外）
images/                     記事の画像（そのまま公開）
lib/taxonomy.js             LAB / PLAY とカテゴリの定義、旧カテゴリからの振り分けルール
lib/content.js              記事本文の出力処理（YouTube 埋め込み・画像なし表示・pathPrefix）
src/_data/site.js           サイト設定（URL / pathPrefix / SNS）
src/_includes/              レイアウトと部品（Nunjucks）
src/pages/                  トップ・LAB・PLAY・各一覧・ARCHIVE・ABOUT・404
src/assets/css/site.css     見た目（LAB / PLAY の世界の切り替えもここ）
src/assets/img/             ロゴ（OKstyle マーク・LAB / PLAY の派生ロゴ原案）
scripts/                    点検（check-site.mjs）と docs 生成（generate-docs.mjs）
docs/                       カテゴリ対応表・リダイレクト表・画像なし一覧・書き出しレポート
```

## 記事本文の扱い

旧記事の本文は WordPress の HTML をそのまま出力しています（Markdown として解釈しない）。ビルド時に行う変換は次の3つだけで、元のファイルは書き換えません。

- 裸の YouTube URL だけの段落 → `<iframe>` 埋め込み（WordPress の oEmbed の代わり）
- `data-missing-image="true"` の画像 → 「画像なし」プレースホルダ
- `/images/...` などのルート相対 URL → pathPrefix を付ける

見た目（文字サイズ・余白・画像幅・表・埋め込み）は `src/assets/css/site.css` の `.entry` 以下で整えています。
