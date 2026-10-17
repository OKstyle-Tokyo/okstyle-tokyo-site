import fs from "node:fs";
import site from "./src/_data/site.js";
import { classifyPost, getSection } from "./lib/taxonomy.js";
import { renderPostBody, findYouTubeIds } from "./lib/content.js";

export default function (eleventyConfig) {
  // ---- 記事本文: Markdown 変換せず WordPress の HTML をそのまま出す（lib/content.js 参照）
  eleventyConfig.setLibrary("md", {
    render: (str, data) => renderPostBody(str, data, site.pathPrefix),
    set() {},
    disable() {},
  });

  // ---- テンプレート対象外
  for (const p of [
    "README.md",
    "DESIGN.md",
    "docs/**",
    "content/pages/**",
    "content/_template.md",
    "assets/**",
    "images/**",
    "scripts/**",
    "lib/**",
    ".github/**",
  ]) {
    eleventyConfig.ignores.add(p);
  }

  // ---- そのままコピーするファイル
  eleventyConfig.addPassthroughCopy({ images: "images" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("./lib/");

  // ---- コレクション
  eleventyConfig.addCollection("articles", (api) => {
    const items = api.getFilteredByGlob("./content/posts/*.md").sort(byDateDesc);
    for (const item of items) {
      const placement = classifyPost(item.data);
      if (placement.fallback) {
        console.warn(
          `[okstyle] ${item.inputPath}: 主カテゴリを決められないため LAB / ${placement.section} に入れました。front matter に section: を書いてください。`,
        );
      }
    }
    return items;
  });

  // ---- フィルタ
  eleventyConfig.addFilter("byWorld", (items, world) =>
    (items || []).filter((item) => classifyPost(item.data).world === world),
  );
  eleventyConfig.addFilter("bySection", (items, slug) =>
    (items || []).filter((item) => classifyPost(item.data).section === slug),
  );
  eleventyConfig.addFilter("placement", (data) => classifyPost(data));
  eleventyConfig.addFilter("sectionInfo", (slug) => getSection(slug));
  // 同じ世界の中での前後の記事（items は新しい順）
  eleventyConfig.addFilter("neighbors", (items, url) => {
    const i = (items || []).findIndex((item) => item.url === url);
    return i < 0 ? {} : { newer: items[i - 1], older: items[i + 1] };
  });
  eleventyConfig.addFilter("head", (items, n) => (items || []).slice(0, n));
  eleventyConfig.addFilter("skip", (items, n) => (items || []).slice(n));

  eleventyConfig.addFilter("groupByYear", (items) => {
    const groups = new Map();
    for (const item of items || []) {
      const y = item.date.getUTCFullYear();
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push(item);
    }
    return [...groups.entries()].map(([year, posts]) => ({ year, posts }));
  });

  // 日付は front matter の値（日本時間の壁時計）をそのまま UTC として扱っているので UTC で表示する
  eleventyConfig.addFilter("ymd", (date) => {
    const d = toDate(date);
    return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
  });
  eleventyConfig.addFilter("isoDate", (date) => toDate(date).toISOString().slice(0, 10));
  eleventyConfig.addFilter("year", (date) => toDate(date).getUTCFullYear());

  eleventyConfig.addFilter("plainText", (str, max = 90) => {
    const text = String(str || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
  });

  const ytCache = new Map();
  eleventyConfig.addFilter("youtubeIds", (item) => {
    if (!item?.inputPath) return [];
    if (!ytCache.has(item.inputPath)) {
      ytCache.set(item.inputPath, findYouTubeIds(fs.readFileSync(item.inputPath, "utf8")));
    }
    return ytCache.get(item.inputPath);
  });

  // 完全URL（OGP 用）。site.url + pathPrefix + path
  eleventyConfig.addFilter("absoluteUrl", function (path) {
    const urlFilter = eleventyConfig.getFilter("url");
    return new URL(urlFilter(path || "/"), site.url).toString();
  });
}

function byDateDesc(a, b) {
  return b.date - a.date || Number(b.data.id || 0) - Number(a.data.id || 0);
}
function toDate(v) {
  if (v === "now") return new Date();
  if (v instanceof Date) return v;
  // タイムゾーンなしの ISO 文字列は（実行環境のTZに左右されないよう）UTC として読む
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}(T[\d:.]+)?$/.test(v)) {
    return new Date(v.length === 10 ? `${v}T00:00:00Z` : `${v}Z`);
  }
  return new Date(v);
}
function pad(n) {
  return String(n).padStart(2, "0");
}

export const config = {
  dir: {
    input: ".",
    includes: "src/_includes",
    data: "src/_data",
    output: "_site",
  },
  // サブパス配信用。値は src/_data/site.js の pathPrefix（ここでは変えない）
  pathPrefix: site.pathPrefix,
  templateFormats: ["md", "njk"],
  markdownTemplateEngine: false,
  htmlTemplateEngine: "njk",
};
