"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { LobbyScreen } from "@/components/lobby/lobby-screen";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/lib/auth/auth-context";
import { LIVE_MODE_ENABLED } from "@/lib/config/features";
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
    if (!LIVE_MODE_ENABLED) return;
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

  if (!LIVE_MODE_ENABLED) {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Live" title="Live pausiert" />
        <EmptyState
          icon="🧊"
          title="Diese Runde ist gerade nicht verfügbar"
          description="Das Live-System ist vorübergehend ausgeblendet, bis wir es wieder sauber freigeben."
          action={
            <Link href="/" className="block">
              <Button>Zur Startseite</Button>
            </Link>
          }
        />
      </div>
    );
  }

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
