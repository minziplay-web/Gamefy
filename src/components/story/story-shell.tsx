"use client";

import type { ReactNode } from "react";

import { CATEGORY_COLOR, STORY_COLORS } from "@/components/story/constants";
import type { Category } from "@/lib/types/frontend";

/**
 * StoryShell — geteilte Layout-Hülle für Story-Format-Slides.
 *
 * Stages 1 (Antworten), 2 (Daily Reveal), 3 (Archiv-Detail) konsumieren das.
 * Stage 5 fügt InlineComments im footer-Slot ein.
 *
 * Aufbau (von oben nach unten):
 *   1. Eyebrow-Header: Kategorie-Pill links, Position-Counter "03 / 05" rechts
 *   2. Frage-Text als Geist-Sans 18-20px (kein Italic, kein Magazine)
 *   3. Body-Slot — Type-spezifischer Renderer (Antwort-UI ODER Reveal)
 *   4. Footer-Slot — Submit-Button (Antworten-Mode) ODER Comments (Reveal-Mode)
 *
 * NICHT enthalten: Swipe-Navigation. Pages koordinieren das selbst (z.B. via
 * motion.div drag in einem stack-pattern).
 */
export function StoryShell({
  position,
  category,
  categoryLabel,
  questionText,
  body,
  footer,
  className = "",
}: {
  position: { current: number; total: number };
  category: Category;
  categoryLabel: string;
  questionText: string;
  body: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const accent = CATEGORY_COLOR[category] ?? STORY_COLORS.daily;

  return (
    <article
      className={`flex min-h-[600px] flex-col rounded-2xl px-5 py-5 ${className}`}
      style={{ backgroundColor: STORY_COLORS.bgElev }}
    >
      {/* eyebrow + position */}
      <header className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent, fontFamily: "var(--font-mono)" }}
        >
          <span
            aria-hidden
            className="block h-1 w-1 rounded-full"
            style={{ backgroundColor: accent }}
          />
          {categoryLabel}
        </span>
        <span
          className="text-[11px] tabular-nums"
          style={{
            color: STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          {String(position.current).padStart(2, "0")} / {String(position.total).padStart(2, "0")}
        </span>
      </header>

      {/* question text */}
      <h2
        className="mt-5 text-[18px] font-medium leading-snug tracking-tight"
        style={{ color: STORY_COLORS.ink }}
      >
        {questionText}
      </h2>

      {/* body slot */}
      <div className="mt-6 flex-1">{body}</div>

      {/* footer slot */}
      {footer ? (
        <footer
          className="mt-6 pt-4"
          style={{ borderTop: `1px solid ${STORY_COLORS.hairSoft}` }}
        >
          {footer}
        </footer>
      ) : null}
    </article>
  );
}
