"use client";

import Link from "next/link";

import { STORY_COLORS } from "@/components/story";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useHomeViewState } from "@/lib/firebase/home";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { HomePastDailyReview } from "@/lib/types/frontend";

/**
 * Past-Dailies-Index — Reddit-dense Liste aller archivierten Tage.
 *
 * Visual: Mockup Section 02 — kompakte Rows, Hairline-Trenner sand-100,
 * Geist-Mono für Datum-Stamps & Index-Position. Klick → Tagesübersicht.
 *
 * Datenquelle: useHomeViewState (gibt die letzten 5 vergangenen Dailies
 * zurück). Keine neuen Firestore-Queries nötig.
 */
export default function PastDailiesPage() {
  const state = useHomeViewState();

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Alte Fragen" title="Archiv" theme="archive" />
        <div className="flex justify-center py-12">
          <ThreeBodyLoader size={48} label="Archiv wird geladen" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Alte Fragen" title="Archiv" theme="archive" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  const entries = state.pastDailies ?? [];

  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="Alte Fragen" title="Archiv" theme="archive" />
      {entries.length === 0 ? (
        <EmptyState
          icon="📅"
          tone="archive"
          title="Noch keine vergangenen Dailies"
          description="Sobald ein Tag abgeschlossen ist, kannst du ihn hier nochmal aufklappen."
        />
      ) : (
        <PastDailiesList entries={entries} />
      )}
    </div>
  );
}

function PastDailiesList({ entries }: { entries: HomePastDailyReview[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl bg-[#161616] ring-1 ring-[#1F1F1F]">
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const dateLabel = formatBerlinDateLabel(entry.dateKey);
        const complete =
          entry.totalInRun > 0 && entry.answeredByMe === entry.totalInRun;
        const none = entry.answeredByMe === 0;
        const dayNumber = entry.dateKey.slice(8, 10);

        return (
          <li
            key={entry.runId ?? entry.dateKey}
            className={isLast ? "" : "border-b border-[#1F1F1F]"}
          >
            <Link
              href={`/past-dailies/${entry.dateKey}`}
              className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-[#0E0E0E]"
            >
              <span
                className="shrink-0 w-9 leading-none tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 22,
                  color: STORY_COLORS.hair,
                  fontWeight: 500,
                }}
                aria-hidden
              >
                {dayNumber}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: STORY_COLORS.ink50,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {entry.dateKey}
                  {entry.runLabel ? ` · ${entry.runLabel}` : ""}
                </p>
                <p
                  className="mt-1 text-[15px] leading-snug"
                  style={{ color: STORY_COLORS.ink, fontWeight: 500 }}
                >
                  {dateLabel}
                </p>
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: STORY_COLORS.ink50 }}
                >
                  {entry.totalInRun} Fragen · {labelForStatus(entry, complete, none)}
                </p>
              </div>

              <span
                className="inline-flex items-center gap-1 text-[12px] tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: complete
                    ? STORY_COLORS.ink70
                    : none
                      ? STORY_COLORS.archiv
                      : STORY_COLORS.daily,
                  fontWeight: 600,
                }}
              >
                {entry.answeredByMe}/{entry.totalInRun}
              </span>
              <span
                aria-hidden
                className="shrink-0 text-[14px]"
                style={{ color: STORY_COLORS.hair }}
              >
                ›
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function labelForStatus(
  entry: HomePastDailyReview,
  complete: boolean,
  none: boolean,
) {
  if (complete) return "Komplett";
  if (none) return "Noch nicht gespielt";
  return `Du hast ${entry.answeredByMe} beantwortet`;
}
