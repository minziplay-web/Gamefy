import { STORY_COLORS } from "@/components/story/constants";

export function SlideProgressBar({
  current,
  total,
  accentColor,
  label,
  className = "",
  sticky = false,
}: {
  current: number;
  total: number;
  accentColor: string;
  label?: string;
  className?: string;
  sticky?: boolean;
}) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.max(1, Math.min(current, safeTotal));
  const percent = (safeCurrent / safeTotal) * 100;

  return (
    <div
      className={`${sticky ? "sticky top-12 z-10" : ""} ${className}`}
      aria-label={label ?? "Slide-Fortschritt"}
    >
      <div
        className="rounded-xl px-2 py-2 backdrop-blur"
        style={{ backgroundColor: "rgba(10, 10, 10, 0.78)" }}
      >
        <div className="flex items-center justify-between gap-3 pb-1.5">
          <span
            className="truncate text-[10px] font-semibold uppercase"
            style={{
              color: STORY_COLORS.ink70,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.12em",
            }}
          >
            {label ?? "Slides"}
          </span>
          <span
            className="shrink-0 text-[10px] tabular-nums"
            style={{
              color: STORY_COLORS.ink50,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
            }}
          >
            {String(safeCurrent).padStart(2, "0")} / {String(safeTotal).padStart(2, "0")}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={safeTotal}
          aria-valuenow={safeCurrent}
          style={{ backgroundColor: STORY_COLORS.hairSoft }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${percent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
