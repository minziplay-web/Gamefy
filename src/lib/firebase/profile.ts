"use client";

import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  dailyAnonymousAggregatesCollection,
  dailyAnswersCollection,
  dailyFirstAnswersCollection,
  dailyPrivateAnswersCollection,
  dailyRunsCollection,
  liveAnonymousAggregatesCollection,
  liveAnswersCollection,
  liveParticipantsGroup,
  livePrivateAnswersCollection,
  liveSessionsCollection,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import { resolveDailyRunStatus } from "@/lib/mapping/daily-run";
import {
  computeDailyStreakStats,
  computeDuelStats,
  computePublicVotesReceivedStats,
} from "@/lib/mapping/stats";
import { mockProfile } from "@/lib/mocks";
import type { DailyHistoryEntry, MemberLite, ProfileStats, ProfileViewState } from "@/lib/types/frontend";
import type {
  DailyAnonymousAggregateDoc,
  DailyAnswerDoc,
  DailyFirstAnswerDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  LiveAnonymousAggregateDoc,
  LiveAnswerDoc,
  LivePrivateAnswerDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export function useProfileViewState(): ProfileViewState {
  const { authState, isMockMode } = useAuth();
  const [state, setState] = useState<ProfileViewState>(
    isMockMode ? mockProfile : { status: "loading" },
  );

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    if (authState.status !== "authenticated") {
      queueMicrotask(() => setState({ status: "loading" }));
      return;
    }

    const usersRef = usersCollection();
    const runsRef = dailyRunsCollection();
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const dailyAnswersRef = dailyAnswersCollection();
    const dailyFirstAnswersRef = dailyFirstAnswersCollection();
    const dailyAggregatesRef = dailyAnonymousAggregatesCollection();
    const liveSessionsRef = liveSessionsCollection();
    const liveParticipantsRef = liveParticipantsGroup();
    const livePrivateAnswersRef = livePrivateAnswersCollection();
    const liveAnswersRef = liveAnswersCollection();
    const liveAggregatesRef = liveAnonymousAggregatesCollection();
    const questionsRef = questionsCollection();

    if (
      !usersRef ||
      !runsRef ||
      !privateAnswersRef ||
      !dailyAnswersRef ||
      !dailyFirstAnswersRef ||
      !dailyAggregatesRef ||
      !liveSessionsRef ||
      !liveParticipantsRef ||
      !livePrivateAnswersRef ||
      !liveAnswersRef ||
      !liveAggregatesRef ||
      !questionsRef
    ) {
      queueMicrotask(() =>
        setState({ status: "error", message: "Firestore ist noch nicht verbunden." }),
      );
      return;
    }

    let members: MemberLite[] = [];
    let dailyRuns: DailyRunDoc[] = [];
    let myDailyAnswers: DailyPrivateAnswerDoc[] = [];
    let myLiveAnswers: LivePrivateAnswerDoc[] = [];
    let dailyAnswers: DailyAnswerDoc[] = [];
    let dailyFirstAnswers: DailyFirstAnswerDoc[] = [];
    let dailyAggregates: DailyAnonymousAggregateDoc[] = [];
    let liveSessions: Array<LiveSessionDoc & { id: string }> = [];
    let liveParticipantSessionIds: string[] = [];
    let liveAnswers: LiveAnswerDoc[] = [];
    let liveAggregates: LiveAnonymousAggregateDoc[] = [];
    let questions = new Map<string, QuestionDoc>();

    const emit = () => {
      const streaks = computeDailyStreakStats(
        myDailyAnswers.map((answer) => answer.dateKey),
      );
      const duelStats = computeDuelStats({
        userId: authState.user.userId,
        dailyRuns,
        dailyAnswers,
        dailyAnonymousAggregates: dailyAggregates,
        liveSessions,
        liveAnswers,
        liveAnonymousAggregates: liveAggregates,
      });
      const questionCategories = new Map(
        Array.from(questions.entries()).map(([questionId, question]) => [
          questionId,
          question.category,
        ]),
      );
      const publicVotesReceived = computePublicVotesReceivedStats({
        userId: authState.user.userId,
        dailyAnswers,
        liveAnswers,
        questionCategories,
      });
      const categoryActivity: ProfileStats["categoryActivity"] = {};
      for (const answer of myDailyAnswers) {
        const category = questions.get(answer.questionId)?.category;
        if (category) {
          categoryActivity[category] = (categoryActivity[category] ?? 0) + 1;
        }
      }
      for (const answer of myLiveAnswers) {
        const category = questions.get(answer.questionId)?.category;
        if (category) {
          categoryActivity[category] = (categoryActivity[category] ?? 0) + 1;
        }
      }
      const roundsHosted = liveSessions.filter(
        (session) => session.hostUserId === authState.user.userId,
      ).length;
      const roundsPlayed = new Set(liveParticipantSessionIds).size;
      const history: DailyHistoryEntry[] = dailyRuns.slice(0, 10).map((run) => ({
        dateKey: run.dateKey,
        totalInRun: run.questionCount,
        answeredByMe: myDailyAnswers.filter((answer) => answer.dateKey === run.dateKey).length,
        status: resolveDailyRunStatus(run),
      }));

      setState({
        status: "ready",
        user: authState.user,
        isSelf: true,
        stats: {
          daily: {
            answeredCount: myDailyAnswers.length,
            streakCurrent: streaks.current,
            streakBest: streaks.best,
            firstAnswerCount: dailyFirstAnswers.filter(
              (answer) => answer.userId === authState.user.userId,
            ).length,
          },
          live: {
            roundsPlayed,
            roundsHosted,
            answersSubmitted: myLiveAnswers.length,
          },
          duels: {
            wins: duelStats.wins,
            losses: duelStats.losses,
            winRatePercent:
              duelStats.wins + duelStats.losses > 0
                ? Math.round((duelStats.wins / (duelStats.wins + duelStats.losses)) * 100)
                : null,
          },
          publicVotesReceived,
          categoryActivity,
        },
        dailyHistory: history,
        members,
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
        query(usersRef, where("isActive", "==", true)),
        (snapshot) => {
          members = snapshot.docs.map((doc) => {
            const data = doc.data() as UserDoc;
            return {
              userId: doc.id,
              displayName: data.displayName,
              photoURL: data.photoURL ?? null,
            };
          });
          emit();
        },
        handleError("Profil-Mitglieder"),
      ),
      onSnapshot(
        query(runsRef, orderBy("dateKey", "desc")),
        (snapshot) => {
          dailyRuns = snapshot.docs.map((doc) => doc.data() as DailyRunDoc);
          emit();
        },
        handleError("Profil-Daily-Runs"),
      ),
      onSnapshot(
        dailyAnswersRef,
        (snapshot) => {
          dailyAnswers = snapshot.docs.map((doc) => doc.data() as DailyAnswerDoc);
          emit();
        },
        handleError("Profil-Daily-Antworten"),
      ),
      onSnapshot(
        dailyFirstAnswersRef,
        (snapshot) => {
          dailyFirstAnswers = snapshot.docs.map(
            (doc) => doc.data() as DailyFirstAnswerDoc,
          );
          emit();
        },
        handleError("Profil-First-Answers"),
      ),
      onSnapshot(
        dailyAggregatesRef,
        (snapshot) => {
          dailyAggregates = snapshot.docs.map(
            (doc) => doc.data() as DailyAnonymousAggregateDoc,
          );
          emit();
        },
        handleError("Profil-Daily-Aggregate"),
      ),
      onSnapshot(
        query(privateAnswersRef, where("userId", "==", authState.user.userId)),
        (snapshot) => {
          myDailyAnswers = snapshot.docs.map((doc) => doc.data() as DailyPrivateAnswerDoc);
          emit();
        },
        handleError("Profil-Eigene Daily-Antworten"),
      ),
      onSnapshot(
        liveSessionsRef,
        (snapshot) => {
          liveSessions = snapshot.docs.map((doc) => ({
            ...(doc.data() as LiveSessionDoc),
            id: doc.id,
          }));
          emit();
        },
        handleError("Profil-Live-Sessions"),
      ),
      onSnapshot(
        query(liveParticipantsRef, where("userId", "==", authState.user.userId)),
        (snapshot) => {
          liveParticipantSessionIds = snapshot.docs
            .map((doc) => doc.ref.parent.parent?.id ?? "")
            .filter(Boolean);
          emit();
        },
        handleError("Profil-Live-Teilnahmen"),
      ),
      onSnapshot(
        query(livePrivateAnswersRef, where("userId", "==", authState.user.userId)),
        (snapshot) => {
          myLiveAnswers = snapshot.docs.map(
            (doc) => doc.data() as LivePrivateAnswerDoc,
          );
          emit();
        },
        handleError("Profil-Eigene Live-Antworten"),
      ),
      onSnapshot(
        liveAnswersRef,
        (snapshot) => {
          liveAnswers = snapshot.docs.map((doc) => doc.data() as LiveAnswerDoc);
          emit();
        },
        handleError("Profil-Live-Antworten"),
      ),
      onSnapshot(
        liveAggregatesRef,
        (snapshot) => {
          liveAggregates = snapshot.docs.map(
            (doc) => doc.data() as LiveAnonymousAggregateDoc,
          );
          emit();
        },
        handleError("Profil-Live-Aggregate"),
      ),
      onSnapshot(
        query(questionsRef, where("active", "==", true)),
        (snapshot) => {
          questions = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
          );
          emit();
        },
        handleError("Profil-Fragen"),
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [authState, isMockMode]);

  return state;
}
