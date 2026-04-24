import type { LobbyViewState } from "@/lib/types/frontend";
import { mockMembers } from "@/lib/mocks/members";

export const mockLobby: LobbyViewState = {
  status: "connected",
  sessionId: "sess_123",
  code: "FRND7",
  phase: "question",
  me: {
    userId: "u_leon",
    displayName: "Leon",
    photoURL: null,
    isHost: true,
    connected: true,
  },
  isHost: true,
  participants: mockMembers.map((m, i) => ({
    ...m,
    isHost: m.userId === "u_leon",
    connected: i < 5,
  })),
  live: {
    phase: "question",
    view: {
      rawQuestionIndex: 2,
      questionIndex: 2,
      totalQuestions: 8,
      question: {
        questionId: "q3",
        indexInRun: 2,
        totalInRun: 8,
        type: "duel_1v1",
        category: "hot_takes",
        anonymous: true,
        text: "Wer ist spontaner?",
        left: mockMembers[0],
        right: mockMembers[2],
      },
    },
    countdown: {
      phaseStartedAtMs: Date.now() - 8_000,
      durationSec: 20,
    },
    submitStatus: "idle",
  },
  finishedSummary: null,
  hostControls: { canStart: false, canAdvance: false, canEnd: true },
};

export const mockLobbyLanding: LobbyViewState = { status: "landing" };
