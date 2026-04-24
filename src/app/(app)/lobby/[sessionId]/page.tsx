"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { LobbyScreen } from "@/components/lobby/lobby-screen";
import { useAuth } from "@/lib/auth/auth-context";
import {
  advanceLiveSession,
  endLiveSession,
  leaveLiveSession,
  revealLiveSession,
  startLiveSession,
  submitLiveAnswer,
} from "@/lib/firebase/live-actions";
import { useLobbyViewState } from "@/lib/firebase/live";

export default function LobbySessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { authState } = useAuth();
  const sessionId = params.sessionId;
  const state = useLobbyViewState(sessionId);
  const lastAutoRevealKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      state.status !== "connected" ||
      !state.isHost ||
      state.phase !== "question" ||
      state.live?.phase !== "question"
    ) {
      return;
    }

    const timing = state.live.countdown;
    const revealAt = timing.phaseStartedAtMs + timing.durationSec * 1000;
    const delay = Math.max(0, revealAt - Date.now());
    const autoRevealKey = `${sessionId}:${state.live.view.question.questionId}:${timing.phaseStartedAtMs}`;

    if (lastAutoRevealKeyRef.current === autoRevealKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (lastAutoRevealKeyRef.current === autoRevealKey) {
        return;
      }

      lastAutoRevealKeyRef.current = autoRevealKey;
      void revealLiveSession(sessionId, authState.status === "authenticated" ? authState.user.userId : "").catch(() => {
        lastAutoRevealKeyRef.current = null;
      });
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authState, sessionId, state]);

  return (
    <LobbyScreen
      initial={state}
      canHostLive={
        authState.status === "authenticated" && authState.user.role === "admin"
      }
      onStartSession={async () => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }
        await startLiveSession(sessionId, authState.user.userId);
      }}
      onSubmitLiveAnswer={async (draft, liveState) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }
        await submitLiveAnswer({
          sessionId,
          user: authState.user,
          question: liveState.view.question,
          rawQuestionIndex: liveState.view.rawQuestionIndex,
          draft,
        });
      }}
      onAdvance={async (revealState) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }
        void revealState;
        await advanceLiveSession({ sessionId, actingUserId: authState.user.userId });
      }}
      onEnd={async () => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }
        await endLiveSession(sessionId, authState.user.userId);
      }}
      onLeave={async () => {
        if (authState.status === "authenticated") {
          await leaveLiveSession(sessionId, authState.user.userId);
        }
        router.push("/lobby");
      }}
    />
  );
}
