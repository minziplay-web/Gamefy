"use client";

import { useState } from "react";

import { QuestionReveal } from "@/components/daily/question-reveal";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import { useDailyViewState } from "@/lib/firebase/daily";
import type { DailyQuestionCardState, HomePastDailyReview } from "@/lib/types/frontend";

export function PastDailies({ entries }: { entries: HomePastDailyReview[] }) {
  const [openDateKey, setOpenDateKey] = useState<string | null>(entries[0]?.dateKey ?? null);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Noch keine vergangenen Dailies"
        description="Sobald ein Tag abgeschlossen ist, kannst du ihn hier nochmal aufklappen."
      />
    );
  }

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between gap-3 px-1 pt-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-sand-900">
          Vergangene Dailys
        </h2>
      </header>

      <ul className="space-y-3">
        {entries.map((entry) => {
          const complete =
            entry.totalInRun > 0 && entry.answeredByMe === entry.totalInRun;
          const none = entry.answeredByMe === 0;
          const open = openDateKey === entry.dateKey;

          return (
            <li key={entry.dateKey} className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setOpenDateKey((current) =>
                    current === entry.dateKey ? null : entry.dateKey,
                  )
                }
                className="flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-left shadow-card-flat transition hover:border-sand-200 hover:bg-white"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-sand-900">
                    {formatBerlinDateLabel(entry.dateKey)}
                  </p>
                  <p className="text-xs text-sand-500">Aufgelöste Antworten ansehen</p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                      complete
                        ? "bg-emerald-100 text-emerald-700"
                        : none
                          ? "bg-sand-100 text-sand-500"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {entry.answeredByMe}/{entry.totalInRun}
                  </div>
                  <span
                    className={`text-sm text-sand-400 transition-transform ${
                      open ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </div>
              </button>

              {open ? <PastDailyReviewContent entry={entry} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PastDailyReviewContent({
  entry,
}: {
  entry: HomePastDailyReview;
}) {
  const state = useDailyViewState(entry.dateKey);

  if (state.status === "loading") {
    return <Card tone="raised" className="px-4 py-4 text-sm text-sand-600">Lade Antworten …</Card>;
  }

  if (state.status === "error") {
    return <Card tone="raised" className="px-4 py-4 text-sm text-rose-700">{state.message}</Card>;
  }

  if (state.status === "no_run") {
    return <Card tone="raised" className="px-4 py-4 text-sm text-sand-600">Für diesen Tag wurde kein Run gefunden.</Card>;
  }

  if (state.status === "run_unplayable") {
    return <Card tone="raised" className="px-4 py-4 text-sm text-sand-600">{state.reason}</Card>;
  }

  const revealCards = state.cards.filter((card): card is Extract<DailyQuestionCardState, { phase: "revealed" }> => card.phase === "revealed");

  if (revealCards.length === 0 && entry.items.length > 0) {
    return (
      <ul className="space-y-3">
        {entry.items.map((item, index) => (
          <li key={`${entry.dateKey}_${item.questionId}`}>
            <Card tone="raised" className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={item.category} size="sm" />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sand-400">
                  #{index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-sand-900">
                {item.questionText}
              </h3>
              <QuestionReveal result={item.result} />
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  if (revealCards.length === 0) {
    return (
      <Card tone="raised" className="px-4 py-4 text-sm text-sand-600">
        Dieser Tag lässt sich gerade nicht mehr vollständig anzeigen. Sehr
        wahrscheinlich wurden die ursprünglichen Fragen später archiviert oder
        gelöscht.
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {revealCards.map((card, index) => (
        <li key={`${entry.dateKey}_${card.question.questionId}`}>
          <Card tone="raised" className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={card.question.category} size="sm" />
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sand-400">
                #{index + 1}
              </span>
            </div>
            <h3 className="text-base font-semibold leading-snug text-sand-900">
              {card.question.text}
            </h3>
            <QuestionReveal result={card.result} />
          </Card>
        </li>
      ))}
    </ul>
  );
}
