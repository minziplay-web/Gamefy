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

  return (
    <div
      className={`${sticky ? "sticky top-12 z-10" : ""} ${className}`}
      aria-label={label ?? "Slide-Fortschritt"}
    >
      <div
        className="rounded-full px-2 py-2 backdrop-blur"
        style={{ backgroundColor: "rgba(10, 10, 10, 0.78)" }}
      >
        <div
          className="flex items-center justify-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={safeTotal}
          aria-valuenow={safeCurrent}
        >
          {Array.from({ length: safeTotal }).map((_, index) => {
            const isActive = index + 1 === safeCurrent;
            return (
              <span
                key={index}
                aria-hidden
                className="block rounded-full transition-all duration-200"
                style={{
                  width: isActive ? 18 : 6,
                  height: 6,
                  backgroundColor: isActive ? accentColor : STORY_COLORS.hair,
                  opacity: isActive ? 1 : 0.75,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
