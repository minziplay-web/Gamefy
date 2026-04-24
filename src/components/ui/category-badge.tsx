import type { Category } from "@/lib/types/frontend";
import { CATEGORY_EMOJI, CATEGORY_LABELS, CATEGORY_TONE } from "@/lib/mapping/categories";

export function CategoryBadge({
  category,
  size = "md",
}: {
  category: Category;
  size?: "sm" | "md";
}) {
  const tone = CATEGORY_TONE[category];
  const sizing =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] tracking-[0.14em]"
      : "px-3 py-1 text-[11px] tracking-[0.14em]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase ${tone.bg} ${tone.text} ${sizing}`}
    >
      <span aria-hidden>{CATEGORY_EMOJI[category]}</span>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
