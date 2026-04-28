import type { ReactNode } from "react";

type EmptyTone = "neutral" | "daily" | "recap" | "archive" | "profile";

const toneClasses: Record<EmptyTone, { shell: string; icon: string }> = {
  neutral: {
    shell: "border-slate-300/80 bg-white",
    icon: "bg-[#F4F7FC] text-sand-700 ring-slate-200",
  },
  daily: {
    shell: "border-daily-primary/35 bg-white",
    icon: "bg-daily-soft text-daily-text ring-daily-primary/25",
  },
  recap: {
    shell: "border-recap-primary/28 bg-white",
    icon: "bg-[#fff8fd] text-recap-text ring-recap-primary/20",
  },
  archive: {
    shell: "border-archive-primary/28 bg-white",
    icon: "bg-archive-soft text-archive-primary ring-archive-primary/20",
  },
  profile: {
    shell: "border-profile-primary/28 bg-white",
    icon: "bg-profile-soft text-profile-text ring-profile-primary/20",
  },
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
  const colors = toneClasses[tone];

  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-[28px] border border-dashed px-6 py-10 text-center shadow-card-flat ${colors.shell}`}
    >
      {icon ? (
        <div
          className={`flex size-14 items-center justify-center rounded-full text-2xl ring-1 ${colors.icon}`}
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-sand-900">{title}</h3>
        {description ? (
          <p className="text-sm text-sand-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
