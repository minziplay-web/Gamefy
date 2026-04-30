"use client";

import { useRef, useState } from "react";

import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionReveal } from "@/components/daily/question-reveal";
import type { DailyRecapItem } from "@/lib/types/frontend";

export function DailyRecap({
  items,
  onVoteMemeCaption,
}: {
  items: DailyRecapItem[];
  onVoteMemeCaption?: (
    item: DailyRecapItem,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
}) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [lastJumpedIndex, setLastJumpedIndex] = useState(-1);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");

  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <header className="px-1 pt-2">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-recap-text">
            Heute aufgelöst
          </h2>
        </header>
        <EmptyState
          icon="⌛"
          tone="recap"
          title="Noch nichts aufgelöst"
          description="Sobald Antworten sichtbar sind, sammeln sie sich hier."
        />
      </section>
    );
  }

  const jumpToNextQuestion = () => {
    if (scrollDirection === "up") {
      setLastJumpedIndex(0);
      setScrollDirection(items.length > 1 ? "down" : "up");
      itemRefs.current[0]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    const nextIndex = (lastJumpedIndex + 1) % items.length;
    setLastJumpedIndex(nextIndex);
    itemRefs.current[nextIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.setTimeout(() => {
      if (isNearPageBottom() || nextIndex === items.length - 1) {
        setScrollDirection("up");
      }
    }, 450);
  };
  const isAtLastQuestion = scrollDirection === "up";

  return (
    <section className="relative space-y-3 pb-20">
      <header className="px-1 pt-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-recap-text">
          Heute aufgelöst
        </h2>
      </header>

      <ul className="space-y-3">
        {items.map((item, index) => {
          const itemKey = `${item.dateKey}:${item.runId ?? "daily"}:${item.questionId}`;
          return (
          <li
            key={itemKey}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            className="scroll-mt-5"
          >
            <article className="radius-card overflow-hidden border border-[#8E6FBD]/25 bg-white shadow-card-flat">
              <div className="h-1 bg-[#8E6FBD]" />
              <div className="space-y-4 p-4 min-[380px]:p-5">
                <header className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={item.category} size="sm" />
                    <span className="ml-auto text-[11px] font-semibold tabular-nums text-sand-500">
                      #{index + 1}
                    </span>
                  </div>
                  <h3 className="text-[1.05rem] font-semibold leading-snug text-sand-900 min-[380px]:text-lg">
                    {item.questionText}
                  </h3>
                </header>
                <QuestionReveal
                  result={item.result}
                  tone="recap"
                  onVoteMemeCaption={
                    onVoteMemeCaption
                      ? (authorUserId, value) =>
                          onVoteMemeCaption(item, authorUserId, value)
                      : undefined
                  }
                />
              </div>
            </article>
          </li>
          );
        })}
      </ul>

      {items.length > 1 ? (
        <button
          type="button"
          onClick={jumpToNextQuestion}
          className="fixed bottom-24 right-4 z-30 flex size-11 items-center justify-center rounded-full border border-white/60 bg-linear-to-br from-[#4A5699] via-[#C45FA0] to-[#E5594F] text-base font-black text-white shadow-[0_14px_28px_-14px_rgba(74,86,153,0.72)] ring-[3px] ring-white/75 transition hover:scale-105 active:scale-95 min-[480px]:right-[calc(50%_-_224px)]"
          aria-label={
            isAtLastQuestion
              ? "Zur ersten aufgelösten Frage springen"
              : "Zur nächsten aufgelösten Frage springen"
          }
          title={isAtLastQuestion ? "Zur ersten Frage" : "Nächste Frage"}
        >
          <span
            className={`transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isAtLastQuestion ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden
          >
            ↓
          </span>
        </button>
      ) : null}
    </section>
  );
}

function isNearPageBottom() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const viewportHeight = window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;
  return scrollTop + viewportHeight >= pageHeight - 24;
}
