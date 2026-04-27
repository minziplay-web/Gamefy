"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminConfigForm } from "@/components/admin/admin-config-form";
import { AdminDailyCategoryPanel } from "@/components/admin/admin-daily-category-panel";
import { AdminDailyList } from "@/components/admin/admin-daily-list";
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics";
import { AdminJsonImport } from "@/components/admin/admin-json-import";
import { AdminMemberList } from "@/components/admin/admin-member-list";
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
  AdminDailyDeleteResult,
  AdminDailyCategoryPlan,
  AdminQuestionFilter,
  AdminQuestionImportResult,
  AdminMemberRow,
  AdminQuestionRow,
  AdminRunActionResult,
  AdminTab,
  AdminViewState,
} from "@/lib/types/frontend";

export function AdminScreen({
  state: initial,
  currentUserId,
  onToggleActive,
  onToggleDailyLock,
  onBulkSetActive,
  onBulkSetDailyLock,
  onBulkDelete,
  onImportQuestions,
  onCreateRun,
  onDeleteRun,
  onDeactivateUser,
  onSaveConfig,
}: {
  state: AdminViewState;
  currentUserId?: string;
  onToggleActive?: (questionId: string, active: boolean) => Promise<void>;
  onToggleDailyLock?: (questionId: string, dailyLocked: boolean) => Promise<void>;
  onBulkSetActive?: (questionIds: string[], active: boolean) => Promise<void>;
  onBulkSetDailyLock?: (questionIds: string[], dailyLocked: boolean) => Promise<void>;
  onBulkDelete?: (questionIds: string[]) => Promise<void>;
  onImportQuestions?: (raw: string) => Promise<AdminQuestionImportResult>;
  onCreateRun?: (
    mode: "create" | "replace",
    plan: AdminDailyCategoryPlan,
  ) => Promise<AdminRunActionResult>;
  onDeleteRun?: (dateKey: string) => Promise<AdminDailyDeleteResult>;
  onDeactivateUser?: (userId: string) => Promise<void>;
  onSaveConfig?: (
    draft: Extract<AdminViewState, { status: "ready" }>["config"]["draft"],
  ) => Promise<void>;
}) {
  const [state, setState] = useState(initial);
  const [replaceConfirm, setReplaceConfirm] = useState<string | null>(null);
  const [deleteRunConfirm, setDeleteRunConfirm] = useState<{
    dateKey: string;
    mode: "delete" | "reset";
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<AdminMemberRow | null>(null);
  const [runActionState, setRunActionState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
    result?: AdminRunActionResult;
    deletedRun?: AdminDailyDeleteResult;
  }>({
    status: "idle",
  });
  const [memberActionState, setMemberActionState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
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
          title="Nur für Admins"
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

  const toggleDailyLock = (questionId: string, next: boolean) =>
    setState((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            questions: {
              ...prev.questions,
              rows: prev.questions.rows.map((r) =>
                r.questionId === questionId
                  ? { ...r, dailyLocked: next, dailyLockedDateKey: next ? berlinDateKey() : null }
                  : r,
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
                  importMessage: undefined,
                },
              }
            : prev,
        );
        const result = await onImportQuestions(raw);
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                questions: {
                  ...prev.questions,
                  importStatus: "success",
                  importError: undefined,
                  importMessage: buildImportMessage(result),
                },
              }
            : prev,
        );
        return;
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
                importMessage: "Import erfolgreich.",
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
                importMessage: undefined,
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
      deletedRun: prev.deletedRun,
    }));

    if (onCreateRun) {
      try {
        const result = await onCreateRun(mode, {
          includedCategories: state.config.draft.dailyIncludedCategories,
          forcedCategories: state.config.draft.dailyForcedCategories,
        });
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

  const confirmDeleteRun = async () => {
    const target = deleteRunConfirm;
    if (!target) return;

    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
      deletedRun: prev.deletedRun,
    }));

    try {
      const result = onDeleteRun
        ? await onDeleteRun(target.dateKey)
        : {
            dateKey: target.dateKey,
            deletedPublicAnswers: 0,
            deletedPrivateAnswers: 0,
                deletedFirstAnswerLocks: 0,
          };
      setDeleteRunConfirm(null);
      setRunActionState({
        status: "success",
        message: buildDeleteRunMessage(target.mode, result),
        deletedRun: result,
      });
    } catch (error) {
      setRunActionState((prev) => ({
        status: "error",
        message: getErrorMessage(
          error,
          target.mode === "reset"
            ? "Das heutige Daily konnte nicht zurückgesetzt werden."
            : "Das Daily konnte nicht gelöscht werden.",
        ),
        result: prev.result,
        deletedRun: prev.deletedRun,
      }));
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

  const confirmRemoveMember = async () => {
    const target = memberToRemove;
    if (!target) {
      return;
    }

    setMemberActionState({
      status: "running",
      message: undefined,
    });

    try {
      if (onDeactivateUser) {
        await onDeactivateUser(target.userId);
      }
      setMemberActionState({
        status: "success",
        message: `${target.displayName} wurde entfernt.`,
      });
      setMemberToRemove(null);
    } catch (error) {
      setMemberActionState({
        status: "error",
        message: getErrorMessage(error, "Das Mitglied konnte nicht entfernt werden."),
      });
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Admin"
        title="Verwaltung"
        subtitle="Fragen, Dailys und App-Konfiguration."
      />
      <AdminDiagnostics daily={state.diagnostics.todayDaily} />
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
            message={state.questions.importMessage}
            onImport={importQuestions}
          />
          <AdminQuestionList
            rows={filteredRows}
            onBulkSetActive={onBulkSetActive}
            onBulkSetDailyLock={onBulkSetDailyLock}
            onBulkDelete={onBulkDelete}
            onToggleDailyLock={async (questionId, next) => {
              toggleDailyLock(questionId, next);
              if (onToggleDailyLock) {
                await onToggleDailyLock(questionId, next).catch(() => {
                  toggleDailyLock(questionId, !next);
                });
              }
            }}
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
        <div className="space-y-4">
          <AdminDailyCategoryPanel
            plan={{
              includedCategories: state.config.draft.dailyIncludedCategories,
              forcedCategories: state.config.draft.dailyForcedCategories,
            }}
            questionCount={state.config.draft.dailyQuestionCount}
            dirty={state.config.dirty}
            saveStatus={state.config.saveStatus}
            saveError={state.config.saveError}
            onChange={(plan) =>
              updateConfig({
                ...state.config.draft,
                dailyIncludedCategories: plan.includedCategories,
                dailyForcedCategories: plan.forcedCategories,
              })
            }
            onSave={saveConfig}
          />
          <AdminDailyList
            runs={state.dailyRuns}
            onCreate={requestCreateRun}
            onDeleteRun={(dateKey) =>
              setDeleteRunConfirm({
                dateKey,
                mode: dateKey === berlinDateKey() ? "reset" : "delete",
              })
            }
            onResetToday={() =>
              setDeleteRunConfirm({
                dateKey: berlinDateKey(),
                mode: "reset",
              })
            }
            todayDateKey={berlinDateKey()}
            runActionStatus={runActionState.status}
            runActionMessage={runActionState.message}
          />
        </div>
      ) : null}

      {state.activeTab === "members" ? (
        <AdminMemberList
          members={state.members}
          currentUserId={currentUserId}
          removeStatus={memberActionState.status}
          removeMessage={memberActionState.message}
          onRemove={setMemberToRemove}
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
        description="Für heute existiert schon ein Daily-Run. Beim Ersetzen werden neue Fragen ausgewählt. Bereits abgegebene Antworten können dadurch ihre Relevanz verlieren."
        confirmLabel="Ersetzen"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setReplaceConfirm(null)}
        onConfirm={() => void confirmReplace()}
        loading={runActionState.status === "running"}
      />
      <ConfirmDialog
        open={memberToRemove !== null}
        title="Mitglied entfernen?"
        description={
          memberToRemove
            ? `${memberToRemove.displayName} wird aus der App deaktiviert und verschwindet aus den aktiven Listen.`
            : ""
        }
        confirmLabel="Entfernen"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setMemberToRemove(null)}
        onConfirm={() => void confirmRemoveMember()}
        loading={memberActionState.status === "running"}
      />
      <ConfirmDialog
        open={deleteRunConfirm !== null}
        title={
          deleteRunConfirm?.mode === "reset"
            ? "Heutiges Daily zurücksetzen?"
            : "Daily löschen?"
        }
        description={
          deleteRunConfirm?.mode === "reset"
            ? "Das heutige Daily und alle dazugehörigen Antworten werden entfernt. Danach kannst du ein neues Daily erzeugen."
            : deleteRunConfirm
              ? `Das Daily vom ${deleteRunConfirm.dateKey} und alle dazugehörigen Antworten werden entfernt.`
              : ""
        }
        confirmLabel={deleteRunConfirm?.mode === "reset" ? "Zurücksetzen" : "Löschen"}
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setDeleteRunConfirm(null)}
        onConfirm={() => void confirmDeleteRun()}
        loading={runActionState.status === "running"}
      />
    </div>
  );
}

function buildImportMessage(result: AdminQuestionImportResult) {
  const parts: string[] = [];
  if (result.importedCount > 0) {
    parts.push(`${result.importedCount} importiert`);
  }
  if (result.updatedCount > 0) {
    parts.push(`${result.updatedCount} aktualisiert`);
  }
  if (result.skippedCount > 0) {
    parts.push(`${result.skippedCount} übersprungen`);
  }

  return parts.length > 0 ? `${parts.join(", ")}.` : "Nichts geändert.";
}

function buildRunActionMessage(result: AdminRunActionResult) {
  if (result.mode === "create") {
    return `Run für ${result.dateKey} mit ${result.questionCount} Fragen erzeugt.`;
  }

  const clearedTotal =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedFirstAnswerLocks;

  if (clearedTotal === 0) {
    return `Run für ${result.dateKey} ersetzt. ${result.questionCount} Fragen sind jetzt aktiv.`;
  }

  const parts: string[] = [`Run für ${result.dateKey} ersetzt.`];
  if (result.deletedPublicAnswers > 0) {
    parts.push(`${result.deletedPublicAnswers} öffentliche Antworten entfernt`);
  }
  if (result.deletedPrivateAnswers > 0) {
    parts.push(`${result.deletedPrivateAnswers} private Antworten entfernt`);
  }
  if (result.deletedFirstAnswerLocks > 0) {
    parts.push(`${result.deletedFirstAnswerLocks} First-Answer-Locks entfernt`);
  }

  return parts.join(" · ");
}

function buildDeleteRunMessage(
  mode: "delete" | "reset",
  result: AdminDailyDeleteResult,
) {
  const parts = [
    mode === "reset"
      ? `Daily für ${result.dateKey} zurückgesetzt.`
      : `Daily für ${result.dateKey} gelöscht.`,
  ];

  if (result.deletedPublicAnswers > 0) {
    parts.push(`${result.deletedPublicAnswers} öffentliche Antworten entfernt`);
  }
  if (result.deletedPrivateAnswers > 0) {
    parts.push(`${result.deletedPrivateAnswers} private Antworten entfernt`);
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
