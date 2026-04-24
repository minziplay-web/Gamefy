import type { Category } from "@/lib/types/frontend";

export const CATEGORY_LABELS: Record<Category, string> = {
  hot_takes: "Hot Takes",
  pure_fun: "Pure Fun",
  deep_talk: "Deep Talk",
  memories: "Erinnerungen",
  career_life: "Karriere & Leben",
  relationships: "Beziehungen",
  hobbies_interests: "Hobbies",
  dirty: "Dirty",
  group_knowledge: "Gruppenkenntnis",
  would_you_rather: "Lieber was?",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
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
};

export const CATEGORY_TONE: Record<
  Category,
  {
    bg: string;
    text: string;
    ring: string;
  }
> = {
  hot_takes: { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
  pure_fun: { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-200" },
  deep_talk: { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" },
  memories: { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" },
  career_life: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  relationships: { bg: "bg-pink-100", text: "text-pink-700", ring: "ring-pink-200" },
  hobbies_interests: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  dirty: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
  group_knowledge: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  would_you_rather: { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-200" },
};
