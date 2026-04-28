import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { DailyHistoryEntry } from "@/lib/types/frontend";

export function DailyHistoryList({ entries }: { entries: DailyHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon="📅"
        tone="profile"
        title="Noch keine Dailys beantwortet"
        description="Los gehts morgen, dann startet dein Verlauf."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const complete =
          entry.totalInRun > 0 && entry.answeredByMe === entry.totalInRun;
        const none = entry.answeredByMe === 0;
        return (
          <li
            key={entry.runId ?? entry.dateKey}
            className="flex flex-col gap-2 rounded-2xl border border-profile-primary/20 bg-white px-4 py-3 shadow-card-flat sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-0.5">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-900">
                <span>{formatBerlinDateLabel(entry.dateKey)}</span>
                {entry.runLabel ? (
                  <span className="rounded-full bg-profile-soft px-2 py-0.5 text-[11px] font-bold text-profile-text">
                    {entry.runLabel}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-sand-500">
                {entry.status === "active"
                  ? "Läuft noch"
                  : entry.status === "closed"
                    ? "Abgeschlossen"
                    : "Geplant"}
              </p>
            </div>
            <div
              className={`self-start rounded-full px-3 py-1 text-xs font-semibold tabular-nums sm:self-auto ${
                complete
                  ? "bg-success-soft text-success-text"
                  : none
                    ? "bg-profile-soft text-profile-text"
                    : "bg-brand-soft text-profile-text"
              }`}
            >
              {entry.answeredByMe}/{entry.totalInRun}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

