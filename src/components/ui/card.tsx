import type { ReactNode } from "react";

type Tone = "raised" | "flat" | "dark";

const toneClasses: Record<Tone, string> = {
  raised:
    "border-white/60 bg-white/85 shadow-card-raised backdrop-blur",
  flat: "border-white/60 bg-white/70 shadow-card-flat backdrop-blur-sm",
  dark: "border-sand-800/60 bg-linear-to-br from-sand-900 via-sand-800 to-sand-700 text-cream shadow-card-raised",
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

