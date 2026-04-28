"use client";

import { AdminScreen } from "@/components/admin/admin-screen";
import { useAuth } from "@/lib/auth/auth-context";
import {
  bulkDeleteQuestions,
  bulkSetQuestionsDailyLock,
  bulkSetQuestionsActive,
  createDailyRun,
  deleteDailyRun,
  deactivateUser,
  importQuestions,
  resetDailyRunAnswers,
  replaceDailyRun,
  rerollDailyRunQuestion,
  saveAdminConfig,
  toggleQuestionDailyLock,
  toggleQuestionActive,
} from "@/lib/firebase/admin-actions";
import { useAdminViewState } from "@/lib/firebase/admin";
import { berlinDateKey } from "@/lib/mapping/date";

export default function AdminPage() {
  const { authState } = useAuth();
  const state = useAdminViewState();

  return (
    <AdminScreen
      state={state}
      currentUserId={authState.status === "authenticated" ? authState.user.userId : undefined}
      onToggleActive={toggleQuestionActive}
      onToggleDailyLock={toggleQuestionDailyLock}
      onBulkSetActive={bulkSetQuestionsActive}
      onBulkSetDailyLock={bulkSetQuestionsDailyLock}
      onBulkDelete={bulkDeleteQuestions}
      onImportQuestions={async (raw) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }

        return importQuestions(raw, authState.user.userId);
      }}
      onCreateRun={async (mode, categoryPlan) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        const payload = {
          dateKey: berlinDateKey(),
          createdBy: authState.user.userId,
          questionCount: state.config.draft.dailyQuestionCount,
          revealPolicy: state.config.draft.dailyRevealPolicy,
          categoryPlan,
        };

        if (mode === "replace") {
          return replaceDailyRun(payload);
        }

        return createDailyRun(payload);
      }}
      onDeleteRun={async (dateKey) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return deleteDailyRun(dateKey);
      }}
      onResetToday={async (dateKey) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return resetDailyRunAnswers(dateKey);
      }}
      onRerollQuestion={async (dateKey, questionId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return rerollDailyRunQuestion({ dateKey, questionId });
      }}
      onDeactivateUser={async (userId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return deactivateUser({
          userId,
          actingUserId: authState.user.userId,
        });
      }}
      onSaveConfig={saveAdminConfig}
    />
  );
}
