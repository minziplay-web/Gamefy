"use client";

import {
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  liveAnswerDoc,
  liveLobbyCodeDoc,
  liveParticipantDoc,
  liveParticipantsCollection,
  livePrivateAnswerDoc,
  liveSessionDoc,
  liveSessionsCollection,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import { assertValidDraftForQuestion } from "@/lib/mapping/answer-guards";
import { isPlayableRunItem } from "@/lib/mapping/daily-run";
import {
  assertValidLiveItems,
  assertValidLiveQuestionIndex,
} from "@/lib/mapping/payload-guards";
import type {
  AppUser,
  DailyAnswerDraft,
  DailyQuestion,
  LobbyConfigDraft,
  QuestionType,
} from "@/lib/types/frontend";
import type {
  DailyRunItemDoc,
  LiveAnswerDoc,
  LiveLobbyCodeDoc,
  LiveParticipantDoc,
  LivePrivateAnswerDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export async function createLiveSession(params: {
  draft: LobbyConfigDraft;
  user: AppUser;
}) {
  const { draft, user } = params;
  const sessionsRef = liveSessionsCollection();
  const questionsRef = questionsCollection();
  const usersRef = usersCollection();

  if (!sessionsRef || !questionsRef || !usersRef) {
    throw new Error("Firestore ist nicht verfügbar.");
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
        draft.categories.includes(question.category) &&
        canUseQuestionInLive(question.type, users.length),
    );

  if (eligibleQuestions.length === 0) {
    throw new Error("Keine passenden Live-Fragen gefunden.");
  }

  const selectedQuestions = shuffle(eligibleQuestions).slice(
    0,
    Math.min(draft.questionCount, eligibleQuestions.length),
  );

  const sessionRef = doc(sessionsRef);
  const items = selectedQuestions.map((question) => {
    const pairing = buildPairing(
      question.type,
      users.map((entry) => entry.userId),
    );

    return pairing
      ? {
          questionId: question.questionId,
          type: question.type,
          pairing,
        }
      : {
          questionId: question.questionId,
          type: question.type,
        };
  });

  assertValidLiveItems(
    items,
    items.map((item) => item.questionId),
  );
  assertValidLiveQuestionIndex({
    status: "lobby",
    currentQuestionIndex: 0,
    questionIds: items.map((item) => item.questionId),
  });

  await reserveLobbyCodeAndCreateSession({
    sessionRef,
    hostUserId: user.userId,
    draft,
    items,
  });

  await setDoc(
    liveParticipantDoc(sessionRef.id, user.userId)!,
    {
      userId: user.userId,
      displayName: user.displayName,
      photoURL: user.photoURL,
      joinedAt: serverTimestamp(),
      isHost: true,
      connected: true,
    } satisfies LiveParticipantDoc,
  );

  return sessionRef.id;
}

export async function joinLiveSessionByCode(params: {
  code: string;
  user: AppUser;
}) {
  const { code, user } = params;
  const codeRef = liveLobbyCodeDoc(code);

  if (!codeRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const codeSnapshot = await getDoc(codeRef);
  if (!codeSnapshot.exists()) {
    throw new Error("Lobby-Code nicht gefunden.");
  }

  const codeData = codeSnapshot.data() as LiveLobbyCodeDoc;
  if (!codeData.active) {
    throw new Error("Diese Live-Runde ist nicht mehr verfügbar.");
  }

  const sessionRef = liveSessionDoc(codeData.sessionId);
  if (!sessionRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const sessionSnapshot = await getDoc(sessionRef);
  if (!sessionSnapshot.exists()) {
    throw new Error("Die Live-Runde zu diesem Code wurde nicht gefunden.");
  }

  const sessionData = sessionSnapshot.data() as LiveSessionDoc;

  if (sessionData.status === "finished") {
    throw new Error("Diese Live-Runde ist bereits beendet.");
  }

  const participantRef = liveParticipantDoc(codeData.sessionId, user.userId);

  if (!participantRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await runTransaction(participantRef.firestore, async (transaction) => {
    const participantSnap = await transaction.get(participantRef);

    transaction.set(
      participantRef,
      {
        userId: user.userId,
        displayName: user.displayName,
        photoURL: user.photoURL,
        joinedAt: participantSnap.exists()
          ? (participantSnap.data() as LiveParticipantDoc).joinedAt ?? serverTimestamp()
          : serverTimestamp(),
        isHost: false,
        connected: true,
      } satisfies LiveParticipantDoc,
      { merge: true },
    );
  });

  return codeData.sessionId;
}

export async function leaveLiveSession(sessionId: string, userId: string) {
  const participantRef = liveParticipantDoc(sessionId, userId);
  const sessionRef = liveSessionDoc(sessionId);
  const participantsRef = liveParticipantsCollection(sessionId);

  if (!participantRef || !sessionRef || !participantsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await updateDoc(participantRef, { connected: false });

  const [sessionSnap, participantsSnap] = await Promise.all([
    getDoc(sessionRef),
    getDocs(participantsRef),
  ]);

  if (!sessionSnap.exists()) {
    return;
  }

  const session = sessionSnap.data() as LiveSessionDoc;
  if (session.status === "finished") {
    return;
  }

  const connectedParticipants = participantsSnap.docs
    .map((doc) => doc.data() as LiveParticipantDoc)
    .filter((participant) => participant.connected);

  if (session.hostUserId === userId || connectedParticipants.length === 0) {
    await finalizeLiveSession(sessionId, session);
  }
}

export async function startLiveSession(sessionId: string, actingUserId: string) {
  const sessionRef = liveSessionDoc(sessionId);
  const questionsRef = questionsCollection();
  const participantsRef = liveParticipantsCollection(sessionId);

  if (!sessionRef || !questionsRef || !participantsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const [questionSnapshot, participantsSnapshot] = await Promise.all([
    getDocs(query(questionsRef, where("active", "==", true))),
    getDocs(participantsRef),
  ]);

  const connectedParticipants = participantsSnapshot.docs
    .map((doc) => doc.data() as LiveParticipantDoc)
    .filter((participant) => participant.connected);

  if (connectedParticipants.length < 2) {
    throw new Error("Es werden mindestens 2 verbundene Teilnehmer benoetigt.");
  }

  const connectedParticipantIds = new Set(
    connectedParticipants.map((participant) => participant.userId),
  );
  const questions = new Map(
    questionSnapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
  );
  await runTransaction(sessionRef.firestore, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error("Lobby nicht gefunden.");
    }

    const session = sessionSnap.data() as LiveSessionDoc;
    if (session.hostUserId !== actingUserId) {
      throw new Error("Nur der Host kann die Runde starten.");
    }
    if (session.status !== "lobby") {
      return;
    }

    const items = session.items ?? [];
    const normalizedItems = items.map((item) =>
      normalizeLiveRunItem(item, connectedParticipantIds),
    );
    assertValidLiveItems(
      normalizedItems,
      normalizedItems.map((item) => item.questionId),
    );
    const firstPlayableIndex = normalizedItems.findIndex((item) =>
      isPlayableRunItem(item, questions.get(item.questionId), connectedParticipantIds),
    );

    if (firstPlayableIndex < 0) {
      throw new Error("Diese Live-Runde enthält keine spielbaren Fragen.");
    }

    assertValidLiveQuestionIndex({
      status: "question",
      currentQuestionIndex: firstPlayableIndex,
      questionIds: normalizedItems.map((item) => item.questionId),
    });

    transaction.update(sessionRef, {
      status: "question",
      currentQuestionIndex: firstPlayableIndex,
      items: normalizedItems,
      startedAt: serverTimestamp(),
      phaseStartedAt: serverTimestamp(),
    });
  });
}

export async function advanceLiveSession(params: {
  sessionId: string;
  actingUserId: string;
}) {
  const { sessionId, actingUserId } = params;
  const sessionRef = liveSessionDoc(sessionId);
  const questionsRef = questionsCollection();
  const participantsRef = liveParticipantsCollection(sessionId);

  if (!sessionRef || !questionsRef || !participantsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const [questionSnapshot, participantsSnapshot] = await Promise.all([
    getDocs(query(questionsRef, where("active", "==", true))),
    getDocs(participantsRef),
  ]);

  const connectedParticipantIds = new Set(
    participantsSnapshot.docs
      .map((doc) => doc.data() as LiveParticipantDoc)
      .filter((participant) => participant.connected)
      .map((participant) => participant.userId),
  );
  const questions = new Map(
    questionSnapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
  );
  const shouldFinish = await runTransaction(sessionRef.firestore, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error("Lobby nicht gefunden.");
    }

    const session = sessionSnap.data() as LiveSessionDoc;
    if (session.hostUserId !== actingUserId) {
      throw new Error("Nur der Host kann die Runde weiterführen.");
    }
    if (session.status !== "reveal") {
      return false;
    }

    const items = session.items ?? [];
    const normalizedItems = items.map((item) =>
      normalizeLiveRunItem(item, connectedParticipantIds),
    );
    assertValidLiveItems(
      normalizedItems,
      normalizedItems.map((item) => item.questionId),
    );

    const nextPlayableIndex = normalizedItems.findIndex(
      (item, index) =>
        index > session.currentQuestionIndex &&
        isPlayableRunItem(item, questions.get(item.questionId), connectedParticipantIds),
    );

    if (nextPlayableIndex < 0) {
      return true;
    }

    assertValidLiveQuestionIndex({
      status: "question",
      currentQuestionIndex: nextPlayableIndex,
      questionIds: normalizedItems.map((item) => item.questionId),
    });

    transaction.update(sessionRef, {
      status: "question",
      currentQuestionIndex: nextPlayableIndex,
      items: normalizedItems,
      phaseStartedAt: serverTimestamp(),
    });
    return false;
  });

  if (shouldFinish) {
    await endLiveSession(sessionId, actingUserId);
  }
}

export async function revealLiveSession(sessionId: string, actingUserId: string) {
  const sessionRef = liveSessionDoc(sessionId);

  if (!sessionRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await runTransaction(sessionRef.firestore, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error("Lobby nicht gefunden.");
    }

    const session = sessionSnap.data() as LiveSessionDoc;
    if (session.hostUserId !== actingUserId) {
      throw new Error("Nur der Host kann die Auflösung starten.");
    }
    if (session.status !== "question") {
      return;
    }

    transaction.update(sessionRef, {
      status: "reveal",
      phaseStartedAt: serverTimestamp(),
    });
  });
}

export async function endLiveSession(sessionId: string, actingUserId: string) {
  const sessionRef = liveSessionDoc(sessionId);

  if (!sessionRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await runTransaction(sessionRef.firestore, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error("Lobby nicht gefunden.");
    }

    const session = sessionSnap.data() as LiveSessionDoc;
    if (session.hostUserId !== actingUserId) {
      throw new Error("Nur der Host kann die Runde beenden.");
    }
    if (session.status === "finished") {
      return;
    }

    transaction.update(sessionRef, {
      status: "finished",
      finishedAt: serverTimestamp(),
      phaseStartedAt: serverTimestamp(),
    });

    const codeRef = liveLobbyCodeDoc(session.code);
    if (codeRef) {
      transaction.set(
        codeRef,
        {
          active: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });
}

export async function submitLiveAnswer(params: {
  sessionId: string;
  user: AppUser;
  question: DailyQuestion;
  rawQuestionIndex: number;
  draft: DailyAnswerDraft;
}) {
  const { sessionId, user, question, rawQuestionIndex, draft } = params;
  const sessionRef = liveSessionDoc(sessionId);
  const questionsRef = questionsCollection();
  const participantsRef = liveParticipantsCollection(sessionId);

  if (!sessionRef || !questionsRef || !participantsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const [sessionSnapshot, questionSnapshot, participantsSnapshot] = await Promise.all([
    getDoc(sessionRef),
    getDocs(query(questionsRef, where("active", "==", true))),
    getDocs(participantsRef),
  ]);

  if (!sessionSnapshot.exists()) {
    throw new Error("Lobby nicht gefunden.");
  }

  const session = sessionSnapshot.data() as LiveSessionDoc;
  if (session.status !== "question") {
    throw new Error("Auf diese Live-Frage kann gerade nicht geantwortet werden.");
  }
  const items = session.items ?? [];
  const connectedParticipantIds = new Set(
    participantsSnapshot.docs
      .map((doc) => doc.data() as LiveParticipantDoc)
      .filter((participant) => participant.connected)
      .map((participant) => participant.userId),
  );
  const questions = new Map(
    questionSnapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
  );
  const questionIndex = rawQuestionIndex;
  const currentItem = items[questionIndex];
  const currentParticipant = participantsSnapshot.docs
    .map((doc) => doc.data() as LiveParticipantDoc)
    .find((participant) => participant.userId === user.userId);

  if (!currentParticipant?.connected) {
    throw new Error("Du bist nicht mehr als verbundener Teilnehmer in dieser Live-Runde.");
  }

  if (
    questionIndex < 0 ||
    !currentItem ||
    currentItem.questionId !== question.questionId ||
    !isPlayableRunItem(currentItem, questions.get(currentItem.questionId), connectedParticipantIds)
  ) {
    throw new Error("Die aktuelle Live-Frage ist nicht mehr spielbar.");
  }

  const answerId = `${sessionId}_${questionIndex}_${user.userId}`;
  const privateRef = livePrivateAnswerDoc(answerId);
  const publicRef = liveAnswerDoc(answerId);

  if (!privateRef || !publicRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  assertValidDraftForQuestion(question, draft);

  await runTransaction(privateRef.firestore, async (transaction) => {
    const previousPrivateSnap = await transaction.get(privateRef);

    const previousPrivate = previousPrivateSnap.exists()
      ? (previousPrivateSnap.data() as LivePrivateAnswerDoc)
      : null;

    const nextPrivate: LivePrivateAnswerDoc = {
      sessionId,
      questionId: question.questionId,
      questionIndex,
      userId: user.userId,
      questionType: question.type,
      ...mapDraftPayload(draft, question),
      submittedAt: previousPrivate?.submittedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(privateRef, nextPrivate, { merge: true });

    const nextPublic: LiveAnswerDoc = {
      sessionId,
      questionId: question.questionId,
      questionIndex,
      userId: user.userId,
      ...mapDraftPayload(draft, question),
      submittedAt: previousPrivate?.submittedAt ?? serverTimestamp(),
    };
    transaction.set(publicRef, nextPublic, { merge: true });
  });
}

async function reserveLobbyCodeAndCreateSession(params: {
  sessionRef: ReturnType<typeof doc>;
  hostUserId: string;
  draft: LobbyConfigDraft;
  items: DailyRunItemDoc[];
}) {
  const { sessionRef, hostUserId, draft, items } = params;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    const codeRef = liveLobbyCodeDoc(code);

    if (!codeRef) {
      throw new Error("Firestore ist nicht verfügbar.");
    }

    try {
      const reservedCode = await runTransaction(sessionRef.firestore, async (transaction) => {
        const codeSnapshot = await transaction.get(codeRef);

        if (codeSnapshot.exists() && (codeSnapshot.data() as LiveLobbyCodeDoc).active) {
          throw new Error("code_taken");
        }

        transaction.set(sessionRef, {
          hostUserId,
          code,
          status: "lobby",
          categories: draft.categories,
          questionIds: items.map((item) => item.questionId),
          currentQuestionIndex: 0,
          questionDurationSec: draft.questionDurationSec,
          revealDurationSec: draft.revealDurationSec,
          createdAt: serverTimestamp(),
          startedAt: null,
          phaseStartedAt: null,
          finishedAt: null,
          items,
        } satisfies LiveSessionDoc);

        transaction.set(codeRef, {
          code,
          sessionId: sessionRef.id,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } satisfies LiveLobbyCodeDoc);

        return code;
      });

      return reservedCode;
    } catch (error) {
      if (error instanceof Error && error.message === "code_taken") {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Konnte keinen freien Lobby-Code erzeugen.");
}

async function finalizeLiveSession(sessionId: string, session: LiveSessionDoc) {
  const sessionRef = liveSessionDoc(sessionId);

  if (!sessionRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await runTransaction(sessionRef.firestore, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists()) {
      return;
    }

    const latestSession = sessionSnap.data() as LiveSessionDoc;
    if (latestSession.status === "finished") {
      return;
    }

    transaction.update(sessionRef, {
      status: "finished",
      finishedAt: serverTimestamp(),
      phaseStartedAt: serverTimestamp(),
    });

    const codeRef = liveLobbyCodeDoc(session.code);
    if (codeRef) {
      transaction.set(
        codeRef,
        {
          active: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function buildPairing(type: QuestionType, userIds: string[]) {
  const shuffled = shuffle(userIds);

  if (type === "duel_1v1" && shuffled.length >= 2) {
    return { memberIds: [shuffled[0], shuffled[1]] as [string, string] };
  }

  if (type === "duel_2v2" && shuffled.length >= 4) {
    return {
      teamA: [shuffled[0], shuffled[1]] as [string, string],
      teamB: [shuffled[2], shuffled[3]] as [string, string],
    };
  }

  return undefined;
}

function normalizeLiveRunItem(
  item: DailyRunItemDoc,
  connectedParticipantIds: Set<string>,
) {
  if (item.type === "duel_1v1" || item.type === "duel_2v2") {
    const pairing = buildPairing(item.type, Array.from(connectedParticipantIds));
    return pairing
      ? {
          questionId: item.questionId,
          type: item.type,
          pairing,
        }
      : {
          questionId: item.questionId,
          type: item.type,
        };
  }

  return item;
}

function canUseQuestionInLive(type: QuestionType, memberCount: number) {
  if (type === "duel_1v1") {
    return memberCount >= 2;
  }

  if (type === "duel_2v2") {
    return memberCount >= 4;
  }

  return true;
}

function shuffle<T>(input: T[]) {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mapDraftPayload(draft: DailyAnswerDraft, question: DailyQuestion) {
  switch (draft.type) {
    case "single_choice":
      return { selectedUserId: draft.selectedUserId };
    case "multi_choice":
      return { selectedUserIds: draft.selectedUserIds };
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
