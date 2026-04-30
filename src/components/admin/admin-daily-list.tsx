"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { AdminDailyRunRow, DateKey, QuestionType } from "@/lib/types/frontend";

type BadgeTone = "neutral" | "dark" | "accent" | "success" | "warning" | "danger";

const STATUS_TONE: Record<
  AdminDailyRunRow["status"],
  { label: string; tone: BadgeTone }
> = {
  scheduled: { label: "Geplant", tone: "neutral" },
  active: { label: "Aktiv", tone: "success" },
  closed: { label: "Abgeschlossen", tone: "neutral" },
};

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Mitglied wählen",
  multi_choice: "Mehrere Mitglieder",
  open_text: "Freitext",
  duel_1v1: "1v1 Voting",
  duel_2v2: "2v2 Voting",
  either_or: "2 Optionen",
  meme_caption: "Meme",
};

export function AdminDailyList({
  runs,
  onCreate,
  onReplaceToday,
  onDeleteRun,
  onResetToday,
  onRerollQuestion,
  onRemoveQuestion,
  todayDateKey,
  runActionStatus = "idle",
  runActionMessage,
}: {
  runs: AdminDailyRunRow[];
  onCreate: () => void;
  onReplaceToday?: () => void;
  onDeleteRun?: (dateKey: DateKey) => void;
  onResetToday?: () => void;
  onRerollQuestion?: (dateKey: DateKey, runId: string, questionId: string, text: string) => void;
  onRemoveQuestion?: (dateKey: DateKey, runId: string, questionId: string, text: string) => void;
  todayDateKey?: DateKey;
  runActionStatus?: "idle" | "running" | "success" | "error";
  runActionMessage?: string;
}) {
  const todayRuns = todayDateKey
    ? runs.filter((r) => r.dateKey === todayDateKey)
    : [];
  const todayRun =
    todayRuns.find((run) => run.runNumber === 1 || run.runId === todayDateKey) ??
    todayRuns[0];
  const visibleRuns = runs.filter(
    (run) => !(run.dateKey === todayDateKey && run.runNumber > 1),
  );

  return (
    <div className="space-y-3">
      {todayRun ? (
        <div className="space-y-3 rounded-2xl border border-daily-primary/30 bg-white p-3 shadow-card-flat">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A4C13]">
              Heute
            </p>
              <p className="truncate text-sm font-bold text-sand-900">
                {todayRun.questionCount} Fragen
            </p>
            </div>
            <Badge tone="warning" size="sm">Heute</Badge>
          </div>
          {todayRun.items && todayRun.items.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-sand-500">
                Heutige Fragen
              </p>
              <ul className="space-y-2">
                {(todayRun.items ?? []).map((item, index) => (
                  <li
                    key={`${todayRun.runId}_${item.questionId}`}
                    className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-sand-50/70 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    {item.type === "meme_caption" && item.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagePath}
                        alt=""
                        className="h-24 w-full rounded-2xl object-cover sm:h-20 sm:w-28"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sand-500">
                          Frage {index + 1}
                        </p>
                        <CategoryBadge category={item.category} size="sm" />
                        <Badge tone="neutral" size="sm">
                          {TYPE_LABELS[item.type]}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium leading-6 text-sand-900">
                        {item.text}
                      </p>
                    </div>
                    <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto sm:grid-cols-1">
                      <Button
                        variant="ghost"
                        className="rounded-xl px-3 text-[12px] text-brand-primary"
                        onClick={() =>
                          onRerollQuestion?.(
                            todayRun.dateKey,
                            todayRun.runId,
                            item.questionId,
                            item.text,
                          )
                        }
                        disabled={runActionStatus === "running" || !onRerollQuestion}
                      >
                        Neu würfeln
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-xl px-3 text-[12px] text-danger-text"
                        onClick={() =>
                          onRemoveQuestion?.(
                            todayRun.dateKey,
                            todayRun.runId,
                            item.questionId,
                            item.text,
                          )
                        }
                        disabled={runActionStatus === "running" || !onRemoveQuestion}
                      >
                        Entfernen
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-3">
            <Button
              className="w-full rounded-xl text-[12px]"
              variant="secondary"
              onClick={onCreate}
              disabled={runActionStatus === "running"}
            >
              {runActionStatus === "running" ? "Fügt hinzu..." : "Frage hinzufügen"}
            </Button>
            <Button
              className="w-full rounded-xl text-[12px]"
              variant="ghost"
              onClick={onReplaceToday}
              disabled={runActionStatus === "running" || !onReplaceToday}
            >
              {runActionStatus === "running" ? "Rerollt..." : "Daily rerollen"}
            </Button>
            <Button
              className="w-full rounded-xl text-[12px]"
              variant="ghost"
              onClick={onResetToday}
              disabled={runActionStatus === "running" || !onResetToday}
            >
              {runActionStatus === "running" ? "Setzt zurück..." : "Antworten resetten"}
            </Button>
          </div>
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

      {visibleRuns.length === 0 ? (
        <EmptyState
          title="Noch keine Runs"
          description="Erzeuge einen Run für heute oder morgen."
        />
      ) : (
        <ul className="space-y-2">
          {visibleRuns.map((run) => {
            const tone = STATUS_TONE[run.status];
            const isToday = run.dateKey === todayDateKey;
            return (
              <li
                key={run.runId}
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  isToday
                    ? "border-daily-primary/35 bg-white"
                    : "border-sand-200/80 bg-white"
                }`}
              >
                <div className="w-full min-w-0 space-y-1 sm:w-auto">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-900">
                    {formatBerlinDateLabel(run.dateKey)}
                    {run.runNumber > 1 ? (
                      <Badge tone="warning" size="sm">
                        {run.runLabel}
                      </Badge>
                    ) : null}
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
