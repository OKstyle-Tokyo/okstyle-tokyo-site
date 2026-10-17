# OKstyle LAB & PLAY ― サイト設計書

サイト名: **OKstyle LAB & PLAY**
タグライン: **ワクワクPlayground**
現行サイト: https://okstyle-tokyo.jp/ （WordPress「IOTだよ/OKstyle」・2016〜2023年の個人ブログ）
この設計書は、現行サイトを静的サイトとして作り直すための唯一の仕様です。迷ったらここに戻ること。

---

## 1. コンセプト

個人の趣味サイト。目的は2つで、それぞれ**別の世界**として見せる。

| 世界 | 対象読者 | 中身 | 雰囲気 |
|---|---|---|---|
| **LAB**（技術） | IoT・AI・VRなど技術に興味がある人 | IoT記事・ものづくり・360°VR・SakeTamu（お酒×IoT） | 先進性、ミステリアス、驚き |
| **PLAY**（ゲーム） | ゲーム界隈の人（いまはスプラトゥーン） | プレイ記録・反省動画・実績 | 鮮やか、勢い、祭り |

両方に共通する芯は **「ワクワク感」「楽しさ」**。真面目一辺倒にしない。

---

## 2. 構造

```
/                      トップ（ヒーロー = LAB / PLAY の2入口 ＋ 最新記事）
/lab/                  LAB トップ（カテゴリ別の入口 ＋ 記事一覧）
/lab/<category>/       LAB カテゴリ一覧（iot / monozukuri / vr）
/play/                 PLAY トップ（ジャンル別の入口 ＋ 記事一覧）
/play/<genre>/         PLAY ジャンル一覧（いまは splatoon のみ。後から追加できる構造）
/posts/<id>/           記事ページ（旧サイトの全記事。idはWordPressの投稿ID）
/about/                このサイトについて（短い自己紹介 ＋ SNSリンク）
/archive/              全記事一覧（年別）
```

### 旧カテゴリ → 新カテゴリの対応

旧サイトのカテゴリ名は `content/taxonomy.json` にある。対応はおおむね下記。該当しないものは `content/posts_index.json` の記事タイトルも見て判断し、判断に迷ったものは `docs/category-mapping.md` に一覧で残すこと。

| 旧カテゴリ（例） | 新 | 備考 |
|---|---|---|
| IoT, IoTinfo, IoTthink, IoTreport, IoTbook, IoTchallenge, IoTイベント, IoT News, CEATEC, 東京モーターショー 等 | LAB / iot | 記事の大半 |
| ものづくり研究, SakeTamu, お酒ハック | LAB / monozukuri | SakeTamuはモノづくりに含める |
| 360°VR | LAB / vr | |
| スプラ, スプライフ, Game, ホビー | PLAY / splatoon | ホビーのうちゲーム以外が出てきたら PLAY / other |

---

## 3. ビジュアル

### 共通
- ヘッダー: 左に OKstyle ロゴ（`assets/brand/` の人型ピクト。赤タイル＋白）、その右に「LAB & PLAY」、下に細字で「ワクワクPlayground」。右にナビ（LAB / PLAY / ARCHIVE / ABOUT）
- フッター: 「OKstyle LAB & PLAY — ワクワクPlayground」＋ SNSリンク（X / YouTube / Facebook / LinkedIn / Pinterest / Tumblr）＋「ご連絡はSNSのDMからどうぞ」。問い合わせフォームは作らない
- `<title>`: 「ページ名｜OKstyle LAB & PLAY」。トップだけ「OKstyle LAB & PLAY｜ワクワクPlayground」
- ページ遷移で世界が切り替わる感覚を出す（配色・見出し書体・背景が変わる）
- スマホ優先。横スクロールなし。画像は横幅100%
- フォント: Google Fonts の日本語フォントを使ってよい（LAB=落ち着いたゴシック、PLAY=太い丸ゴシック系）。本文は読みやすさ優先

### LAB（技術）
- ダーク基調（濃紺〜黒）。発光色は1色（シアン系 or 紫系。どちらかに決めて統一）
- 背景に薄いグリッド／粒子／光の筋。動きは控えめ（CSSアニメ程度、重いJS不要）
- 見出しは細めで字間広め。「実験室」「観測」の語感
- LABロゴ: OKstyleの人型ピクトを引き継いだ派生SVG（例: 人型＋軌道・光）。**原案でよい**

### PLAY（ゲーム）
- 明るい地に原色2〜3色（例: イエロー／マゼンタ／ターコイズ）。インク飛沫・斜めの帯・大きな丸ゴシック
- 「お祭り」「ステージ」の勢い。カードは少し傾けてもよい
- PLAYロゴ: 同じ人型ピクトの派生SVG（例: 人型＋インク飛沫）
- **参考にした任天堂のサイトは「雰囲気」だけ**。画像・フォント・ロゴ・キャラクター・固有名詞のデザインは一切使わない。スプラトゥーンの名称は記事本文に残っている分だけでよく、サイトのデザイン要素としては使わない

### トップ
- ヒーロー: 画面を左右（スマホは上下）に割り、左 LAB（ダーク）／右 PLAY（明るい）。それぞれにロゴ・一言・入口ボタン。上に「ようこそ、ワクワクPlaygroundへ」
- その下に最新記事（LAB/PLAY混在・新しい順・8件程度・どちらの世界か一目で分かるラベル付き）

---

## 4. コンテンツの扱い（重要）

- 記事は `content/posts/*.md`。front matter（id, title, date, modified, slug, old_url, categories, tags, featured, excerpt）＋本文は**WordPressのHTMLそのまま**。Markdownに変換しない
- **本文には手を入れない**。見た目（文字サイズ・余白・画像幅・表・コードブロック）だけCSSで整える
- 画像は `images/<年>/<ファイル名>`。本文内の `src="/images/..."` を正しく解決すること（GitHub Pages のサブパス配信に注意、後述）
- `data-missing-image="true"` が付いた `<img>` は取得できなかった画像。**「画像なし」と分かるプレースホルダ**（枠＋テキスト）で表示し、`docs/missing-images.md` に記事とURLの一覧を出力する（`export_report.md` が元データ）
- YouTube: 本文中の `<iframe>` はそのまま。裸のYouTube URLだけの段落があれば `<iframe>` 埋め込みに変換してよい（WordPressのoEmbedの代わり）
- 旧URL（`old_url`）は `docs/redirects.md` に新URLとの対応表を出す（ドメイン切替時のリダイレクト用。今は表だけでよい）
- 今後も記事を足す。`content/posts/` に1ファイル置いてpushすれば増える構造にする。新記事用のテンプレ `content/_template.md` を用意する

---

## 5. 技術

- 静的サイトジェネレーター: **Eleventy (11ty)**。理由: HTML混在のMarkdownをそのまま扱える・Nodeだけで動く・設定が小さい
- ビルド: GitHub Actions → GitHub Pages（`actions/deploy-pages`）。`main` に push で自動デプロイ
- **URL**: 当面は `https://okstyle-tokyo.github.io/okstyle-tokyo-site/` で配信する。サブパスなので Eleventy の `pathPrefix` と `url` フィルタを必ず使い、`/images/...` `/posts/...` などのリンクが全ページで切れないこと。将来は独自ドメイン（okstyle-tokyo.jp）に切り替えるので、pathPrefix は1か所の設定で変えられるようにする
- 外部ライブラリは最小限。フォント以外のCDNは原則使わない
- 秘密情報（APIキー等）は一切置かない。`.env` は `.gitignore` 済み
- 画像は最適化しなくてよい（まず全部出す。軽量化は翌週以降）

---

## 6. 完了の定義（今回）

1. GitHub Pages で **全ページ**（トップ・LAB・PLAY・各一覧・記事275本・about・archive）が表示される
2. 画像が表示される。取得できなかった画像は「画像なし」プレースホルダで表示され、`docs/missing-images.md` に一覧がある
3. YouTube埋め込みが再生できる
4. スマホ幅で横スクロールが出ない
5. `docs/category-mapping.md` と `docs/redirects.md` がある
6. README に「記事の足し方」「ローカルで見る方法」「ドメイン切替時に変える箇所」が書いてある

細部のデザイン調整は翌週以降に行う。今回は「全部見える」を優先。
