import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "daily"
  | "recap"
  | "profile"
  | "archive";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white shadow-[0_10px_24px_-12px_rgba(74,86,153,0.55)] hover:bg-brand-strong active:translate-y-px",
  secondary:
    "bg-slate-900 text-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.38)] hover:bg-slate-800 active:translate-y-px",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  destructive:
    "bg-archive-primary text-white shadow-[0_10px_24px_-12px_rgba(143,47,74,0.55)] hover:bg-archive-strong active:translate-y-px",
  daily:
    "bg-daily-text text-white shadow-[0_12px_28px_-14px_rgba(107,67,26,0.42)] hover:bg-daily-accent active:translate-y-px",
  recap:
    "bg-linear-to-r from-recap-primary to-recap-strong text-white shadow-[0_12px_28px_-12px_rgba(196,95,160,0.48)] hover:from-[#AD4E8C] hover:to-brand-strong active:translate-y-px",
  profile:
    "bg-linear-to-r from-profile-primary to-profile-strong text-white shadow-[0_12px_28px_-12px_rgba(74,86,153,0.55)] hover:from-[#3C477F] hover:to-[#101D46] active:translate-y-px",
  archive:
    "bg-linear-to-r from-archive-primary to-archive-text text-white shadow-[0_12px_28px_-12px_rgba(143,47,74,0.46)] hover:from-[#74233A] hover:to-archive-strong active:translate-y-px",
};

const sizeClasses: Record<Size, string> = {
  md: "min-h-12 px-5 py-3 text-sm",
  sm: "min-h-10 px-3.5 py-2 text-[13px]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
