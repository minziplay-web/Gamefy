import type { DailyRunItemDoc, DailyRunDoc, LiveSessionDoc } from "@/lib/types/firestore";

function hasValidPairing(item: DailyRunItemDoc) {
  if (item.type === "duel_1v1") {
    return Boolean(item.pairing?.memberIds && item.pairing.memberIds.length === 2);
  }

  if (item.type === "duel_2v2") {
    return Boolean(
      item.pairing?.teamA &&
        item.pairing.teamA.length === 2 &&
        item.pairing?.teamB &&
        item.pairing.teamB.length === 2,
    );
  }

  return !item.pairing;
}

function hasDistinctQuestionIds(items: DailyRunItemDoc[], questionIds: string[]) {
  if (items.length !== questionIds.length) {
    return false;
  }

  return items.every((item, index) => item.questionId === questionIds[index]);
}

export function assertValidDailyRunPayload(
  payload: Pick<DailyRunDoc, "dateKey" | "questionCount" | "questionIds" | "items">,
) {
  const items = payload.items ?? [];

  if (payload.questionCount !== items.length) {
    throw new Error("Daily-Run inkonsistent: questionCount passt nicht zu items.");
  }

  if (!hasDistinctQuestionIds(items, payload.questionIds)) {
    throw new Error("Daily-Run inkonsistent: questionIds und items laufen auseinander.");
  }

  if (!items.every((item) => hasValidPairing(item))) {
    throw new Error("Daily-Run inkonsistent: Mindestens ein Pairing passt nicht zum Fragetyp.");
  }
}

export function assertValidLiveItems(
  items: DailyRunItemDoc[],
  questionIds: string[],
) {
  if (!hasDistinctQuestionIds(items, questionIds)) {
    throw new Error("Live-Session inkonsistent: questionIds und items laufen auseinander.");
  }

  if (!items.every((item) => hasValidPairing(item))) {
    throw new Error("Live-Session inkonsistent: Mindestens ein Pairing passt nicht zum Fragetyp.");
  }
}

export function assertValidLiveQuestionIndex(
  payload: Pick<LiveSessionDoc, "status" | "currentQuestionIndex" | "questionIds">,
) {
  if (payload.status === "lobby") {
    if (payload.currentQuestionIndex !== 0) {
      throw new Error("Live-Lobby inkonsistent: currentQuestionIndex muss vor Start 0 sein.");
    }
    return;
  }

  if (
    payload.currentQuestionIndex < 0 ||
    payload.currentQuestionIndex >= payload.questionIds.length
  ) {
    throw new Error("Live-Session inkonsistent: currentQuestionIndex liegt ausserhalb der Fragenliste.");
  }
}
