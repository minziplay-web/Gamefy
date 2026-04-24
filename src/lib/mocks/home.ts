import type { HomeViewState } from "@/lib/types/frontend";

export const mockHome: HomeViewState = {
  status: "ready",
  greeting: {
    displayName: "Leon",
    localDateLabel: "Donnerstag, 23. April",
    streakCurrent: 4,
  },
  dailyTeaser: {
    dateKey: "2026-04-23",
    totalQuestions: 5,
    answeredByMe: 2,
    status: "active",
    revealPolicy: "after_answer",
  },
  activeLiveSession: {
    sessionId: "sess_123",
    code: "FRND7",
    hostDisplayName: "Leon",
    participantCount: 5,
    phase: "lobby",
    iAmParticipant: true,
  },
  canHostLive: true,
  showAdminEntry: true,
};
