"use client";

import {
  Timestamp,
  doc,
  getDoc,
  getDocs,
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
  appConfigDoc,
  dailyAnswersCollection,
  dailyFirstAnswersCollection,
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

const MAX_DAILY_CATEGORY_COUNT = 12;
const DEFAULT_DAILY_CATEGORIES: Category[] = [
  "hot_takes",
  "pure_fun",
  "deep_talk",
  "memories",
  "career_life",
  "relationships",
  "hobbies_interests",
  "dirty",
  "group_knowledge",
  "would_you_rather",
  "conspiracy",
  "meme_it",
];

export async function saveAdminConfig(draft: AdminConfigDraft) {
  const target = appConfigDoc();

  if (!target) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await setDoc(
    target,
    {
      timezone: "Europe/Berlin",
      dailyQuestionCount: Math.min(draft.dailyQuestionCount, MAX_DAILY_CATEGORY_COUNT),
      dailyRevealPolicy: draft.dailyRevealPolicy,
      onboardingEnabled: draft.onboardingEnabled,
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
          dailyLocked: false,
          dailyLockedDateKey: null,
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

  if (!runRef || !answersRef || !privateAnswersRef || !firstAnswersRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const deletionResult = await deleteDailyRunData({
    dateKey,
    runRef,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
  });

  return {
    dateKey,
    ...deletionResult,
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

  if (
    !questionsRef ||
    !usersRef ||
    !runRef ||
    !answersRef ||
    !privateAnswersRef ||
    !firstAnswersRef
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

  const eligibleQuestions = questionSnapshot.docs
    .map((snapshot) => ({
      questionId: snapshot.id,
      ...(snapshot.data() as QuestionDoc),
    }))
    .filter(
      (question) =>
        (question.targetMode === "daily" || question.targetMode === "both")
        && question.dailyLocked !== true
        && canUseQuestionInDaily(question.type, users.length),
    );

  if (eligibleQuestions.length === 0) {
    throw new Error("Keine freigegebenen Daily-Fragen gefunden.");
  }

  const runPayload = buildDailyRunPayload({
    dateKey,
    createdBy,
    questionCount,
    revealPolicy,
    categoryPlan: params.categoryPlan,
    questions: eligibleQuestions,
    userIds: users.map((user) => user.userId),
    previous: existingRun.exists() ? (existingRun.data() as DailyRunDoc) : null,
  });

  if (params.mode === "replace") {
    const replacementResult = await replaceDailyRunAtomically({
      dateKey,
      runRef,
      runPayload,
      answersRef,
      privateAnswersRef,
      firstAnswersRef,
    });
    return {
      mode: "replace",
      dateKey,
      questionCount: runPayload.questionCount,
      ...replacementResult,
    };
  }

  await setDoc(runRef, runPayload, { merge: false });
  return {
    mode: "create",
    dateKey,
    questionCount: runPayload.questionCount,
    deletedPublicAnswers: 0,
    deletedPrivateAnswers: 0,
    deletedFirstAnswerLocks: 0,
  };
}

function buildDailyRunPayload(params: {
  dateKey: DateKey;
  createdBy: string;
  questionCount: number;
  revealPolicy: AdminConfigDraft["dailyRevealPolicy"];
  categoryPlan?: AdminDailyCategoryPlan;
  questions: Array<{ questionId: string } & QuestionDoc>;
  userIds: string[];
  previous: DailyRunDoc | null;
}) {
  const {
    dateKey,
    createdBy,
    questionCount,
    revealPolicy,
    categoryPlan,
    questions,
    userIds,
    previous,
  } = params;

  const includedCategories = categoryPlan?.includedCategories ?? [];
  const forcedCategories = categoryPlan?.forcedCategories ?? [];

  if (includedCategories.length === 0) {
    throw new Error("Wähle mindestens eine Kategorie für das Daily aus.");
  }

  const questionsByCategory = new Map<Category, Array<{ questionId: string } & QuestionDoc>>();
  for (const question of questions) {
    if (!includedCategories.includes(question.category)) {
      continue;
    }
    const group = questionsByCategory.get(question.category) ?? [];
    group.push(question);
    questionsByCategory.set(question.category, group);
  }

  if (questionsByCategory.size === 0) {
    throw new Error("Für die gewählten Kategorien gibt es keine freigegebenen Fragen.");
  }

  const missingForcedCategories = forcedCategories.filter(
    (category) => !questionsByCategory.has(category),
  );

  if (missingForcedCategories.length > 0) {
    throw new Error(
      `Diese Pflicht-Kategorien haben gerade keine freigegebenen Fragen: ${missingForcedCategories.join(", ")}.`,
    );
  }

  const selectedCategoryCount = Math.min(
    questionCount,
    MAX_DAILY_CATEGORY_COUNT,
    questionsByCategory.size,
  );

  if (forcedCategories.length > selectedCategoryCount) {
    throw new Error("Du hast mehr Pflicht-Kategorien gewählt als heute Fragen gezogen werden.");
  }

  const remainingCategories = shuffle(
    Array.from(questionsByCategory.keys()).filter(
      (category) => !forcedCategories.includes(category),
    ),
  );
  const chosenCategories = [
    ...forcedCategories,
    ...remainingCategories.slice(0, selectedCategoryCount - forcedCategories.length),
  ];
  const selectedQuestions = chosenCategories.map((category) => {
    const categoryQuestions = questionsByCategory.get(category);
    if (!categoryQuestions || categoryQuestions.length === 0) {
      throw new Error(`Für ${category} wurde keine freigegebene Frage gefunden.`);
    }

    return shuffle(categoryQuestions)[0];
  });

  const items = selectedQuestions.map((question) => {
    const pairing = buildPairing(question.type, userIds);
    const questionSnapshot = {
      text: question.text,
      category: question.category,
      ...(question.options ? { options: question.options } : {}),
      ...(question.imagePath ? { imagePath: question.imagePath } : {}),
    };

    return pairing
      ? {
          questionId: question.questionId,
          type: question.type,
          questionSnapshot,
          pairing,
        }
      : {
          questionId: question.questionId,
          type: question.type,
          questionSnapshot,
        };
  });

  const payload = {
    dateKey,
    timezone: "Europe/Berlin" as const,
    status: dateKey === berlinDateKey() ? "active" as const : "scheduled" as const,
    questionCount: items.length,
    revealPolicy,
    questionIds: items.map((item) => item.questionId),
    items,
    createdBy,
    createdAt: previous?.createdAt ?? Timestamp.now(),
    updatedAt: serverTimestamp(),
  };

  assertValidDailyRunPayload(payload);

  return payload;
}

async function replaceDailyRunAtomically(params: {
  dateKey: DateKey;
  runRef: NonNullable<ReturnType<typeof dailyRunDoc>>;
  runPayload: ReturnType<typeof buildDailyRunPayload>;
  answersRef: NonNullable<ReturnType<typeof dailyAnswersCollection>>;
  privateAnswersRef: NonNullable<ReturnType<typeof dailyPrivateAnswersCollection>>;
  firstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
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
  } = params;
  const deletionResult = await collectDailyRunDeletionData({
    dateKey,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
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
}): Promise<Pick<
  AdminDailyDeleteResult,
  | "deletedPublicAnswers"
  | "deletedPrivateAnswers"
  | "deletedFirstAnswerLocks"
>> {
  const { runRef, dateKey, answersRef, privateAnswersRef, firstAnswersRef } = params;
  const deletionResult = await collectDailyRunDeletionData({
    dateKey,
    answersRef,
    privateAnswersRef,
    firstAnswersRef,
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

async function collectDailyRunDeletionData(params: {
  dateKey: DateKey;
  answersRef: NonNullable<ReturnType<typeof dailyAnswersCollection>>;
  privateAnswersRef: NonNullable<ReturnType<typeof dailyPrivateAnswersCollection>>;
  firstAnswersRef: NonNullable<ReturnType<typeof dailyFirstAnswersCollection>>;
}) {
  const { dateKey, answersRef, privateAnswersRef, firstAnswersRef } = params;
  const [answersSnapshot, privateAnswersSnapshot, firstAnswersSnapshot] =
    await Promise.all([
      getDocs(query(answersRef, where("dateKey", "==", dateKey))),
      getDocs(query(privateAnswersRef, where("dateKey", "==", dateKey))),
      getDocs(query(firstAnswersRef, where("dateKey", "==", dateKey))),
    ]);

  return {
    docs: [
      ...answersSnapshot.docs,
      ...privateAnswersSnapshot.docs,
      ...firstAnswersSnapshot.docs,
    ],
    counts: {
      deletedPublicAnswers: answersSnapshot.docs.length,
      deletedPrivateAnswers: privateAnswersSnapshot.docs.length,
      deletedFirstAnswerLocks: firstAnswersSnapshot.docs.length,
    },
  };
}

function buildPairing(type: QuestionType, userIds: string[]) {
  const shuffled = shuffle(userIds);

  if (type === "duel_1v1" && shuffled.length >= 2) {
    return {
      memberIds: [shuffled[0], shuffled[1]] as [string, string],
    };
  }

  if (type === "duel_2v2" && shuffled.length >= 4) {
    return {
      teamA: [shuffled[0], shuffled[1]] as [string, string],
      teamB: [shuffled[2], shuffled[3]] as [string, string],
    };
  }

  return undefined;
}

function canUseQuestionInDaily(type: QuestionType, memberCount: number) {
  if (type === "duel_1v1") {
    return memberCount >= 2;
  }

  if (type === "duel_2v2") {
    return memberCount >= 4;
  }

  return true;
}

function shuffle<T>(input: T[]): T[] {
  const copy = [...input];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
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
  question: Pick<QuestionDoc, "text" | "category" | "targetMode">,
) {
  return JSON.stringify({
    text: question.text.trim().toLocaleLowerCase("de-DE"),
    category: question.category,
    targetMode: question.targetMode,
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
