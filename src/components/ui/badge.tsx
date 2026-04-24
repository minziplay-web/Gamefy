import type { ReactNode } from "react";

type Tone = "neutral" | "dark" | "coral" | "success" | "warning" | "danger";
type Size = "sm" | "md";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-sand-100 text-sand-700",
  dark: "bg-sand-900 text-cream",
  coral: "bg-coral-soft text-coral-strong",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
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
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
