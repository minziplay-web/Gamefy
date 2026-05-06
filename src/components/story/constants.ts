import type { Category } from "@/lib/types/frontend";

// SVG-derived brand palette — alle UI-Akzente kommen aus diesem Set
// Dark-Mode-Tokens (User-Decision 2026-05-06): pure-black canvas, brand colors
// als Akzente, helle Text- und dunkle Hairline-Werte.
export const STORY_COLORS = {
  // Brand accents — bleiben unverändert für Light/Dark
  daily: "#F39A2B", // home / today reveal — sunny orange
  antworten: "#F0D043", // answer-mode tab — yellow (User-Decision 2026-05-06: KEIN Pink/Magenta)
  archiv: "#E5594F", // archive — coral
  profil: "#4A5699", // profile — brand blue
  yellow: "#F0D043", // accent legacy alias
  blueLight: "#6277BA", // lighter brand
  orangeWarm: "#FD9E22", // alt orange for accents
  // Dark-mode neutrals — semantisch invertiert vs. ursprüngliche Light-Mode-Werte
  ink: "#FAFAFA", // primary text (war #172031)
  ink70: "#A8A8A8", // muted text (war #37465A)
  ink50: "#6E6E73", // dim text (war #64768D)
  hair: "#2C2C2E", // stronger divider (war #DBE4EF)
  hairSoft: "#1F1F1F", // subtle divider / elevated bg (war #EEF2F7)
  // Surface-Tokens (neu)
  bg: "#000000", // page bg
  bgElev: "#161616", // cards/sheets
  bgSubtle: "#0E0E0E", // very subtle elevation
} as const;

// Category → primary color used as eyebrow accent in StoryShell.
// User-Decision 2026-05-06: keine Pink/Magenta-Töne mehr.
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
