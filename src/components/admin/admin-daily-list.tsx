"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { AdminDailyRunRow, DateKey } from "@/lib/types/frontend";

type BadgeTone = "neutral" | "dark" | "accent" | "success" | "warning" | "danger";

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
  onDeleteRun,
  onResetToday,
  onRerollQuestion,
  todayDateKey,
  runActionStatus = "idle",
  runActionMessage,
}: {
  runs: AdminDailyRunRow[];
  onCreate: () => void;
  onDeleteRun?: (dateKey: DateKey) => void;
  onResetToday?: () => void;
  onRerollQuestion?: (dateKey: DateKey, questionId: string, text: string) => void;
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
        <div className="space-y-3 rounded-2xl border border-daily-primary/35 bg-white p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9A4C13]">
              Heute
            </p>
            <p className="text-sm font-medium text-sand-900">
              Für heute existiert bereits ein Run mit {todayRun.questionCount} Fragen.
            </p>
          </div>
          {todayRun.items && todayRun.items.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-daily-primary/25 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-500">
                Heutige Fragen
              </p>
              <ul className="space-y-2">
                {todayRun.items.map((item, index) => (
                  <li
                    key={item.questionId}
                    className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-sand-50/70 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sand-500">
                        Frage {index + 1}
                      </p>
                      <p className="text-sm font-medium leading-6 text-sand-900">
                        {item.text}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full shrink-0 px-3 text-brand-primary sm:w-auto"
                      onClick={() =>
                        onRerollQuestion?.(todayRun.dateKey, item.questionId, item.text)
                      }
                      disabled={runActionStatus === "running" || !onRerollQuestion}
                    >
                      Neu würfeln
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Button
            className="w-full"
            variant="secondary"
            onClick={onCreate}
            disabled={runActionStatus === "running"}
          >
            {runActionStatus === "running" ? "Rerollt..." : "Heutiges Daily rerollen"}
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={onResetToday}
            disabled={runActionStatus === "running" || !onResetToday}
          >
            {runActionStatus === "running" ? "Setzt zurück..." : "Heutiges Daily zurücksetzen"}
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
              ? "bg-danger-soft text-danger-text"
              : runActionStatus === "success"
                ? "bg-success-soft text-success-text"
                : "bg-sand-50 text-sand-700"
          }`}
        >
          {runActionMessage}
        </p>
      ) : null}

      {runs.length === 0 ? (
        <EmptyState
          title="Noch keine Runs"
          description="Erzeuge einen Run für heute oder morgen."
        />
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => {
            const tone = STATUS_TONE[run.status];
            const isToday = run.dateKey === todayDateKey;
            return (
              <li
                key={run.dateKey}
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  isToday
                    ? "border-daily-primary/35 bg-white"
                    : "border-sand-200/80 bg-white"
                }`}
              >
                <div className="w-full min-w-0 space-y-1 sm:w-auto">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-900">
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
                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
                  {!isToday ? (
                    <Button
                      variant="ghost"
                      className="px-3 text-danger-text"
                      onClick={() => onDeleteRun?.(run.dateKey)}
                      disabled={runActionStatus === "running" || !onDeleteRun}
                    >
                      Löschen
                    </Button>
                  ) : null}
                  <Badge tone={tone.tone} size="sm">
                    {tone.label}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
