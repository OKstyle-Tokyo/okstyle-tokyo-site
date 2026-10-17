import { WORLDS, SECTIONS, sectionsOf } from "../../lib/taxonomy.js";

export default {
  ...WORLDS,
  list: [WORLDS.lab, WORLDS.play],
  sections: SECTIONS,
  labSections: sectionsOf("lab"),
  playSections: sectionsOf("play"),
};
