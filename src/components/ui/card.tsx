import type { ReactNode } from "react";

type Tone = "raised" | "flat" | "dark";

const toneClasses: Record<Tone, string> = {
  raised:
    "border-slate-200/80 bg-white shadow-card-raised",
  flat: "border-slate-200/75 bg-[#fbfdff] shadow-card-flat",
  dark: "border-slate-800/60 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-cream shadow-card-raised",
};

export function Card({
  children,
  className = "",
  tone = "raised",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  as?: "section" | "article" | "div";
}) {
  return (
    <Tag
      className={`radius-card border p-5 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </Tag>
  );
}

