import type { ReactNode } from "react";

type EmptyTone = "neutral" | "daily" | "recap" | "archive" | "profile";

const toneAccent: Record<EmptyTone, string> = {
  neutral: "#A8A8A8",
  daily: "#F39A2B",
  recap: "#F39A2B",
  archive: "#E5594F",
  profile: "#D860B5",
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  tone = "neutral",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: EmptyTone;
}) {
  const accent = toneAccent[tone];

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center"
      style={{ backgroundColor: "#161616" }}
    >
      {icon ? (
        <div
          className="flex size-12 items-center justify-center rounded-full text-xl"
          style={{
            backgroundColor: "#0E0E0E",
            color: accent,
          }}
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: "#FAFAFA", textWrap: "balance" }}
        >
          {title}
        </h3>
        {description ? (
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "#A8A8A8", textWrap: "pretty" }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
