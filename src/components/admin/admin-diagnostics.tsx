import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type {
  AdminCleanupResult,
  AdminDailyDiagnostics,
  AdminDiagnosticIssue,
  AdminLiveDiagnostics,
  AdminOpsDiagnostics,
} from "@/lib/types/frontend";

type BadgeTone = "neutral" | "dark" | "coral" | "success" | "warning" | "danger";

const DAILY_STATE_TONE: Record<
  AdminDailyDiagnostics["state"],
  { label: string; tone: BadgeTone }
> = {
  missing: { label: "Kein Run", tone: "neutral" },
  ready: { label: "Spielbar", tone: "success" },
  incomplete: { label: "Unvollstaendig", tone: "warning" },
  unplayable: { label: "Nicht spielbar", tone: "danger" },
};

const LIVE_STATE_TONE: Record<
  AdminLiveDiagnostics["state"],
  { label: string; tone: BadgeTone }
> = {
  ready: { label: "OK", tone: "success" },
  warning: { label: "Achtung", tone: "warning" },
  error: { label: "Fehler", tone: "danger" },
};

const PHASE_LABEL: Record<AdminLiveDiagnostics["phase"], string> = {
  lobby: "Warteraum",
  question: "Frage",
  reveal: "Aufloesung",
  finished: "Beendet",
};

export function AdminDiagnostics({
  daily,
  live,
  ops,
  cleanupStatus = "idle",
  cleanupMessage,
  cleanupResult,
  onCleanup,
}: {
  daily: AdminDailyDiagnostics;
  live: AdminLiveDiagnostics | null;
  ops: AdminOpsDiagnostics;
  cleanupStatus?: "idle" | "running" | "success" | "error";
  cleanupMessage?: string;
  cleanupResult?: AdminCleanupResult;
  onCleanup?: () => void;
}) {
  return (
    <section className="space-y-3 radius-card border border-white/60 bg-white/85 p-4 shadow-card-flat backdrop-blur-sm">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
          Status
        </h2>
      </header>

      <DailyBlock daily={daily} />
      {live ? <LiveBlock live={live} /> : <LiveEmpty />}
      <OpsBlock
        ops={ops}
        cleanupStatus={cleanupStatus}
        cleanupMessage={cleanupMessage}
        cleanupResult={cleanupResult}
        onCleanup={onCleanup}
      />
    </section>
  );
}

function DailyBlock({ daily }: { daily: AdminDailyDiagnostics }) {
  const tone = DAILY_STATE_TONE[daily.state];
  const { counts } = daily;

  return (
    <div className="space-y-2 rounded-2xl border border-sand-100 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-sand-900">
            Heutige Daily
          </p>
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
              label: "First-Locks",
              value: `${counts.firstAnswerLocks}`,
            },
          ]}
        />
      ) : null}

      <IssueList issues={daily.issues} />
    </div>
  );
}

function LiveBlock({ live }: { live: AdminLiveDiagnostics }) {
  const tone = LIVE_STATE_TONE[live.state];
  const { counts } = live;

  return (
    <div className="space-y-2 rounded-2xl border border-sand-100 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-sand-900">
            Live-Session
          </p>
          <p className="text-xs text-sand-500">
            Code {live.code} · {PHASE_LABEL[live.phase]}
          </p>
        </div>
        <Badge tone={tone.tone} size="sm">
          {tone.label}
        </Badge>
      </div>

      <CountRow
        items={[
          {
            label: "Fragen",
            value: `${counts.playableItems}/${counts.totalItems}`,
          },
          {
            label: "Verbunden",
            value: `${counts.connectedParticipants}/${counts.totalParticipants}`,
          },
        ]}
      />

      {live.timing.sessionAgeMinutes !== null || live.timing.phaseAgeMinutes !== null ? (
        <CountRow
          items={[
            {
              label: "Session-Alter",
              value: formatMinutes(live.timing.sessionAgeMinutes),
            },
            {
              label: "Phasen-Alter",
              value: formatMinutes(live.timing.phaseAgeMinutes),
            },
          ]}
        />
      ) : null}

      <IssueList issues={live.issues} />
    </div>
  );
}

function LiveEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-sand-200 bg-sand-50/50 p-3 text-center">
      <p className="text-xs font-medium text-sand-500">
        Keine aktive Live-Session
      </p>
    </div>
  );
}

function OpsBlock({
  ops,
  cleanupStatus,
  cleanupMessage,
  cleanupResult,
  onCleanup,
}: {
  ops: AdminOpsDiagnostics;
  cleanupStatus: "idle" | "running" | "success" | "error";
  cleanupMessage?: string;
  cleanupResult?: AdminCleanupResult;
  onCleanup?: () => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-sand-100 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-sand-900">Ops</p>
          <p className="text-xs text-sand-500">
            Aufraeumen beendeter Live-Sessions und alter Lobby-Codes.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCleanup}
          disabled={!onCleanup || cleanupStatus === "running"}
        >
          {cleanupStatus === "running" ? "Raeumt auf..." : "Cleanup"}
        </Button>
      </div>

      <CountRow
        items={[
          { label: "Finished", value: `${ops.finishedLiveSessions}` },
          { label: "Stale", value: `${ops.staleFinishedLiveSessions}` },
          { label: "Codes", value: `${ops.inactiveLobbyCodes}` },
        ]}
      />

      <CountRow
        items={[
          { label: "Code-Stale", value: `${ops.staleInactiveLobbyCodes}` },
          { label: "First-Locks", value: `${ops.orphanedDailyFirstAnswerLocks}` },
          { label: "Cleanup", value: cleanupStatus === "idle" ? "bereit" : cleanupStatus },
        ]}
      />

      {ops.oldestStaleFinishedLiveAgeHours !== null ||
      ops.oldestStaleInactiveLobbyCodeAgeHours !== null ? (
        <CountRow
          items={[
            {
              label: "Aelteste Session",
              value: formatHours(ops.oldestStaleFinishedLiveAgeHours),
            },
            {
              label: "Aeltester Code",
              value: formatHours(ops.oldestStaleInactiveLobbyCodeAgeHours),
            },
          ]}
        />
      ) : null}

      {cleanupResult ? (
        <CountRow
          items={[
            { label: "Finalisiert", value: `${cleanupResult.finalizedStaleLiveSessions}` },
            { label: "Geloescht", value: `${cleanupResult.deletedFinishedLiveSessions}` },
            { label: "Codes", value: `${cleanupResult.deletedInactiveLobbyCodes}` },
          ]}
        />
      ) : null}

      {cleanupResult ? (
        <CountRow
          items={[
            {
              label: "Locks",
              value: `${cleanupResult.deletedOrphanedDailyFirstAnswerLocks}`,
            },
            {
              label: "Bilanz",
              value: formatCleanupTotal(cleanupResult),
            },
          ]}
        />
      ) : null}

      {cleanupMessage ? (
        <p
          className={`rounded-lg px-2.5 py-1.5 text-xs ${
            cleanupStatus === "error"
              ? "bg-rose-50 text-rose-800"
              : cleanupStatus === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-sand-50 text-sand-600"
          }`}
        >
          {cleanupMessage}
        </p>
      ) : null}
    </div>
  );
}

function formatMinutes(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function formatHours(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value < 1) {
    return "<1 h";
  }

  if (value < 24) {
    return `${Math.floor(value)} h`;
  }

  const days = Math.floor(value / 24);
  const hours = Math.floor(value % 24);
  return hours === 0 ? `${days} d` : `${days} d ${hours} h`;
}

function formatCleanupTotal(result: AdminCleanupResult) {
  const total =
    result.finalizedStaleLiveSessions +
    result.deletedFinishedLiveSessions +
    result.deletedInactiveLobbyCodes +
    result.deletedOrphanedDailyFirstAnswerLocks;

  return total === 0 ? "nichts" : `${total} Aktionen`;
}

function CountRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  const gridClass =
    items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <dl className={`grid ${gridClass} gap-2`}>
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

