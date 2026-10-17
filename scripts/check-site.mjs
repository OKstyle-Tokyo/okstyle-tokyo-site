// ビルド結果（_site/）の点検スクリプト。`npm run build && npm run check` で実行する。
//  1. 全記事のページがあるか、主要ページがあるか
//  2. 記事本文が元ファイルどおりに出力されているか（pathPrefix 付与・YouTube 変換・画像なし置換以外は変えていないか）
//  3. 全HTMLの内部リンク・画像（src / href / srcset）が _site 内のファイルに解決できるか（サブパス配信で切れないか）
//  4. <title> の書式
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import site from "../src/_data/site.js";
import { renderPostBody } from "../lib/content.js";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "_site");
const prefix = "/" + site.pathPrefix.replace(/^\/+|\/+$/g, "");
const prefixSlash = prefix === "/" ? "/" : prefix + "/";
const errors = [];
const warn = [];

if (!fs.existsSync(out)) {
  console.error("_site/ がありません。先に npm run build を実行してください。");
  process.exit(1);
}

// ---- 1. ページの存在
const postFiles = fs.readdirSync(path.join(root, "content/posts")).filter((f) => f.endsWith(".md"));
const required = ["index.html", "lab/index.html", "play/index.html", "archive/index.html", "about/index.html", "404.html"];
for (const r of required) if (!fs.existsSync(path.join(out, r))) errors.push(`主要ページがありません: ${r}`);

// ---- 2. 本文
let bodyOk = 0;
for (const f of postFiles) {
  const { data, content } = matter(fs.readFileSync(path.join(root, "content/posts", f), "utf8"));
  const id = data.id ?? path.basename(f, ".md");
  const htmlPath = path.join(out, "posts", String(id), "index.html");
  if (!fs.existsSync(htmlPath)) {
    errors.push(`記事ページがありません: posts/${id}/ (${f})`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  const expected = renderPostBody(content, data, site.pathPrefix).trim();
  if (!html.includes(expected)) errors.push(`本文が想定と一致しません: ${f}`);
  else bodyOk++;
  if (!html.includes(`<title>${escapeHtml(String(data.title))}｜OKstyle LAB &amp; PLAY</title>`)) {
    errors.push(`<title> の書式が違います: posts/${id}/`);
  }
}

// ---- 3. 内部リンク
const htmlFiles = walk(out).filter((f) => f.endsWith(".html"));
const ATTR = /\s(src|href|srcset|poster|action)\s*=\s*(["'])(.*?)\2/gi;
let checked = 0;
const broken = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(out, file);
  let m;
  while ((m = ATTR.exec(html))) {
    const [, attr, , value] = m;
    const urls = attr.toLowerCase() === "srcset" ? value.split(",").map((s) => s.trim().split(/\s+/)[0]) : [value];
    for (const raw of urls) {
      const url = decodeEntities(raw.trim());
      if (!url || url.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) continue;
      if (!url.startsWith("/")) {
        warn.push(`相対URL: ${rel} → ${url}`);
        continue;
      }
      checked++;
      if (prefix !== "/" && !url.startsWith(prefixSlash) && url !== prefix) {
        addBroken(rel, url, "pathPrefix なし");
        continue;
      }
      const local = decodeURIComponent(url.slice(prefix === "/" ? 0 : prefix.length).split(/[?#]/)[0]);
      const target = path.join(out, local);
      const ok =
        (fs.existsSync(target) && fs.statSync(target).isFile()) || fs.existsSync(path.join(target, "index.html"));
      if (!ok) addBroken(rel, url, "ファイルなし");
    }
  }
}
for (const [key, pages] of broken) errors.push(`リンク切れ (${key}) — ${pages.length}ページ: ${pages.slice(0, 3).join(", ")}`);

// ---- 4. トップの <title>
const home = fs.readFileSync(path.join(out, "index.html"), "utf8");
if (!home.includes("<title>OKstyle LAB &amp; PLAY｜ワクワクPlayground</title>")) errors.push("トップの <title> が違います");

console.log(`記事: ${postFiles.length} 本 / 本文一致: ${bodyOk} 本`);
console.log(`HTML: ${htmlFiles.length} ファイル / 内部URL: ${checked} 件を確認`);
if (warn.length) console.log(`注意: ${warn.length} 件\n  ` + [...new Set(warn)].slice(0, 20).join("\n  "));
if (errors.length) {
  console.error(`\nNG: ${errors.length} 件\n  ` + errors.slice(0, 50).join("\n  "));
  process.exit(1);
}
console.log("OK: 問題は見つかりませんでした");

function addBroken(page, url, reason) {
  const key = `${reason}: ${url}`;
  if (!broken.has(key)) broken.set(key, []);
  broken.get(key).push(page);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
function decodeEntities(s) {
  return s.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&");
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
