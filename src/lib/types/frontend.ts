export type UserId = string;
export type QuestionId = string;
export type SessionId = string;
export type DateKey = string;

export type Category =
  | "hot_takes"
  | "pure_fun"
  | "deep_talk"
  | "memories"
  | "career_life"
  | "relationships"
  | "hobbies_interests"
  | "dirty"
  | "group_knowledge"
  | "would_you_rather";

export type QuestionType =
  | "single_choice"
  | "open_text"
  | "duel_1v1"
  | "duel_2v2"
  | "either_or";

export type UserRole = "admin" | "member";
export type TargetMode = "daily" | "live" | "both";
export type RevealPolicy = "after_answer" | "after_day_end";

export interface MemberLite {
  userId: UserId;
  displayName: string;
  photoURL: string | null;
}

export interface AppUser {
  userId: UserId;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
}

export type AuthState =
  | { status: "initializing" }
  | { status: "unauthenticated" }
  | { status: "requesting_link"; email: string }
  | { status: "link_sent"; email: string }
  | { status: "verifying_link" }
  | { status: "authenticated"; user: AppUser }
  | { status: "error"; message: string; recoverable: boolean };

// ---------------------------------------------------------
// Onboarding
// ---------------------------------------------------------

export interface OnboardingDraft {
  displayName: string;
  photoFile: File | null;
  photoPreviewUrl: string | null;
}

export interface OnboardingValidation {
  displayNameError: string | null;
  photoError: string | null;
  canSubmit: boolean;
}

export type OnboardingState =
  | { status: "idle"; draft: OnboardingDraft; validation: OnboardingValidation }
  | { status: "uploading_photo"; draft: OnboardingDraft; progress: number }
  | { status: "submitting"; draft: OnboardingDraft }
  | { status: "completed" }
  | { status: "error"; draft: OnboardingDraft; message: string };

// ---------------------------------------------------------
// Home
// ---------------------------------------------------------

export interface DailyTeaser {
  dateKey: DateKey;
  totalQuestions: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
  revealPolicy: RevealPolicy;
  hasIncompleteItems?: boolean;
  isUnplayable?: boolean;
}

export interface LiveSessionTeaser {
  sessionId: SessionId;
  code: string;
  hostDisplayName: string;
  participantCount: number;
  phase: "lobby" | "question" | "reveal" | "finished";
  iAmParticipant: boolean;
}

export interface HomeGreeting {
  displayName: string;
  localDateLabel: string;
  streakCurrent: number;
}

export type HomeViewState =
  | { status: "loading" }
  | {
      status: "ready";
      greeting: HomeGreeting;
      dailyTeaser: DailyTeaser | null;
      activeLiveSession: LiveSessionTeaser | null;
      canHostLive: boolean;
      showAdminEntry: boolean;
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Daily / Question shared view models
// ---------------------------------------------------------

interface DailyQuestionBase {
  questionId: QuestionId;
  indexInRun: number;
  totalInRun: number;
  text: string;
  category: Category;
  anonymous: boolean;
}

export interface SingleChoiceQuestion extends DailyQuestionBase {
  type: "single_choice";
  candidates: MemberLite[];
}

export interface OpenTextQuestion extends DailyQuestionBase {
  type: "open_text";
  maxLength: number;
}

export interface Duel1v1Question extends DailyQuestionBase {
  type: "duel_1v1";
  left: MemberLite;
  right: MemberLite;
}

export interface Duel2v2Question extends DailyQuestionBase {
  type: "duel_2v2";
  teamA: [MemberLite, MemberLite];
  teamB: [MemberLite, MemberLite];
}

export interface EitherOrQuestion extends DailyQuestionBase {
  type: "either_or";
  options: [string, string];
}

export type DailyQuestion =
  | SingleChoiceQuestion
  | OpenTextQuestion
  | Duel1v1Question
  | Duel2v2Question
  | EitherOrQuestion;

export type DailyAnswerDraft =
  | { type: "single_choice"; questionId: QuestionId; selectedUserId?: UserId }
  | { type: "open_text"; questionId: QuestionId; textAnswer: string }
  | { type: "duel_1v1"; questionId: QuestionId; selectedSide?: "left" | "right" }
  | { type: "duel_2v2"; questionId: QuestionId; selectedTeam?: "teamA" | "teamB" }
  | { type: "either_or"; questionId: QuestionId; selectedOptionIndex?: 0 | 1 };

export interface SingleChoiceResult {
  questionType: "single_choice";
  totalVotes: number;
  anonymous: boolean;
  counts: Array<{
    candidate: MemberLite;
    votes: number;
    percent: number;
  }>;
  myChoiceUserId?: UserId;
}

export interface OpenTextResult {
  questionType: "open_text";
  anonymous: boolean;
  entries: Array<{
    text: string;
    author?: MemberLite;
  }>;
}

export interface Duel1v1Result {
  questionType: "duel_1v1";
  anonymous: boolean;
  left: { member: MemberLite; votes: number; percent: number };
  right: { member: MemberLite; votes: number; percent: number };
  myChoice?: "left" | "right";
}

export interface Duel2v2Result {
  questionType: "duel_2v2";
  anonymous: boolean;
  teamA: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  teamB: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  myChoice?: "teamA" | "teamB";
}

export interface EitherOrResult {
  questionType: "either_or";
  anonymous: boolean;
  options: [
    { label: string; votes: number; percent: number },
    { label: string; votes: number; percent: number },
  ];
  myChoiceIndex?: 0 | 1;
}

export type QuestionResult =
  | SingleChoiceResult
  | OpenTextResult
  | Duel1v1Result
  | Duel2v2Result
  | EitherOrResult;

export type DailyQuestionCardState =
  | { phase: "unanswered"; question: DailyQuestion; draft?: DailyAnswerDraft }
  | {
      phase: "submitting";
      question: DailyQuestion;
      draft: DailyAnswerDraft;
    }
  | {
      phase: "submitted_waiting_reveal";
      question: DailyQuestion;
      myAnswer: DailyAnswerDraft;
    }
  | {
      phase: "revealed";
      question: DailyQuestion;
      myAnswer?: DailyAnswerDraft;
      result: QuestionResult;
    }
  | {
      phase: "error";
      question: DailyQuestion;
      message: string;
      lastDraft?: DailyAnswerDraft;
    };

export type DailyViewState =
  | { status: "loading" }
  | {
      status: "no_run";
      dateKey: DateKey;
      message: string;
    }
  | {
      status: "run_unplayable";
      dateKey: DateKey;
      reason: string;
      isAdmin: boolean;
    }
  | {
      status: "ready";
      dateKey: DateKey;
      runStatus: "scheduled" | "active" | "closed";
      revealPolicy: RevealPolicy;
      cards: DailyQuestionCardState[];
      progress: { answered: number; total: number };
      hasIncompleteItems?: boolean;
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Lobby / Live
// ---------------------------------------------------------

export interface LobbyParticipant {
  userId: UserId;
  displayName: string;
  photoURL: string | null;
  isHost: boolean;
  connected: boolean;
}

export type LobbyPhase = "lobby" | "question" | "reveal" | "finished";

export interface LobbyConfigDraft {
  categories: Category[];
  questionCount: number;
  questionDurationSec: number;
  revealDurationSec: number;
}

export interface CountdownTiming {
  phaseStartedAtMs: number;
  durationSec: number;
}

export interface LiveQuestionView {
  rawQuestionIndex: number;
  questionIndex: number;
  totalQuestions: number;
  question: DailyQuestion;
}

export type LiveQuestionState =
  | {
      phase: "question";
      view: LiveQuestionView;
      countdown: CountdownTiming;
      draft?: DailyAnswerDraft;
      submitStatus: "idle" | "submitting" | "submitted" | "error";
      submitError?: string;
    }
  | {
      phase: "reveal";
      view: LiveQuestionView;
      countdown: CountdownTiming;
      result: QuestionResult;
      myAnswer?: DailyAnswerDraft;
    };

export type RevealState = Extract<LiveQuestionState, { phase: "reveal" }>;

export interface LiveFinishedSummary {
  totalQuestions: number;
  myAnswersCount: number;
  topCategory: Category | null;
  rounds: Array<{
    questionIndex: number;
    questionText: string;
    category: Category;
    anonymous: boolean;
    result: QuestionResult;
  }>;
}

export type LobbyViewState =
  | { status: "loading" }
  | { status: "landing" }
  | {
      status: "creating";
      draft: LobbyConfigDraft;
      canSubmit: boolean;
      submitStatus: "idle" | "submitting" | "error";
      submitError?: string;
    }
  | {
      status: "joining_by_code";
      code: string;
      submitStatus: "idle" | "submitting" | "error";
      submitError?: string;
    }
  | {
      status: "connected";
      sessionId: SessionId;
      code: string;
      phase: LobbyPhase;
      participants: LobbyParticipant[];
      me: LobbyParticipant;
      isHost: boolean;
      live: LiveQuestionState | null;
      finishedSummary: LiveFinishedSummary | null;
      hostControls: {
        canStart: boolean;
        canAdvance: boolean;
        canEnd: boolean;
      };
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Profile
// ---------------------------------------------------------

export interface ProfileStats {
  daily: {
    answeredCount: number;
    streakCurrent: number;
    streakBest: number;
    firstAnswerCount: number;
  };
  live: {
    roundsPlayed: number;
    roundsHosted: number;
    answersSubmitted: number;
  };
  duels: {
    wins: number;
    losses: number;
    winRatePercent: number | null;
  };
  publicVotesReceived: {
    total: number;
    byCategory: Partial<Record<Category, number>>;
  };
  categoryActivity: Partial<Record<Category, number>>;
}

export interface DailyHistoryEntry {
  dateKey: DateKey;
  totalInRun: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
}

export type ProfileViewState =
  | { status: "loading" }
  | {
      status: "ready";
      user: AppUser;
      isSelf: boolean;
      stats: ProfileStats;
      dailyHistory: DailyHistoryEntry[];
      members: MemberLite[];
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

export interface AdminQuestionRow {
  questionId: QuestionId;
  text: string;
  category: Category;
  type: QuestionType;
  anonymous: boolean;
  targetMode: TargetMode;
  active: boolean;
  createdAtIso: string;
  createdByDisplayName: string;
}

export interface AdminQuestionFilter {
  search: string;
  category: Category | "all";
  type: QuestionType | "all";
  active: "all" | "active" | "inactive";
  targetMode: TargetMode | "all";
}

export interface AdminDailyRunRow {
  dateKey: DateKey;
  status: "scheduled" | "active" | "closed";
  questionCount: number;
  createdByDisplayName: string;
}

export interface AdminDiagnosticIssue {
  severity: "warning" | "error";
  code: string;
  message: string;
}

export interface AdminDailyDiagnostics {
  dateKey: DateKey;
  state: "missing" | "ready" | "incomplete" | "unplayable";
  counts: {
    runItems: number;
    playableItems: number;
    publicAnswers: number;
    privateAnswers: number;
    anonymousAggregates: number;
    firstAnswerLocks: number;
  };
  issues: AdminDiagnosticIssue[];
}

export interface AdminLiveDiagnostics {
  sessionId: SessionId;
  phase: "lobby" | "question" | "reveal" | "finished";
  state: "ready" | "warning" | "error";
  code: string;
  counts: {
    totalItems: number;
    playableItems: number;
    connectedParticipants: number;
    totalParticipants: number;
  };
  timing: {
    sessionAgeMinutes: number | null;
    phaseAgeMinutes: number | null;
  };
  issues: AdminDiagnosticIssue[];
}

export interface AdminOpsDiagnostics {
  finishedLiveSessions: number;
  staleFinishedLiveSessions: number;
  inactiveLobbyCodes: number;
  staleInactiveLobbyCodes: number;
  orphanedDailyFirstAnswerLocks: number;
  oldestStaleFinishedLiveAgeHours: number | null;
  oldestStaleInactiveLobbyCodeAgeHours: number | null;
}

export interface AdminCleanupResult {
  finalizedStaleLiveSessions: number;
  deletedFinishedLiveSessions: number;
  deletedInactiveLobbyCodes: number;
  deletedOrphanedDailyFirstAnswerLocks: number;
}

export interface AdminRunActionResult {
  mode: "create" | "replace";
  dateKey: DateKey;
  questionCount: number;
  deletedPublicAnswers: number;
  deletedPrivateAnswers: number;
  deletedAnonymousAggregates: number;
  deletedFirstAnswerLocks: number;
}

export interface AdminConfigDraft {
  dailyQuestionCount: number;
  dailyRevealPolicy: RevealPolicy;
  liveDefaultQuestionDurationSec: number;
  liveDefaultRevealDurationSec: number;
  onboardingEnabled: boolean;
}

export type AdminTab = "questions" | "daily" | "config";

export type AdminViewState =
  | { status: "loading" }
  | { status: "forbidden" }
  | {
      status: "ready";
      activeTab: AdminTab;
      questions: {
        rows: AdminQuestionRow[];
        filter: AdminQuestionFilter;
        importStatus: "idle" | "importing" | "success" | "error";
        importError?: string;
      };
      dailyRuns: AdminDailyRunRow[];
      config: {
        draft: AdminConfigDraft;
        saveStatus: "idle" | "saving" | "saved" | "error";
        saveError?: string;
        dirty: boolean;
      };
      diagnostics: {
        todayDaily: AdminDailyDiagnostics;
        activeLive: AdminLiveDiagnostics | null;
        ops: AdminOpsDiagnostics;
      };
    }
  | { status: "error"; message: string };
