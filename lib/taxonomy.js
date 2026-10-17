// 世界（LAB / PLAY）とカテゴリ（セクション）の定義、および旧カテゴリからの振り分けルール。
// サイトのテンプレート（src/_data/worlds.js）と docs 生成スクリプトの両方がここを参照する。

export const WORLDS = {
  lab: {
    key: "lab",
    name: "LAB",
    label: "LAB / 技術",
    kicker: "OBSERVATION ROOM",
    catch: "観測と実験の部屋",
    lead: "IoT・ものづくり・360°VR。気になる技術を見つけて、試して、記録する実験室。",
    logo: "/assets/img/lab-logo.svg",
  },
  play: {
    key: "play",
    name: "PLAY",
    label: "PLAY / ゲーム",
    kicker: "STAGE",
    catch: "遊んで、反省して、また遊ぶ",
    lead: "プレイ記録と反省動画のステージ。勝っても負けても、まずは楽しむ。",
    logo: "/assets/img/play-logo.svg",
  },
};

// 表示順はこの配列の順（世界ごと）。
// oldCategories: このセクションに振り分ける旧WordPressカテゴリ名。
export const SECTIONS = [
  {
    world: "lab",
    slug: "iot",
    name: "IoT",
    en: "Internet of Things",
    description: "IoTニュース・ガジェット・展示会レポート。知識ゼロから追いかけた観測ログ。",
    oldCategories: ["IoT"],
  },
  {
    world: "lab",
    slug: "monozukuri",
    name: "ものづくり",
    en: "Making",
    description: "電子工作・部品レポート、そしてお酒×IoTの SakeTamu。手を動かした実験の記録。",
    oldCategories: ["ものづくり研究", "お酒ハックSakeTamu"],
  },
  {
    world: "lab",
    slug: "vr",
    name: "360°VR",
    en: "360° VR",
    description: "全天球カメラで切り取った風景。沖縄から東京まで、ぐるっと見回す記録。",
    oldCategories: ["360°VR"],
  },
  {
    world: "play",
    slug: "splatoon",
    name: "スプライフ",
    en: "Play Log",
    description: "バンカラマッチの反省動画「猛反省道場」とプレイ記録。",
    oldCategories: ["Game", "ホビー"],
  },
];

// 主カテゴリの優先順（DESIGN.md 2章）。上にあるほど優先。
// 「沖縄［OKinawa］」は主カテゴリにしない（タグとして残す）。
export const PRIORITY = [
  { section: "splatoon", oldCategories: ["Game", "ホビー"] },
  { section: "monozukuri", oldCategories: ["お酒ハックSakeTamu", "ものづくり研究"] },
  { section: "vr", oldCategories: ["360°VR"] },
  { section: "iot", oldCategories: ["IoT"] },
];

export const TAG_ONLY_CATEGORIES = { "沖縄［OKinawa］": "沖縄" };

// 既定の振り分け先（どのルールにも当たらない記事）。ビルド時に警告を出す。
export const FALLBACK_SECTION = "iot";

export function getSection(slug) {
  return SECTIONS.find((s) => s.slug === slug);
}

export function sectionsOf(world) {
  return SECTIONS.filter((s) => s.world === world);
}

/**
 * 記事データ（front matter）から主カテゴリを決める。
 * 1. front matter に `section:`（例: splatoon）があればそれを使う（新しい記事用）
 * 2. なければ旧カテゴリ（categories）を PRIORITY の順に照合
 * 3. どれにも当たらなければ FALLBACK_SECTION
 */
export function classifyPost(data = {}) {
  const categories = Array.isArray(data.categories) ? data.categories : [];

  if (data.section) {
    const section = getSection(data.section);
    if (!section) {
      throw new Error(
        `記事 ${data.id ?? data.title}: section "${data.section}" は未定義です（lib/taxonomy.js の SECTIONS を確認）`,
      );
    }
    return { world: section.world, section: section.slug, rule: "front matter の section 指定" };
  }

  for (const rule of PRIORITY) {
    const hit = categories.find((c) => rule.oldCategories.includes(c));
    if (hit) {
      const section = getSection(rule.section);
      return { world: section.world, section: section.slug, rule: `旧カテゴリ「${hit}」` };
    }
  }

  const fallback = getSection(FALLBACK_SECTION);
  return { world: fallback.world, section: fallback.slug, rule: "該当なし（既定値）", fallback: true };
}

/** 表示用タグ。主カテゴリにしない旧カテゴリ（沖縄）をタグとして足す。 */
export function displayTags(data = {}) {
  const tags = Array.isArray(data.tags) ? [...data.tags] : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  for (const [category, tag] of Object.entries(TAG_ONLY_CATEGORIES)) {
    if (categories.includes(category) && !tags.includes(tag)) tags.unshift(tag);
  }
  return tags;
}
