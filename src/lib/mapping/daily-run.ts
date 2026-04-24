import { berlinDateKey, compareDateKeys } from "@/lib/mapping/date";
import type { DateKey } from "@/lib/types/frontend";
import type { DailyRunDoc, DailyRunItemDoc, QuestionDoc } from "@/lib/types/firestore";

export interface ValidatedDailyRun {
  dateKey: DateKey;
  totalItems: number;
  playableItems: DailyRunItemDoc[];
  hasIncompleteItems: boolean;
  isUnplayable: boolean;
  reason?: string;
}

export function validateDailyRun(params: {
  run: DailyRunDoc;
  questions: Map<string, QuestionDoc>;
  activeMemberIds: Set<string>;
}): ValidatedDailyRun {
  const { run, questions, activeMemberIds } = params;

  const items =
    run.items ??
    run.questionIds.map(
      (questionId): DailyRunItemDoc => ({
        questionId,
        type: questions.get(questionId)?.type ?? "open_text",
      }),
    );

  const playableItems = items.filter((item) =>
    isPlayableRunItem(item, questions.get(item.questionId), activeMemberIds),
  );

  const hasIncompleteItems = playableItems.length !== items.length;
  const isUnplayable = playableItems.length === 0;

  return {
    dateKey: run.dateKey,
    totalItems: items.length,
    playableItems,
    hasIncompleteItems,
    isUnplayable,
    reason: isUnplayable ? getUnplayableReason(items, questions, activeMemberIds) : undefined,
  };
}

export function resolveDailyRunStatus(
  run: Pick<DailyRunDoc, "dateKey" | "status">,
  now: Date = new Date(),
): DailyRunDoc["status"] {
  const today = berlinDateKey(now);
  const compare = compareDateKeys(run.dateKey, today);

  if (compare < 0) {
    return "closed";
  }

  if (compare > 0) {
    return "scheduled";
  }

  return run.status === "closed" ? "closed" : "active";
}

export function isPlayableRunItem(
  item: DailyRunItemDoc,
  question: QuestionDoc | undefined,
  activeMemberIds: Set<string>,
) {
  const type = item.type ?? question?.type;

  if (!question || !type) {
    return false;
  }

  if (type === "duel_1v1") {
    const ids = item.pairing?.memberIds ?? [];
    return ids.length === 2 && ids.every((id) => activeMemberIds.has(id));
  }

  if (type === "duel_2v2") {
    const teamA = item.pairing?.teamA ?? [];
    const teamB = item.pairing?.teamB ?? [];
    const ids = [...teamA, ...teamB];
    return ids.length === 4 && ids.every((id) => activeMemberIds.has(id));
  }

  return true;
}

function getUnplayableReason(
  items: DailyRunItemDoc[],
  questions: Map<string, QuestionDoc>,
  activeMemberIds: Set<string>,
) {
  if (items.length === 0) {
    return "Der heutige Run enthält keine Fragen.";
  }

  const hasKnownQuestion = items.some((item) => questions.has(item.questionId));
  if (!hasKnownQuestion) {
    return "Die Fragen für den heutigen Run konnten nicht geladen werden.";
  }

  const hasDuelItem = items.some((item) => {
    const type = item.type ?? questions.get(item.questionId)?.type;
    return type === "duel_1v1" || type === "duel_2v2";
  });

  if (hasDuelItem && activeMemberIds.size < 2) {
    return "Es gibt nicht genug aktive Mitglieder für die heutigen Duel-Fragen.";
  }

  return "Der heutige Run enthält keine spielbaren Fragen.";
}
