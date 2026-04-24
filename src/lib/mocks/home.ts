import type { HomeViewState } from "@/lib/types/frontend";
import { mockMembers } from "@/lib/mocks/members";

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
  dailyRecap: [
    {
      questionId: "q1",
      questionText: "Wer würde am ehesten spontan einen Flug buchen?",
      category: "pure_fun",
      anonymous: false,
      result: {
        questionType: "single_choice",
        anonymous: false,
        totalVotes: 5,
        myChoiceUserId: "u_tim",
        counts: [
          { candidate: mockMembers[1], votes: 3, percent: 60 },
          { candidate: mockMembers[3], votes: 2, percent: 40 },
          { candidate: mockMembers[0], votes: 0, percent: 0 },
          { candidate: mockMembers[2], votes: 0, percent: 0 },
          { candidate: mockMembers[4], votes: 0, percent: 0 },
          { candidate: mockMembers[5], votes: 0, percent: 0 },
        ],
      },
    },
    {
      questionId: "q3",
      questionText: "Wer ist spontaner?",
      category: "hot_takes",
      anonymous: true,
      result: {
        questionType: "duel_1v1",
        anonymous: true,
        myChoice: "left",
        left: { member: mockMembers[0], votes: 3, percent: 60 },
        right: { member: mockMembers[2], votes: 2, percent: 40 },
      },
    },
  ],
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
