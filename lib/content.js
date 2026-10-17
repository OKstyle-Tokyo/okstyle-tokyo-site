// 記事本文の出力処理。
// 旧記事の本文は WordPress の HTML そのもの。Markdown として解釈すると崩れるので、
// 既定では「そのまま」出力し、ビルド時に次の3つだけを行う（元ファイルは書き換えない）。
//   1. 裸の YouTube URL だけの段落を <iframe> 埋め込みに変換（WordPress の oEmbed の代わり）
//   2. data-missing-image="true" の <img> を「画像なし」プレースホルダに置き換え
//   3. ルート相対 URL（/images/... など）に pathPrefix を付ける（GitHub Pages のサブパス配信対策）
// front matter に `format: markdown` と書いた記事だけは Markdown として変換する（新しい記事用）。

import markdownIt from "markdown-it";

const md = markdownIt({ html: true, linkify: false, breaks: false });

const YT_BARE_PARAGRAPH =
  /<p(?:\s[^>]*)?>\s*(https?:\/\/(?:www\.|m\.)?(?:youtu\.be\/([\w-]{11})|youtube\.com\/(?:watch\?(?:[^\s<"]*&(?:amp;)?)?v=|shorts\/)([\w-]{11}))[^\s<]*)\s*<\/p>/g;

export function embedBareYouTube(html) {
  return html.replace(YT_BARE_PARAGRAPH, (match, url, id1, id2) => {
    const id = id1 || id2;
    return (
      `<figure class="yt-embed" data-converted-from="${escapeAttr(url)}">` +
      `<iframe loading="lazy" src="https://www.youtube.com/embed/${id}" title="YouTube動画" ` +
      `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
      `referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></figure>`
    );
  });
}

const MISSING_IMG = /<img\b[^>]*\bdata-missing-image=(["'])true\1[^>]*>/gi;

export function replaceMissingImages(html) {
  return html.replace(MISSING_IMG, (tag) => {
    const alt = getAttr(tag, "alt");
    const src = getAttr(tag, "data-original-src") || getAttr(tag, "src");
    return (
      `<span class="missing-image" role="img" aria-label="画像なし${alt ? `：${escapeAttr(alt)}` : ""}"` +
      `${src ? ` data-original-src="${escapeAttr(src)}"` : ""}>` +
      `<span class="missing-image__label">画像なし</span>` +
      `${alt ? `<span class="missing-image__alt">${escapeHtml(alt)}</span>` : ""}` +
      `</span>`
    );
  });
}

const URL_ATTR = /(\s(?:src|href|poster|data-src|action)\s*=\s*)(["'])(\/(?!\/)[^"']*)\2/gi;
const SRCSET_ATTR = /(\s(?:srcset|data-srcset)\s*=\s*)(["'])([^"']*)\2/gi;

export function prefixRootUrls(html, pathPrefix) {
  if (!pathPrefix || pathPrefix === "/") return html;
  const prefix = "/" + pathPrefix.replace(/^\/+|\/+$/g, "");
  const add = (url) => (url.startsWith(prefix + "/") ? url : prefix + url);
  return html
    .replace(URL_ATTR, (m, attr, q, url) => `${attr}${q}${add(url)}${q}`)
    .replace(SRCSET_ATTR, (m, attr, q, value) => {
      const next = value
        .split(",")
        .map((part) => part.replace(/^(\s*)(\/(?!\/)\S*)/, (mm, sp, url) => sp + add(url)))
        .join(",");
      return `${attr}${q}${next}${q}`;
    });
}

export function renderPostBody(str, data = {}, pathPrefix = "/") {
  let html = data.format === "markdown" ? md.render(str) : str;
  html = embedBareYouTube(html);
  html = replaceMissingImages(html);
  html = prefixRootUrls(html, pathPrefix);
  return html;
}

/** 本文中の YouTube 動画IDを出現順に返す（PLAY トップの埋め込み用） */
export function findYouTubeIds(html) {
  const ids = [];
  const re =
    /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:[^\s<"]*&(?:amp;)?)?v=|shorts\/)|youtu\.be\/)([\w-]{11})/g;
  let m;
  while ((m = re.exec(html))) if (!ids.includes(m[1])) ids.push(m[1]);
  return ids;
}

function getAttr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return m ? m[2] : "";
}

function escapeAttr(s) {
  return String(s).replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeHtml(s) {
  return String(s).replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
