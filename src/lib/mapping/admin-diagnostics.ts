import { validateDailyRun } from "@/lib/mapping/daily-run";
import type {
  AdminDailyDiagnostics,
  AdminDiagnosticIssue,
  AdminLiveDiagnostics,
} from "@/lib/types/frontend";
import type {
  DailyRunItemDoc,
  DailyAnonymousAggregateDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  LiveParticipantDoc,
  LiveSessionDoc,
  QuestionDoc,
} from "@/lib/types/firestore";

export function analyzeTodayDailyDiagnostics(params: {
  dateKey: string;
  run: DailyRunDoc | null;
  questions: Map<string, QuestionDoc>;
  activeMemberIds: Set<string>;
  publicAnswerCount: number;
  privateAnswers: DailyPrivateAnswerDoc[];
  anonymousAggregates: DailyAnonymousAggregateDoc[];
  firstAnswerLockCount: number;
}): AdminDailyDiagnostics {
  const {
    dateKey,
    run,
    questions,
    activeMemberIds,
    publicAnswerCount,
    privateAnswers,
    anonymousAggregates,
    firstAnswerLockCount,
  } = params;

  const issues: AdminDiagnosticIssue[] = [];

  if (!run) {
    if (
      publicAnswerCount > 0 ||
      privateAnswers.length > 0 ||
      anonymousAggregates.length > 0 ||
      firstAnswerLockCount > 0
    ) {
      issues.push({
        severity: "error",
        code: "orphaned_daily_data",
        message: "Für heute existieren Antworten oder Locks ohne passenden Run.",
      });
    } else {
      issues.push({
        severity: "warning",
        code: "missing_daily_run",
        message: "Für heute existiert noch kein Daily-Run.",
      });
    }

    return {
      dateKey,
      state: "missing",
      counts: {
        runItems: 0,
        playableItems: 0,
        publicAnswers: publicAnswerCount,
        privateAnswers: privateAnswers.length,
        anonymousAggregates: anonymousAggregates.length,
        firstAnswerLocks: firstAnswerLockCount,
      },
      issues,
    };
  }

  const validated = validateDailyRun({ run, questions, activeMemberIds });

  if (validated.totalItems === 0) {
    issues.push({
      severity: "error",
      code: "empty_run",
      message: "Der heutige Run enthält keine Items.",
    });
  }

  if (run.questionCount !== validated.totalItems) {
    issues.push({
      severity: "warning",
      code: "question_count_mismatch",
      message: "questionCount passt nicht zur tatsaechlichen Item-Anzahl im Run.",
    });
  }

  if (validated.isUnplayable) {
    issues.push({
      severity: "error",
      code: "run_unplayable",
      message: validated.reason ?? "Der heutige Run enthält keine spielbaren Fragen.",
    });
  } else if (validated.hasIncompleteItems) {
    issues.push({
      severity: "warning",
      code: "run_incomplete",
      message: "Mindestens eine Frage im heutigen Run ist nicht spielbar und wird übersprungen.",
    });
  }

  if (firstAnswerLockCount > privateAnswers.length) {
    issues.push({
      severity: "warning",
      code: "stale_first_answer_locks",
      message: "Es existieren mehr First-Answer-Locks als private Antworten. Das deutet auf alte Locks oder einen ersetzten Run hin.",
    });
  }

  const state = validated.isUnplayable
    ? "unplayable"
    : validated.hasIncompleteItems
      ? "incomplete"
      : "ready";

  return {
    dateKey,
    state,
    counts: {
      runItems: validated.totalItems,
      playableItems: validated.playableItems.length,
      publicAnswers: publicAnswerCount,
      privateAnswers: privateAnswers.length,
      anonymousAggregates: anonymousAggregates.length,
      firstAnswerLocks: firstAnswerLockCount,
    },
    issues,
  };
}

export function analyzeActiveLiveDiagnostics(params: {
  session: (LiveSessionDoc & { id: string }) | null;
  participants: LiveParticipantDoc[];
  questions: Map<string, QuestionDoc>;
}): AdminLiveDiagnostics | null {
  const { session, participants, questions } = params;

  if (!session) {
    return null;
  }

  const issues: AdminDiagnosticIssue[] = [];
  const connectedParticipants = participants.filter((participant) => participant.connected);
  const connectedIds = new Set(connectedParticipants.map((participant) => participant.userId));

  const items = session.items ?? [];
  const playableItems = items.filter((item) =>
    isPlayableLiveItem(item, questions.get(item.questionId), connectedIds),
  );

  const hostConnected = connectedParticipants.some(
    (participant) => participant.userId === session.hostUserId,
  );

  if (items.length === 0) {
    issues.push({
      severity: "error",
      code: "empty_session",
      message: "Die aktive Live-Session enthält keine Fragen.",
    });
  }

  if (connectedParticipants.length === 0 && session.status !== "finished") {
    issues.push({
      severity: "warning",
      code: "no_connected_participants",
      message: "Die aktive Live-Session hat gerade keine verbundenen Teilnehmer.",
    });
  }

  if (!hostConnected && session.status !== "finished") {
    issues.push({
      severity: "warning",
      code: "host_disconnected",
      message: "Der Host ist nicht verbunden. Die Session sollte backendseitig bald beendet werden.",
    });
  }

  if (session.currentQuestionIndex < 0 || session.currentQuestionIndex >= items.length) {
    issues.push({
      severity: "error",
      code: "current_index_out_of_bounds",
      message: "Der aktuelle Fragenindex der Live-Session liegt ausserhalb der Item-Liste.",
    });
  }

  if (
    (session.status === "question" || session.status === "reveal") &&
    (!items[session.currentQuestionIndex] ||
      !isPlayableLiveItem(
        items[session.currentQuestionIndex],
        questions.get(items[session.currentQuestionIndex]?.questionId ?? ""),
        connectedIds,
      ))
  ) {
    issues.push({
      severity: "error",
      code: "current_question_unplayable",
      message: "Die aktuelle Live-Frage ist nicht spielbar.",
    });
  }

  if (
    (session.status === "question" || session.status === "reveal" || session.status === "finished") &&
    playableItems.length === 0
  ) {
    issues.push({
      severity: "error",
      code: "no_playable_live_questions",
      message: "Die aktive Live-Session enthält keine spielbaren Fragen mehr.",
    });
  }

  const phaseStartedAtMs = toMillis(session.phaseStartedAt);
  const phaseAgeMs = phaseStartedAtMs ? Date.now() - phaseStartedAtMs : 0;
  const createdAtMs = toMillis(session.createdAt);
  const sessionAgeMs = createdAtMs ? Date.now() - createdAtMs : 0;

  if (
    session.status === "question" &&
    phaseAgeMs > (session.questionDurationSec + 30) * 1000
  ) {
    issues.push({
      severity: "warning",
      code: "question_phase_stalled",
      message: "Die Fragenphase läuft deutlich länger als der konfigurierte Countdown. Die Runde könnte hängen.",
    });
  }

  if (
    session.status === "reveal" &&
    phaseAgeMs > (session.revealDurationSec + 30) * 1000
  ) {
    issues.push({
      severity: "warning",
      code: "reveal_phase_stalled",
      message: "Die Auflösungsphase läuft deutlich länger als erwartet. Der Host sollte weiterführen oder beenden.",
    });
  }

  if (
    session.status === "lobby" &&
    sessionAgeMs > 2 * 60 * 60 * 1000
  ) {
    issues.push({
      severity: "warning",
      code: "lobby_stale",
      message: "Diese Lobby ist seit längerer Zeit offen und könnte veraltet sein.",
    });
  }

  const state = issues.some((issue) => issue.severity === "error")
    ? "error"
    : issues.length > 0
      ? "warning"
      : "ready";

  return {
    sessionId: session.id,
    phase: session.status,
    state,
    code: session.code,
    counts: {
      totalItems: items.length,
      playableItems: playableItems.length,
      connectedParticipants: connectedParticipants.length,
      totalParticipants: participants.length,
    },
    timing: {
      sessionAgeMinutes: createdAtMs ? Math.max(0, Math.floor(sessionAgeMs / 60000)) : null,
      phaseAgeMinutes: phaseStartedAtMs ? Math.max(0, Math.floor(phaseAgeMs / 60000)) : null,
    },
    issues,
  };
}

function toMillis(value: unknown) {
  if (!value || typeof value !== "object" || value === null || !("toMillis" in value)) {
    return null;
  }

  return (value as { toMillis: () => number }).toMillis();
}

function isPlayableLiveItem(
  item: DailyRunItemDoc,
  question: QuestionDoc | undefined,
  connectedParticipantIds: Set<string>,
) {
  const type = item.type ?? question?.type;

  if (!question || !type) {
    return false;
  }

  if (type === "duel_1v1") {
    const ids = item.pairing?.memberIds ?? [];
    return ids.length === 2 && ids.every((id) => connectedParticipantIds.has(id));
  }

  if (type === "duel_2v2") {
    const teamA = item.pairing?.teamA ?? [];
    const teamB = item.pairing?.teamB ?? [];
    const ids = [...teamA, ...teamB];
    return ids.length === 4 && ids.every((id) => connectedParticipantIds.has(id));
  }

  return true;
}
