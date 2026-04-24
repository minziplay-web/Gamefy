"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { AdminDailyRunRow, DateKey } from "@/lib/types/frontend";

type BadgeTone = "neutral" | "dark" | "coral" | "success" | "warning" | "danger";

const STATUS_TONE: Record<
  AdminDailyRunRow["status"],
  { label: string; tone: BadgeTone }
> = {
  scheduled: { label: "Geplant", tone: "neutral" },
  active: { label: "Aktiv", tone: "success" },
  closed: { label: "Abgeschlossen", tone: "neutral" },
};

export function AdminDailyList({
  runs,
  onCreate,
  todayDateKey,
  runActionStatus = "idle",
  runActionMessage,
}: {
  runs: AdminDailyRunRow[];
  onCreate: () => void;
  todayDateKey?: DateKey;
  runActionStatus?: "idle" | "running" | "success" | "error";
  runActionMessage?: string;
}) {
  const todayRun = todayDateKey
    ? runs.find((r) => r.dateKey === todayDateKey)
    : undefined;

  return (
    <div className="space-y-3">
      {todayRun ? (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              Heute
            </p>
            <p className="text-sm font-medium text-amber-900">
              Fuer heute existiert bereits ein Run mit {todayRun.questionCount} Fragen.
            </p>
          </div>
          <Button
            className="w-full"
            variant="secondary"
            onClick={onCreate}
            disabled={runActionStatus === "running"}
          >
            {runActionStatus === "running" ? "Ersetzt..." : "Heutigen Run ersetzen"}
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={onCreate} disabled={runActionStatus === "running"}>
          {runActionStatus === "running" ? "Erzeugt..." : "Neuen Run erzeugen"}
        </Button>
      )}

      {runActionMessage ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            runActionStatus === "error"
              ? "bg-rose-50 text-rose-800"
              : runActionStatus === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-sand-50 text-sand-700"
          }`}
        >
          {runActionMessage}
        </p>
      ) : null}

      {runs.length === 0 ? (
        <EmptyState
          title="Noch keine Runs"
          description="Erzeuge einen Run fuer heute oder morgen."
        />
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => {
            const tone = STATUS_TONE[run.status];
            const isToday = run.dateKey === todayDateKey;
            return (
              <li
                key={run.dateKey}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  isToday
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-white/50 bg-white/80"
                }`}
              >
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-sand-900">
                    {formatBerlinDateLabel(run.dateKey)}
                    {isToday ? (
                      <Badge tone="warning" size="sm">
                        heute
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-sand-500">
                    {run.questionCount} Fragen · {run.createdByDisplayName}
                  </p>
                </div>
                <Badge tone={tone.tone} size="sm">
                  {tone.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
