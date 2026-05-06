import type { ReactNode } from "react";

type Tone = "raised" | "flat" | "dark";

const toneClasses: Record<Tone, string> = {
  raised: "border-[#2C2C2E] bg-[#1A1A1A] text-[#FAFAFA]",
  flat: "border-[#1F1F1F] bg-[#0E0E0E] text-[#FAFAFA]",
  dark: "border-[#2C2C2E] bg-[#1A1A1A] text-[#FAFAFA]",
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

