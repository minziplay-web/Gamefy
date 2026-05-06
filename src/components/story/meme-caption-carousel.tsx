"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

import { AvatarCircle } from "@/components/ui/avatar";
import { MemeImage } from "@/components/daily/meme-image";
import { STORY_COLORS } from "@/components/story/constants";
import type { MemeCaptionResult } from "@/lib/types/frontend";

/**
 * MemeCaptionCarousel — jedes erstellte Meme als eigenständiger "Insta-Post".
 *
 * User-Decision 2026-05-06: nicht mehr eine Liste aller Captions in einer
 * Slide, sondern pro Caption ein eigener Slide mit dem Meme-Bild oben + Author
 * + Caption + Vote-Count. Reihenfolge: Top-Voted zuerst.
 *
 * Navigation: Prev/Next-Buttons + Dot-Pager. Bewusst KEIN drag-swipe damit der
 * Parent-Slide-Swipe nicht überschrieben wird.
 */
export function MemeCaptionCarousel({
  result,
  accentColor,
}: {
  result: MemeCaptionResult;
  accentColor: string;
}) {
  const ranked = [...result.entries]
    .map((entry, originalIdx) => ({
      entry,
      originalIdx,
      count: entry.thumbsUpCount ?? 0,
    }))
    .sort(
      (a, b) => b.count - a.count || a.originalIdx - b.originalIdx,
    );

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const total = ranked.length;
  const showedHintRef = useRef(false);

  // Erstes-Render-Hint: kurze Wackel-Animation am Carousel damit User
  // erkennt dass er sliden kann. Nur einmal pro Mount.
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (showedHintRef.current) return;
    if (total <= 1) return;
    showedHintRef.current = true;
    const t = setTimeout(() => setHint(true), 350);
    const t2 = setTimeout(() => setHint(false), 1300);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [total]);

  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(total - 1, next));
    if (target === index) return;
    setDirection(target > index ? 1 : -1);
    setIndex(target);
  };

  const SWIPE_DISTANCE = 60;
  const SWIPE_VELOCITY = 320;
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      goTo(index + 1);
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      goTo(index - 1);
    }
  };

  if (ranked.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="overflow-hidden rounded-xl"
          style={{ backgroundColor: STORY_COLORS.hairSoft }}
        >
          <MemeImage imagePath={result.imagePath} frame="standalone" />
        </div>
        <p className="text-[13px]" style={{ color: STORY_COLORS.ink50 }}>
          Noch keine Bildunterschriften.
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(index, 0), ranked.length - 1);
  const current = ranked[safeIndex];
  const isWinner = safeIndex === 0 && current.count > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Slide-Container mit drag + AnimatePresence-Übergang */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={safeIndex}
            custom={direction}
            initial={{ x: direction * 80, opacity: 0 }}
            animate={
              hint
                ? { x: [-12, 0], opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
                : { x: 0, opacity: 1 }
            }
            exit={{ x: direction * -80, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            drag={total > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="touch-pan-y"
          >
            {/* Image post — Insta-style, full bleed within slide padding */}
            <div
              className="overflow-hidden rounded-xl"
              style={{ backgroundColor: STORY_COLORS.hairSoft }}
            >
              <MemeImage
                imagePath={result.imagePath}
                caption={current.entry.text}
                frame="standalone"
              />
            </div>

            {/* Author row + count */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {current.entry.author ? (
                  <AvatarCircle member={current.entry.author} size="sm" />
                ) : (
                  <div
                    className="size-8 shrink-0 rounded-full"
                    style={{ backgroundColor: STORY_COLORS.hairSoft }}
                  />
                )}
                <span
                  className="truncate text-[13px]"
                  style={{
                    color: STORY_COLORS.ink,
                    fontWeight: isWinner ? 600 : 500,
                  }}
                >
                  {current.entry.author?.displayName ?? "Unbekannt"}
                </span>
                {isWinner ? (
                  <span
                    className="text-[10px] tabular-nums"
                    style={{
                      color: accentColor,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    TOP
                  </span>
                ) : null}
              </div>
              <span
                className="shrink-0 text-[13px] tabular-nums"
                style={{
                  color: isWinner ? accentColor : STORY_COLORS.ink50,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
              >
                ❤ {current.count}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pulsing chevron-right hint — only when more slides exist and not last */}
        {total > 1 && safeIndex < total - 1 ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: [0, 0.85, 0.6], x: [-4, 4, -4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              backgroundColor: "rgba(0,0,0,0.45)",
              color: "#FAFAFA",
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18}>
              <path
                d="m9.5 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth={1.7}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        ) : null}
      </div>

      {/* Carousel-controls: Prev/Next + dot pager + position counter */}
      {total > 1 ? (
        <div className="mt-1 flex flex-col gap-2">
          <div
            className="flex items-center justify-between text-[11px] tabular-nums"
            style={{ color: STORY_COLORS.ink50, fontFamily: "var(--font-mono)" }}
          >
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              disabled={safeIndex === 0}
              className="transition disabled:opacity-30"
              aria-label="Vorheriger Meme-Post"
            >
              ← VORHER
            </button>
            <span>
              {String(safeIndex + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              disabled={safeIndex === total - 1}
              className="transition disabled:opacity-30"
              aria-label="Nächster Meme-Post"
            >
              WEITER →
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {ranked.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Meme-Post ${i + 1}`}
                className="block rounded-full transition-all"
                style={{
                  width: i === safeIndex ? 18 : 6,
                  height: 6,
                  backgroundColor:
                    i === safeIndex ? accentColor : STORY_COLORS.hair,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
