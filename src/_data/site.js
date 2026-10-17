// サイト全体の設定。
// ★ 独自ドメインに切り替えるときは、この url と pathPrefix の2つを変える（README 参照）。
//   GitHub Pages:  url: "https://okstyle-tokyo.github.io", pathPrefix: "/okstyle-tokyo-site/"
//   独自ドメイン:  url: "https://okstyle-tokyo.jp",       pathPrefix: "/"

export default {
  url: "https://okstyle-tokyo.github.io",
  pathPrefix: "/okstyle-tokyo-site/",

  title: "OKstyle LAB & PLAY",
  tagline: "ワクワクPlayground",
  description: "OKstyle の個人サイト。技術の実験室 LAB と、ゲームのステージ PLAY。ワクワクPlayground。",
  lang: "ja",
  author: "OKstyle",

  // フッター・about に出す SNS。url が空のものはリンクにせず「準備中」として表示する。
  // 記事本文から確認できたのは X と Facebook のみ。それ以外は URL 要確認。
  sns: [
    { key: "x", name: "X", url: "https://x.com/okstyle_tokyo" },
    { key: "youtube", name: "YouTube", url: "" },
    { key: "facebook", name: "Facebook", url: "https://www.facebook.com/okstyle.tokyo/" },
    { key: "linkedin", name: "LinkedIn", url: "" },
    { key: "pinterest", name: "Pinterest", url: "" },
    { key: "tumblr", name: "Tumblr", url: "" },
  ],
};
