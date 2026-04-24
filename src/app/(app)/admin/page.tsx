"use client";

import { AdminScreen } from "@/components/admin/admin-screen";
import { useAuth } from "@/lib/auth/auth-context";
import {
  cleanupFinishedLiveSessions,
  createDailyRun,
  deactivateUser,
  importQuestions,
  replaceDailyRun,
  saveAdminConfig,
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
      onImportQuestions={async (raw) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }

        await importQuestions(raw, authState.user.userId);
      }}
      onCreateRun={async (mode) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        const payload = {
          dateKey: berlinDateKey(),
          createdBy: authState.user.userId,
          questionCount: state.config.draft.dailyQuestionCount,
          revealPolicy: state.config.draft.dailyRevealPolicy,
        };

        if (mode === "replace") {
          return replaceDailyRun(payload);
        }

        return createDailyRun(payload);
      }}
      onCleanupFinishedSessions={async () => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return cleanupFinishedLiveSessions();
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
