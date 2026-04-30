"use client";

import Link from "next/link";
import { useState } from "react";

import { QuestionReveal } from "@/components/daily/question-reveal";
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
      <ul className="space-y-3">
        {entries.map((entry) => {
          const complete =
            entry.totalInRun > 0 && entry.answeredByMe === entry.totalInRun;
          const none = entry.answeredByMe === 0;
          const entryKey = getPastDailyKey(entry);
          const open = openEntryKey === entryKey;

          return (
            <li key={entryKey}>
              <article
                className={`overflow-hidden rounded-3xl bg-white transition ${
                  open
                    ? "shadow-card-raised ring-2 ring-archive-primary/30"
                    : "shadow-card-flat ring-1 ring-slate-200 hover:-translate-y-0.5 hover:shadow-card-raised hover:ring-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenEntryKey((current) =>
                      current === entryKey ? null : entryKey,
                    )
                  }
                  aria-expanded={open}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition"
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
                  <div className="border-t border-slate-100 px-5 pb-6 pt-5 min-[380px]:px-6">
                    <PastDailyReviewContent
                      entry={entry}
                      onVoteMemeCaption={onVoteMemeCaption}
                    />
                  </div>
                ) : null}
              </article>
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
      <div className="space-y-3">
        <p className="text-sm text-sand-700">
          Du hast dieses Daily noch nicht fertig beantwortet.
        </p>
        <Link
          href={`/daily?date=${entry.dateKey}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-archive-primary px-4 py-3 text-sm font-semibold text-white shadow-card-flat transition hover:bg-archive-text"
        >
          Daily nachholen
        </Link>
      </div>
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
    return <p className="text-sm text-sand-600">Lade Antworten …</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-archive-primary">{state.message}</p>;
  }

  if (state.status === "no_run") {
    return (
      <p className="text-sm text-sand-600">
        Für diesen Tag wurde kein Run gefunden.
      </p>
    );
  }

  if (state.status === "run_unplayable") {
    return <p className="text-sm text-sand-600">{state.reason}</p>;
  }

  const revealCards = state.cards.filter(
    (card): card is Extract<DailyQuestionCardState, { phase: "revealed" }> =>
      card.phase === "revealed",
  );

  if (revealCards.length === 0 && entry.items.length > 0) {
    return (
      <ul className="divide-y divide-slate-100">
        {entry.items.map((item, index) => (
          <li
            key={`${entry.dateKey}_${item.questionId}`}
            className="space-y-4 py-6 first:pt-0 last:pb-0"
          >
            <header className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-archive-text/75">
                <span>#{index + 1}</span>
                <span aria-hidden className="size-1 rounded-full bg-archive-text/40" />
                <CategoryBadge category={item.category} size="sm" />
              </div>
              <h3 className="text-base font-semibold leading-snug text-sand-900 min-[380px]:text-lg">
                {item.questionText}
              </h3>
            </header>
            <QuestionReveal
              result={item.result}
              tone="archive"
              embedded
              onVoteMemeCaption={
                onVoteMemeCaption
                  ? (authorUserId, value) =>
                      onVoteMemeCaption(item, authorUserId, value)
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    );
  }

  if (revealCards.length === 0) {
    return (
      <p className="text-sm text-sand-600">
        Dieser Tag lässt sich gerade nicht mehr vollständig anzeigen. Sehr
        wahrscheinlich wurden die ursprünglichen Fragen später archiviert oder
        gelöscht.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {revealCards.map((card, index) => (
        <li
          key={`${entry.dateKey}_${card.question.questionId}`}
          className="space-y-4 py-6 first:pt-0 last:pb-0"
        >
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-archive-text/75">
              <span>#{index + 1}</span>
              <span aria-hidden className="size-1 rounded-full bg-archive-text/40" />
              <CategoryBadge category={card.question.category} size="sm" />
            </div>
            <h3 className="text-base font-semibold leading-snug text-sand-900 min-[380px]:text-lg">
              {card.question.text}
            </h3>
          </header>
          <QuestionReveal
            result={card.result}
            tone="archive"
            embedded
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
        </li>
      ))}
    </ul>
  );
}
