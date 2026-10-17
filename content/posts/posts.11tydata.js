// content/posts/ 以下の記事すべてに共通するデータ。
// 記事は /posts/<id>/ に出力され、主カテゴリ（LAB / PLAY のどちらか）は lib/taxonomy.js で決まる。
import { classifyPost, displayTags } from "../../lib/taxonomy.js";

export default {
  layout: "layouts/post.njk",
  isPost: true,
  eleventyComputed: {
    permalink: (data) => `/posts/${data.id ?? data.page.fileSlug}/`,
    placement: (data) => classifyPost(data),
    world: (data) => classifyPost(data).world,
    postTags: (data) => displayTags(data),
  },
};
