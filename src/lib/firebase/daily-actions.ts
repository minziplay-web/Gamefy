"use client";

import {
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import {
  dailyRunDoc,
  dailyAnonymousAggregateDoc,
  dailyAnswerDoc,
  dailyFirstAnswerDoc,
  dailyPrivateAnswerDoc,
} from "@/lib/firebase/collections";
import { assertValidDraftForQuestion } from "@/lib/mapping/answer-guards";
import { resolveDailyRunStatus } from "@/lib/mapping/daily-run";
import type {
  AppUser,
  DailyAnswerDraft,
  DailyQuestion,
} from "@/lib/types/frontend";
import type {
  DailyAnswerDoc,
  DailyAnonymousAggregateDoc,
  DailyFirstAnswerDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
} from "@/lib/types/firestore";

export async function submitDailyAnswer(params: {
  dateKey: string;
  user: AppUser;
  question: DailyQuestion;
  draft: DailyAnswerDraft;
}) {
  const { dateKey, user, question, draft } = params;
  const answerId = `${dateKey}_${question.questionId}_${user.userId}`;
  const privateRef = dailyPrivateAnswerDoc(answerId);
  const publicRef = dailyAnswerDoc(answerId);
  const aggregateRef = dailyAnonymousAggregateDoc(`${dateKey}_${question.questionId}`);
  const firstAnswerRef = dailyFirstAnswerDoc(`${dateKey}_${question.questionId}`);
  const runRef = dailyRunDoc(dateKey);

  if (
    !privateRef ||
    !publicRef ||
    !aggregateRef ||
    !firstAnswerRef ||
    !runRef
  ) {
    throw new Error("Firestore ist nicht verfuegbar.");
  }

  assertValidDraftForQuestion(question, draft);

  await runTransaction(privateRef.firestore, async (transaction) => {
    const [runSnap, previousPrivateSnap, aggregateSnap, firstAnswerSnap] = await Promise.all([
      transaction.get(runRef),
      transaction.get(privateRef),
      question.anonymous ? transaction.get(aggregateRef) : Promise.resolve(null),
      transaction.get(firstAnswerRef),
    ]);

    if (!runSnap.exists()) {
      throw new Error("Der heutige Daily-Run existiert nicht mehr.");
    }

    const run = runSnap.data() as DailyRunDoc;
    if (resolveDailyRunStatus(run) !== "active") {
      throw new Error("Diese Daily ist nicht mehr aktiv.");
    }
    if (!(run.questionIds ?? []).includes(question.questionId)) {
      throw new Error("Diese Frage gehoert nicht mehr zum aktuellen Daily-Run.");
    }

    const previousPrivate = previousPrivateSnap.exists()
      ? (previousPrivateSnap.data() as DailyPrivateAnswerDoc)
      : null;
    const aggregate = aggregateSnap?.exists()
      ? (aggregateSnap.data() as DailyAnonymousAggregateDoc)
      : null;
    const firstAnswer = firstAnswerSnap.exists()
      ? (firstAnswerSnap.data() as DailyFirstAnswerDoc)
      : null;
    const firstSubmit = previousPrivate === null;
    const isFirstAnswerForQuestion = !firstAnswer && firstSubmit;

    const nextPrivate: DailyPrivateAnswerDoc = {
      dateKey,
      questionId: question.questionId,
      userId: user.userId,
      questionType: question.type,
      anonymous: question.anonymous,
      ...mapDraftPayload(draft, question),
      createdAt: previousPrivate?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(privateRef, nextPrivate, { merge: true });

    if (isFirstAnswerForQuestion) {
      transaction.set(firstAnswerRef, {
        dateKey,
        questionId: question.questionId,
        userId: user.userId,
        createdAt: serverTimestamp(),
      } satisfies DailyFirstAnswerDoc);
    }

    if (question.anonymous) {
      const previousDraft = previousPrivate ? mapPrivateAnswerToDraft(previousPrivate) : undefined;
      const nextAggregate = buildNextAnonymousAggregate({
        current: aggregate,
        previousDraft,
        nextDraft: draft,
        question,
        dateKey,
      });

      transaction.set(aggregateRef, nextAggregate, { merge: true });
    } else {
      const nextPublic: DailyAnswerDoc = {
        dateKey,
        questionId: question.questionId,
        userId: user.userId,
        questionType: question.type,
        anonymous: false,
        ...mapDraftPayload(draft, question),
        createdAt: previousPrivate?.createdAt ?? serverTimestamp(),
      };

      transaction.set(publicRef, nextPublic, { merge: true });
    }
  });
}

function buildNextAnonymousAggregate(params: {
  current: DailyAnonymousAggregateDoc | null;
  previousDraft?: DailyAnswerDraft;
  nextDraft: DailyAnswerDraft;
  question: DailyQuestion;
  dateKey: string;
}): DailyAnonymousAggregateDoc {
  const { current, previousDraft, nextDraft, question, dateKey } = params;
  const counts = { ...(current?.counts ?? {}) };
  const texts = [...(current?.textAnswers ?? [])];

  const previousKey = previousDraft ? getAggregateCountKey(previousDraft) : undefined;
  const nextKey = getAggregateCountKey(nextDraft);

  if (previousKey && previousKey !== nextKey) {
    counts[previousKey] = Math.max(0, (counts[previousKey] ?? 0) - 1);
  }

  if (nextKey) {
    const increment = previousKey === nextKey ? 0 : 1;
    counts[nextKey] = (counts[nextKey] ?? 0) + increment;
  }

  if (previousDraft?.type === "open_text" && previousDraft.textAnswer.trim()) {
    removeOne(texts, previousDraft.textAnswer.trim());
  }

  if (nextDraft.type === "open_text" && nextDraft.textAnswer.trim()) {
    texts.push(nextDraft.textAnswer.trim());
  }

  const nextAggregate: DailyAnonymousAggregateDoc = {
    dateKey,
    questionId: question.questionId,
    questionType: question.type,
    counts,
    updatedAt: serverTimestamp(),
  };

  if (question.type === "open_text") {
    nextAggregate.textAnswers = texts;
  } else if (current?.textAnswers) {
    nextAggregate.textAnswers = current.textAnswers;
  }

  const duelContext = extractDuelContext(question);
  if (duelContext) {
    nextAggregate.duelContext = duelContext;
  }

  return nextAggregate;
}

function mapDraftPayload(draft: DailyAnswerDraft, question: DailyQuestion) {
  switch (draft.type) {
    case "single_choice":
      return { selectedUserId: draft.selectedUserId };
    case "open_text":
      return { textAnswer: draft.textAnswer.trim() };
    case "duel_1v1":
      return {
        selectedSide: draft.selectedSide,
        duelContext: extractDuelContext(question),
      };
    case "duel_2v2":
      return {
        selectedTeam: draft.selectedTeam,
        duelContext: extractDuelContext(question),
      };
    case "either_or":
      return { selectedOptionIndex: draft.selectedOptionIndex };
  }
}

function mapPrivateAnswerToDraft(answer: DailyPrivateAnswerDoc): DailyAnswerDraft {
  switch (answer.questionType) {
    case "single_choice":
      return {
        type: "single_choice",
        questionId: answer.questionId,
        selectedUserId: answer.selectedUserId,
      };
    case "open_text":
      return {
        type: "open_text",
        questionId: answer.questionId,
        textAnswer: answer.textAnswer ?? "",
      };
    case "duel_1v1":
      return {
        type: "duel_1v1",
        questionId: answer.questionId,
        selectedSide: answer.selectedSide,
      };
    case "duel_2v2":
      return {
        type: "duel_2v2",
        questionId: answer.questionId,
        selectedTeam: answer.selectedTeam,
      };
    case "either_or":
      return {
        type: "either_or",
        questionId: answer.questionId,
        selectedOptionIndex:
          answer.selectedOptionIndex === 0 || answer.selectedOptionIndex === 1
            ? answer.selectedOptionIndex
            : undefined,
      };
  }
}

function extractDuelContext(question: DailyQuestion) {
  if (question.type === "duel_1v1") {
    return {
      memberIds: [question.left.userId, question.right.userId],
    };
  }

  if (question.type === "duel_2v2") {
    return {
      teamA: question.teamA.map((member) => member.userId),
      teamB: question.teamB.map((member) => member.userId),
    };
  }

  return undefined;
}

function getAggregateCountKey(draft: DailyAnswerDraft) {
  switch (draft.type) {
    case "single_choice":
      return draft.selectedUserId;
    case "duel_1v1":
      return draft.selectedSide;
    case "duel_2v2":
      return draft.selectedTeam;
    case "either_or":
      return draft.selectedOptionIndex !== undefined
        ? `option_${draft.selectedOptionIndex}`
        : undefined;
    case "open_text":
      return undefined;
  }
}

function removeOne(values: string[], target: string) {
  const index = values.indexOf(target);
  if (index >= 0) {
    values.splice(index, 1);
  }
}
