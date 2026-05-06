import type { Category } from "@/lib/types/frontend";

// SVG-derived brand palette — alle UI-Akzente kommen aus diesem Set
// Dark-Mode-Tokens (User-Decision 2026-05-06): pure-black canvas, brand colors
// als Akzente, helle Text- und dunkle Hairline-Werte.
export const STORY_COLORS = {
  // Brand accents — User-Decision 2026-05-06 Round 3:
  // Tab-Farben sind die kanonischen Page-Akzente. Per-Page wird die jeweilige
  // Tab-Farbe in StoryShell + RevealBarChart propagiert (nicht mehr pro Frage
  // random aus CATEGORY_COLOR durchgemischt).
  daily: "#F39A2B", // Daily-Tab — sunny orange
  antworten: "#4A5699", // Antworten-Tab — brand blue
  archiv: "#E5594F", // Archiv-Tab — coral
  profil: "#D860B5", // Profil-Tab — pink (vom User explicit für Profil-Tab erlaubt)
  // Sekundär-Akzente
  yellow: "#F0D043",
  blueLight: "#6277BA",
  orangeWarm: "#FD9E22",
  // Dark-mode neutrals — semantisch invertiert vs. ursprüngliche Light-Mode-Werte
  ink: "#FAFAFA", // primary text (war #172031)
  ink70: "#A8A8A8", // muted text (war #37465A)
  ink50: "#6E6E73", // dim text (war #64768D)
  hair: "#2C2C2E", // stronger divider (war #DBE4EF)
  hairSoft: "#1F1F1F", // subtle divider / elevated bg (war #EEF2F7)
  // Surface-Tokens
  bg: "#000000", // page bg
  bgElev: "#1A1A1A", // cards/sheets
  bgSubtle: "#232323", // raised inner blocks (z.B. Frage-Block) — heller als bgElev
} as const;

/** @deprecated User-Decision 2026-05-06 Round 3: Slide-Eyebrows folgen jetzt
 *  der Tab-Farbe der Page (siehe STORY_COLORS.daily/antworten/archiv/profil),
 *  nicht der Kategorie. Map noch da für legacy-Aufrufe und falls Kategorie-
 *  Akzente nochmal kommen. */
export const CATEGORY_COLOR: Record<Category, string> = {
  custom: STORY_COLORS.yellow,
  hot_takes: STORY_COLORS.archiv,
  pure_fun: STORY_COLORS.daily,
  deep_talk: STORY_COLORS.profil,
  memories: STORY_COLORS.blueLight,
  career_life: STORY_COLORS.profil,
  relationships: STORY_COLORS.orangeWarm,
  hobbies_interests: STORY_COLORS.daily,
  dirty: STORY_COLORS.archiv,
  group_knowledge: STORY_COLORS.profil,
  would_you_rather: STORY_COLORS.orangeWarm,
  conspiracy: STORY_COLORS.blueLight,
  meme_it: STORY_COLORS.profil,
};

// Stable hash → palette pick. Used for avatar initial backgrounds and
// any deterministic color assignment per user/seed. Kein Magenta mehr.
const PALETTE_FOR_HASH = [
  STORY_COLORS.daily,
  STORY_COLORS.archiv,
  STORY_COLORS.profil,
  STORY_COLORS.blueLight,
  STORY_COLORS.yellow,
  STORY_COLORS.orangeWarm,
];

export function pickStoryColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE_FOR_HASH[h % PALETTE_FOR_HASH.length];
}
