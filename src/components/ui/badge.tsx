import type { ReactNode } from "react";

type Tone =
  | "neutral"
  | "dark"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "daily"
  | "recap"
  | "profile"
  | "archive";
type Size = "sm" | "md";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-white text-slate-700 ring-slate-200",
  dark: "bg-slate-900 text-white ring-slate-800",
  accent: "bg-brand-soft text-brand-primary ring-brand-primary/18",
  success: "bg-success-soft text-success-text ring-success-text/18",
  warning: "bg-award-soft text-award-text ring-award-primary/30",
  danger: "bg-danger-soft text-danger-text ring-danger-text/18",
  daily: "bg-daily-soft text-daily-text ring-daily-primary/24",
  recap: "bg-[#fff8fd] text-recap-text ring-recap-primary/20",
  profile: "bg-profile-soft text-profile-text ring-profile-primary/20",
  archive: "bg-archive-soft text-archive-primary ring-archive-primary/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[10px] tracking-[0.14em]",
  md: "px-3 py-1 text-[11px] tracking-[0.14em]",
};

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase ring-1 ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
