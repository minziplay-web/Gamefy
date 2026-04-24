export function ProgressBar({
  value,
  total,
  tone = "coral",
  className = "",
}: {
  value: number;
  total: number;
  tone?: "coral" | "dark";
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.min(100, Math.round((value / total) * 100));
  const fill =
    tone === "coral" ? "bg-coral" : "bg-sand-900";

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-sand-100 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${fill}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
