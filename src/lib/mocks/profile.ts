import type { ProfileStats, ProfileViewState } from "@/lib/types/frontend";
import { mockMe, mockMembers } from "@/lib/mocks/members";

export const mockProfileStats: ProfileStats = {
  daily: {
    answeredCount: 42,
    streakCurrent: 4,
    streakBest: 11,
    firstAnswerCount: 7,
  },
  live: { roundsPlayed: 6, roundsHosted: 2, answersSubmitted: 48 },
  duels: { wins: 13, losses: 9, winRatePercent: 59 },
  publicVotesReceived: {
    total: 31,
    byCategory: { pure_fun: 12, hot_takes: 9, deep_talk: 6, memories: 4 },
  },
  categoryActivity: {
    pure_fun: 18,
    deep_talk: 12,
    hot_takes: 8,
    memories: 4,
  },
};

export const mockProfile: ProfileViewState = {
  status: "ready",
  user: mockMe,
  isSelf: true,
  stats: mockProfileStats,
  dailyHistory: [
    { dateKey: "2026-04-23", totalInRun: 5, answeredByMe: 2, status: "active" },
    { dateKey: "2026-04-22", totalInRun: 5, answeredByMe: 5, status: "closed" },
    { dateKey: "2026-04-21", totalInRun: 5, answeredByMe: 5, status: "closed" },
    { dateKey: "2026-04-20", totalInRun: 4, answeredByMe: 4, status: "closed" },
    { dateKey: "2026-04-19", totalInRun: 5, answeredByMe: 3, status: "closed" },
    { dateKey: "2026-04-18", totalInRun: 6, answeredByMe: 6, status: "closed" },
  ],
  members: mockMembers,
};
