"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminConfigForm } from "@/components/admin/admin-config-form";
import { AdminDailyList } from "@/components/admin/admin-daily-list";
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics";
import { AdminJsonImport } from "@/components/admin/admin-json-import";
import { AdminQuestionFilterBar } from "@/components/admin/admin-question-filter-bar";
import { AdminQuestionList } from "@/components/admin/admin-question-list";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { mergeAdminState } from "@/lib/mapping/state-merge";
import { berlinDateKey } from "@/lib/mapping/date";
import type {
  AdminCleanupResult,
  AdminQuestionFilter,
  AdminQuestionRow,
  AdminRunActionResult,
  AdminTab,
  AdminViewState,
} from "@/lib/types/frontend";

export function AdminScreen({
  state: initial,
  onToggleActive,
  onImportQuestions,
  onCreateRun,
  onCleanupFinishedSessions,
  onSaveConfig,
}: {
  state: AdminViewState;
  onToggleActive?: (questionId: string, active: boolean) => Promise<void>;
  onImportQuestions?: (raw: string) => Promise<void>;
  onCreateRun?: (mode: "create" | "replace") => Promise<AdminRunActionResult>;
  onCleanupFinishedSessions?: () => Promise<AdminCleanupResult>;
  onSaveConfig?: (
    draft: Extract<AdminViewState, { status: "ready" }>["config"]["draft"],
  ) => Promise<void>;
}) {
  const [state, setState] = useState(initial);
  const [replaceConfirm, setReplaceConfirm] = useState<string | null>(null);
  const [cleanupState, setCleanupState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
    result?: AdminCleanupResult;
  }>({
    status: "idle",
  });
  const [runActionState, setRunActionState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
    result?: AdminRunActionResult;
  }>({
    status: "idle",
  });

  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeAdminState(prev, initial)));
  }, [initial]);

  const filteredRows = useMemo(() => {
    if (state.status !== "ready") return [];
    return filterRows(state.questions.rows, state.questions.filter);
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Admin" title="Verwaltung" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Admin" title="Verwaltung" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Admin" title="Verwaltung" />
        <EmptyState
          icon="🔒"
          title="Nur fuer Admins"
          description="Du hast keine Admin-Rechte in dieser Gruppe."
        />
      </div>
    );
  }

  const setTab = (activeTab: AdminTab) =>
    setState((prev) => (prev.status === "ready" ? { ...prev, activeTab } : prev));

  const updateQuestionFilter = (filter: AdminQuestionFilter) =>
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, questions: { ...prev.questions, filter } }
        : prev,
    );

  const toggleActive = (questionId: string, next: boolean) =>
    setState((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            questions: {
              ...prev.questions,
              rows: prev.questions.rows.map((r) =>
                r.questionId === questionId ? { ...r, active: next } : r,
              ),
            },
          }
        : prev,
    );

  const importQuestions = async (raw: string) => {
    try {
      if (onImportQuestions) {
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                questions: {
                  ...prev.questions,
                  importStatus: "importing",
                  importError: undefined,
                },
              }
            : prev,
        );
        await onImportQuestions(raw);
      } else {
        JSON.parse(raw);
      }
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              questions: {
                ...prev.questions,
                importStatus: "success",
                importError: undefined,
              },
            }
          : prev,
      );
    } catch (error) {
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              questions: {
                ...prev.questions,
                importStatus: "error",
                importError: getErrorMessage(error, "Import konnte nicht verarbeitet werden."),
              },
            }
          : prev,
      );
    }
  };

  const runCreate = async (mode: "create" | "replace") => {
    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
    }));

    if (onCreateRun) {
      try {
        const result = await onCreateRun(mode);
        setRunActionState({
          status: "success",
          message: buildRunActionMessage(result),
          result,
        });
      } catch (error) {
        setRunActionState((prev) => ({
          status: "error",
          message: getErrorMessage(
            error,
            mode === "replace"
              ? "Der heutige Run konnte nicht ersetzt werden."
              : "Der Run konnte nicht erzeugt werden.",
          ),
          result: prev.result,
        }));
        throw new Error("run_action_failed");
      }
      return;
    }

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const today = berlinDateKey();
      if (mode === "create" && prev.dailyRuns.some((r) => r.dateKey === today)) return prev;
      return {
        ...prev,
        dailyRuns: [
          {
            dateKey: today,
            status: "scheduled",
            questionCount: prev.config.draft.dailyQuestionCount,
            createdByDisplayName: "Admin",
          },
          ...prev.dailyRuns,
        ],
      };
    });
    setRunActionState({
      status: "success",
      message:
        mode === "replace"
          ? "Der heutige Run wurde lokal ersetzt."
          : "Ein neuer Run wurde lokal angelegt.",
      result: {
        mode,
        dateKey: berlinDateKey(),
        questionCount: state.status === "ready" ? state.config.draft.dailyQuestionCount : 0,
        deletedPublicAnswers: 0,
        deletedPrivateAnswers: 0,
        deletedAnonymousAggregates: 0,
        deletedFirstAnswerLocks: 0,
      },
    });
  };

  const requestCreateRun = () => {
    const today = berlinDateKey();
    const existing =
      state.status === "ready"
        ? state.dailyRuns.find((r) => r.dateKey === today)
        : undefined;
    if (existing) {
      setReplaceConfirm(today);
      return;
    }
    void runCreate("create").catch(() => undefined);
  };

  const confirmReplace = async () => {
    setReplaceConfirm(null);
    try {
      await runCreate("replace");
    } catch {
      return;
    }
  };

  const updateConfig = (draft: typeof state.config.draft) =>
    setState((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            config: {
              ...prev.config,
              draft,
              dirty: true,
              saveStatus: "idle",
              saveError: undefined,
            },
          }
        : prev,
    );

  const runCleanup = async () => {
    setCleanupState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
    }));

    try {
      const result = onCleanupFinishedSessions
        ? await onCleanupFinishedSessions()
        : {
            finalizedStaleLiveSessions: 0,
            deletedFinishedLiveSessions: 0,
            deletedInactiveLobbyCodes: 0,
            deletedOrphanedDailyFirstAnswerLocks: 0,
          };

      setCleanupState({
        status: "success",
        message: buildCleanupMessage(result),
        result,
      });
    } catch (error) {
      setCleanupState((prev) => ({
        status: "error",
        message: getErrorMessage(error, "Cleanup konnte nicht abgeschlossen werden."),
        result: prev.result,
      }));
    }
  };

  const saveConfig = async () => {
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, config: { ...prev.config, saveStatus: "saving" } }
        : prev,
    );

    if (state.status === "ready" && onSaveConfig) {
      try {
        await onSaveConfig(state.config.draft);
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                config: { ...prev.config, saveStatus: "saved", dirty: false },
              }
            : prev,
        );
      } catch (error) {
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                config: {
                  ...prev.config,
                  saveStatus: "error",
                  saveError: getErrorMessage(
                    error,
                    "Config konnte nicht gespeichert werden.",
                  ),
                },
              }
            : prev,
        );
      }
      return;
    }

    window.setTimeout(() => {
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              config: { ...prev.config, saveStatus: "saved", dirty: false },
            }
          : prev,
      );
    }, 400);
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Admin"
        title="Verwaltung"
        subtitle="Fragen, Daily-Runs und App-Konfiguration."
      />
      <AdminDiagnostics
        daily={state.diagnostics.todayDaily}
        live={state.diagnostics.activeLive}
        ops={state.diagnostics.ops}
        cleanupStatus={cleanupState.status}
        cleanupMessage={cleanupState.message}
        cleanupResult={cleanupState.result}
        onCleanup={onCleanupFinishedSessions ? () => void runCleanup() : undefined}
      />
      <AdminTabs value={state.activeTab} onChange={setTab} />

      {state.activeTab === "questions" ? (
        <div className="space-y-4">
          <AdminQuestionFilterBar
            filter={state.questions.filter}
            onChange={updateQuestionFilter}
          />
          <AdminJsonImport
            status={state.questions.importStatus}
            error={state.questions.importError}
            onImport={importQuestions}
          />
          <AdminQuestionList
            rows={filteredRows}
            onToggleActive={(questionId, next) => {
              toggleActive(questionId, next);
              if (onToggleActive) {
                void onToggleActive(questionId, next).catch(() => {
                  toggleActive(questionId, !next);
                });
              }
            }}
          />
        </div>
      ) : null}

      {state.activeTab === "daily" ? (
        <AdminDailyList
          runs={state.dailyRuns}
          onCreate={requestCreateRun}
          todayDateKey={berlinDateKey()}
          runActionStatus={runActionState.status}
          runActionMessage={runActionState.message}
        />
      ) : null}

      {state.activeTab === "config" ? (
        <AdminConfigForm
          draft={state.config.draft}
          saveStatus={state.config.saveStatus}
          saveError={state.config.saveError}
          dirty={state.config.dirty}
          onChange={updateConfig}
          onSave={saveConfig}
        />
      ) : null}

      <ConfirmDialog
        open={replaceConfirm !== null}
        title="Heutigen Run ersetzen?"
        description="Fuer heute existiert schon ein Daily-Run. Beim Ersetzen werden neue Fragen ausgewaehlt. Bereits abgegebene Antworten koennen dadurch ihre Relevanz verlieren."
        confirmLabel="Ersetzen"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setReplaceConfirm(null)}
        onConfirm={() => void confirmReplace()}
        loading={runActionState.status === "running"}
      />
    </div>
  );
}

function buildCleanupMessage(result: AdminCleanupResult) {
  const affectedTotal =
    result.finalizedStaleLiveSessions +
    result.deletedFinishedLiveSessions +
    result.deletedInactiveLobbyCodes +
    result.deletedOrphanedDailyFirstAnswerLocks;

  if (affectedTotal === 0) {
    return "Es gab nichts zum Aufraeumen.";
  }

  const parts: string[] = [];
  if (result.finalizedStaleLiveSessions > 0) {
    parts.push(`${result.finalizedStaleLiveSessions} stale Live-Sessions finalisiert`);
  }
  if (result.deletedFinishedLiveSessions > 0) {
    parts.push(`${result.deletedFinishedLiveSessions} finished Live-Sessions geloescht`);
  }
  if (result.deletedInactiveLobbyCodes > 0) {
    parts.push(`${result.deletedInactiveLobbyCodes} alte Lobby-Codes geloescht`);
  }
  if (result.deletedOrphanedDailyFirstAnswerLocks > 0) {
    parts.push(
      `${result.deletedOrphanedDailyFirstAnswerLocks} verwaiste First-Answer-Locks geloescht`,
    );
  }

  return parts.join(" · ");
}

function buildRunActionMessage(result: AdminRunActionResult) {
  if (result.mode === "create") {
    return `Run fuer ${result.dateKey} mit ${result.questionCount} Fragen erzeugt.`;
  }

  const clearedTotal =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedAnonymousAggregates +
    result.deletedFirstAnswerLocks;

  if (clearedTotal === 0) {
    return `Run fuer ${result.dateKey} ersetzt. ${result.questionCount} Fragen sind jetzt aktiv.`;
  }

  const parts: string[] = [`Run fuer ${result.dateKey} ersetzt.`];
  if (result.deletedPublicAnswers > 0) {
    parts.push(`${result.deletedPublicAnswers} oeffentliche Antworten entfernt`);
  }
  if (result.deletedPrivateAnswers > 0) {
    parts.push(`${result.deletedPrivateAnswers} private Antworten entfernt`);
  }
  if (result.deletedAnonymousAggregates > 0) {
    parts.push(`${result.deletedAnonymousAggregates} anonyme Aggregates entfernt`);
  }
  if (result.deletedFirstAnswerLocks > 0) {
    parts.push(`${result.deletedFirstAnswerLocks} First-Answer-Locks entfernt`);
  }

  return parts.join(" · ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function filterRows(
  rows: AdminQuestionRow[],
  filter: AdminQuestionFilter,
): AdminQuestionRow[] {
  return rows.filter((row) => {
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (!row.text.toLowerCase().includes(s)) return false;
    }
    if (filter.category !== "all" && row.category !== filter.category) {
      return false;
    }
    if (filter.type !== "all" && row.type !== filter.type) return false;
    if (filter.active === "active" && !row.active) return false;
    if (filter.active === "inactive" && row.active) return false;
    if (filter.targetMode !== "all" && row.targetMode !== filter.targetMode) {
      return false;
    }
    return true;
  });
}
