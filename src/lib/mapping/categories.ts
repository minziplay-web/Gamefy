import type { Category } from "@/lib/types/frontend";

export const CATEGORY_LABELS: Record<Category, string> = {
  custom: "Deine Frage",
  hot_takes: "Hot Takes",
  pure_fun: "Forreal bruh?",
  deep_talk: "Deep Talk",
  memories: "Erinnerungen",
  career_life: "Karriere & Leben",
  relationships: "Beziehungen",
  hobbies_interests: "Hobbies",
  dirty: "Dirty",
  group_knowledge: "Gruppenkenntnis",
  would_you_rather: "Would You Rather",
  conspiracy: "Verschwörung",
  meme_it: "Meme it",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  custom: "🏆",
  hot_takes: "🔥",
  pure_fun: "😂",
  deep_talk: "💭",
  memories: "🍻",
  career_life: "💼",
  relationships: "❤️",
  hobbies_interests: "🎮",
  dirty: "🌶️",
  group_knowledge: "🧠",
  would_you_rather: "🎭",
  conspiracy: "🛸",
  meme_it: "🤳",
};

export const CATEGORY_TONE: Record<
  Category,
  {
    bg: string;
    text: string;
    ring: string;
  }
> = {
  custom: { bg: "bg-award-soft", text: "text-award-text", ring: "ring-award-primary/45" },
  hot_takes: { bg: "bg-archive-soft", text: "text-archive-primary", ring: "ring-archive-primary/28" },
  pure_fun: { bg: "bg-daily-track", text: "text-daily-text", ring: "ring-daily-primary/32" },
  deep_talk: { bg: "bg-profile-soft", text: "text-profile-text", ring: "ring-profile-primary/30" },
  memories: { bg: "bg-archive-wash", text: "text-archive-text", ring: "ring-archive-primary/22" },
  career_life: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  relationships: { bg: "bg-recap-soft", text: "text-recap-text", ring: "ring-recap-primary/30" },
  hobbies_interests: { bg: "bg-brand-soft", text: "text-brand-primary", ring: "ring-brand-primary/25" },
  dirty: { bg: "bg-danger-soft", text: "text-danger-text", ring: "ring-archive-primary/30" },
  group_knowledge: { bg: "bg-profile-soft", text: "text-profile-text", ring: "ring-profile-primary/30" },
  would_you_rather: { bg: "bg-recap-wash", text: "text-recap-strong", ring: "ring-recap-primary/25" },
  conspiracy: { bg: "bg-slate-900", text: "text-cream", ring: "ring-slate-700" },
  meme_it: { bg: "bg-recap-soft", text: "text-recap-text", ring: "ring-recap-primary/30" },
};
