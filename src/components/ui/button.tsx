import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-coral text-white shadow-[0_10px_24px_-12px_rgba(223,109,87,0.7)] hover:bg-coral-strong active:translate-y-px",
  secondary:
    "bg-sand-900 text-cream hover:bg-sand-800 active:translate-y-px",
  ghost:
    "bg-transparent text-sand-700 hover:bg-sand-100 hover:text-sand-900",
  destructive:
    "bg-rose-600 text-white shadow-[0_10px_24px_-12px_rgba(225,29,72,0.55)] hover:bg-rose-700 active:translate-y-px",
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
