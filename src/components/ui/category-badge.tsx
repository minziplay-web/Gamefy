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
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold uppercase ring-1 ${tone.bg} ${tone.text} ${tone.ring} ${sizing}`}
    >
      <span aria-hidden className="shrink-0">
        {CATEGORY_EMOJI[category]}
      </span>
      <span className="min-w-0 truncate">{CATEGORY_LABELS[category]}</span>
    </span>
  );
}
