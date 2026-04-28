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
  AdminDailyQuestionRerollResult,
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
  onResetToday,
  onRerollQuestion,
  onDeactivateUser,
  onGrantTrophy,
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
  onResetToday?: (dateKey: string) => Promise<AdminDailyDeleteResult>;
  onRerollQuestion?: (
    dateKey: string,
    runId: string,
    questionId: string,
  ) => Promise<AdminDailyQuestionRerollResult>;
  onDeactivateUser?: (userId: string) => Promise<void>;
  onGrantTrophy?: (userId: string) => Promise<void>;
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
  const [rerollConfirm, setRerollConfirm] = useState<{
    dateKey: string;
    runId: string;
    questionId: string;
    text: string;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<AdminMemberRow | null>(null);
  const [runActionState, setRunActionState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
    result?: AdminRunActionResult;
    deletedRun?: AdminDailyDeleteResult;
    rerollResult?: AdminDailyQuestionRerollResult;
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
      rerollResult: prev.rerollResult,
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
              ? "Das heutige Daily konnte nicht gererollt werden."
              : "Der Run konnte nicht erzeugt werden.",
          ),
          result: prev.result,
          deletedRun: prev.deletedRun,
          rerollResult: prev.rerollResult,
        }));
        throw new Error("run_action_failed");
      }
      return;
    }

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const today = berlinDateKey();
      const nextRunNumber =
        Math.max(0, ...prev.dailyRuns.filter((r) => r.dateKey === today).map((r) => r.runNumber)) + 1;
      return {
        ...prev,
        dailyRuns: [
          {
            runId: nextRunNumber === 1 ? today : `${today}_${nextRunNumber}`,
            dateKey: today,
            runNumber: nextRunNumber,
            runLabel: nextRunNumber === 1 ? "Daily" : `Daily Nr. ${nextRunNumber}`,
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
          ? "Das heutige Daily wurde lokal gererollt."
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
      const result =
        target.mode === "reset"
          ? onResetToday
            ? await onResetToday(target.dateKey)
            : {
                dateKey: target.dateKey,
                deletedPublicAnswers: 0,
                deletedPrivateAnswers: 0,
                deletedFirstAnswerLocks: 0,
              }
          : onDeleteRun
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
        rerollResult: undefined,
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
        rerollResult: prev.rerollResult,
      }));
    }
  };

  const confirmRerollQuestion = async () => {
    const target = rerollConfirm;
    if (!target || !onRerollQuestion) {
      return;
    }

    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
      deletedRun: prev.deletedRun,
      rerollResult: prev.rerollResult,
    }));

    try {
      const result = await onRerollQuestion(target.dateKey, target.runId, target.questionId);
      setRerollConfirm(null);
      setRunActionState({
        status: "success",
        message: buildRerollQuestionMessage(result),
        rerollResult: result,
      });
    } catch (error) {
      setRunActionState((prev) => ({
        status: "error",
        message: getErrorMessage(error, "Die Frage konnte nicht neu gewürfelt werden."),
        result: prev.result,
        deletedRun: prev.deletedRun,
        rerollResult: prev.rerollResult,
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
            onReplaceToday={() => setReplaceConfirm(berlinDateKey())}
            onRerollQuestion={(dateKey, runId, questionId, text) =>
              setRerollConfirm({ dateKey, runId, questionId, text })
            }
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
          onGrantTrophy={async (member) => {
            setMemberActionState({ status: "running", message: undefined });
            try {
              if (onGrantTrophy) {
                await onGrantTrophy(member.userId);
              }
              setMemberActionState({
                status: "success",
                message: `${member.displayName} hat jetzt eine Bonus-Trophy bekommen.`,
              });
            } catch (error) {
              setMemberActionState({
                status: "error",
                message: getErrorMessage(
                  error,
                  "Die Trophy konnte nicht vergeben werden.",
                ),
              });
            }
          }}
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
        title="Heutiges Daily rerollen?"
        description="Für heute existiert schon ein Daily. Beim Rerollen werden alle heutigen Fragen neu aus dem Pool gezogen. Bereits abgegebene Antworten, Locks und Herzen gehen dabei für heute verloren."
        confirmLabel="Rerollen"
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
            ? "Die heutigen Fragen bleiben bestehen. Es werden nur alle Antworten, First-Answer-Locks und Meme-Herzen entfernt, sodass das Daily wieder wie frisch erzeugt ist."
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
      <ConfirmDialog
        open={rerollConfirm !== null}
        title="Frage neu würfeln?"
        description={
          rerollConfirm
            ? `„${rerollConfirm.text}“ wird aus dem heutigen Daily entfernt. Alle Antworten und Meme-Herzen zu dieser Frage werden gelöscht, damit die neue Frage wieder offen für alle ist.`
            : ""
        }
        confirmLabel="Neu würfeln"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setRerollConfirm(null)}
        onConfirm={() => void confirmRerollQuestion()}
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

  if (result.mode === "add") {
    return `${result.runNumber && result.runNumber > 1 ? `Daily Nr. ${result.runNumber}` : "Weiteres Daily"} für ${result.dateKey} mit ${result.questionCount} Fragen erzeugt.`;
  }

  const clearedTotal =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedFirstAnswerLocks;

  if (clearedTotal === 0) {
    return `Daily für ${result.dateKey} gererollt. ${result.questionCount} neue Fragen sind jetzt aktiv.`;
  }

  const parts: string[] = [`Daily für ${result.dateKey} gererollt.`];
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
      ? `Daily für ${result.dateKey} auf frisch erzeugt zurückgesetzt.`
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

function buildRerollQuestionMessage(result: AdminDailyQuestionRerollResult) {
  const parts = [
    `Frage neu gewürfelt. Neu drin: ${result.replacementQuestionText}.`,
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
  if (result.deletedMemeVotes > 0) {
    parts.push(`${result.deletedMemeVotes} Herzen entfernt`);
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
