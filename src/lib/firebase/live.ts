"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  liveAnonymousAggregatesCollection,
  liveAnswersCollection,
  liveParticipantsCollection,
  livePrivateAnswersCollection,
  liveSessionDoc,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import { isPlayableRunItem } from "@/lib/mapping/daily-run";
import { mockLobby, mockLobbyLanding } from "@/lib/mocks";
import type {
  Category,
  DailyAnswerDraft,
  DailyQuestion,
  LiveFinishedSummary,
  LobbyParticipant,
  LobbyViewState,
  MemberLite,
  QuestionResult,
} from "@/lib/types/frontend";
import type {
  DailyRunItemDoc,
  LiveAnswerDoc,
  LiveAnonymousAggregateDoc,
  LiveParticipantDoc,
  LivePrivateAnswerDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export function useLobbyViewState(sessionId?: string): LobbyViewState {
  const { authState, isMockMode } = useAuth();
  const [state, setState] = useState<LobbyViewState>(
    isMockMode
      ? sessionId
        ? mockLobby
        : mockLobbyLanding
      : sessionId
        ? { status: "loading" }
        : { status: "landing" },
  );

  useEffect(() => {
    if (isMockMode) {
      queueMicrotask(() => setState(sessionId ? mockLobby : mockLobbyLanding));
      return;
    }

    if (!sessionId) {
      queueMicrotask(() => setState({ status: "landing" }));
      return;
    }

    if (authState.status !== "authenticated") {
      queueMicrotask(() => setState({ status: "error", message: "Nicht eingeloggt." }));
      return;
    }

    const sessionRef = liveSessionDoc(sessionId);
    const participantsRef = liveParticipantsCollection(sessionId);
    const questionsRef = questionsCollection();
    const usersRef = usersCollection();
    const publicAnswersRef = liveAnswersCollection();
    const privateAnswersRef = livePrivateAnswersCollection();
    const anonymousAggregatesRef = liveAnonymousAggregatesCollection();

    if (
      !sessionRef ||
      !participantsRef ||
      !questionsRef ||
      !usersRef ||
      !publicAnswersRef ||
      !privateAnswersRef ||
      !anonymousAggregatesRef
    ) {
      queueMicrotask(() =>
        setState({ status: "error", message: "Firestore ist nicht verfügbar." }),
      );
      return;
    }

    let session: (LiveSessionDoc & { id: string }) | null = null;
    let participants: LobbyParticipant[] = [];
    let questions = new Map<string, QuestionDoc>();
    let members = new Map<string, MemberLite>();
    let myAnswers = new Map<number, LivePrivateAnswerDoc>();
    let publicAnswers = new Map<number, LiveAnswerDoc[]>();
    let anonymousAggregates = new Map<number, LiveAnonymousAggregateDoc>();

    const emit = () => {
      if (!session || authState.status !== "authenticated") {
        return;
      }

      const me =
        participants.find((participant) => participant.userId === authState.user.userId) ??
        {
          userId: authState.user.userId,
          displayName: authState.user.displayName,
          photoURL: authState.user.photoURL,
          isHost: session.hostUserId === authState.user.userId,
          connected: true,
        };

      const isHost = session.hostUserId === authState.user.userId;
      const items = session.items ?? [];
      const connectedParticipantIds = new Set(
        participants
          .filter((participant) => participant.connected)
          .map((participant) => participant.userId),
      );
      const playableItems = items.filter((item) =>
        isPlayableRunItem(item, questions.get(item.questionId), connectedParticipantIds),
      );

      if (
        (session.status === "question" || session.status === "reveal" || session.status === "finished") &&
        playableItems.length === 0
      ) {
        setState({
          status: "error",
          message: "Diese Live-Runde enthält keine spielbaren Fragen mehr.",
        });
        return;
      }

      const currentItem = items[session.currentQuestionIndex];
      const currentItemPlayable = currentItem
        ? isPlayableRunItem(
            currentItem,
            questions.get(currentItem.questionId),
            connectedParticipantIds,
          )
        : false;

      if (
        (session.status === "question" || session.status === "reveal") &&
        (!currentItem || !currentItemPlayable)
      ) {
        setState({
          status: "error",
          message: "Die aktuelle Live-Frage ist nicht spielbar. Bitte die Runde beenden und neu starten.",
        });
        return;
      }

      const displayQuestionIndex = items
        .slice(0, session.currentQuestionIndex + 1)
        .filter((item) =>
          isPlayableRunItem(item, questions.get(item.questionId), connectedParticipantIds),
        )
        .length - 1;

      const live =
        session.status === "question" || session.status === "reveal"
          ? buildLivePhase({
              session,
              currentItem,
              rawQuestionIndex: session.currentQuestionIndex,
              displayQuestionIndex: Math.max(0, displayQuestionIndex),
              totalQuestions: playableItems.length || items.length,
              questions,
              members,
              myAnswer: myAnswers.get(session.currentQuestionIndex),
              publicAnswers: publicAnswers.get(session.currentQuestionIndex) ?? [],
              anonymousAggregate: anonymousAggregates.get(session.currentQuestionIndex),
            })
          : null;

      const finishedSummary =
        session.status === "finished"
          ? buildFinishedSummary({
              session,
              items: (playableItems.length > 0 ? playableItems : items).map((item) => ({
                rawIndex: items.indexOf(item),
                item,
              })),
              questions,
              members,
              publicAnswers,
              anonymousAggregates,
              myAnswers,
            })
          : null;

      setState({
        status: "connected",
        sessionId: session.id,
        code: session.code,
        phase: session.status,
        participants,
        me,
        isHost,
        live,
        finishedSummary,
        hostControls: {
          canStart:
            isHost &&
            session.status === "lobby" &&
            participants.filter((participant) => participant.connected).length >= 2,
          canAdvance: isHost && session.status === "reveal",
          canEnd: isHost,
        },
      });
    };

    const handleError = (scope: string) => (error: unknown) => {
      setState({
        status: "error",
        message: formatListenerError(scope, error),
      });
    };

    const unsubscribers = [
      onSnapshot(
        sessionRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setState({ status: "error", message: "Lobby nicht gefunden." });
            return;
          }
          session = { ...(snapshot.data() as LiveSessionDoc), id: snapshot.id };
          emit();
        },
        handleError("Live-Session"),
      ),
      onSnapshot(
        participantsRef,
        (snapshot) => {
          participants = snapshot.docs.map((doc) => {
            const data = doc.data() as LiveParticipantDoc;
            return {
              userId: data.userId,
              displayName: data.displayName,
              photoURL: data.photoURL,
              isHost: data.isHost,
              connected: data.connected,
            };
          });
          emit();
        },
        handleError("Live-Teilnehmer"),
      ),
      onSnapshot(
        query(questionsRef, where("active", "==", true)),
        (snapshot) => {
          questions = new Map(snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]));
          emit();
        },
        handleError("Live-Fragen"),
      ),
      onSnapshot(
        query(usersRef, where("isActive", "==", true)),
        (snapshot) => {
          members = new Map(
            snapshot.docs.map((doc) => [
              doc.id,
              {
                userId: doc.id,
                displayName: (doc.data() as UserDoc).displayName,
                photoURL: (doc.data() as UserDoc).photoURL ?? null,
              } satisfies MemberLite,
            ]),
          );
          emit();
        },
        handleError("Live-Mitglieder"),
      ),
      onSnapshot(
        query(
          privateAnswersRef,
          where("sessionId", "==", sessionId),
          where("userId", "==", authState.user.userId),
        ),
        (snapshot) => {
          myAnswers = new Map(
            snapshot.docs.map((doc) => {
              const data = doc.data() as LivePrivateAnswerDoc;
              return [data.questionIndex, data];
            }),
          );
          emit();
        },
        handleError("Eigene Live-Antworten"),
      ),
      onSnapshot(
        query(publicAnswersRef, where("sessionId", "==", sessionId)),
        (snapshot) => {
          const grouped = new Map<number, LiveAnswerDoc[]>();
          for (const doc of snapshot.docs) {
            const data = doc.data() as LiveAnswerDoc;
            const list = grouped.get(data.questionIndex) ?? [];
            list.push(data);
            grouped.set(data.questionIndex, list);
          }
          publicAnswers = grouped;
          emit();
        },
        handleError("Öffentliche Live-Antworten"),
      ),
      onSnapshot(
        query(anonymousAggregatesRef, where("sessionId", "==", sessionId)),
        (snapshot) => {
          anonymousAggregates = new Map(
            snapshot.docs.map((doc) => {
              const data = doc.data() as LiveAnonymousAggregateDoc;
              return [data.questionIndex, data];
            }),
          );
          emit();
        },
        handleError("Anonyme Live-Ergebnisse"),
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [authState, isMockMode, sessionId]);

  return state;
}

function buildLivePhase(params: {
  session: LiveSessionDoc;
  currentItem?: DailyRunItemDoc;
  rawQuestionIndex: number;
  displayQuestionIndex: number;
  totalQuestions: number;
  questions: Map<string, QuestionDoc>;
  members: Map<string, MemberLite>;
  myAnswer?: LivePrivateAnswerDoc;
  publicAnswers: LiveAnswerDoc[];
  anonymousAggregate?: LiveAnonymousAggregateDoc;
}) {
  const {
    session,
    currentItem,
    rawQuestionIndex,
    displayQuestionIndex,
    totalQuestions,
    questions,
    members,
    myAnswer,
    publicAnswers,
    anonymousAggregate,
  } = params;

  if (!currentItem) {
    return null;
  }

  const questionDoc = questions.get(currentItem.questionId);
  if (!questionDoc) {
    return null;
  }

  const question = mapLiveQuestion({
    questionId: currentItem.questionId,
    question: questionDoc,
    index: displayQuestionIndex,
    total: totalQuestions,
    members,
    pairing: currentItem.pairing,
  });

  if (!question) {
    return null;
  }

  const myDraft = myAnswer ? mapLiveAnswerDraft(myAnswer) : undefined;

  if (session.status === "question") {
    return {
      phase: "question" as const,
      view: {
        rawQuestionIndex,
        questionIndex: displayQuestionIndex,
        totalQuestions,
        question,
      },
      countdown: {
        phaseStartedAtMs: toMillis(session.phaseStartedAt),
        durationSec: session.questionDurationSec,
      },
      draft: myDraft,
      submitStatus: myDraft ? "submitted" as const : "idle" as const,
    };
  }

  return {
    phase: "reveal" as const,
    view: {
      rawQuestionIndex,
      questionIndex: displayQuestionIndex,
      totalQuestions,
      question,
    },
    countdown: {
      phaseStartedAtMs: toMillis(session.phaseStartedAt),
      durationSec: session.revealDurationSec,
    },
    result: mapLiveQuestionResult({
      question,
      myAnswer: myDraft,
      publicAnswers,
      anonymousAggregate,
      members,
    }),
    myAnswer: myDraft,
  };
}

function buildFinishedSummary(params: {
  session: LiveSessionDoc & { id: string };
  items: Array<{ rawIndex: number; item: DailyRunItemDoc }>;
  questions: Map<string, QuestionDoc>;
  members: Map<string, MemberLite>;
  publicAnswers: Map<number, LiveAnswerDoc[]>;
  anonymousAggregates: Map<number, LiveAnonymousAggregateDoc>;
  myAnswers: Map<number, LivePrivateAnswerDoc>;
}): LiveFinishedSummary {
  const { items, questions, members, publicAnswers, anonymousAggregates, myAnswers } = params;
  const categoryCounts = new Map<Category, number>();

  for (const { item } of items) {
    const category = questions.get(item.questionId)?.category;
    if (category) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  const topCategory =
    Array.from(categoryCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    null;

  return {
    totalQuestions: items.length,
    myAnswersCount: items.filter(({ rawIndex }) => myAnswers.has(rawIndex)).length,
    topCategory,
    rounds: items.flatMap(({ rawIndex, item }, index) => {
      const questionDoc = questions.get(item.questionId);
      if (!questionDoc) {
        return [];
      }
      const question = mapLiveQuestion({
        questionId: item.questionId,
        question: questionDoc,
        index,
        total: items.length,
        members,
        pairing: item.pairing,
      });
      if (!question) {
        return [];
      }
      return [
        {
          questionIndex: index,
          questionText: question.text,
          category: question.category,
          anonymous: question.anonymous,
          result: mapLiveQuestionResult({
            question,
            myAnswer: myAnswers.get(rawIndex)
              ? mapLiveAnswerDraft(myAnswers.get(rawIndex)!)
              : undefined,
            publicAnswers: publicAnswers.get(rawIndex) ?? [],
            anonymousAggregate: anonymousAggregates.get(rawIndex),
            members,
          }),
        },
      ];
    }),
  };
}

function mapLiveQuestion(params: {
  questionId: string;
  question: QuestionDoc;
  index: number;
  total: number;
  members: Map<string, MemberLite>;
  pairing?: DailyRunItemDoc["pairing"];
}): DailyQuestion | null {
  const { questionId, question, index, total, members, pairing } = params;
  const base = {
    questionId,
    indexInRun: index,
    totalInRun: total,
    text: question.text,
    category: question.category,
    anonymous: question.anonymous,
  };

  switch (question.type) {
    case "single_choice":
      return { ...base, type: "single_choice", candidates: Array.from(members.values()) };
    case "open_text":
      return { ...base, type: "open_text", maxLength: 280 };
    case "either_or":
      return {
        ...base,
        type: "either_or",
        options: [question.options?.[0] ?? "Option A", question.options?.[1] ?? "Option B"],
      };
    case "meme_caption":
      return { ...base, type: "meme_caption", imagePath: question.imagePath ?? "", maxLength: 140 };
    case "duel_1v1": {
      const left = pairing?.memberIds?.[0] ? members.get(pairing.memberIds[0]) : undefined;
      const right = pairing?.memberIds?.[1] ? members.get(pairing.memberIds[1]) : undefined;
      if (!left || !right) return null;
      return { ...base, type: "duel_1v1", left, right };
    }
    case "duel_2v2": {
      const teamA0 = pairing?.teamA?.[0] ? members.get(pairing.teamA[0]) : undefined;
      const teamA1 = pairing?.teamA?.[1] ? members.get(pairing.teamA[1]) : undefined;
      const teamB0 = pairing?.teamB?.[0] ? members.get(pairing.teamB[0]) : undefined;
      const teamB1 = pairing?.teamB?.[1] ? members.get(pairing.teamB[1]) : undefined;
      if (!teamA0 || !teamA1 || !teamB0 || !teamB1) return null;
      return { ...base, type: "duel_2v2", teamA: [teamA0, teamA1], teamB: [teamB0, teamB1] };
    }
  }
}

function mapLiveAnswerDraft(answer: LivePrivateAnswerDoc): DailyAnswerDraft {
  switch (answer.questionType) {
    case "single_choice":
      return { type: "single_choice", questionId: answer.questionId, selectedUserId: answer.selectedUserId };
    case "open_text":
      return { type: "open_text", questionId: answer.questionId, textAnswer: answer.textAnswer ?? "" };
    case "duel_1v1":
      return { type: "duel_1v1", questionId: answer.questionId, selectedSide: answer.selectedSide };
    case "duel_2v2":
      return { type: "duel_2v2", questionId: answer.questionId, selectedTeam: answer.selectedTeam };
    case "either_or":
      return {
        type: "either_or",
        questionId: answer.questionId,
        selectedOptionIndex:
          answer.selectedOptionIndex === 0 || answer.selectedOptionIndex === 1
            ? answer.selectedOptionIndex
            : undefined,
      };
    case "meme_caption":
      return { type: "meme_caption", questionId: answer.questionId, textAnswer: answer.textAnswer ?? "" };
  }
}

function mapLiveQuestionResult(params: {
  question: DailyQuestion;
  myAnswer?: DailyAnswerDraft;
  publicAnswers: LiveAnswerDoc[];
  anonymousAggregate?: LiveAnonymousAggregateDoc;
  members?: Map<string, MemberLite>;
}): QuestionResult {
  const { question, myAnswer, publicAnswers, anonymousAggregate, members } = params;

  switch (question.type) {
    case "single_choice": {
      const totalVotes = question.anonymous
        ? Object.values(anonymousAggregate?.counts ?? {}).reduce((sum, count) => sum + count, 0)
        : publicAnswers.length;
      return {
        questionType: "single_choice",
        anonymous: question.anonymous,
        totalVotes,
        counts: question.candidates.map((candidate) => {
          const votes = question.anonymous
            ? anonymousAggregate?.counts?.[candidate.userId] ?? 0
            : publicAnswers.filter((answer) => answer.selectedUserId === candidate.userId).length;
          return {
            candidate,
            votes,
            percent: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
          };
        }),
        voterRows: question.anonymous
          ? undefined
          : publicAnswers
              .map((answer) => {
                const voter = members?.get(answer.userId);
                const target = answer.selectedUserId
                  ? question.candidates.find((candidate) => candidate.userId === answer.selectedUserId)
                  : undefined;
                if (!voter || !target) {
                  return null;
                }
                return { voter, target };
              })
              .filter((row): row is { voter: MemberLite; target: MemberLite } => row !== null),
        myChoiceUserId:
          myAnswer?.type === "single_choice" ? myAnswer.selectedUserId : undefined,
      };
    }
    case "open_text":
      return {
        questionType: "open_text",
        anonymous: question.anonymous,
        entries: question.anonymous
          ? (anonymousAggregate?.textAnswers ?? []).map((text) => ({ text }))
          : publicAnswers.filter((answer) => answer.textAnswer).map((answer) => ({ text: answer.textAnswer! })),
      };
    case "duel_1v1": {
      const leftVotes = question.anonymous
        ? anonymousAggregate?.counts?.left ?? 0
        : publicAnswers.filter((answer) => answer.selectedSide === "left").length;
      const rightVotes = question.anonymous
        ? anonymousAggregate?.counts?.right ?? 0
        : publicAnswers.filter((answer) => answer.selectedSide === "right").length;
      const totalVotes = leftVotes + rightVotes;
      return {
        questionType: "duel_1v1",
        anonymous: question.anonymous,
        left: {
          member: question.left,
          votes: leftVotes,
          percent: totalVotes > 0 ? Math.round((leftVotes / totalVotes) * 100) : 0,
        },
        right: {
          member: question.right,
          votes: rightVotes,
          percent: totalVotes > 0 ? Math.round((rightVotes / totalVotes) * 100) : 0,
        },
        voterRows: question.anonymous
          ? undefined
          : publicAnswers
              .map((answer) => {
                const voter = members?.get(answer.userId);
                if (!voter || (answer.selectedSide !== "left" && answer.selectedSide !== "right")) {
                  return null;
                }
                return { voter, side: answer.selectedSide };
              })
              .filter(
                (
                  row,
                ): row is { voter: MemberLite; side: "left" | "right" } => row !== null,
              ),
        myChoice: myAnswer?.type === "duel_1v1" ? myAnswer.selectedSide : undefined,
      };
    }
    case "duel_2v2": {
      const teamAVotes = question.anonymous
        ? anonymousAggregate?.counts?.teamA ?? 0
        : publicAnswers.filter((answer) => answer.selectedTeam === "teamA").length;
      const teamBVotes = question.anonymous
        ? anonymousAggregate?.counts?.teamB ?? 0
        : publicAnswers.filter((answer) => answer.selectedTeam === "teamB").length;
      const totalVotes = teamAVotes + teamBVotes;
      return {
        questionType: "duel_2v2",
        anonymous: question.anonymous,
        teamA: {
          members: question.teamA,
          votes: teamAVotes,
          percent: totalVotes > 0 ? Math.round((teamAVotes / totalVotes) * 100) : 0,
        },
        teamB: {
          members: question.teamB,
          votes: teamBVotes,
          percent: totalVotes > 0 ? Math.round((teamBVotes / totalVotes) * 100) : 0,
        },
        voterRows: question.anonymous
          ? undefined
          : publicAnswers
              .map((answer) => {
                const voter = members?.get(answer.userId);
                if (!voter || (answer.selectedTeam !== "teamA" && answer.selectedTeam !== "teamB")) {
                  return null;
                }
                return { voter, team: answer.selectedTeam };
              })
              .filter(
                (
                  row,
                ): row is { voter: MemberLite; team: "teamA" | "teamB" } => row !== null,
              ),
        myChoice: myAnswer?.type === "duel_2v2" ? myAnswer.selectedTeam : undefined,
      };
    }
    case "either_or": {
      const option0Votes = question.anonymous
        ? anonymousAggregate?.counts?.option_0 ?? 0
        : publicAnswers.filter((answer) => answer.selectedOptionIndex === 0).length;
      const option1Votes = question.anonymous
        ? anonymousAggregate?.counts?.option_1 ?? 0
        : publicAnswers.filter((answer) => answer.selectedOptionIndex === 1).length;
      const totalVotes = option0Votes + option1Votes;
      return {
        questionType: "either_or",
        anonymous: question.anonymous,
        options: [
          { label: question.options[0], votes: option0Votes, percent: totalVotes > 0 ? Math.round((option0Votes / totalVotes) * 100) : 0 },
          { label: question.options[1], votes: option1Votes, percent: totalVotes > 0 ? Math.round((option1Votes / totalVotes) * 100) : 0 },
        ],
        voterRows: question.anonymous
          ? undefined
          : publicAnswers
              .map((answer) => {
                const voter = members?.get(answer.userId);
                const optionIndex =
                  answer.selectedOptionIndex === 0 || answer.selectedOptionIndex === 1
                    ? answer.selectedOptionIndex
                    : undefined;
                if (!voter || optionIndex === undefined) {
                  return null;
                }
                return { voter, optionIndex };
              })
              .filter(
                (row): row is { voter: MemberLite; optionIndex: 0 | 1 } => row !== null,
              ),
        myChoiceIndex: myAnswer?.type === "either_or" ? myAnswer.selectedOptionIndex : undefined,
      };
    }
    case "meme_caption":
      return {
        questionType: "meme_caption",
        anonymous: question.anonymous,
        imagePath: question.imagePath,
        entries: question.anonymous
          ? (anonymousAggregate?.textAnswers ?? []).map((text) => ({ text }))
          : publicAnswers
              .filter((answer) => answer.textAnswer)
              .map((answer) => ({
                text: answer.textAnswer!,
                author: members?.get(answer.userId),
              })),
      };
  }
}

function toMillis(value: unknown) {
  if (!value) return Date.now();
  if (typeof value === "object" && value !== null && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}
