"use client";

import { PastDailies } from "@/components/home/past-dailies";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/lib/auth/auth-context";
import { submitMemeCaptionVote } from "@/lib/firebase/daily-actions";
import { useHomeViewState } from "@/lib/firebase/home";

export default function PastDailiesPage() {
  const { authState } = useAuth();
  const state = useHomeViewState();

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Alte Fragen" title="Archiv" theme="archive" />
        <div className="flex justify-center py-12">
          <ThreeBodyLoader size={48} label="Archiv wird geladen" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Alte Fragen" title="Archiv" theme="archive" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="Alte Fragen" title="Archiv" theme="archive" />
      <PastDailies
        entries={state.pastDailies ?? []}
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
