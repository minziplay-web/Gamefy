"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LobbyCreateForm } from "@/components/lobby/lobby-create-form";
import { LobbyFinishedSummary } from "@/components/lobby/lobby-finished-summary";
import { LobbyJoinForm } from "@/components/lobby/lobby-join-form";
import { LobbyLanding } from "@/components/lobby/lobby-landing";
import { LobbyLiveQuestion } from "@/components/lobby/lobby-live-question";
import { LobbyLiveReveal } from "@/components/lobby/lobby-live-reveal";
import { LobbyWaitingRoom } from "@/components/lobby/lobby-waiting-room";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { mergeLobbyState } from "@/lib/mapping/state-merge";
import type {
  DailyAnswerDraft,
  LiveQuestionState,
  LobbyConfigDraft,
  LobbyViewState,
} from "@/lib/types/frontend";

const DEFAULT_CONFIG: LobbyConfigDraft = {
  categories: ["pure_fun", "hot_takes", "deep_talk"],
  questionCount: 8,
  questionDurationSec: 20,
  revealDurationSec: 10,
};

export function LobbyScreen({
  initial,
  canHostLive,
  onCreateSession,
  onJoinByCode,
  onSubmitLiveAnswer,
  onStartSession,
  onAdvance,
  onEnd,
  onLeave,
}: {
  initial: LobbyViewState;
  canHostLive: boolean;
  onCreateSession?: (draft: LobbyConfigDraft) => Promise<string | void>;
  onJoinByCode?: (code: string) => Promise<string | void>;
  onSubmitLiveAnswer?: (
    draft: DailyAnswerDraft,
    state: Extract<LiveQuestionState, { phase: "question" }>,
  ) => Promise<void>;
  onStartSession?: () => Promise<void>;
  onAdvance?: (
    state: Extract<LiveQuestionState, { phase: "reveal" }>,
  ) => Promise<void>;
  onEnd?: () => Promise<void>;
  onLeave?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [state, setState] = useState<LobbyViewState>(initial);

  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeLobbyState(prev, initial)));
  }, [initial]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Live" title="Lobby" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "landing") {
    return (
      <LobbyLanding
        canHost={canHostLive}
        onCreate={() =>
          setState({
            status: "creating",
            draft: { ...DEFAULT_CONFIG, categories: [...DEFAULT_CONFIG.categories] },
            canSubmit: true,
            submitStatus: "idle",
          })
        }
        onJoin={() =>
          setState({ status: "joining_by_code", code: "", submitStatus: "idle" })
        }
      />
    );
  }

  if (state.status === "creating") {
    return (
      <LobbyCreateForm
        initial={state.draft}
        submitStatus={state.submitStatus}
        submitError={state.submitError}
        onCancel={() => setState({ status: "landing" })}
        onSubmit={async (draft) => {
          if (!onCreateSession) {
            return;
          }

          setState((prev) =>
            prev.status === "creating"
              ? { ...prev, submitStatus: "submitting", submitError: undefined }
              : prev,
          );

          try {
            const sessionId = await onCreateSession(draft);
            if (sessionId) {
              router.push(`/lobby/${sessionId}`);
            }
          } catch {
            setState((prev) =>
              prev.status === "creating"
                ? {
                    ...prev,
                    submitStatus: "error",
                    submitError: "Lobby konnte nicht erstellt werden.",
                  }
                : prev,
            );
          }
        }}
      />
    );
  }

  if (state.status === "joining_by_code") {
    return (
      <LobbyJoinForm
        submitStatus={state.submitStatus}
        submitError={state.submitError}
        onCancel={() => setState({ status: "landing" })}
        onSubmit={async (code) => {
          if (!onJoinByCode) {
            return;
          }

          setState((prev) =>
            prev.status === "joining_by_code"
              ? { ...prev, submitStatus: "submitting", submitError: undefined }
              : prev,
          );

          try {
            const sessionId = await onJoinByCode(code);
            if (sessionId) {
              router.push(`/lobby/${sessionId}`);
            }
          } catch {
            setState((prev) =>
              prev.status === "joining_by_code"
                ? {
                    ...prev,
                    submitStatus: "error",
                    submitError: "Lobby-Code nicht gefunden.",
                  }
                : prev,
            );
          }
        }}
      />
    );
  }

  if (state.status === "error") {
    const backToLobby = () => {
      if (onLeave) {
        void Promise.resolve(onLeave()).catch(() => router.push("/lobby"));
      } else {
        router.push("/lobby");
      }
    };
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Live" title="Lobby" />
        <ErrorBanner message={state.message} />
        <Button className="w-full" variant="secondary" onClick={backToLobby}>
          Zurück zur Lobby-Übersicht
        </Button>
      </div>
    );
  }

  const connected = state;

  if (connected.phase === "lobby") {
    return (
      <LobbyWaitingRoom
        code={connected.code}
        participants={connected.participants}
        isHost={connected.isHost}
        canStart={connected.hostControls.canStart}
        onStart={() => {
          if (onStartSession) {
            void onStartSession();
          }
        }}
        onLeave={() => {
          if (onLeave) {
            void onLeave();
          }
          router.push("/lobby");
        }}
        onCopyCode={() => {
          if (typeof navigator !== "undefined") {
            navigator.clipboard?.writeText(connected.code).catch(() => {});
          }
        }}
      />
    );
  }

  if (connected.phase === "question" && connected.live?.phase === "question") {
    return (
      <LobbyLiveQuestion
        state={connected.live}
        onDraftChange={(draft) => {
          setState((prev) =>
            prev.status === "connected" && prev.live?.phase === "question"
              ? { ...prev, live: { ...prev.live, draft } }
              : prev,
          );
        }}
        onSubmit={(draft) => {
          if (!onSubmitLiveAnswer) {
            return;
          }
          void onSubmitLiveAnswer(
            draft,
            connected.live as Extract<LiveQuestionState, { phase: "question" }>,
          );
        }}
      />
    );
  }

  if (connected.phase === "reveal" && connected.live?.phase === "reveal") {
    return (
      <LobbyLiveReveal
        state={connected.live}
        isHost={connected.isHost}
        onAdvance={() => {
          if (onAdvance) {
            void onAdvance(
              connected.live as Extract<LiveQuestionState, { phase: "reveal" }>,
            );
          }
        }}
        onEnd={() => {
          if (onEnd) {
            void onEnd();
          }
        }}
      />
    );
  }

  if (connected.phase === "finished" && connected.finishedSummary) {
    return (
      <LobbyFinishedSummary
        summary={connected.finishedSummary}
        onClose={() => router.push("/")}
      />
    );
  }

  if (connected.phase === "finished") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Live" title="Runde beendet" />
        <ErrorBanner message="Zusammenfassung ist nicht verfügbar." />
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => router.push("/")}
        >
          Zurück zum Home
        </Button>
      </div>
    );
  }

  return null;
}
