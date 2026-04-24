import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { DailyHistoryEntry } from "@/lib/types/frontend";

export function DailyHistoryList({ entries }: { entries: DailyHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
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
            key={entry.dateKey}
            className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/75 px-4 py-3 shadow-card-flat"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-sand-900">
                {formatBerlinDateLabel(entry.dateKey)}
              </p>
              <p className="text-xs text-sand-500">
                {entry.status === "active"
                  ? "Laeuft noch"
                  : entry.status === "closed"
                    ? "Abgeschlossen"
                    : "Geplant"}
              </p>
            </div>
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
          </li>
        );
      })}
    </ul>
  );
}

