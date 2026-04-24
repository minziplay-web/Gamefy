import type { DailyViewState } from "@/lib/types/frontend";
import { mockMembers } from "@/lib/mocks/members";

export const mockDaily: DailyViewState = {
  status: "ready",
  dateKey: "2026-04-23",
  runStatus: "active",
  revealPolicy: "after_answer",
  progress: { answered: 2, total: 5 },
  cards: [
    {
      phase: "revealed",
      question: {
        questionId: "q1",
        indexInRun: 0,
        totalInRun: 5,
        type: "single_choice",
        category: "pure_fun",
        anonymous: false,
        text: "Wer wuerde am ehesten spontan einen Flug buchen?",
        candidates: mockMembers,
      },
      myAnswer: {
        type: "single_choice",
        questionId: "q1",
        selectedUserId: "u_tim",
      },
      result: {
        questionType: "single_choice",
        totalVotes: 5,
        anonymous: false,
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
      phase: "submitted_waiting_reveal",
      question: {
        questionId: "q2",
        indexInRun: 1,
        totalInRun: 5,
        type: "open_text",
        category: "deep_talk",
        anonymous: true,
        text: "Was schaetzt du am meisten an unserer Gruppe?",
        maxLength: 280,
      },
      myAnswer: {
        type: "open_text",
        questionId: "q2",
        textAnswer: "Dass wir ehrlich zueinander sind.",
      },
    },
    {
      phase: "unanswered",
      question: {
        questionId: "q3",
        indexInRun: 2,
        totalInRun: 5,
        type: "duel_1v1",
        category: "hot_takes",
        anonymous: true,
        text: "Wer ist spontaner?",
        left: mockMembers[0],
        right: mockMembers[2],
      },
    },
    {
      phase: "unanswered",
      question: {
        questionId: "q4",
        indexInRun: 3,
        totalInRun: 5,
        type: "either_or",
        category: "would_you_rather",
        anonymous: true,
        text: "Wuerdest du eher nie wieder feiern oder nie wieder verreisen?",
        options: ["Nie wieder feiern", "Nie wieder verreisen"],
      },
    },
    {
      phase: "unanswered",
      question: {
        questionId: "q5",
        indexInRun: 4,
        totalInRun: 5,
        type: "duel_2v2",
        category: "pure_fun",
        anonymous: false,
        text: "Welches Duo ist chaotischer?",
        teamA: [mockMembers[0], mockMembers[1]],
        teamB: [mockMembers[3], mockMembers[4]],
      },
    },
  ],
};
