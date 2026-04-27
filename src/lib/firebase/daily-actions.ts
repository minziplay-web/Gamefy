"use client";

import {
  deleteDoc,
  doc,
  runTransaction,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  dailyRunDoc,
  dailyAnswerDoc,
  dailyFirstAnswerDoc,
  dailyMemeVoteDoc,
  dailyPrivateAnswerDoc,
  questionsCollection,
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
  DailyFirstAnswerDoc,
  DailyMemeVoteDoc,
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
  const firstAnswerRef = dailyFirstAnswerDoc(`${dateKey}_${question.questionId}`);
  const runRef = dailyRunDoc(dateKey);
  const questionsRef = questionsCollection();
  const questionRef = questionsRef ? doc(questionsRef, question.questionId) : null;

  if (
    !privateRef ||
    !publicRef ||
    !firstAnswerRef ||
    !runRef ||
    !questionRef
  ) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  assertValidDraftForQuestion(question, draft);

  await runTransaction(privateRef.firestore, async (transaction) => {
    const [runSnap, previousPrivateSnap, firstAnswerSnap] = await Promise.all([
      transaction.get(runRef),
      transaction.get(privateRef),
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
      throw new Error("Diese Frage gehört nicht mehr zum aktuellen Daily-Run.");
    }

    const previousPrivate = previousPrivateSnap.exists()
      ? (previousPrivateSnap.data() as DailyPrivateAnswerDoc)
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
      anonymous: false,
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
      transaction.set(
        questionRef,
        {
          dailyLocked: true,
          dailyLockedDateKey: dateKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

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
  });
}

export async function submitMemeCaptionVote(params: {
  dateKey: string;
  questionId: string;
  authorUserId: string;
  voterUserId: string;
  on: boolean;
}) {
  const { dateKey, questionId, authorUserId, voterUserId, on } = params;
  const voteId = `${dateKey}_${questionId}_${authorUserId}_${voterUserId}`;
  const voteRef = dailyMemeVoteDoc(voteId);
  const runRef = dailyRunDoc(dateKey);
  const answerRef = dailyAnswerDoc(`${dateKey}_${questionId}_${authorUserId}`);
  const questionsRef = questionsCollection();
  const questionRef = questionsRef ? doc(questionsRef, questionId) : null;

  if (!voteRef || !runRef || !answerRef || !questionRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (!on) {
    await deleteDoc(voteRef);
    return;
  }

  await runTransaction(voteRef.firestore, async (transaction) => {
    const [runSnap, questionSnap, answerSnap] = await Promise.all([
      transaction.get(runRef),
      transaction.get(questionRef),
      transaction.get(answerRef),
    ]);

    if (!runSnap.exists()) {
      throw new Error("Der heutige Daily-Run existiert nicht mehr.");
    }

    const run = runSnap.data() as DailyRunDoc;
    if (resolveDailyRunStatus(run) !== "active") {
      throw new Error("Diese Daily ist nicht mehr aktiv.");
    }
    if (!(run.questionIds ?? []).includes(questionId)) {
      throw new Error("Diese Frage gehört nicht mehr zum aktuellen Daily-Run.");
    }
    if (!questionSnap.exists() || questionSnap.data().type !== "meme_caption") {
      throw new Error("Diese Frage unterstützt keine Herzen.");
    }
    if (!answerSnap.exists()) {
      throw new Error("Dieses Meme existiert nicht mehr.");
    }

    transaction.set(voteRef, {
      dateKey,
      questionId,
      authorUserId,
      voterUserId,
      createdAt: serverTimestamp(),
    } satisfies DailyMemeVoteDoc);
  });
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
    case "meme_caption":
      return { textAnswer: draft.textAnswer.trim() };
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
