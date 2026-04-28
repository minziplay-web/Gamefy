export function ProgressBar({
  value,
  total,
  tone = "dark",
  className = "",
}: {
  value: number;
  total: number;
  tone?: "dark" | "daily" | "recap" | "archive";
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.min(100, Math.round((value / total) * 100));
  const fill =
    tone === "dark"
      ? "bg-sand-900"
      : tone === "daily"
        ? "bg-daily-text"
        : tone === "recap"
          ? "bg-linear-to-r from-recap-primary to-recap-strong"
          : tone === "archive"
            ? "bg-linear-to-r from-archive-primary to-archive-text"
            : "bg-brand-primary";
  const track =
    tone === "daily"
      ? "bg-daily-track"
      : tone === "recap"
        ? "bg-recap-soft"
        : tone === "archive"
          ? "bg-archive-soft"
          : "bg-sand-100";

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full ${track} ${className}`}
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
