import { validateDailyRun } from "@/lib/mapping/daily-run";
import type {
  AdminDailyDiagnostics,
  AdminDiagnosticIssue,
} from "@/lib/types/frontend";
import type {
  DailyAnonymousAggregateDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
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
      message: "questionCount passt nicht zur tatsächlichen Item-Anzahl im Run.",
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
      message:
        "Es existieren mehr First-Answer-Locks als private Antworten. Das deutet auf alte Locks oder einen ersetzten Run hin.",
    });
  }

  return {
    dateKey,
    state: validated.isUnplayable
      ? "unplayable"
      : validated.hasIncompleteItems
        ? "incomplete"
        : "ready",
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
