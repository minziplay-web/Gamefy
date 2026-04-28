"use client";

import {
  Timestamp,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  buildDailyRunPayload,
  buildDailyRunItem,
  canUseQuestionInDaily,
  DEFAULT_DAILY_CATEGORIES,
  shuffle,
} from "@/lib/daily/daily-run-generator";
import { isUserTrophyQuestion } from "@/lib/daily/custom-daily-questions";
import {
  appConfigDoc,
  dailyAnswersCollection,
  dailyFirstAnswersCollection,
  dailyMemeVotesCollection,
  dailyPrivateAnswersCollection,
  dailyRunDoc,
  dailyRunsCollection,
  liveAnswersCollection,
  liveLobbyCodesCollection,
  liveParticipantsCollection,
  livePrivateAnswersCollection,
  liveSessionsCollection,
  questionsCollection,
  userDoc,
  usersCollection,
} from "@/lib/firebase/collections";
import { berlinDateKey, shiftDateKey } from "@/lib/mapping/date";
import { assertValidDailyRunPayload } from "@/lib/mapping/payload-guards";
import type {
  AdminConfigDraft,
  AdminDailyCategoryPlan,
  AdminDailyDeleteResult,
  AdminDailyQuestionRerollResult,
  AdminQuestionImportResult,
  AdminRunActionResult,
  Category,
  DateKey,
  QuestionType,
  TargetMode,
} from "@/lib/types/frontend";
import type { DailyRunDoc, QuestionDoc, UserDoc } from "@/lib/types/firestore";

interface AdminCleanupResult {
  finalizedStaleLiveSessions: number;
  deletedFinishedLiveSessions: number;
  deletedInactiveLobbyCodes: number;
  deletedOrphanedDailyFirstAnswerLocks: number;
}

interface ImportQuestionInput {
  text: string;
  category: Category;
  type: QuestionType;
  targetMode: TargetMode;
  options?: string[];
  imagePath?: string;
}

export async function saveAdminConfig(draft: AdminConfigDraft) {
  const target = appConfigDoc();

  if (!target) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await setDoc(
    target,
    {
      timezone: "Europe/Berlin",
      dailyQuestionCount: Math.min(draft.dailyQuestionCount, 12),
      dailyRevealPolicy: draft.dailyRevealPolicy,
      onboardingEnabled: draft.onboardingEnabled,
      dailyAutoCreateEnabled: draft.dailyAutoCreateEnabled,
      dailyIncludedCategories:
        draft.dailyIncludedCategories.length > 0
          ? draft.dailyIncludedCategories
          : DEFAULT_DAILY_CATEGORIES,
      dailyForcedCategories: draft.dailyForcedCategories.filter((category) =>
        draft.dailyIncludedCategories.includes(category),
      ),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function toggleQuestionActive(questionId: string, active: boolean) {
  const questionsRef = questionsCollection();

  if (!questionsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await updateDoc(doc(questionsRef, questionId), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleQuestionDailyLock(questionId: string, dailyLocked: boolean) {
  const questionsRef = questionsCollection();

  if (!questionsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await updateDoc(doc(questionsRef, questionId), {
    dailyLocked,
    dailyLockedDateKey: dailyLocked ? berlinDateKey() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function bulkSetQuestionsActive(questionIds: string[], active: boolean) {
  const questionsRef = questionsCollection();

  if (!questionsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (questionIds.length === 0) {
    return;
  }

  const batch = writeBatch(questionsRef.firestore);
  for (const questionId of questionIds) {
    batch.update(doc(questionsRef, questionId), {
      active,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function bulkSetQuestionsDailyLock(
  questionIds: string[],
  dailyLocked: boolean,
) {
  const questionsRef = questionsCollection();

  if (!questionsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (questionIds.length === 0) {
    return;
  }

  const batch = writeBatch(questionsRef.firestore);
  for (const questionId of questionIds) {
    batch.update(doc(questionsRef, questionId), {
      dailyLocked,
      dailyLockedDateKey: dailyLocked ? berlinDateKey() : null,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function bulkDeleteQuestions(questionIds: string[]) {
  const questionsRef = questionsCollection();

  if (!questionsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (questionIds.length === 0) {
    return;
  }

  for (const chunk of chunkDocs(questionIds, 450)) {
    const batch = writeBatch(questionsRef.firestore);
    for (const questionId of chunk) {
      batch.delete(doc(questionsRef, questionId));
    }
    await batch.commit();
  }
}

export async function deactivateUser(params: {
  userId: string;
  actingUserId: string;
}) {
  const targetRef = userDoc(params.userId);

  if (!targetRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (params.userId === params.actingUserId) {
    throw new Error("Du kannst dich nicht selbst entfernen.");
  }

  const snapshot = await getDoc(targetRef);

  if (!snapshot.exists()) {
    throw new Error("Der Benutzer wurde nicht gefunden.");
  }

  const user = snapshot.data() as UserDoc;

  if (user.role === "admin") {
    throw new Error("Admins können hier nicht entfernt werden.");
  }

  if (user.isActive === false) {
    return;
  }

  await updateDoc(targetRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function grantBonusTrophy(userId: string) {
  const targetRef = userDoc(userId);

  if (!targetRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const snapshot = await getDoc(targetRef);
  if (!snapshot.exists()) {
    throw new Error("Der Benutzer wurde nicht gefunden.");
  }

  const user = snapshot.data() as UserDoc;
  if (!user.isActive) {
    throw new Error("Inaktive Mitglieder können keine Trophy bekommen.");
  }

  await updateDoc(targetRef, {
    bonusTrophyCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export function parseQuestionImport(raw: string): ImportQuestionInput[] {
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Import muss ein JSON-Array sein.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Eintrag ${index + 1} ist kein Objekt.`);
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.text !== "string" || !candidate.text.trim()) {
      throw new Error(`Eintrag ${index + 1}: text fehlt.`);
    }

    if (typeof candidate.category !== "string") {
      throw new Error(`Eintrag ${index + 1}: category fehlt.`);
    }

    if (typeof candidate.type !== "string") {
      throw new Error(`Eintrag ${index + 1}: type fehlt.`);
    }

    if (typeof candidate.targetMode !== "string") {
      throw new Error(`Eintrag ${index + 1}: targetMode fehlt.`);
    }

    const question: ImportQuestionInput = {
      text: candidate.text.trim(),
      category: candidate.category as Category,
      type: candidate.type as QuestionType,
      targetMode: candidate.targetMode as TargetMode,
    };

    if (candidate.options !== undefined) {
      if (
        !Array.isArray(candidate.options) ||
        candidate.options.some((option) => typeof option !== "string")
      ) {
        throw new Error(
          `Eintrag ${index + 1}: options muss ein String-Array sein.`,
        );
      }
      question.options = candidate.options as string[];
    }

    if (candidate.imagePath !== undefined) {
      if (typeof candidate.imagePath !== "string") {
        throw new Error(`Eintrag ${index + 1}: imagePath muss ein String sein.`);
      }
      question.imagePath = candidate.imagePath;
    }

    return question;
  });
}

export async function importQuestions(raw: string, createdBy: string) {
  const items = parseQuestionImport(raw);
  const questionsRef = questionsCollection();

  if (!questionsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const existingSnapshot = await getDocs(questionsRef);
  const existingExactKeys = new Set<string>();
  const existingByIdentity = new Map<
    string,
    { id: string; data: QuestionDoc }
  >();

  for (const snapshot of existingSnapshot.docs) {
    const data = snapshot.data() as QuestionDoc;
    existingExactKeys.add(buildQuestionImportExactKey(data));
    const identityKey = buildQuestionImportIdentityKey(data);
    if (!existingByIdentity.has(identityKey)) {
      existingByIdentity.set(identityKey, { id: snapshot.id, data });
    }
  }

  const seenExactKeys = new Set<string>();
  const seenIdentityTargets = new Map<string, string>();
  const batch = writeBatch(questionsRef.firestore);
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const exactKey = buildQuestionImportExactKey(item);
    if (existingExactKeys.has(exactKey) || seenExactKeys.has(exactKey)) {
      skippedCount += 1;
      continue;
    }

    const identityKey = buildQuestionImportIdentityKey(item);
    const existing = existingByIdentity.get(identityKey);
    const targetQuestionId =
      seenIdentityTargets.get(identityKey) ?? existing?.id ?? null;

    if (targetQuestionId) {
      batch.set(
        doc(questionsRef, targetQuestionId),
        {
          ...item,
          active: true,
          dailyLocked: existing?.data.dailyLocked ?? false,
          dailyLockedDateKey: existing?.data.dailyLockedDateKey ?? null,
          source: existing?.data.source ?? "admin_pool",
          ownerUserId: existing?.data.ownerUserId ?? null,
          targetDateKey: existing?.data.targetDateKey ?? null,
          consumedInDailyDateKey: existing?.data.consumedInDailyDateKey ?? null,
          createdBy: existing?.data.createdBy ?? createdBy,
          createdAt: existing?.data.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: false },
      );
      seenIdentityTargets.set(identityKey, targetQuestionId);
      updatedCount += 1;
      continue;
    }

    const docRef = doc(questionsRef);
    batch.set(docRef, {
      ...item,
      active: true,
      dailyLocked: false,
      dailyLockedDateKey: null,
      source: "admin_pool",
      ownerUserId: null,
      targetDateKey: null,
      consumedInDailyDateKey: null,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    seenIdentityTargets.set(identityKey, docRef.id);
    seenExactKeys.add(exactKey);
    importedCount += 1;
  }

  if (importedCount > 0 || updatedCount > 0) {
    await batch.commit();
  }

  return {
    importedCount,
    updatedCount,
    skippedCount,
  } satisfies AdminQuestionImportResult;
}

export async function createDailyRun(params: {
  dateKey: string;
  createdBy: string;
  questionCount: number;
  revealPolicy: AdminConfigDraft["dailyRevealPolicy"];
  categoryPlan?: AdminDailyCategoryPlan;
}) {
  return upsertDailyRun({ ...params, mode: "create" });
}

export async function replaceDailyRun(params: {
  dateKey: string;
  createdBy: string;
  questionCount: number;
  revealPolicy: AdminConfigDraft["dailyRevealPolicy"];
  categoryPlan?: AdminDailyCategoryPlan;
}) {
  return upsertDailyRun({ ...params, mode: "replace" });
}

export async function deleteDailyRun(dateKey: string): Promise<AdminDailyDeleteResult> {
  const runRef = dailyRunDoc(dateKey);
  const answersRef = dailyAnswersCollection();
  const privateAnswersRef = dailyPrivateAnswersCollection();
  const firstAnswersRef = dailyFirstAnswersCollection();
  const memeVotesRef = dailyMemeVotesCollection();

  if (!runRef || !answersRef || !privateAnswersRef || !firstAnswersRef || !memeVotesRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const deletionResult = await deleteDailyRunData({
    dateKey,
    runRef,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
    memeVotesRef,
  });

  return {
    dateKey,
    ...deletionResult,
  };
}

export async function resetDailyRunAnswers(
  dateKey: string,
): Promise<AdminDailyDeleteResult> {
  const runRef = dailyRunDoc(dateKey);
  const answersRef = dailyAnswersCollection();
  const privateAnswersRef = dailyPrivateAnswersCollection();
  const firstAnswersRef = dailyFirstAnswersCollection();
  const memeVotesRef = dailyMemeVotesCollection();

  if (!runRef || !answersRef || !privateAnswersRef || !firstAnswersRef || !memeVotesRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const runSnapshot = await getDoc(runRef);
  if (!runSnapshot.exists()) {
    throw new Error("Der Daily-Run wurde nicht gefunden.");
  }

  const deletionResult = await collectDailyRunDeletionData({
    dateKey,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
    memeVotesRef,
  });

  for (const chunk of chunkDocs(deletionResult.docs, 450)) {
    const batch = writeBatch(runRef.firestore);
    for (const entry of chunk) {
      batch.delete(entry.ref);
    }
    await batch.commit();
  }

  await setDoc(
    runRef,
    {
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    dateKey,
    ...deletionResult.counts,
  };
}

export async function rerollDailyRunQuestion(params: {
  dateKey: DateKey;
  questionId: string;
}): Promise<AdminDailyQuestionRerollResult> {
  const { dateKey, questionId } = params;
  const runRef = dailyRunDoc(dateKey);
  const runsRef = dailyRunsCollection();
  const questionsRef = questionsCollection();
  const usersRef = usersCollection();
  const answersRef = dailyAnswersCollection();
  const privateAnswersRef = dailyPrivateAnswersCollection();
  const firstAnswersRef = dailyFirstAnswersCollection();
  const memeVotesRef = dailyMemeVotesCollection();
  const configRef = appConfigDoc();

  if (
    !runRef ||
    !runsRef ||
    !questionsRef ||
    !usersRef ||
    !answersRef ||
    !privateAnswersRef ||
    !firstAnswersRef ||
    !memeVotesRef ||
    !configRef
  ) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const [runSnapshot, questionSnapshot, userSnapshot, configSnapshot] = await Promise.all([
    getDoc(runRef),
    getDocs(query(questionsRef, where("active", "==", true))),
    getDocs(query(usersRef, where("isActive", "==", true))),
    getDoc(configRef),
  ]);

  if (!runSnapshot.exists()) {
    throw new Error("Der Daily-Run wurde nicht gefunden.");
  }

  const run = runSnapshot.data() as DailyRunDoc;
  const items: DailyRunDoc["items"] =
    run.items ??
    run.questionIds.map((existingQuestionId) => ({
      questionId: existingQuestionId,
      type: questionSnapshot.docs.find((doc) => doc.id === existingQuestionId)?.data()
        ?.type ?? "open_text",
    }));
  const targetIndex = items.findIndex((item) => item.questionId === questionId);

  if (targetIndex === -1) {
    throw new Error("Diese Frage gehört nicht zu diesem Daily.");
  }

  const targetItem = items[targetIndex];
  const targetQuestion = questionSnapshot.docs
    .map((snapshot) => ({ questionId: snapshot.id, ...(snapshot.data() as QuestionDoc) }))
    .find((question) => question.questionId === questionId);
  const targetCategory =
    targetItem.questionSnapshot?.category ?? targetQuestion?.category;

  if (!targetCategory) {
    throw new Error("Die Kategorie der Frage konnte nicht bestimmt werden.");
  }

  const activeUserIds = userSnapshot.docs.map((snapshot) => snapshot.id);
  const config = configSnapshot.data() as { dailyIncludedCategories?: Category[] } | undefined;
  const includedCategories =
    config?.dailyIncludedCategories && config.dailyIncludedCategories.length > 0
      ? config.dailyIncludedCategories
      : DEFAULT_DAILY_CATEGORIES;

  if (!includedCategories.includes(targetCategory)) {
    throw new Error("Diese Kategorie ist aktuell nicht für Daily-Fragen freigegeben.");
  }

  const eligibleQuestions = questionSnapshot.docs
    .map((snapshot) => ({ questionId: snapshot.id, ...(snapshot.data() as QuestionDoc) }))
    .filter(
      (question) =>
        (question.targetMode === "daily" || question.targetMode === "both") &&
        question.dailyLocked !== true &&
        question.category === targetCategory &&
        question.questionId !== questionId &&
        !run.questionIds.includes(question.questionId) &&
        canUseQuestionInDaily(question.type, activeUserIds.length),
    );

  if (eligibleQuestions.length === 0) {
    throw new Error("Für diese Kategorie gibt es gerade keine weitere freigegebene Ersatzfrage.");
  }

  const replacementQuestion = shuffle(eligibleQuestions)[0];
  const replacementItem = buildDailyRunItem(replacementQuestion, activeUserIds);
  const nextItems = items.map((item, index) =>
    index === targetIndex ? replacementItem : item,
  );
  const nextPayload: DailyRunDoc = {
    ...run,
    questionIds: nextItems.map((item) => item.questionId),
    items: nextItems,
    questionCount: nextItems.length,
    updatedAt: serverTimestamp(),
  };

  assertValidDailyRunPayload(nextPayload);

  await setDoc(runRef, nextPayload, { merge: false });

  const deletionResult = await collectDailyQuestionDeletionData({
    dateKey,
    questionId,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
    memeVotesRef,
  });

  for (const chunk of chunkDocs(deletionResult.docs, 450)) {
    const batch = writeBatch(runRef.firestore);
    for (const entry of chunk) {
      batch.delete(entry.ref);
    }
    await batch.commit();
  }

  return {
    dateKey,
    replacedQuestionId: questionId,
    replacementQuestionId: replacementQuestion.questionId,
    replacementQuestionText: replacementQuestion.text,
    replacementCategory: replacementQuestion.category,
    deletedPublicAnswers: deletionResult.counts.deletedPublicAnswers,
    deletedPrivateAnswers: deletionResult.counts.deletedPrivateAnswers,
    deletedFirstAnswerLocks: deletionResult.counts.deletedFirstAnswerLocks,
    deletedMemeVotes: deletionResult.counts.deletedMemeVotes,
  };
}

export async function cleanupFinishedLiveSessions(params?: {
  olderThanHours?: number;
  limitCount?: number;
}): Promise<AdminCleanupResult> {
  const olderThanHours = params?.olderThanHours ?? 12;
  const limitCount = params?.limitCount ?? 10;
  const sessionsRef = liveSessionsCollection();
  const codesRef = liveLobbyCodesCollection();
  const publicAnswersRef = liveAnswersCollection();
  const privateAnswersRef = livePrivateAnswersCollection();
  const dailyRunsRef = dailyRunsCollection();
  const dailyFirstAnswersRef = dailyFirstAnswersCollection();

  if (
    !sessionsRef ||
    !codesRef ||
    !publicAnswersRef ||
    !privateAnswersRef ||
    !dailyRunsRef ||
    !dailyFirstAnswersRef
  ) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const finalizedStaleLiveSessions = await finalizeStaleLiveSessions({
    sessionsRef,
    codesRef,
    limitCount,
  });

  const snapshot = await getDocs(
    query(
      sessionsRef,
      where("status", "==", "finished"),
      orderBy("finishedAt", "asc"),
      limit(limitCount),
    ),
  );
  const sessions = snapshot.docs
    .map((entry) => ({
      id: entry.id,
      ...(entry.data() as { code?: string; finishedAt?: unknown }),
    }))
    .filter((session) => isOlderThanHours(session.finishedAt, olderThanHours));

  for (const session of sessions) {
    const participantsRef = liveParticipantsCollection(session.id);
    const sessionRef = doc(sessionsRef, session.id);

    if (!participantsRef) {
      continue;
    }

    const [participantsSnapshot, publicAnswersSnapshot, privateAnswersSnapshot] =
      await Promise.all([
        getDocs(participantsRef),
        getDocs(query(publicAnswersRef, where("sessionId", "==", session.id))),
        getDocs(query(privateAnswersRef, where("sessionId", "==", session.id))),
      ]);

    const deletions = [
      ...participantsSnapshot.docs,
      ...publicAnswersSnapshot.docs,
      ...privateAnswersSnapshot.docs,
    ];

    for (const chunk of chunkDocs(deletions, 450)) {
      const batch = writeBatch(sessionsRef.firestore);
      for (const docSnap of chunk) {
        batch.delete(docSnap.ref);
      }
      await batch.commit();
    }

    if (session.code) {
      const codeRef = doc(codesRef, session.code);
      await setDoc(
        codeRef,
        {
          active: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await deleteDocInOwnBatch(sessionRef);
  }

  const deletedInactiveLobbyCodes = await cleanupInactiveLobbyCodes({
    codesRef,
    olderThanHours,
    limitCount,
  });

  const deletedOrphanedDailyFirstAnswerLocks = await cleanupOrphanedDailyFirstAnswerLocks({
    dailyRunsRef,
    dailyFirstAnswersRef,
    olderThanDateKey: shiftDateKey(berlinDateKey(), -7),
    limitCount,
  });

  return {
    finalizedStaleLiveSessions,
    deletedFinishedLiveSessions: sessions.length,
    deletedInactiveLobbyCodes,
    deletedOrphanedDailyFirstAnswerLocks,
  };
}

async function upsertDailyRun(params: {
  dateKey: string;
  createdBy: string;
  questionCount: number;
  revealPolicy: AdminConfigDraft["dailyRevealPolicy"];
  categoryPlan?: AdminDailyCategoryPlan;
  mode: "create" | "replace";
}): Promise<AdminRunActionResult> {
  const { dateKey, createdBy, questionCount, revealPolicy } = params;
  const questionsRef = questionsCollection();
  const usersRef = usersCollection();
  const runRef = dailyRunDoc(dateKey);
  const answersRef = dailyAnswersCollection();
  const privateAnswersRef = dailyPrivateAnswersCollection();
  const firstAnswersRef = dailyFirstAnswersCollection();
  const memeVotesRef = dailyMemeVotesCollection();

  if (
    !questionsRef ||
    !usersRef ||
    !runRef ||
    !answersRef ||
    !privateAnswersRef ||
    !firstAnswersRef ||
    !memeVotesRef
  ) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const existingRun = await getDoc(runRef);

  if (existingRun.exists() && params.mode === "create") {
    throw new Error("Für heute existiert bereits ein Daily-Run. Bitte explizit ersetzen.");
  }

  const [questionSnapshot, userSnapshot] = await Promise.all([
    getDocs(query(questionsRef, where("active", "==", true))),
    getDocs(query(usersRef, where("isActive", "==", true))),
  ]);

  const users = userSnapshot.docs.map((snapshot) => ({
    userId: snapshot.id,
    ...(snapshot.data() as UserDoc),
  }));

  const allQuestions = questionSnapshot.docs
    .map((snapshot) => ({
      questionId: snapshot.id,
      ...(snapshot.data() as QuestionDoc),
    }));
  const customQuestions = allQuestions.filter(
    (question) =>
      isUserTrophyQuestion(question)
      && question.targetDateKey === dateKey
      && (question.consumedInDailyDateKey == null
        || question.consumedInDailyDateKey === dateKey),
  );
  const eligibleQuestions = allQuestions
    .filter(
      (question) =>
        !isUserTrophyQuestion(question)
        && (question.targetMode === "daily" || question.targetMode === "both")
        && question.dailyLocked !== true
        && canUseQuestionInDaily(question.type, users.length),
    );

  if (eligibleQuestions.length === 0 && customQuestions.length === 0) {
    throw new Error("Keine freigegebenen Daily-Fragen gefunden.");
  }

  const runPayload = buildDailyRunPayload({
    dateKey,
    createdBy,
    questionCount,
    revealPolicy,
    categoryPlan: params.categoryPlan,
    customQuestions,
    questions: eligibleQuestions,
    userIds: users.map((user) => user.userId),
    previousCreatedAt: existingRun.exists()
      ? (existingRun.data() as DailyRunDoc).createdAt
      : undefined,
    updatedAt: existingRun.exists()
      ? serverTimestamp()
      : Timestamp.now(),
  });

  if (params.mode === "replace") {
    const replacementResult = await replaceDailyRunAtomically({
      dateKey,
      runRef,
      runPayload,
      answersRef,
      privateAnswersRef,
      firstAnswersRef,
      memeVotesRef,
    });
    await markCustomQuestionsConsumedByDate({
      questionsRef,
      dateKey,
      questionIds: customQuestions.map((question) => question.questionId),
    });
    return {
      mode: "replace",
      dateKey,
      questionCount: runPayload.questionCount,
      ...replacementResult,
    };
  }

  await setDoc(runRef, runPayload, { merge: false });
  await markCustomQuestionsConsumedByDate({
    questionsRef,
    dateKey,
    questionIds: customQuestions.map((question) => question.questionId),
  });
  return {
    mode: "create",
    dateKey,
    questionCount: runPayload.questionCount,
    deletedPublicAnswers: 0,
    deletedPrivateAnswers: 0,
    deletedFirstAnswerLocks: 0,
  };
}

async function replaceDailyRunAtomically(params: {
  dateKey: DateKey;
  runRef: NonNullable<ReturnType<typeof dailyRunDoc>>;
  runPayload: ReturnType<typeof buildDailyRunPayload>;
  answersRef: NonNullable<ReturnType<typeof dailyAnswersCollection>>;
  privateAnswersRef: NonNullable<ReturnType<typeof dailyPrivateAnswersCollection>>;
  firstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
  memeVotesRef: NonNullable<ReturnType<typeof dailyMemeVotesCollection>>;
}): Promise<Pick<
  AdminRunActionResult,
  | "deletedPublicAnswers"
  | "deletedPrivateAnswers"
  | "deletedFirstAnswerLocks"
>> {
  const {
    dateKey,
    runRef,
    runPayload,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
    memeVotesRef,
  } = params;
  const deletionResult = await collectDailyRunDeletionData({
    dateKey,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
    memeVotesRef,
  });
  const deletions = deletionResult.docs;

  if (deletions.length > 449) {
    const freezeBatch = writeBatch(runRef.firestore);
    freezeBatch.set(
      runRef,
      {
        dateKey,
        timezone: "Europe/Berlin",
        status: "closed",
        questionCount: 0,
        questionIds: [],
        items: [],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await freezeBatch.commit();
  }

  if (deletions.length <= 449) {
    const batch = writeBatch(runRef.firestore);
    for (const entry of deletions) {
      batch.delete(entry.ref);
    }
    batch.set(runRef, runPayload, { merge: false });
    await batch.commit();
    return deletionResult.counts;
  }

  for (const chunk of chunkDocs(deletions, 450)) {
    const batch = writeBatch(runRef.firestore);
    for (const entry of chunk) {
      batch.delete(entry.ref);
    }
    await batch.commit();
  }

  await setDoc(runRef, runPayload, { merge: false });
  return deletionResult.counts;
}

async function deleteDailyRunData(params: {
  dateKey: DateKey;
  runRef: NonNullable<ReturnType<typeof dailyRunDoc>>;
  answersRef: NonNullable<ReturnType<typeof dailyAnswersCollection>>;
  privateAnswersRef: NonNullable<ReturnType<typeof dailyPrivateAnswersCollection>>;
  firstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
  memeVotesRef: NonNullable<ReturnType<typeof dailyMemeVotesCollection>>;
}): Promise<Pick<
  AdminDailyDeleteResult,
  | "deletedPublicAnswers"
  | "deletedPrivateAnswers"
  | "deletedFirstAnswerLocks"
>> {
  const { runRef, dateKey, answersRef, privateAnswersRef, firstAnswersRef, memeVotesRef } =
    params;
  const deletionResult = await collectDailyRunDeletionData({
    dateKey,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
    memeVotesRef,
  });
  const { docs } = deletionResult;

  if (docs.length <= 449) {
    const batch = writeBatch(runRef.firestore);
    for (const entry of docs) {
      batch.delete(entry.ref);
    }
    batch.delete(runRef);
    await batch.commit();
    return deletionResult.counts;
  }

  for (const chunk of chunkDocs(docs, 450)) {
    const batch = writeBatch(runRef.firestore);
    for (const entry of chunk) {
      batch.delete(entry.ref);
    }
    await batch.commit();
  }

  await deleteDocInOwnBatch(runRef);
  return deletionResult.counts;
}

async function collectDailyQuestionDeletionData(params: {
  dateKey: DateKey;
  questionId: string;
  answersRef: NonNullable<ReturnType<typeof dailyAnswersCollection>>;
  privateAnswersRef: NonNullable<ReturnType<typeof dailyPrivateAnswersCollection>>;
  firstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
  memeVotesRef: NonNullable<ReturnType<typeof dailyMemeVotesCollection>>;
}) {
  const { dateKey, questionId, answersRef, privateAnswersRef, firstAnswersRef, memeVotesRef } =
    params;
  const [answersSnapshot, privateAnswersSnapshot, firstAnswersSnapshot, memeVotesSnapshot] =
    await Promise.all([
      getDocs(
        query(
          answersRef,
          where("dateKey", "==", dateKey),
          where("questionId", "==", questionId),
        ),
      ),
      getDocs(
        query(
          privateAnswersRef,
          where("dateKey", "==", dateKey),
          where("questionId", "==", questionId),
        ),
      ),
      getDocs(
        query(
          firstAnswersRef,
          where("dateKey", "==", dateKey),
          where("questionId", "==", questionId),
        ),
      ),
      getDocs(
        query(
          memeVotesRef,
          where("dateKey", "==", dateKey),
          where("questionId", "==", questionId),
        ),
      ),
    ]);

  return {
    docs: [
      ...answersSnapshot.docs,
      ...privateAnswersSnapshot.docs,
      ...firstAnswersSnapshot.docs,
      ...memeVotesSnapshot.docs,
    ],
    counts: {
      deletedPublicAnswers: answersSnapshot.docs.length,
      deletedPrivateAnswers: privateAnswersSnapshot.docs.length,
      deletedFirstAnswerLocks: firstAnswersSnapshot.docs.length,
      deletedMemeVotes: memeVotesSnapshot.docs.length,
    },
  };
}

async function collectDailyRunDeletionData(params: {
  dateKey: DateKey;
  answersRef: NonNullable<ReturnType<typeof dailyAnswersCollection>>;
  privateAnswersRef: NonNullable<ReturnType<typeof dailyPrivateAnswersCollection>>;
  firstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
  memeVotesRef: NonNullable<ReturnType<typeof dailyMemeVotesCollection>>;
}) {
  const { dateKey, answersRef, privateAnswersRef, firstAnswersRef, memeVotesRef } = params;
  const [answersSnapshot, privateAnswersSnapshot, firstAnswersSnapshot, memeVotesSnapshot] =
    await Promise.all([
      getDocs(query(answersRef, where("dateKey", "==", dateKey))),
      getDocs(query(privateAnswersRef, where("dateKey", "==", dateKey))),
      getDocs(query(firstAnswersRef, where("dateKey", "==", dateKey))),
      getDocs(query(memeVotesRef, where("dateKey", "==", dateKey))),
    ]);

  return {
    docs: [
      ...answersSnapshot.docs,
      ...privateAnswersSnapshot.docs,
      ...firstAnswersSnapshot.docs,
      ...memeVotesSnapshot.docs,
    ],
    counts: {
      deletedPublicAnswers: answersSnapshot.docs.length,
      deletedPrivateAnswers: privateAnswersSnapshot.docs.length,
      deletedFirstAnswerLocks: firstAnswersSnapshot.docs.length,
    },
  };
}

function isOlderThanHours(value: unknown, hours: number) {
  const millis = toMillis(value);
  if (!millis) {
    return false;
  }

  return Date.now() - millis > hours * 60 * 60 * 1000;
}

function toMillis(value: unknown) {
  if (!value || typeof value !== "object" || value === null || !("toMillis" in value)) {
    return null;
  }

  return (value as { toMillis: () => number }).toMillis();
}

function chunkDocs<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function markCustomQuestionsConsumedByDate(params: {
  questionsRef: NonNullable<ReturnType<typeof questionsCollection>>;
  dateKey: DateKey;
  questionIds: string[];
}) {
  const { questionsRef, dateKey, questionIds } = params;

  if (questionIds.length === 0) {
    return;
  }

  const batch = writeBatch(questionsRef.firestore);
  for (const questionId of questionIds) {
    batch.update(doc(questionsRef, questionId), {
      consumedInDailyDateKey: dateKey,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

function buildQuestionImportExactKey(
  question: Pick<
    QuestionDoc,
    "text" | "category" | "type" | "targetMode" | "options" | "imagePath"
  >,
) {
  return JSON.stringify({
    text: question.text.trim().toLocaleLowerCase("de-DE"),
    category: question.category,
    type: question.type,
    targetMode: question.targetMode,
    options: question.options?.map((option) =>
      option.trim().toLocaleLowerCase("de-DE"),
    ) ?? null,
    imagePath: question.imagePath?.trim() || null,
  });
}

function buildQuestionImportIdentityKey(
  question: Pick<
    QuestionDoc,
    "text" | "category" | "type" | "targetMode" | "imagePath"
  >,
) {
  return JSON.stringify({
    text: question.text.trim().toLocaleLowerCase("de-DE"),
    category: question.category,
    targetMode: question.targetMode,
    imagePath:
      question.type === "meme_caption"
        ? question.imagePath?.trim() ?? null
        : null,
  });
}

async function deleteDocInOwnBatch(target: ReturnType<typeof doc>) {
  const batch = writeBatch(target.firestore);
  batch.delete(target);
  await batch.commit();
}

async function cleanupInactiveLobbyCodes(params: {
  codesRef: NonNullable<ReturnType<typeof liveLobbyCodesCollection>>;
  olderThanHours: number;
  limitCount: number;
}) {
  const { codesRef, olderThanHours, limitCount } = params;
  const snapshot = await getDocs(
    query(
      codesRef,
      where("active", "==", false),
      orderBy("updatedAt", "asc"),
      limit(limitCount),
    ),
  );

  const staleCodes = snapshot.docs.filter((docSnap) =>
    isOlderThanHours((docSnap.data() as { updatedAt?: unknown }).updatedAt, olderThanHours),
  );

  if (staleCodes.length === 0) {
    return 0;
  }

  const batch = writeBatch(codesRef.firestore);
  for (const entry of staleCodes) {
    batch.delete(entry.ref);
  }
  await batch.commit();
  return staleCodes.length;
}

async function cleanupOrphanedDailyFirstAnswerLocks(params: {
  dailyRunsRef: NonNullable<ReturnType<typeof dailyRunsCollection>>;
  dailyFirstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
  olderThanDateKey: string;
  limitCount: number;
}) {
  const { dailyRunsRef, dailyFirstAnswersRef, olderThanDateKey, limitCount } = params;
  const snapshot = await getDocs(
    query(
      dailyFirstAnswersRef,
      where("dateKey", "<", olderThanDateKey),
      orderBy("dateKey", "asc"),
      limit(limitCount),
    ),
  );

  const candidates = snapshot.docs
    .map((docSnap) => ({
      ref: docSnap.ref,
      data: docSnap.data() as { dateKey: string },
    }))
    .filter((entry) => entry.data.dateKey < olderThanDateKey);

  if (candidates.length === 0) {
    return 0;
  }

  const orphanedRefs: Array<{ ref: (typeof candidates)[number]["ref"] }> = [];
  for (const candidate of candidates) {
    const runRef = doc(dailyRunsRef, candidate.data.dateKey);
    const runSnapshot = await getDoc(runRef);
    if (!runSnapshot.exists()) {
      orphanedRefs.push({ ref: candidate.ref });
    }
  }

  if (orphanedRefs.length === 0) {
    return 0;
  }

  const batch = writeBatch(dailyFirstAnswersRef.firestore);
  for (const entry of orphanedRefs) {
    batch.delete(entry.ref);
  }
  await batch.commit();
  return orphanedRefs.length;
}

async function finalizeStaleLiveSessions(params: {
  sessionsRef: NonNullable<ReturnType<typeof liveSessionsCollection>>;
  codesRef: NonNullable<ReturnType<typeof liveLobbyCodesCollection>>;
  limitCount: number;
}) {
  const { sessionsRef, codesRef, limitCount } = params;
  const snapshot = await getDocs(query(sessionsRef, orderBy("createdAt", "asc"), limit(limitCount)));
  let finalizedCount = 0;

  for (const entry of snapshot.docs) {
    const session = entry.data() as {
      code?: string;
      status: "lobby" | "question" | "reveal" | "finished";
      createdAt?: unknown;
      phaseStartedAt?: unknown;
      questionDurationSec?: number;
      revealDurationSec?: number;
    };

    if (!isStaleLiveSession(session)) {
      continue;
    }

    await updateDoc(entry.ref, {
      status: "finished",
      finishedAt: serverTimestamp(),
      phaseStartedAt: serverTimestamp(),
    });
    finalizedCount += 1;

    if (session.code) {
      const codeRef = doc(codesRef, session.code);
      await setDoc(
        codeRef,
        {
          active: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  }

  return finalizedCount;
}

function isStaleLiveSession(session: {
  status: "lobby" | "question" | "reveal" | "finished";
  createdAt?: unknown;
  phaseStartedAt?: unknown;
  questionDurationSec?: number;
  revealDurationSec?: number;
}) {
  if (session.status === "finished") {
    return false;
  }

  if (session.status === "lobby") {
    return isOlderThanHours(session.createdAt, 12);
  }

  const phaseStartedAtMs = toMillis(session.phaseStartedAt);
  if (!phaseStartedAtMs) {
    return false;
  }

  const ageMs = Date.now() - phaseStartedAtMs;

  if (session.status === "question") {
    return ageMs > ((session.questionDurationSec ?? 20) + 30) * 1000;
  }

  if (session.status === "reveal") {
    return ageMs > ((session.revealDurationSec ?? 10) + 30) * 1000;
  }

  return false;
}
