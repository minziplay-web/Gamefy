"use client";

import { onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  getCustomQuestionTargetDateKey,
  isPendingUserTrophyQuestion,
  isUserTrophyQuestion,
  shouldHideUserTrophyQuestionForUser,
} from "@/lib/daily/custom-daily-questions";
import {
  dailyAnswersCollection,
  dailyMemeVotesCollection,
  dailyPrivateAnswersCollection,
  dailyRunsCollection,
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
import { resolveDailyRunStatus, validateDailyRun } from "@/lib/mapping/daily-run";
import { formatBerlinDateLabel, berlinDateKey } from "@/lib/mapping/date";
import {
  computeAvailableTrophyCount,
  computeDailyMemeTrophyCount,
  computeDailyStreakStats,
} from "@/lib/mapping/stats";
import { mockHome } from "@/lib/mocks";
import type { HomePastDailyReview, HomeViewState, MemberLite } from "@/lib/types/frontend";
import type {
  DailyAnswerDoc,
  DailyMemeVoteDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  LiveParticipantDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

type QuestionLike = Pick<
  QuestionDoc,
  "text" | "category" | "type" | "options"
>;

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
    const memeVotesRef = dailyMemeVotesCollection();
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const sessionsRef = liveSessionsCollection();
    const runsRef = dailyRunsCollection();
    const questionsRef = questionsCollection();
    const usersRef = usersCollection();

    if (
      !runRef ||
      !answersRef ||
      !memeVotesRef ||
      !privateAnswersRef ||
      !runsRef ||
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
    let recentRuns: DailyRunDoc[] = [];
    let activeSessionParticipantCount = 0;
    let iAmParticipantInActiveSession = false;
    let questions = new Map<string, QuestionDoc>();
    let users = new Map<string, UserDoc>();
    let activeMemberIds = new Set<string>();
    let answeredDateKeys = new Set<string>();
    let allMyDailyAnswers: DailyPrivateAnswerDoc[] = [];
    let myDailyAnswers = new Map<string, DailyPrivateAnswerDoc>();
    let allPublicAnswers = new Map<string, DailyAnswerDoc[]>();
    let allMemeVotes = new Map<string, DailyMemeVoteDoc[]>();
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
      const visiblePlayableItems =
        validatedRun?.playableItems.filter((item) => {
          const question = questions.get(item.questionId);
          return !question
            || !shouldHideUserTrophyQuestionForUser(question, authState.user.userId);
        }) ?? [];
      const visiblePlayableQuestionIds = visiblePlayableItems.map((item) => item.questionId);
      const memberMap = new Map(
        Array.from(users.entries()).map(([userId, user]) => [
          userId,
          {
            userId,
            displayName: user.displayName,
            photoURL: user.photoURL ?? null,
          } satisfies MemberLite,
        ]),
      );
      const targetCustomQuestionDateKey = getCustomQuestionTargetDateKey({
        todayDateKey: dateKey,
        hasTodayRun: Boolean(runData),
      });
      const myCustomQuestions = Array.from(questions.entries())
        .map(([questionId, question]) => ({
          questionId,
          ...question,
        }))
        .filter(
          (question) =>
            isUserTrophyQuestion(question)
            && question.ownerUserId === authState.user.userId,
        );
      const earnedTrophies = computeDailyMemeTrophyCount({
        userId: authState.user.userId,
        dailyRuns: recentRuns,
        dailyAnswers: Array.from(allPublicAnswers.values()).flat(),
        dailyMemeVotes: Array.from(allMemeVotes.values()).flat(),
      });
      const bonusTrophies = users.get(authState.user.userId)?.bonusTrophyCount ?? 0;
      const spentTrophies = myCustomQuestions.length;
      const availableTrophies = computeAvailableTrophyCount({
        earnedTrophies,
        spentCustomQuestions: spentTrophies,
        bonusTrophies,
      });
      const pendingCustomQuestion = myCustomQuestions.find((question) =>
        isPendingUserTrophyQuestion(question, targetCustomQuestionDateKey),
      );
      const activeCustomQuestionNotice =
        runData && validatedRun
          ? [...visiblePlayableItems]
              .reverse()
              .map((item) => {
                const question = questions.get(item.questionId);
                if (!question || !isUserTrophyQuestion(question)) {
                  return null;
                }

                if (answerQuestionIds.has(item.questionId)) {
                  return null;
                }

                const ownerUserId = question.ownerUserId;
                return {
                  questionId: item.questionId,
                  authorDisplayName:
                    ownerUserId && users.get(ownerUserId)?.displayName
                      ? users.get(ownerUserId)!.displayName
                      : "jemandem",
                  questionText: question.text,
                  isMine: ownerUserId === authState.user.userId,
                };
              })
              .find(Boolean) ?? null
          : null;

      const buildReviewItems = (
        runToRender: DailyRunDoc,
        mode: "today" | "past" = "today",
      ) => {
        const validated = validateDailyRun({
          run: runToRender,
          questions,
          activeMemberIds,
        });

        const reviewItems =
          mode === "past"
            ? runToRender.items ??
              runToRender.questionIds.map((questionId) => ({
                questionId,
                type: questions.get(questionId)?.type ?? "open_text",
                pairing: undefined,
              }))
            : validated.playableItems;

        if (mode === "today" && validated.isUnplayable) {
          return [];
        }

        return reviewItems.flatMap((item, index) => {
          const questionDoc = getQuestionSource(item, questions);
          if (!questionDoc) {
            return [];
          }

          const question = mapDailyQuestion({
            questionId: item.questionId,
            question: questionDoc,
            index,
            total: reviewItems.length,
            members: memberMap,
            pairing: item.pairing,
          });

          if (!question) {
            return [];
          }

          const reviewKey = `${runToRender.dateKey}_${item.questionId}`;
          const myAnswerDoc = allMyDailyAnswers.find(
            (answer) =>
              answer.dateKey === runToRender.dateKey && answer.questionId === item.questionId,
          );
          const myAnswer = myAnswerDoc
            ? mapDailyAnswerDraft(myAnswerDoc as DailyAnswerDoc)
            : undefined;
          return [
            {
              dateKey: runToRender.dateKey,
              questionId: question.questionId,
              questionText: question.text,
              category: question.category,
              result: mapQuestionResult({
                question,
                myAnswer,
                publicAnswers: allPublicAnswers.get(reviewKey) ?? [],
                memeVotes: allMemeVotes.get(reviewKey) ?? [],
                currentUserId: authState.user.userId,
                members: memberMap,
              }),
            },
          ];
        });
      };

      const dailyRecap =
        run && validatedRun
          ? buildReviewItems(run, "today")
          : [];

      const pastDailies: HomePastDailyReview[] = recentRuns
        .filter((run) => run.dateKey < dateKey)
        .slice(0, 5)
        .map((run) => ({
          dateKey: run.dateKey,
          totalInRun: run.questionCount,
          answeredByMe: allMyDailyAnswers.filter(
            (answer) => answer.dateKey === run.dateKey,
          ).length,
          status: resolveDailyRunStatus(run),
          items: buildReviewItems(run, "past"),
        }));

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
              totalQuestions: visiblePlayableQuestionIds.length,
              answeredByMe: visiblePlayableQuestionIds.filter((questionId) =>
                answerQuestionIds.has(questionId),
              ).length,
              status: resolveDailyRunStatus(runData),
              revealPolicy: runData.revealPolicy,
              hasIncompleteItems: validatedRun?.hasIncompleteItems,
              isUnplayable: validatedRun?.isUnplayable,
            }
          : null,
        dailyRecap,
        pastDailies,
        customQuestionStatus: {
          targetDateKey: targetCustomQuestionDateKey,
          availableTrophies,
          earnedTrophies,
          bonusTrophies,
          spentTrophies,
          pendingQuestion: pendingCustomQuestion
            ? {
                questionId: pendingCustomQuestion.questionId,
                targetDateKey:
                  pendingCustomQuestion.targetDateKey ?? targetCustomQuestionDateKey,
                type:
                  pendingCustomQuestion.type === "open_text"
                  || pendingCustomQuestion.type === "single_choice"
                  || pendingCustomQuestion.type === "multi_choice"
                  || pendingCustomQuestion.type === "either_or"
                    ? pendingCustomQuestion.type
                    : "open_text",
                text: pendingCustomQuestion.text,
                options:
                  pendingCustomQuestion.type === "either_or"
                  && pendingCustomQuestion.options?.length === 2
                    ? [
                        pendingCustomQuestion.options[0],
                        pendingCustomQuestion.options[1],
                      ]
                    : undefined,
              }
            : null,
        },
        customQuestionNotice: activeCustomQuestionNotice,
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
          allMyDailyAnswers = snapshot.docs.map(
            (doc) => doc.data() as DailyPrivateAnswerDoc,
          );
          myDailyAnswers = new Map(
            allMyDailyAnswers
              .filter((answer) => answer.dateKey === dateKey)
              .map((answer) => [answer.questionId, answer]),
          );
          answeredDateKeys = new Set(
            allMyDailyAnswers.map((answer) => answer.dateKey),
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
        query(runsRef, orderBy("dateKey", "desc")),
        (snapshot) => {
          recentRuns = snapshot.docs.map((doc) => doc.data() as DailyRunDoc);
          emit();
        },
        handleError("Home-Daily-Verlauf"),
      ),
      onSnapshot(
        answersRef,
        (snapshot) => {
          allPublicAnswers = snapshot.docs
            .map((doc) => doc.data() as DailyAnswerDoc)
            .reduce<Map<string, DailyAnswerDoc[]>>((acc, answer) => {
              const key = `${answer.dateKey}_${answer.questionId}`;
              const existing = acc.get(key) ?? [];
              existing.push(answer);
              acc.set(key, existing);
              return acc;
            }, new Map());
          emit();
        },
        handleError("Home-Daily-Ergebnisse"),
      ),
      onSnapshot(
        memeVotesRef,
        (snapshot) => {
          allMemeVotes = snapshot.docs
            .map((doc) => doc.data() as DailyMemeVoteDoc)
            .reduce<Map<string, DailyMemeVoteDoc[]>>((acc, vote) => {
              const key = `${vote.dateKey}_${vote.questionId}`;
              const existing = acc.get(key) ?? [];
              existing.push(vote);
              acc.set(key, existing);
              return acc;
            }, new Map());
          emit();
        },
        handleError("Home-Meme-Votes"),
      ),
      onSnapshot(
        questionsRef,
        (snapshot) => {
          questions = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
          );
          emit();
        },
        handleError("Home-Fragen"),
      ),
      onSnapshot(
        usersRef,
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

function getQuestionSource(
  item: DailyRunItemDocLike,
  questions: Map<string, QuestionDoc>,
): QuestionLike | null {
  const liveQuestion = questions.get(item.questionId);
  if (liveQuestion) {
    return liveQuestion;
  }

  if (!item.questionSnapshot) {
    return null;
  }

  return {
    text: item.questionSnapshot.text,
    category: item.questionSnapshot.category,
    type: item.type,
    options: item.questionSnapshot.options,
  };
}

type DailyRunItemDocLike = NonNullable<DailyRunDoc["items"]>[number];
