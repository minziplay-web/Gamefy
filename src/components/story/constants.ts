import type { Category } from "@/lib/types/frontend";

// SVG-derived brand palette — alle UI-Akzente kommen aus diesem Set
export const STORY_COLORS = {
  daily: "#F39A2B", // home / today reveal
  antworten: "#C45FA0", // answer-mode tab
  archiv: "#E5594F", // archive
  profil: "#4A5699", // profile
  yellow: "#F0D043", // accent (meme winner, highlights)
  blueLight: "#6277BA", // lighter brand
  ink: "#172031", // main text on light bg
  ink70: "#37465A",
  ink50: "#64768D",
  hair: "#DBE4EF",
  hairSoft: "#EEF2F7",
} as const;

// Category → primary color used as eyebrow accent in StoryShell
export const CATEGORY_COLOR: Record<Category, string> = {
  custom: STORY_COLORS.yellow,
  hot_takes: STORY_COLORS.archiv,
  pure_fun: STORY_COLORS.daily,
  deep_talk: STORY_COLORS.profil,
  memories: STORY_COLORS.blueLight,
  career_life: STORY_COLORS.profil,
  relationships: STORY_COLORS.antworten,
  hobbies_interests: STORY_COLORS.daily,
  dirty: STORY_COLORS.archiv,
  group_knowledge: STORY_COLORS.profil,
  would_you_rather: STORY_COLORS.antworten,
  conspiracy: STORY_COLORS.blueLight,
  meme_it: STORY_COLORS.profil,
};

// Stable hash → 6-color palette pick. Used for avatar initial backgrounds and
// any deterministic color assignment per user/seed.
const PALETTE_FOR_HASH = [
  STORY_COLORS.daily,
  STORY_COLORS.antworten,
  STORY_COLORS.archiv,
  STORY_COLORS.profil,
  STORY_COLORS.blueLight,
  STORY_COLORS.yellow,
];

export function pickStoryColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE_FOR_HASH[h % PALETTE_FOR_HASH.length];
}
