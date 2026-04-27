"use client";

import { Badge } from "@/components/ui/badge";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type {
  AdminDailyDiagnostics,
  AdminDiagnosticIssue,
} from "@/lib/types/frontend";

type BadgeTone = "neutral" | "dark" | "coral" | "success" | "warning" | "danger";

const DAILY_STATE_TONE: Record<
  AdminDailyDiagnostics["state"],
  { label: string; tone: BadgeTone }
> = {
  missing: { label: "Kein Run", tone: "neutral" },
  ready: { label: "Spielbar", tone: "success" },
  incomplete: { label: "Unvollständig", tone: "warning" },
  unplayable: { label: "Nicht spielbar", tone: "danger" },
};

export function AdminDiagnostics({
  daily,
}: {
  daily: AdminDailyDiagnostics;
}) {
  const tone = DAILY_STATE_TONE[daily.state];
  const { counts } = daily;

  return (
    <section className="space-y-3 radius-card border border-white/60 bg-white/85 p-4 shadow-card-flat backdrop-blur-sm">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
          Daily-Status
        </h2>
      </header>

      <div className="space-y-2 rounded-2xl border border-sand-100 bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-sand-900">Heutige Daily</p>
            <p className="text-xs text-sand-500">
              {formatBerlinDateLabel(daily.dateKey)}
            </p>
          </div>
          <Badge tone={tone.tone} size="sm">
            {tone.label}
          </Badge>
        </div>

        {daily.state !== "missing" ? (
          <CountRow
            items={[
              {
                label: "Fragen",
                value: `${counts.playableItems}/${counts.runItems}`,
              },
              {
                label: "Antworten",
                value: `${counts.publicAnswers + counts.privateAnswers}`,
              },
              {
                label: "Locks",
                value: `${counts.firstAnswerLocks}`,
              },
            ]}
          />
        ) : null}

        <IssueList issues={daily.issues} />
      </div>
    </section>
  );
}

function CountRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="rounded-lg bg-sand-50 px-2 py-1.5 text-center"
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-sand-500">
            {item.label}
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-sand-900">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function IssueList({ issues }: { issues: AdminDiagnosticIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <ul className="space-y-1">
      {issues.map((issue, idx) => (
        <li
          key={`${issue.code}-${idx}`}
          className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
            issue.severity === "error"
              ? "bg-rose-50 text-rose-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <span aria-hidden className="shrink-0">
            {issue.severity === "error" ? "⛔" : "⚠️"}
          </span>
          <span className="flex-1">{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}
