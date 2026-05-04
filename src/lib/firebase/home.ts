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
  liveParticipantsCollection,
  liveSessionsCollection,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import { isTestFirebaseProject } from "@/lib/firebase/config";
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
import type {
  HomeActivityItem,
  HomePastDailyReview,
  HomeViewState,
  MemberLite,
} from "@/lib/types/frontend";
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
  "text" | "category" | "type" | "options" | "imagePath"
>;

type DailyRunWithMeta = DailyRunDoc & {
  runId: string;
  runNumber: number;
};

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
    const answersRef = dailyAnswersCollection();
    const memeVotesRef = dailyMemeVotesCollection();
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const sessionsRef = liveSessionsCollection();
    const runsRef = dailyRunsCollection();
    const questionsRef = questionsCollection();
    const usersRef = usersCollection();

    if (
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

    let runData: DailyRunWithMeta[] = [];
    let answerQuestionIds = new Set<string>();
    let streakCurrent = 0;
    let activeSession: (LiveSessionDoc & { id?: string }) | null = null;
    let recentRuns: DailyRunWithMeta[] = [];
    let activeSessionParticipantCount = 0;
    let iAmParticipantInActiveSession = false;
    let questions = new Map<string, QuestionDoc>();
    let users = new Map<string, UserDoc>();
    let activeMemberIds = new Set<string>();
    let answeredDateKeys = new Set<string>();
    let allMyDailyAnswers: DailyPrivateAnswerDoc[] = [];
    let allPublicAnswers = new Map<string, DailyAnswerDoc[]>();
    let allMemeVotes = new Map<string, DailyMemeVoteDoc[]>();
    let unsubscribeActiveParticipants: (() => void) | null = null;
    const pendingInitialSnapshots = new Set([
      "privateAnswers",
      "runs",
      "answers",
      "memeVotes",
      "questions",
      "users",
      "sessions",
    ]);

    const emit = () => {
      if (pendingInitialSnapshots.size > 0) {
        return;
      }

      const todayRunViews = runData.map((run) => {
        const validated = validateDailyRun({
          run,
          questions,
          activeMemberIds,
        });
        const visibleItems = validated.playableItems.filter((item) => {
          const question = questions.get(item.questionId);
          return !question
            || !shouldHideUserTrophyQuestionForUser(question, authState.user.userId);
        });
        return { run, validated, visibleItems };
      });
      const visiblePlayableQuestionKeys = todayRunViews.flatMap(({ run, visibleItems }) =>
        visibleItems.map((item) => answerKey(run.runId, item.questionId)),
      );
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
        hasTodayRun: runData.length > 0,
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
      const lastClosedRun = recentRuns
        .filter((run) => run.dateKey < dateKey && resolveDailyRunStatus(run) === "closed")
        .sort((left, right) =>
          right.dateKey === left.dateKey
            ? right.runNumber - left.runNumber
            : right.dateKey.localeCompare(left.dateKey),
        )[0];
      const lastDailyTrophyCount = lastClosedRun
        ? computeDailyMemeTrophyCount({
            userId: authState.user.userId,
            dailyRuns: [lastClosedRun],
            dailyAnswers: Array.from(allPublicAnswers.values()).flat(),
            dailyMemeVotes: Array.from(allMemeVotes.values()).flat(),
          })
        : 0;
      const pendingCustomQuestion = myCustomQuestions.find((question) =>
        isPendingUserTrophyQuestion(question),
      );
      const activeCustomQuestionNotice =
        runData.length > 0
          ? [...todayRunViews.flatMap((view) =>
              view.visibleItems.map((item) => ({ item, run: view.run })),
            )]
              .reverse()
              .map(({ item, run }) => {
                const question = questions.get(item.questionId);
                if (!question || !isUserTrophyQuestion(question)) {
                  return null;
                }

                if (answerQuestionIds.has(answerKey(run.runId, item.questionId))) {
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
        runToRender: DailyRunWithMeta,
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
            runId: runToRender.runId,
            runNumber: runToRender.runNumber,
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

          const reviewKey = answerKey(runToRender.runId, item.questionId);
          const myAnswerDoc = allMyDailyAnswers.find(
            (answer) =>
              (answer.runId ?? answer.dateKey) === runToRender.runId
              && answer.questionId === item.questionId,
          );
          const myAnswer = myAnswerDoc
            ? mapDailyAnswerDraft(myAnswerDoc as DailyAnswerDoc)
            : undefined;
          return [
            {
              dateKey: runToRender.dateKey,
              runId: runToRender.runId,
              runNumber: runToRender.runNumber,
              runLabel:
                runToRender.runNumber > 1 ? `Daily Nr. ${runToRender.runNumber}` : undefined,
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
        runData.flatMap((run) => buildReviewItems(run, "today"));

      const pastDailies: HomePastDailyReview[] = recentRuns
        .filter((run) => run.dateKey < dateKey)
        .slice(0, 5)
        .map((run) => ({
          runId: run.runId,
          runNumber: run.runNumber,
          runLabel: run.runNumber > 1 ? `Daily Nr. ${run.runNumber}` : undefined,
          dateKey: run.dateKey,
          totalInRun: run.questionCount,
          answeredByMe: allMyDailyAnswers.filter(
            (answer) => (answer.runId ?? answer.dateKey) === run.runId,
          ).length,
          status: resolveDailyRunStatus(run),
          items: buildReviewItems(run, "past"),
        }));
      const recentActivity = buildRecentActivityItems({
        answers: Array.from(allPublicAnswers.values()).flat(),
        dateKey,
        users,
      });

      setState({
        status: "ready",
        greeting: {
          displayName: authState.user.displayName,
          localDateLabel: formatBerlinDateLabel(dateKey),
          streakCurrent,
        },
        dailyTeaser: runData.length > 0
          ? {
              dateKey,
              totalQuestions: visiblePlayableQuestionKeys.length,
              answeredByMe: visiblePlayableQuestionKeys.filter((key) =>
                answerQuestionIds.has(key),
              ).length,
              status: runData.some((run) => resolveDailyRunStatus(run) === "active")
                ? "active"
                : runData.some((run) => resolveDailyRunStatus(run) === "scheduled")
                  ? "scheduled"
                  : "closed",
              revealPolicy: runData[0]?.revealPolicy ?? "after_answer",
              hasIncompleteItems: todayRunViews.some((view) => view.validated.hasIncompleteItems),
              isUnplayable: todayRunViews.every((view) => view.validated.isUnplayable),
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
                  && pendingCustomQuestion.options
                  && pendingCustomQuestion.options.length >= 2
                    ? pendingCustomQuestion.options
                    : undefined,
              }
            : null,
        },
        trophyEarnedNotice:
          isTestFirebaseProject() && authState.user.role === "admin"
            ? {
                dateKey: lastClosedRun?.dateKey ?? dateKey,
                trophyCount: Math.max(1, lastDailyTrophyCount),
                availableTrophies: Math.max(1, availableTrophies),
              }
            : lastClosedRun && lastDailyTrophyCount > 0
            ? {
                dateKey: lastClosedRun.dateKey,
                trophyCount: lastDailyTrophyCount,
                availableTrophies,
              }
            : null,
        customQuestionNotice: activeCustomQuestionNotice,
        recentActivity,
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

    const markSnapshotReady = (key: string) => {
      pendingInitialSnapshots.delete(key);
      emit();
    };

    const handleError = (scope: string) => (error: unknown) => {
      setState({
        status: "error",
        message: formatListenerError(scope, error),
      });
    };

    const unsubscribers = [
      onSnapshot(
        query(
          privateAnswersRef,
          where("userId", "==", authState.user.userId),
        ),
        (snapshot) => {
          allMyDailyAnswers = snapshot.docs.map(
            (doc) => doc.data() as DailyPrivateAnswerDoc,
          );
          answeredDateKeys = new Set(
            allMyDailyAnswers.map((answer) => answer.dateKey),
          );
          answerQuestionIds = new Set(
            snapshot.docs
              .map((doc) => doc.data() as DailyPrivateAnswerDoc)
              .filter((answer) => answer.dateKey === dateKey)
              .map((answer) => answerKey(answer.runId ?? answer.dateKey, answer.questionId)),
          );
          streakCurrent = computeDailyStreakStats(answeredDateKeys).current;
          markSnapshotReady("privateAnswers");
        },
        handleError("Home-Eigene Antworten"),
      ),
      onSnapshot(
        query(runsRef, orderBy("dateKey", "desc")),
        (snapshot) => {
          recentRuns = snapshot.docs
            .map((doc) => {
              const data = doc.data() as DailyRunDoc;
              return {
                ...data,
                runId: data.runId ?? doc.id,
                runNumber: data.runNumber ?? (doc.id === data.dateKey ? 1 : 99),
              };
            })
            .filter(isCanonicalDailyRun);
          runData = recentRuns
            .filter((run) => run.dateKey === dateKey)
            .sort((left, right) =>
              left.runNumber === right.runNumber
                ? left.runId.localeCompare(right.runId)
                : left.runNumber - right.runNumber,
            );
          markSnapshotReady("runs");
        },
        handleError("Home-Daily-Verlauf"),
      ),
      onSnapshot(
        answersRef,
        (snapshot) => {
          allPublicAnswers = snapshot.docs
            .map((doc) => doc.data() as DailyAnswerDoc)
            .reduce<Map<string, DailyAnswerDoc[]>>((acc, answer) => {
              const key = answerKey(answer.runId ?? answer.dateKey, answer.questionId);
              const existing = acc.get(key) ?? [];
              existing.push(answer);
              acc.set(key, existing);
              return acc;
            }, new Map());
          markSnapshotReady("answers");
        },
        handleError("Home-Daily-Ergebnisse"),
      ),
      onSnapshot(
        memeVotesRef,
        (snapshot) => {
          allMemeVotes = snapshot.docs
            .map((doc) => doc.data() as DailyMemeVoteDoc)
            .reduce<Map<string, DailyMemeVoteDoc[]>>((acc, vote) => {
              const key = answerKey(vote.runId ?? vote.dateKey, vote.questionId);
              const existing = acc.get(key) ?? [];
              existing.push(vote);
              acc.set(key, existing);
              return acc;
            }, new Map());
          markSnapshotReady("memeVotes");
        },
        handleError("Home-Meme-Votes"),
      ),
      onSnapshot(
        questionsRef,
        (snapshot) => {
          questions = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
          );
          markSnapshotReady("questions");
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
          markSnapshotReady("users");
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

          markSnapshotReady("sessions");
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
  if (item.questionSnapshot) {
    return {
      text: item.questionSnapshot.text,
      category: item.questionSnapshot.category,
      type: item.type,
      options: item.questionSnapshot.options,
      imagePath: item.questionSnapshot.imagePath,
    };
  }

  return questions.get(item.questionId) ?? null;
}

function answerKey(runId: string, questionId: string) {
  return `${runId}:${questionId}`;
}

function isCanonicalDailyRun(run: DailyRunWithMeta) {
  return run.runNumber <= 1 || run.runId === run.dateKey;
}

function buildRecentActivityItems({
  answers,
  dateKey,
  users,
}: {
  answers: DailyAnswerDoc[];
  dateKey: string;
  users: Map<string, UserDoc>;
}): HomeActivityItem[] {
  return answers
    .filter((answer) => answer.dateKey === dateKey)
    .map((answer, index) => {
      const createdAtMs = readTimestampMs(answer.createdAt);
      if (!createdAtMs) {
        return null;
      }

      return {
        id: `${answer.runId ?? answer.dateKey}:${answer.questionId}:${answer.userId}:${createdAtMs}:${index}`,
        actorDisplayName: users.get(answer.userId)?.displayName ?? "Jemand",
        action:
          answer.questionType === "meme_caption"
            ? "created_meme"
            : "answered_question",
        timeLabel: formatTimeLabel(createdAtMs),
        createdAtMs,
      } satisfies HomeActivityItem;
    })
    .filter((item): item is HomeActivityItem => Boolean(item))
    .sort((left, right) => right.createdAtMs - left.createdAtMs);
}

function readTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object"
    && value !== null
    && "toDate" in value
    && typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === "object"
    && value !== null
    && "seconds" in value
    && typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  return null;
}

function formatTimeLabel(ms: number) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(ms));
}

type DailyRunItemDocLike = NonNullable<DailyRunDoc["items"]>[number];
