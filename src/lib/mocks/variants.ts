import type {
  AdminViewState,
  DailyViewState,
  HomeViewState,
  LiveFinishedSummary,
  LobbyViewState,
  ProfileStats,
  ProfileViewState,
} from "@/lib/types/frontend";
import { mockAdmin } from "@/lib/mocks/admin";
import { mockDaily } from "@/lib/mocks/daily";
import { mockHome } from "@/lib/mocks/home";
import { mockLobby, mockLobbyLanding } from "@/lib/mocks/lobby";
import { mockMembers, mockMe } from "@/lib/mocks/members";
import { mockProfile, mockProfileStats } from "@/lib/mocks/profile";

export const homeVariants: Record<string, HomeViewState> = {
  normal: mockHome,
  loading: { status: "loading" },
  error: { status: "error", message: "Startseite konnte nicht geladen werden." },
  "no-daily": {
    status: "ready",
    greeting: mockHome.status === "ready" ? mockHome.greeting : {
      displayName: "Leon",
      localDateLabel: "Heute",
      streakCurrent: 0,
    },
    dailyTeaser: null,
    activeLiveSession: null,
    canHostLive: true,
    showAdminEntry: true,
  },
  "daily-unplayable":
    mockHome.status === "ready"
      ? {
          ...mockHome,
          dailyTeaser: {
            dateKey: "2026-04-24",
            totalQuestions: 5,
            answeredByMe: 0,
            status: "active",
            revealPolicy: "after_answer",
            isUnplayable: true,
          },
          activeLiveSession: null,
        }
      : mockHome,
  "daily-closed":
    mockHome.status === "ready"
      ? {
          ...mockHome,
          dailyTeaser: {
            dateKey: "2026-04-24",
            totalQuestions: 5,
            answeredByMe: 4,
            status: "closed",
            revealPolicy: "after_answer",
          },
          activeLiveSession: null,
        }
      : mockHome,
  "daily-incomplete":
    mockHome.status === "ready"
      ? {
          ...mockHome,
          dailyTeaser: {
            dateKey: "2026-04-24",
            totalQuestions: 5,
            answeredByMe: 2,
            status: "active",
            revealPolicy: "after_answer",
            hasIncompleteItems: true,
          },
          activeLiveSession: null,
        }
      : mockHome,
  "member-live":
    mockHome.status === "ready"
      ? {
          ...mockHome,
          canHostLive: false,
          showAdminEntry: false,
          activeLiveSession: mockHome.activeLiveSession
            ? { ...mockHome.activeLiveSession, iAmParticipant: false }
            : null,
        }
      : mockHome,
};

export const dailyVariants: Record<string, DailyViewState> = {
  normal: mockDaily,
  loading: { status: "loading" },
  error: { status: "error", message: "Daily konnte nicht geladen werden." },
  "no-run": {
    status: "no_run",
    dateKey: "2026-04-24",
    message: "Heute wurde noch keine Daily erzeugt.",
  },
  unplayable: {
    status: "run_unplayable",
    dateKey: "2026-04-24",
    reason: "Der heutige Run hat keine spielbaren Fragen.",
    isAdmin: true,
  },
  "unplayable-member": {
    status: "run_unplayable",
    dateKey: "2026-04-24",
    reason: "Der heutige Run hat keine spielbaren Fragen.",
    isAdmin: false,
  },
  incomplete:
    mockDaily.status === "ready"
      ? { ...mockDaily, hasIncompleteItems: true }
      : mockDaily,
  closed:
    mockDaily.status === "ready"
      ? { ...mockDaily, runStatus: "closed" }
      : mockDaily,
};

const finishedSummary: LiveFinishedSummary = {
  totalQuestions: 3,
  myAnswersCount: 3,
  topCategory: "hot_takes",
  rounds:
    mockDaily.status === "ready"
      ? mockDaily.cards.slice(0, 3).map((card, idx) => ({
          questionIndex: idx,
          questionText: card.question.text,
          category: card.question.category,
          anonymous: card.question.anonymous,
          result:
            card.phase === "revealed"
              ? card.result
              : {
                  questionType: "single_choice",
                  anonymous: card.question.anonymous,
                  totalVotes: 5,
                  myChoiceUserId: mockMembers[0].userId,
                  counts: mockMembers.slice(0, 5).map((candidate, i) => ({
                    candidate,
                    votes: i === 0 ? 3 : i === 1 ? 2 : 0,
                    percent: i === 0 ? 60 : i === 1 ? 40 : 0,
                  })),
                },
        }))
      : [],
};

export const lobbyVariants: Record<string, LobbyViewState> = {
  landing: mockLobbyLanding,
  loading: { status: "loading" },
  creating: {
    status: "creating",
    draft: {
      categories: ["pure_fun", "hot_takes"],
      questionCount: 8,
      questionDurationSec: 20,
      revealDurationSec: 10,
    },
    canSubmit: true,
    submitStatus: "idle",
  },
  "joining-by-code": {
    status: "joining_by_code",
    code: "",
    submitStatus: "idle",
  },
  "joining-error": {
    status: "joining_by_code",
    code: "ABCXY",
    submitStatus: "error",
    submitError: "Lobby-Code nicht gefunden.",
  },
  waiting:
    mockLobby.status === "connected"
      ? { ...mockLobby, phase: "lobby", live: null }
      : mockLobby,
  question: mockLobby,
  reveal:
    mockLobby.status === "connected" && mockLobby.live?.phase === "question"
      ? {
          ...mockLobby,
          phase: "reveal",
          live: {
            phase: "reveal",
            view: mockLobby.live.view,
            countdown: {
              phaseStartedAtMs: Date.now() - 3_000,
              durationSec: 10,
            },
            myAnswer: { type: "duel_1v1", questionId: "q3", selectedSide: "left" },
            result: {
              questionType: "duel_1v1",
              anonymous: true,
              myChoice: "left",
              left: {
                member: mockMembers[0],
                votes: 3,
                percent: 60,
              },
              right: {
                member: mockMembers[2],
                votes: 2,
                percent: 40,
              },
            },
          },
        }
      : mockLobby,
  finished:
    mockLobby.status === "connected"
      ? {
          ...mockLobby,
          phase: "finished",
          live: null,
          finishedSummary,
          hostControls: { canStart: false, canAdvance: false, canEnd: false },
        }
      : mockLobby,
  error: {
    status: "error",
    message: "Die aktuelle Live-Frage ist nicht spielbar. Bitte die Runde beenden und neu starten.",
  },
};

const emptyProfileStats: ProfileStats = {
  daily: {
    answeredCount: 0,
    streakCurrent: 0,
    streakBest: 0,
    firstAnswerCount: 0,
  },
  live: { roundsPlayed: 0, roundsHosted: 0, answersSubmitted: 0 },
  duels: { wins: 0, losses: 0, winRatePercent: null },
  publicVotesReceived: { total: 0, byCategory: {} },
  categoryActivity: {},
};

const partialProfileStats: ProfileStats = {
  daily: {
    answeredCount: 3,
    streakCurrent: 0,
    streakBest: 2,
    firstAnswerCount: 0,
  },
  live: { roundsPlayed: 0, roundsHosted: 0, answersSubmitted: 0 },
  duels: { wins: 0, losses: 0, winRatePercent: null },
  publicVotesReceived: { total: 0, byCategory: {} },
  categoryActivity: { pure_fun: 2, deep_talk: 1 },
};

export const profileVariants: Record<string, ProfileViewState> = {
  full: mockProfile,
  loading: { status: "loading" },
  error: { status: "error", message: "Profil konnte nicht geladen werden." },
  "not-found": { status: "not_found" },
  empty: {
    status: "ready",
    user: { ...mockMe, displayName: "Neu", role: "member" },
    isSelf: true,
    stats: emptyProfileStats,
    dailyHistory: [],
    members: mockMembers,
  },
  partial: {
    status: "ready",
    user: { ...mockMe, displayName: "Tim", role: "member" },
    isSelf: true,
    stats: partialProfileStats,
    dailyHistory: [
      { dateKey: "2026-04-24", totalInRun: 5, answeredByMe: 3, status: "active" },
      { dateKey: "2026-04-23", totalInRun: 5, answeredByMe: 0, status: "closed" },
    ],
    members: mockMembers,
  },
  "other-member":
    mockProfile.status === "ready"
      ? {
          ...mockProfile,
          isSelf: false,
          user: { ...mockMe, userId: "u_tim", displayName: "Tim" },
          stats: { ...mockProfileStats, daily: { ...mockProfileStats.daily, streakCurrent: 1 } },
        }
      : mockProfile,
};

export const adminVariants: Record<string, AdminViewState> = {
  normal: mockAdmin,
  loading: { status: "loading" },
  forbidden: { status: "forbidden" },
  error: { status: "error", message: "Admin konnte nicht geladen werden." },
  warnings:
    mockAdmin.status === "ready"
      ? {
          ...mockAdmin,
          diagnostics: {
            ...mockAdmin.diagnostics,
            todayDaily: {
              ...mockAdmin.diagnostics.todayDaily,
              state: "incomplete",
              issues: [
                {
                  severity: "warning",
                  code: "run_incomplete",
                  message: "Mindestens eine Frage im heutigen Run ist nicht spielbar und wird übersprungen.",
                },
                {
                  severity: "warning",
                  code: "first_answer_lock_mismatch",
                  message: "First-Answer-Locks stimmen nicht mit Antworten überein.",
                },
              ],
            },
            activeLive: mockAdmin.diagnostics.activeLive
              ? {
                  ...mockAdmin.diagnostics.activeLive,
                  state: "warning",
                  issues: [
                    {
                      severity: "warning",
                      code: "question_phase_stalled",
                      message: "Question-Phase läuft überdurchschnittlich lang.",
                    },
                  ],
                }
              : null,
          },
        }
      : mockAdmin,
  errors:
    mockAdmin.status === "ready"
      ? {
          ...mockAdmin,
          diagnostics: {
            ...mockAdmin.diagnostics,
            todayDaily: {
              ...mockAdmin.diagnostics.todayDaily,
              state: "unplayable",
              issues: [
                {
                  severity: "error",
                  code: "run_unplayable",
                  message: "Der heutige Run hat keine einzige spielbare Frage.",
                },
              ],
            },
            activeLive: mockAdmin.diagnostics.activeLive
              ? {
                  ...mockAdmin.diagnostics.activeLive,
                  state: "error",
                  issues: [
                    {
                      severity: "error",
                      code: "current_index_out_of_bounds",
                      message: "Session-Index liegt ausserhalb der Items.",
                    },
                  ],
                }
              : null,
          },
        }
      : mockAdmin,
  "no-runs":
    mockAdmin.status === "ready"
      ? {
          ...mockAdmin,
          dailyRuns: [],
          diagnostics: {
            ...mockAdmin.diagnostics,
            todayDaily: {
              ...mockAdmin.diagnostics.todayDaily,
              state: "missing",
              counts: {
                runItems: 0,
                playableItems: 0,
                publicAnswers: 0,
                privateAnswers: 0,
                anonymousAggregates: 0,
                firstAnswerLocks: 0,
              },
              issues: [],
            },
            activeLive: null,
          },
        }
      : mockAdmin,
};
