"use client";

import Link from "next/link";

import { STORY_COLORS } from "@/components/story";

/**
 * LockedRevealBody — Body-Slot für Story-Slides, die der User noch nicht
 * beantwortet hat. Schlicht: Lock-Icon + Hinweis + CTA, kein Fake-Chart-
 * Background (User-Decision 2026-05-06: weniger cluttered).
 */
export function LockedRevealBody({
  hint = "Beantworte zuerst, dann siehst du wie alle anderen abgestimmt haben.",
}: {
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
      <span
        className="inline-flex size-10 items-center justify-center rounded-full text-base"
        style={{
          backgroundColor: STORY_COLORS.hairSoft,
          color: STORY_COLORS.daily,
        }}
        aria-hidden
      >
        🔒
      </span>
      <p
        className="text-[14px] leading-snug"
        style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
      >
        Noch nicht beantwortet
      </p>
      <p
        className="max-w-[30ch] text-[12px] leading-relaxed"
        style={{ color: STORY_COLORS.ink50 }}
      >
        {hint}
      </p>
      <Link
        href="/daily"
        className="mt-1 inline-flex items-center justify-center rounded-full border px-4 py-2 text-[11px] tabular-nums transition hover:bg-[#1F1F1F]"
        style={{
          backgroundColor: "transparent",
          borderColor: STORY_COLORS.daily,
          color: STORY_COLORS.daily,
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.08em",
        }}
      >
        JETZT ANTWORTEN
      </Link>
    </div>
  );
}
