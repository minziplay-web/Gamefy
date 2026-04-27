"use client";

import { HomeScreen } from "@/components/home/home-screen";
import { useAuth } from "@/lib/auth/auth-context";
import { submitMemeCaptionVote } from "@/lib/firebase/daily-actions";
import { useHomeViewState } from "@/lib/firebase/home";

export default function HomePage() {
  const { authState } = useAuth();
  const state = useHomeViewState();

  return (
    <HomeScreen
      state={state}
      onVoteMemeCaption={async (item, authorUserId, value) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }

        await submitMemeCaptionVote({
          dateKey: item.dateKey,
          questionId: item.questionId,
          authorUserId,
          voterUserId: authState.user.userId,
          on: value,
        });
      }}
    />
  );
}
