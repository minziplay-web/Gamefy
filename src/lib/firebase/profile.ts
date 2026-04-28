"use client";

import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  dailyAnswersCollection,
  dailyFirstAnswersCollection,
  dailyMemeVotesCollection,
  dailyPrivateAnswersCollection,
  dailyRunsCollection,
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
  computeAvailableTrophyCount,
  computeDailyStreakStats,
  computeDailyMemeTrophyCount,
  computeDuelStats,
  computePublicVotesReceivedStats,
  computeSpecialRelationshipStats,
} from "@/lib/mapping/stats";
import { mockProfile } from "@/lib/mocks";
import type { DailyHistoryEntry, MemberLite, ProfileStats, ProfileViewState } from "@/lib/types/frontend";
import type {
  DailyAnswerDoc,
  DailyFirstAnswerDoc,
  DailyMemeVoteDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  LiveAnswerDoc,
  LivePrivateAnswerDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export function useProfileViewState(targetUserId?: string): ProfileViewState {
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
    const dailyMemeVotesRef = dailyMemeVotesCollection();
    const liveSessionsRef = liveSessionsCollection();
    const liveParticipantsRef = liveParticipantsGroup();
    const livePrivateAnswersRef = livePrivateAnswersCollection();
    const liveAnswersRef = liveAnswersCollection();
    const questionsRef = questionsCollection();

    if (
      !usersRef ||
      !runsRef ||
      !privateAnswersRef ||
      !dailyAnswersRef ||
      !dailyFirstAnswersRef ||
      !dailyMemeVotesRef ||
      !liveSessionsRef ||
      !liveParticipantsRef ||
      !livePrivateAnswersRef ||
      !liveAnswersRef ||
      !questionsRef
    ) {
      queueMicrotask(() =>
        setState({ status: "error", message: "Firestore ist noch nicht verbunden." }),
      );
      return;
    }

    const viewedUserId = targetUserId ?? authState.user.userId;
    const isSelfProfile = viewedUserId === authState.user.userId;
    let members: MemberLite[] = [];
    let viewedUser: UserDoc | null = null;
    let dailyRuns: DailyRunDoc[] = [];
    let myDailyAnswers: DailyPrivateAnswerDoc[] = [];
    let myLiveAnswers: LivePrivateAnswerDoc[] = [];
    let dailyAnswers: DailyAnswerDoc[] = [];
    let dailyFirstAnswers: DailyFirstAnswerDoc[] = [];
    let dailyMemeVotes: DailyMemeVoteDoc[] = [];
    let liveSessions: Array<LiveSessionDoc & { id: string }> = [];
    let liveParticipantSessionIds: string[] = [];
    let liveAnswers: LiveAnswerDoc[] = [];
    let questions = new Map<string, QuestionDoc>();

    const emit = () => {
      if (!viewedUser) {
        setState({ status: "not_found" });
        return;
      }

      const streaks = computeDailyStreakStats(myDailyAnswers.map((answer) => answer.dateKey));
      const memeTrophyCount = computeDailyMemeTrophyCount({
        userId: viewedUserId,
        dailyRuns,
        dailyAnswers,
        dailyMemeVotes,
      });
      const bonusTrophyCount = viewedUser.bonusTrophyCount ?? 0;
      const spentCustomQuestions = Array.from(questions.values()).filter(
        (question) => question.source === "user_trophy" && question.ownerUserId === viewedUserId,
      ).length;
      const duelStats = computeDuelStats({
        userId: viewedUserId,
        dailyRuns,
        dailyAnswers,
        liveSessions,
        liveAnswers,
      });
      const questionCategories = new Map(
        Array.from(questions.entries()).map(([questionId, question]) => [
          questionId,
          question.category,
        ]),
      );
      const publicVotesReceived = computePublicVotesReceivedStats({
        userId: viewedUserId,
        dailyAnswers,
        liveAnswers,
        questionCategories,
      });
      const membersById = new Map(members.map((member) => [member.userId, member] as const));
      const specialRelationships = computeSpecialRelationshipStats({
        userId: viewedUserId,
        dailyAnswers,
        liveAnswers,
        membersById,
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
        (session) => session.hostUserId === viewedUserId,
      ).length;
      const roundsPlayed = new Set(liveParticipantSessionIds).size;
      const completedDailyCount = dailyRuns.filter((run) => {
        const answeredForRun = myDailyAnswers.filter(
          (answer) => answer.dateKey === run.dateKey,
        ).length;
        return run.questionCount > 0 && answeredForRun >= run.questionCount;
      }).length;
      const history: DailyHistoryEntry[] = dailyRuns.slice(0, 10).map((run) => ({
        dateKey: run.dateKey,
        totalInRun: run.questionCount,
        answeredByMe: myDailyAnswers.filter((answer) => answer.dateKey === run.dateKey).length,
        status: resolveDailyRunStatus(run),
      }));

      setState({
        status: "ready",
        user: {
          userId: viewedUserId,
          email: viewedUser.email,
          displayName: viewedUser.displayName,
          photoURL: viewedUser.photoURL ?? null,
          role: viewedUser.role,
          onboardingCompleted: viewedUser.onboardingCompleted,
        },
        isSelf: viewedUserId === authState.user.userId,
        stats: {
          daily: {
            answeredCount: myDailyAnswers.length,
            completedCount: completedDailyCount,
            streakCurrent: streaks.current,
            streakBest: streaks.best,
            firstAnswerCount: dailyFirstAnswers.filter(
              (answer) => answer.userId === viewedUserId,
            ).length,
            memeTrophyCount,
            availableTrophyCount: computeAvailableTrophyCount({
              earnedTrophies: memeTrophyCount,
              spentCustomQuestions,
              bonusTrophies: bonusTrophyCount,
            }),
          },
          live: {
            roundsPlayed,
            roundsHosted,
            answersSubmitted: isSelfProfile ? myLiveAnswers.length : 0,
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
          specialRelationships,
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
          const userMap = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as UserDoc] as const),
          );
          viewedUser = userMap.get(viewedUserId) ?? null;
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
        dailyMemeVotesRef,
        (snapshot) => {
          dailyMemeVotes = snapshot.docs.map(
            (doc) => doc.data() as DailyMemeVoteDoc,
          );
          emit();
        },
        handleError("Profil-Meme-Votes"),
      ),
      ...(isSelfProfile
        ? [
            onSnapshot(
              query(privateAnswersRef, where("userId", "==", viewedUserId)),
              (snapshot) => {
                myDailyAnswers = snapshot.docs.map(
                  (doc) => doc.data() as DailyPrivateAnswerDoc,
                );
                emit();
              },
              handleError("Profil-Daily-Antworten"),
            ),
          ]
        : []),
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
        query(liveParticipantsRef, where("userId", "==", viewedUserId)),
        (snapshot) => {
          liveParticipantSessionIds = snapshot.docs
            .map((doc) => doc.ref.parent.parent?.id ?? "")
            .filter(Boolean);
          emit();
        },
        handleError("Profil-Live-Teilnahmen"),
      ),
      ...(isSelfProfile
        ? [
            onSnapshot(
              query(livePrivateAnswersRef, where("userId", "==", viewedUserId)),
              (snapshot) => {
                myLiveAnswers = snapshot.docs.map(
                  (doc) => doc.data() as LivePrivateAnswerDoc,
                );
                emit();
              },
              handleError("Profil-Live-Antworten des Profils"),
            ),
          ]
        : []),
      onSnapshot(
        liveAnswersRef,
        (snapshot) => {
          liveAnswers = snapshot.docs.map((doc) => doc.data() as LiveAnswerDoc);
          emit();
        },
        handleError("Profil-Live-Antworten"),
      ),
      onSnapshot(
        questionsRef,
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
  }, [authState, isMockMode, targetUserId]);

  return state;
}
