"use client";

import { DailyCallout } from "@/components/home/daily-callout";
import { DailyRecap } from "@/components/home/daily-recap";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/lib/auth/auth-context";
import { isTestFirebaseProject } from "@/lib/firebase/config";
import { submitMemeCaptionVote } from "@/lib/firebase/daily-actions";
import { useHomeViewState } from "@/lib/firebase/home";
import { PREVIEW_MEME_LEADERBOARD_RECAP_ITEM } from "@/lib/mocks/recap-preview";

export default function ResolvedPage() {
  const { authState } = useAuth();
  const state = useHomeViewState();

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Fragen aufgelöst" title="Recap" theme="recap" />
        <div className="flex justify-center py-12">
          <ThreeBodyLoader size={48} label="Recap wird geladen" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Fragen aufgelöst" title="Recap" theme="recap" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="Fragen aufgelöst" title="Recap" theme="recap" />
      <DailyCallout
        teaser={state.dailyTeaser}
        customQuestionNotice={state.customQuestionNotice}
      />
      <DailyRecap
        items={
          isTestFirebaseProject()
            ? [
                ...(state.dailyRecap ?? []),
                PREVIEW_MEME_LEADERBOARD_RECAP_ITEM,
              ]
            : (state.dailyRecap ?? [])
        }
        onVoteMemeCaption={async (item, authorUserId, value) => {
          if (authState.status !== "authenticated") {
            throw new Error("Nicht eingeloggt.");
          }

          await submitMemeCaptionVote({
            dateKey: item.dateKey,
            runId: item.runId,
            questionId: item.questionId,
            authorUserId,
            voterUserId: authState.user.userId,
            on: value,
          });
        }}
      />
    </div>
  );
}
