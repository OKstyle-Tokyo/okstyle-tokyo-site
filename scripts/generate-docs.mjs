// docs/ の対応表を content/posts/ から生成する。記事を足したら `npm run docs` で更新できる。
//   docs/category-mapping.md … 旧カテゴリ → 新しい世界 / カテゴリ（全記事）
//   docs/redirects.md        … 旧URL → 新URL（ドメイン切替時のリダイレクト用）
//   docs/missing-images.md   … 取得できなかった画像（data-missing-image="true"）の一覧
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import site from "../src/_data/site.js";
import { classifyPost, getSection, WORLDS, SECTIONS, PRIORITY } from "../lib/taxonomy.js";

const root = path.resolve(import.meta.dirname, "..");
const postsDir = path.join(root, "content/posts");
const docsDir = path.join(root, "docs");

const posts = fs
  .readdirSync(postsDir)
  .filter((f) => f.endsWith(".md"))
  .map((file) => {
    const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
    const { data, content } = matter(raw);
    return { file, data, content, placement: classifyPost(data) };
  })
  .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));

const newPath = (p) => `/posts/${p.data.id ?? path.basename(p.file, ".md")}/`;
const prefix = site.pathPrefix.replace(/\/+$/, "");
const pagesUrl = (p) => `${site.url}${prefix}${p}`;
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const day = (d) => String(d ?? "").slice(0, 10);

// ---------------------------------------------------------------- category-mapping.md
{
  const counts = {};
  for (const p of posts) counts[p.placement.section] = (counts[p.placement.section] || 0) + 1;

  const combos = new Map();
  for (const p of posts) {
    const key = (p.data.categories || []).join(" + ") || "（なし）";
    const v = combos.get(key) || { count: 0, placement: p.placement };
    v.count++;
    combos.set(key, v);
  }

  const review = posts.filter((p) => {
    const c = p.data.categories || [];
    return p.placement.fallback || (c.includes("360°VR") && c.includes("IoT"));
  });

  let md = `# カテゴリ対応表（旧カテゴリ → LAB / PLAY）

\`npm run docs\` で \`content/posts/\` から自動生成しています（手で編集しない）。
ルールは \`lib/taxonomy.js\`、方針は DESIGN.md 2章。

## ルール

記事が複数の旧カテゴリを持つときは、下の表の**上にあるものを優先**して主カテゴリを1つに決めます。
「沖縄［OKinawa］」は主カテゴリにせず、記事ページで「#沖縄」タグとして表示します。
新しい記事は front matter の \`section:\`（例: \`section: iot\`）で直接指定できます。

| 優先 | 旧カテゴリ | 新（世界 / カテゴリ） | URL | 件数 |
|---|---|---|---|---|
${PRIORITY.map((r, i) => {
  const s = getSection(r.section);
  return `| ${i + 1} | ${r.oldCategories.join(", ")} | ${WORLDS[s.world].name} / ${s.slug}（${s.name}） | \`/${s.world}/${s.slug}/\` | ${counts[s.slug] || 0} |`;
}).join("\n")}
| – | 沖縄［OKinawa］ | （主カテゴリにしない → タグ「沖縄」） | – | – |

合計: ${posts.length} 本（LAB ${posts.filter((p) => p.placement.world === "lab").length} / PLAY ${posts.filter((p) => p.placement.world === "play").length}）

## 旧カテゴリの組み合わせ別

| 旧カテゴリの組み合わせ | 件数 | → 新 |
|---|---|---|
${[...combos.entries()]
  .sort((a, b) => b[1].count - a[1].count)
  .map(([k, v]) => `| ${cell(k)} | ${v.count} | ${WORLDS[v.placement.world].name} / ${v.placement.section} |`)
  .join("\n")}

## 判断メモ（確認してほしい記事）

ルールどおりに振り分けたうえで、迷いが出そうなものを挙げます。違和感があれば \`section:\` を front matter に書けば個別に上書きできます。

- **「360°VR」と「IoT」の両方を持つ記事**（${posts.filter((p) => (p.data.categories || []).includes("360°VR") && (p.data.categories || []).includes("IoT")).length} 本）: 優先順により **LAB / vr** にしています。
- **主カテゴリを決められなかった記事**: ${posts.filter((p) => p.placement.fallback).length} 本${posts.some((p) => p.placement.fallback) ? "（LAB / iot に仮置き）" : ""}
- PLAY の「Game」「ホビー」は4本とも両方のカテゴリを持っており、すべて PLAY / splatoon です。

${
  review.length
    ? `| id | 日付 | タイトル | 旧カテゴリ | → 新 |
|---|---|---|---|---|
${review.map((p) => `| ${p.data.id} | ${day(p.data.date)} | ${cell(p.data.title)} | ${cell((p.data.categories || []).join(", "))} | ${p.placement.world} / ${p.placement.section} |`).join("\n")}`
    : ""
}

## 全記事の対応表（新しい順）

| id | 日付 | タイトル | 旧カテゴリ | 世界 | 新カテゴリ | 決め手 |
|---|---|---|---|---|---|---|
${posts
  .map(
    (p) =>
      `| ${p.data.id} | ${day(p.data.date)} | ${cell(p.data.title)} | ${cell((p.data.categories || []).join(", "))} | ${WORLDS[p.placement.world].name} | ${p.placement.section} | ${cell(p.placement.rule)} |`,
  )
  .join("\n")}
`;
  fs.writeFileSync(path.join(docsDir, "category-mapping.md"), md);
}

// ---------------------------------------------------------------- redirects.md
{
  const oldPath = (u) => {
    try {
      return decodeURI(new URL(u).pathname);
    } catch {
      return u;
    }
  };
  let md = `# 旧URL → 新URL 対応表

\`npm run docs\` で自動生成しています。独自ドメイン（okstyle-tokyo.jp）へ切り替えるときのリダイレクト設定の元データです。
今は表だけで、リダイレクトの仕組みはまだ入れていません。

- 旧: WordPress のパーマリンク（\`https://okstyle-tokyo.jp/<slug>\`）
- 新: \`/posts/<WordPressの投稿ID>/\`
  - いま（GitHub Pages）: \`${site.url}${prefix}/posts/<id>/\`
  - 独自ドメイン切替後: \`https://okstyle-tokyo.jp/posts/<id>/\`

## 記事（${posts.length} 本）

| id | 旧パス | 新パス | タイトル |
|---|---|---|---|
${posts.map((p) => `| ${p.data.id} | \`${cell(oldPath(p.data.old_url))}\` | \`${newPath(p)}\` | ${cell(p.data.title)} |`).join("\n")}

## カテゴリ・固定ページ（参考・要確認）

旧サイトのカテゴリ一覧や固定ページのURL形式は書き出しデータに含まれていないため、下は WordPress の標準形式（\`/category/<slug>/\`）を仮定した対応です。実際のURLを確認してから使ってください。

| 旧（推定） | 新 |
|---|---|
${[
  ["/category/iot/", "/lab/iot/"],
  ["/category/manufacturing-research/", "/lab/monozukuri/"],
  ["/category/iot-wearable-saketamu/", "/lab/monozukuri/"],
  ["/category/360vr/", "/lab/vr/"],
  ["/category/okinawa/", "/lab/vr/（沖縄タグの記事が多い）"],
  ["/category/hobby/", "/play/splatoon/"],
  ["/category/hobby/game/", "/play/splatoon/"],
  ["/お問い合わせ", "/about/"],
  ["/ホームページ", "/about/"],
]
  .map(([a, b]) => `| \`${a}\` | \`${b}\` |`)
  .join("\n")}

## CSV（リダイレクト設定に貼り付ける用）

\`\`\`csv
old_url,new_path
${posts.map((p) => `${p.data.old_url},${newPath(p)}`).join("\n")}
\`\`\`
`;
  fs.writeFileSync(path.join(docsDir, "redirects.md"), md);
}

// ---------------------------------------------------------------- missing-images.md
{
  const rows = [];
  for (const p of posts) {
    const re = /<img\b[^>]*\bdata-missing-image=(["'])true\1[^>]*>/gi;
    let m;
    while ((m = re.exec(p.content))) {
      const tag = m[0];
      const attr = (n) => (tag.match(new RegExp(`\\s${n}\\s*=\\s*(["'])(.*?)\\1`, "i")) || [])[2] || "";
      rows.push({ p, src: attr("data-original-src") || attr("src"), alt: attr("alt") });
    }
  }
  const report = fs.existsSync(path.join(docsDir, "export-report.md"))
    ? fs.readFileSync(path.join(docsDir, "export-report.md"), "utf8")
    : "";
  const externalCount = (report.match(/外部画像（URLのまま）:\s*(\d+)/) || [])[1];
  const reportSection = (report.split(/^## 画像なし.*$/m)[1] || "").trim();

  let md = `# 画像なし（取得できなかった画像）一覧

\`npm run docs\` で自動生成しています。元データは記事本文の \`data-missing-image="true"\` と \`docs/export-report.md\`。
サイト上では、これらの画像は「画像なし」と書かれた枠（プレースホルダ）で表示されます。

- 記事本文で見つかった件数: **${rows.length} 件**
- 書き出しレポート（export-report.md）の「画像なし」欄: ${reportSection ? `「${reportSection.split("\n")[0]}」` : "（記載なし）"}

${
  rows.length
    ? `| 記事 | タイトル | 元の画像URL | alt |
|---|---|---|---|
${rows.map((r) => `| ${r.p.data.id} | ${cell(r.p.data.title)} | ${cell(r.src)} | ${cell(r.alt)} |`).join("\n")}`
    : `今回の書き出しでは取得できなかった画像は **0 件** でした（記事本文に \`data-missing-image="true"\` の画像はありません）。
今後、記事に \`data-missing-image="true"\` 付きの \`<img>\` が入ったら、ここに一覧が出ます。`
}

## 参考: 外部サイトの画像

本文には、旧サイトの外（他社サイトなど）にある画像がURLのまま残っています${externalCount ? `（書き出しレポートでは ${externalCount} 件）` : ""}。
これらは取得対象外で、リンク先のサイト側の都合で表示されなくなることがあります。
`;
  fs.writeFileSync(path.join(docsDir, "missing-images.md"), md);
}

console.log(`docs を更新しました（記事 ${posts.length} 本 / セクション ${SECTIONS.length}）`);
