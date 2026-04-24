"use client";

import { onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  dailyAnswersCollection,
  dailyAnonymousAggregatesCollection,
  dailyPrivateAnswersCollection,
  dailyRunDoc,
  liveParticipantsCollection,
  liveSessionsCollection,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import {
  mapDailyAnswerDraft,
  mapDailyQuestion,
  mapQuestionResult,
} from "@/lib/firebase/daily";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import { shouldReveal } from "@/lib/mapping/daily";
import { resolveDailyRunStatus, validateDailyRun } from "@/lib/mapping/daily-run";
import { formatBerlinDateLabel, berlinDateKey } from "@/lib/mapping/date";
import { computeDailyStreakStats } from "@/lib/mapping/stats";
import { mockHome } from "@/lib/mocks";
import type { HomeViewState } from "@/lib/types/frontend";
import type {
  DailyAnonymousAggregateDoc,
  DailyAnswerDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  LiveParticipantDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export function useHomeViewState(): HomeViewState {
  const { authState, isMockMode } = useAuth();
  const [state, setState] = useState<HomeViewState>(
    isMockMode ? mockHome : { status: "loading" },
  );

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    if (authState.status !== "authenticated") {
      queueMicrotask(() => setState({ status: "loading" }));
      return;
    }

    const dateKey = berlinDateKey();
    const runRef = dailyRunDoc(dateKey);
    const answersRef = dailyAnswersCollection();
    const aggregatesRef = dailyAnonymousAggregatesCollection();
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const sessionsRef = liveSessionsCollection();
    const questionsRef = questionsCollection();
    const usersRef = usersCollection();

    if (
      !runRef ||
      !answersRef ||
      !aggregatesRef ||
      !privateAnswersRef ||
      !sessionsRef ||
      !questionsRef ||
      !usersRef
    ) {
      queueMicrotask(() =>
        setState({ status: "error", message: "Firestore ist noch nicht verbunden." }),
      );
      return;
    }

    let runData: DailyRunDoc | null = null;
    let answerQuestionIds = new Set<string>();
    let streakCurrent = 0;
    let activeSession: (LiveSessionDoc & { id?: string }) | null = null;
    let activeSessionParticipantCount = 0;
    let iAmParticipantInActiveSession = false;
    let questions = new Map<string, QuestionDoc>();
    let users = new Map<string, UserDoc>();
    let activeMemberIds = new Set<string>();
    let answeredDateKeys = new Set<string>();
    let myDailyAnswers = new Map<string, DailyPrivateAnswerDoc>();
    let allPublicAnswers = new Map<string, DailyAnswerDoc[]>();
    let anonymousAggregates = new Map<string, DailyAnonymousAggregateDoc>();
    let unsubscribeActiveParticipants: (() => void) | null = null;

    const emit = () => {
      const validatedRun = runData
        ? validateDailyRun({
            run: runData,
            questions,
            activeMemberIds,
          })
        : null;
      const run = runData;
      const visibleQuestionIds = validatedRun?.playableItems.map((item) => item.questionId) ?? [];
      const dailyRecap =
        run && validatedRun
          ? validatedRun.playableItems
              .flatMap((item, index) => {
                const questionDoc = questions.get(item.questionId);
                if (!questionDoc) {
                  return [];
                }

                const question = mapDailyQuestion({
                  questionId: item.questionId,
                  question: questionDoc,
                  index,
                  total: validatedRun.playableItems.length,
                  members: new Map(
                    Array.from(users.entries()).map(([userId, user]) => [
                      userId,
                      {
                        userId,
                        displayName: user.displayName,
                        photoURL: user.photoURL ?? null,
                      },
                    ]),
                  ),
                  pairing: item.pairing,
                });

                if (!question) {
                  return [];
                }

                const myAnswerDoc = myDailyAnswers.get(item.questionId);
                const myAnswer = myAnswerDoc
                  ? mapDailyAnswerDraft(myAnswerDoc as DailyAnswerDoc)
                  : undefined;
                const reveal = shouldReveal({
                  revealPolicy: run.revealPolicy,
                  runStatus: resolveDailyRunStatus(run),
                  dateKey: run.dateKey,
                  hasOwnAnswer: Boolean(myAnswer),
                });

                if (!reveal) {
                  return [];
                }

                return [
                  {
                    questionId: question.questionId,
                    questionText: question.text,
                    category: question.category,
                    anonymous: question.anonymous,
                    result: mapQuestionResult({
                      question,
                      myAnswer,
                      publicAnswers: allPublicAnswers.get(item.questionId) ?? [],
                      anonymousAggregate: anonymousAggregates.get(item.questionId),
                      members: new Map(
                        Array.from(users.entries()).map(([userId, user]) => [
                          userId,
                          {
                            userId,
                            displayName: user.displayName,
                            photoURL: user.photoURL ?? null,
                          },
                        ]),
                      ),
                    }),
                  },
                ];
              })
              .slice(0, 5)
          : [];

      setState({
        status: "ready",
        greeting: {
          displayName: authState.user.displayName,
          localDateLabel: formatBerlinDateLabel(dateKey),
          streakCurrent,
        },
        dailyTeaser: runData
          ? {
              dateKey,
              totalQuestions: visibleQuestionIds.length,
              answeredByMe: visibleQuestionIds.filter((questionId) =>
                answerQuestionIds.has(questionId),
              ).length,
              status: resolveDailyRunStatus(runData),
              revealPolicy: runData.revealPolicy,
              hasIncompleteItems: validatedRun?.hasIncompleteItems,
              isUnplayable: validatedRun?.isUnplayable,
            }
          : null,
        dailyRecap,
        activeLiveSession: activeSession
          ? {
              sessionId: activeSession.id ?? "",
              code: activeSession.code,
              hostDisplayName:
                users.get(activeSession.hostUserId)?.displayName ??
                (activeSession.hostUserId === authState.user.userId
                  ? authState.user.displayName
                  : "Live-Host"),
              participantCount: activeSessionParticipantCount,
              phase: activeSession.status,
              iAmParticipant:
                iAmParticipantInActiveSession ||
                activeSession.hostUserId === authState.user.userId,
            }
          : null,
        canHostLive: authState.user.role === "admin",
        showAdminEntry: authState.user.role === "admin",
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
        runRef,
        (snapshot) => {
          runData = snapshot.exists() ? (snapshot.data() as DailyRunDoc) : null;
          emit();
        },
        handleError("Home-Daily"),
      ),
      onSnapshot(
        query(
          privateAnswersRef,
          where("userId", "==", authState.user.userId),
        ),
        (snapshot) => {
          myDailyAnswers = new Map(
            snapshot.docs
              .map((doc) => doc.data() as DailyPrivateAnswerDoc)
              .filter((answer) => answer.dateKey === dateKey)
              .map((answer) => [answer.questionId, answer]),
          );
          answeredDateKeys = new Set(
            snapshot.docs.map((doc) => (doc.data() as DailyPrivateAnswerDoc).dateKey),
          );
          answerQuestionIds = new Set(
            snapshot.docs
              .map((doc) => doc.data() as DailyPrivateAnswerDoc)
              .filter((answer) => answer.dateKey === dateKey)
              .map((answer) => answer.questionId),
          );
          streakCurrent = computeDailyStreakStats(answeredDateKeys).current;
          emit();
        },
        handleError("Home-Eigene Antworten"),
      ),
      onSnapshot(
        query(answersRef, where("dateKey", "==", dateKey)),
        (snapshot) => {
          allPublicAnswers = snapshot.docs
            .map((doc) => doc.data() as DailyAnswerDoc)
            .reduce<Map<string, DailyAnswerDoc[]>>((acc, answer) => {
              const existing = acc.get(answer.questionId) ?? [];
              existing.push(answer);
              acc.set(answer.questionId, existing);
              return acc;
            }, new Map());
          emit();
        },
        handleError("Home-Daily-Ergebnisse"),
      ),
      onSnapshot(
        query(aggregatesRef, where("dateKey", "==", dateKey)),
        (snapshot) => {
          anonymousAggregates = new Map(
            snapshot.docs.map((doc) => {
              const data = doc.data() as DailyAnonymousAggregateDoc;
              return [data.questionId, data];
            }),
          );
          emit();
        },
        handleError("Home-Daily-Aggregate"),
      ),
      onSnapshot(
        query(questionsRef, where("active", "==", true)),
        (snapshot) => {
          questions = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
          );
          emit();
        },
        handleError("Home-Fragen"),
      ),
      onSnapshot(
        query(usersRef, where("isActive", "==", true)),
        (snapshot) => {
          users = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as UserDoc]),
          );
          activeMemberIds = new Set(
            snapshot.docs.map((doc) => {
              const data = doc.data() as UserDoc;
              return data.isActive ? doc.id : "";
            }).filter(Boolean),
          );
          emit();
        },
        handleError("Home-Mitglieder"),
      ),
      onSnapshot(
        query(sessionsRef, orderBy("createdAt", "desc"), limit(5)),
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            ...(doc.data() as LiveSessionDoc),
            id: doc.id,
          }));
          const nextActiveSession = docs.find((session) => session.status !== "finished") ?? null;
          const previousSessionId = activeSession?.id ?? null;
          const nextSessionId = nextActiveSession?.id ?? null;

          activeSession = nextActiveSession;

          if (previousSessionId !== nextSessionId) {
            unsubscribeActiveParticipants?.();
            unsubscribeActiveParticipants = null;
            activeSessionParticipantCount = 0;
            iAmParticipantInActiveSession = false;

            if (nextSessionId) {
              const participantsRef = liveParticipantsCollection(nextSessionId);
              if (participantsRef) {
                unsubscribeActiveParticipants = onSnapshot(participantsRef, (participantsSnapshot) => {
                  const connectedParticipants = participantsSnapshot.docs
                    .map((doc) => doc.data() as LiveParticipantDoc)
                    .filter((participant) => participant.connected);

                  activeSessionParticipantCount = connectedParticipants.length;
                  iAmParticipantInActiveSession = connectedParticipants.some(
                    (participant) => participant.userId === authState.user.userId,
                  );
                  emit();
                });
              }
            }
          }

          emit();
        },
        handleError("Home-Live-Session"),
      ),
    ];

    return () => {
      unsubscribeActiveParticipants?.();
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [authState, isMockMode]);

  return state;
}
