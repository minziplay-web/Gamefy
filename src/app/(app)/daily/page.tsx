"use client";

import { useSearchParams } from "next/navigation";

import { CustomDailyQuestionCard } from "@/components/home/custom-daily-question-card";
import { DailyScreen } from "@/components/daily/daily-screen";
import { useAuth } from "@/lib/auth/auth-context";
import { submitCustomDailyQuestion } from "@/lib/firebase/custom-daily-question-actions";
import { submitDailyAnswer, submitMemeCaptionVote } from "@/lib/firebase/daily-actions";
import { useDailyViewState } from "@/lib/firebase/daily";
import { useHomeViewState } from "@/lib/firebase/home";
import type { DailyAnswerDraft, DailyQuestionCardState } from "@/lib/types/frontend";

export default function DailyPage() {
  const { authState } = useAuth();
  const searchParams = useSearchParams();
  const dateKey = searchParams.get("date") ?? undefined;
  const state = useDailyViewState(dateKey);
  const homeState = useHomeViewState();
  const showCustomQuestionCard =
    !dateKey &&
    homeState.status === "ready" &&
    state.status === "ready" &&
    state.progress.total > 0 &&
    state.progress.answered >= state.progress.total &&
    Boolean(homeState.customQuestionStatus);

  return (
    <DailyScreen
      state={state}
      completionContent={
        showCustomQuestionCard && homeState.status === "ready" ? (
          <CustomDailyQuestionCard
            status={homeState.customQuestionStatus!}
            onSubmit={submitCustomDailyQuestion}
          />
        ) : null
      }
      onSubmitAnswer={async (
        draft: DailyAnswerDraft,
        card: DailyQuestionCardState,
      ) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht eingeloggt.");
        }

        try {
          await submitDailyAnswer({
            dateKey: state.dateKey,
            user: authState.user,
            question: card.question,
            draft,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unbekannter Fehler beim Speichern.";
          throw new Error(message);
        }
      }}
      onVoteMemeCaption={async (card, authorUserId, value) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht eingeloggt.");
        }

        await submitMemeCaptionVote({
          dateKey: state.dateKey,
          questionId: card.question.questionId,
          authorUserId,
          voterUserId: authState.user.userId,
          on: value,
        });
      }}
    />
  );
}
