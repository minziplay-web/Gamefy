"use client";

import Link from "next/link";
import { useState } from "react";

import { QuestionReveal } from "@/components/daily/question-reveal";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import { useDailyViewState } from "@/lib/firebase/daily";
import type {
  DailyQuestionCardState,
  DailyRecapItem,
  HomePastDailyReview,
} from "@/lib/types/frontend";

export function PastDailies({
  entries,
  onVoteMemeCaption,
}: {
  entries: HomePastDailyReview[];
  onVoteMemeCaption?: (
    item: DailyRecapItem,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
}) {
  const [openEntryKey, setOpenEntryKey] = useState<string | null>(
    entries[0] ? getPastDailyKey(entries[0]) : null,
  );

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="📅"
        tone="archive"
        title="Noch keine vergangenen Dailies"
        description="Sobald ein Tag abgeschlossen ist, kannst du ihn hier nochmal aufklappen."
      />
    );
  }

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between gap-3 px-1 pt-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-archive-text">
          Archiv
        </h2>
      </header>

      <ul className="space-y-3">
        {entries.map((entry) => {
          const complete =
            entry.totalInRun > 0 && entry.answeredByMe === entry.totalInRun;
          const none = entry.answeredByMe === 0;
          const entryKey = getPastDailyKey(entry);
          const open = openEntryKey === entryKey;

          return (
            <li key={entryKey} className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setOpenEntryKey((current) =>
                    current === entryKey ? null : entryKey,
                  )
                }
                className="flex w-full items-center justify-between rounded-[24px] border-2 border-archive-primary/16 bg-white px-4 py-3 text-left shadow-card-flat transition hover:-translate-y-0.5 hover:border-archive-primary/35 hover:shadow-card-raised"
              >
                <div className="space-y-0.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-900">
                    <span>{formatBerlinDateLabel(entry.dateKey)}</span>
                    {entry.runLabel ? (
                      <span className="rounded-full bg-archive-soft px-2 py-0.5 text-[11px] font-bold text-archive-primary">
                        {entry.runLabel}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-sand-500">Aufgelöste Antworten ansehen</p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                      complete
                        ? "bg-success-soft text-success-text"
                        : none
                    ? "bg-archive-soft text-archive-primary"
                    : "bg-[#FFF3F4] text-archive-primary"
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

              {open ? (
                <PastDailyReviewContent
                  entry={entry}
                  onVoteMemeCaption={onVoteMemeCaption}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PastDailyReviewContent({
  entry,
  onVoteMemeCaption,
}: {
  entry: HomePastDailyReview;
  onVoteMemeCaption?: (
    item: DailyRecapItem,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
}) {
  const isIncomplete =
    entry.totalInRun > 0 && entry.answeredByMe < entry.totalInRun;

  if (isIncomplete) {
    return (
      <Card
        tone="raised"
        className="space-y-3 border-archive-primary/22 bg-white px-4 py-4"
      >
        <p className="text-sm text-sand-700">
          Du hast dieses Daily noch nicht fertig beantwortet.
        </p>
        <Link
          href={`/daily?date=${entry.dateKey}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-archive-primary px-4 py-3 text-sm font-semibold text-white shadow-card-flat transition hover:bg-archive-text"
        >
          Daily nachholen
        </Link>
      </Card>
    );
  }

  return (
    <PastDailyResolvedContent
      entry={entry}
      onVoteMemeCaption={onVoteMemeCaption}
    />
  );
}

function getPastDailyKey(entry: HomePastDailyReview) {
  return entry.runId ?? entry.dateKey;
}

function PastDailyResolvedContent({
  entry,
  onVoteMemeCaption,
}: {
  entry: HomePastDailyReview;
  onVoteMemeCaption?: (
    item: DailyRecapItem,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
}) {
  const state = useDailyViewState(entry.dateKey);

  if (state.status === "loading") {
    return (
      <Card
        tone="raised"
        className="border-archive-primary/22 bg-white px-4 py-4 text-sm text-sand-600"
      >
        Lade Antworten …
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card
        tone="raised"
        className="border-archive-primary/22 bg-white px-4 py-4 text-sm text-archive-primary"
      >
        {state.message}
      </Card>
    );
  }

  if (state.status === "no_run") {
    return (
      <Card
        tone="raised"
        className="border-archive-primary/22 bg-white px-4 py-4 text-sm text-sand-600"
      >
        Für diesen Tag wurde kein Run gefunden.
      </Card>
    );
  }

  if (state.status === "run_unplayable") {
    return (
      <Card
        tone="raised"
        className="border-archive-primary/22 bg-white px-4 py-4 text-sm text-sand-600"
      >
        {state.reason}
      </Card>
    );
  }

  const revealCards = state.cards.filter(
    (card): card is Extract<DailyQuestionCardState, { phase: "revealed" }> =>
      card.phase === "revealed",
  );

  if (revealCards.length === 0 && entry.items.length > 0) {
    return (
      <ul className="space-y-3">
        {entry.items.map((item, index) => {
          return (
          <li key={`${entry.dateKey}_${item.questionId}`}>
            <Card
              tone="raised"
              className="space-y-3 border-transparent bg-transparent p-0 shadow-none"
            >
              <div className="px-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <CategoryBadge category={item.category} size="sm" />
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sand-400">
                    #{index + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold leading-snug text-sand-900">
                  {item.questionText}
                </h3>
              </div>
              <QuestionReveal
                result={item.result}
                tone="archive"
                onVoteMemeCaption={
                  onVoteMemeCaption
                    ? (authorUserId, value) =>
                        onVoteMemeCaption(item, authorUserId, value)
                    : undefined
                }
              />
            </Card>
          </li>
          );
        })}
      </ul>
    );
  }

  if (revealCards.length === 0) {
    return (
      <Card
        tone="raised"
        className="border-archive-primary/22 bg-white px-4 py-4 text-sm text-sand-600"
      >
        Dieser Tag lässt sich gerade nicht mehr vollständig anzeigen. Sehr
        wahrscheinlich wurden die ursprünglichen Fragen später archiviert oder
        gelöscht.
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {revealCards.map((card, index) => {
        return (
        <li key={`${entry.dateKey}_${card.question.questionId}`}>
          <Card
            tone="raised"
            className="space-y-3 border-transparent bg-transparent p-0 shadow-none"
          >
            <div className="px-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <CategoryBadge category={card.question.category} size="sm" />
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sand-400">
                  #{index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-sand-900">
                {card.question.text}
              </h3>
            </div>
            <QuestionReveal
              result={card.result}
              tone="archive"
              onVoteMemeCaption={
                onVoteMemeCaption
                  ? (authorUserId, value) =>
                      onVoteMemeCaption(
                        {
                          dateKey: entry.dateKey,
                          questionId: card.question.questionId,
                          questionText: card.question.text,
                          category: card.question.category,
                          result: card.result,
                        },
                        authorUserId,
                        value,
                      )
                  : undefined
              }
            />
          </Card>
        </li>
        );
      })}
    </ul>
  );
}
