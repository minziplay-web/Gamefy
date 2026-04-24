"use client";

import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  dailyAnonymousAggregatesCollection,
  dailyAnswersCollection,
  dailyFirstAnswersCollection,
  dailyPrivateAnswersCollection,
  dailyRunDoc,
  appConfigDoc,
  dailyRunsCollection,
  liveParticipantsCollection,
  liveLobbyCodesCollection,
  liveSessionsCollection,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import {
  analyzeActiveLiveDiagnostics,
  analyzeTodayDailyDiagnostics,
} from "@/lib/mapping/admin-diagnostics";
import { resolveDailyRunStatus } from "@/lib/mapping/daily-run";
import { berlinDateKey, toIsoString } from "@/lib/mapping/date";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import { mockAdmin } from "@/lib/mocks";
import type { AdminViewState } from "@/lib/types/frontend";
import type {
  AppConfigDoc,
  DailyAnonymousAggregateDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  LiveParticipantDoc,
  LiveLobbyCodeDoc,
  LiveSessionDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export function useAdminViewState(): AdminViewState {
  const { authState, isMockMode } = useAuth();
  const [state, setState] = useState<AdminViewState>(
    isMockMode ? mockAdmin : { status: "loading" },
  );

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    if (authState.status !== "authenticated") {
      queueMicrotask(() => setState({ status: "loading" }));
      return;
    }

    if (authState.user.role !== "admin") {
      queueMicrotask(() => setState({ status: "forbidden" }));
      return;
    }

    const questionsRef = questionsCollection();
    const runsRef = dailyRunsCollection();
    const configRef = appConfigDoc();
    const usersRef = usersCollection();
    const todayRunRef = dailyRunDoc(berlinDateKey());
    const dailyAnswersRef = dailyAnswersCollection();
    const dailyPrivateAnswersRef = dailyPrivateAnswersCollection();
    const dailyAggregatesRef = dailyAnonymousAggregatesCollection();
    const dailyFirstAnswersRef = dailyFirstAnswersCollection();
    const liveSessionsRef = liveSessionsCollection();
    const liveLobbyCodesRef = liveLobbyCodesCollection();

    if (
      !questionsRef ||
      !runsRef ||
      !configRef ||
      !usersRef ||
      !todayRunRef ||
      !dailyAnswersRef ||
      !dailyPrivateAnswersRef ||
      !dailyAggregatesRef ||
      !dailyFirstAnswersRef ||
      !liveSessionsRef ||
      !liveLobbyCodesRef
    ) {
      queueMicrotask(() =>
        setState({ status: "error", message: "Firestore ist noch nicht verbunden." }),
      );
      return;
    }

    const todayDateKey = berlinDateKey();
    let questionRows = mockAdmin.status === "ready" ? mockAdmin.questions.rows : [];
    let dailyRuns = mockAdmin.status === "ready" ? mockAdmin.dailyRuns : [];
    let configDraft = mockAdmin.status === "ready" ? mockAdmin.config.draft : {
      dailyQuestionCount: 5,
      dailyRevealPolicy: "after_answer" as const,
      liveDefaultQuestionDurationSec: 20,
      liveDefaultRevealDurationSec: 10,
      onboardingEnabled: true,
    };
    let questions = new Map<string, QuestionDoc>();
    let activeUsers = new Map<string, UserDoc>();
    let todayRun: DailyRunDoc | null = null;
    let todayPublicAnswerCount = 0;
    let todayPrivateAnswers: DailyPrivateAnswerDoc[] = [];
    let todayAnonymousAggregates: DailyAnonymousAggregateDoc[] = [];
    let allDailyRuns: DailyRunDoc[] = [];
    let allDailyFirstAnswerLocks: Array<{ dateKey: string }> = [];
    let todayFirstAnswerLockCount = 0;
    let activeLiveSession: (LiveSessionDoc & { id: string }) | null = null;
    let activeLiveParticipants: LiveParticipantDoc[] = [];
    let finishedLiveSessions: Array<LiveSessionDoc & { id: string }> = [];
    let inactiveLobbyCodes: LiveLobbyCodeDoc[] = [];
    let unsubscribeActiveLiveParticipants: (() => void) | null = null;

    const emit = () => {
      setState({
        status: "ready",
        activeTab: "questions",
        questions: {
          rows: questionRows,
          filter: {
            search: "",
            category: "all",
            type: "all",
            active: "all",
            targetMode: "all",
          },
          importStatus: "idle",
        },
        dailyRuns,
        config: {
          draft: configDraft,
          saveStatus: "idle",
          dirty: false,
        },
        diagnostics: {
          todayDaily: analyzeTodayDailyDiagnostics({
            dateKey: todayDateKey,
            run: todayRun,
            questions,
            activeMemberIds: new Set(activeUsers.keys()),
            publicAnswerCount: todayPublicAnswerCount,
            privateAnswers: todayPrivateAnswers,
            anonymousAggregates: todayAnonymousAggregates,
            firstAnswerLockCount: todayFirstAnswerLockCount,
          }),
          activeLive: analyzeActiveLiveDiagnostics({
            session: activeLiveSession,
            participants: activeLiveParticipants,
            questions,
          }),
          ops: {
            finishedLiveSessions: finishedLiveSessions.length,
            staleFinishedLiveSessions: finishedLiveSessions.filter((session) =>
              isOlderThanHours(session.finishedAt, 12),
            ).length,
            inactiveLobbyCodes: inactiveLobbyCodes.length,
            staleInactiveLobbyCodes: inactiveLobbyCodes.filter((code) =>
              isOlderThanHours(code.updatedAt, 12),
            ).length,
            orphanedDailyFirstAnswerLocks: allDailyFirstAnswerLocks.filter(
              (entry) =>
                entry.dateKey < todayDateKey &&
                !allDailyRuns.some((run) => run.dateKey === entry.dateKey),
            ).length,
            oldestStaleFinishedLiveAgeHours: getOldestAgeHours(
              finishedLiveSessions
                .map((session) => session.finishedAt)
                .filter((value) => isOlderThanHours(value, 12)),
            ),
            oldestStaleInactiveLobbyCodeAgeHours: getOldestAgeHours(
              inactiveLobbyCodes
                .map((code) => code.updatedAt)
                .filter((value) => isOlderThanHours(value, 12)),
            ),
          },
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
        query(questionsRef),
        (snapshot) => {
          questions = new Map(snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]));
          questionRows = snapshot.docs.map((doc) => {
            const data = doc.data() as QuestionDoc;
            const createdByName = data.createdBy
              ? activeUsers.get(data.createdBy)?.displayName
              : undefined;
            return {
              questionId: doc.id,
              text: data.text,
              category: data.category,
              type: data.type,
              anonymous: data.anonymous,
              targetMode: data.targetMode,
              active: data.active,
              createdAtIso: toIsoString(data.createdAt) ?? new Date(0).toISOString(),
              createdByDisplayName: createdByName ?? "Admin",
            };
          });
          emit();
        },
        handleError("Admin-Fragen"),
      ),
      onSnapshot(
        query(usersRef, where("isActive", "==", true)),
        (snapshot) => {
          activeUsers = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as UserDoc] as const),
          );
          emit();
        },
        handleError("Admin-Mitglieder"),
      ),
      onSnapshot(
        query(runsRef, orderBy("dateKey", "desc")),
        (snapshot) => {
          allDailyRuns = snapshot.docs.map((doc) => doc.data() as DailyRunDoc);
          dailyRuns = snapshot.docs.map((doc) => {
            const data = doc.data() as DailyRunDoc;
            const createdByName = data.createdBy
              ? activeUsers.get(data.createdBy)?.displayName
              : undefined;
            return {
              dateKey: data.dateKey,
              status: resolveDailyRunStatus(data),
              questionCount: data.questionCount,
              createdByDisplayName: createdByName ?? "Admin",
            };
          });
          emit();
        },
        handleError("Admin-Daily-Runs"),
      ),
      onSnapshot(
        todayRunRef,
        (snapshot) => {
          todayRun = snapshot.exists() ? (snapshot.data() as DailyRunDoc) : null;
          emit();
        },
        handleError("Admin-Heutiger Run"),
      ),
      onSnapshot(
        query(dailyAnswersRef, where("dateKey", "==", todayDateKey)),
        (snapshot) => {
          todayPublicAnswerCount = snapshot.docs.length;
          emit();
        },
        handleError("Admin-Heutige oeffentliche Antworten"),
      ),
      onSnapshot(
        query(dailyPrivateAnswersRef, where("dateKey", "==", todayDateKey)),
        (snapshot) => {
          todayPrivateAnswers = snapshot.docs.map(
            (doc) => doc.data() as DailyPrivateAnswerDoc,
          );
          emit();
        },
        handleError("Admin-Heutige private Antworten"),
      ),
      onSnapshot(
        query(dailyAggregatesRef, where("dateKey", "==", todayDateKey)),
        (snapshot) => {
          todayAnonymousAggregates = snapshot.docs.map(
            (doc) => doc.data() as DailyAnonymousAggregateDoc,
          );
          emit();
        },
        handleError("Admin-Heutige anonyme Aggregate"),
      ),
      onSnapshot(
        query(dailyFirstAnswersRef, where("dateKey", "==", todayDateKey)),
        (snapshot) => {
          todayFirstAnswerLockCount = snapshot.docs.length;
          emit();
        },
        handleError("Admin-Heutige First-Answer-Locks"),
      ),
      onSnapshot(
        dailyFirstAnswersRef,
        (snapshot) => {
          allDailyFirstAnswerLocks = snapshot.docs.map(
            (doc) => doc.data() as { dateKey: string },
          );
          emit();
        },
        handleError("Admin-Alle First-Answer-Locks"),
      ),
      onSnapshot(
        query(liveSessionsRef, orderBy("createdAt", "desc")),
        (snapshot) => {
          const sessions = snapshot.docs.map((doc) => ({
            ...(doc.data() as LiveSessionDoc),
            id: doc.id,
          }));
          finishedLiveSessions = sessions.filter((session) => session.status === "finished");
          const nextActiveSession = sessions.find((session) => session.status !== "finished") ?? null;
          const previousSessionId = activeLiveSession?.id ?? null;
          const nextSessionId = nextActiveSession?.id ?? null;

          activeLiveSession = nextActiveSession;

          if (previousSessionId !== nextSessionId) {
            unsubscribeActiveLiveParticipants?.();
            unsubscribeActiveLiveParticipants = null;
            activeLiveParticipants = [];

            if (nextSessionId) {
              const participantsRef = liveParticipantsCollection(nextSessionId);
              if (participantsRef) {
                unsubscribeActiveLiveParticipants = onSnapshot(
                  participantsRef,
                  (participantsSnapshot) => {
                    activeLiveParticipants = participantsSnapshot.docs.map(
                      (doc) => doc.data() as LiveParticipantDoc,
                    );
                    emit();
                  },
                  handleError("Admin-Aktive Live-Teilnehmer"),
                );
              }
            }
          }

          emit();
        },
        handleError("Admin-Live-Sessions"),
      ),
      onSnapshot(
        liveLobbyCodesRef,
        (snapshot) => {
          inactiveLobbyCodes = snapshot.docs
            .map((doc) => doc.data() as LiveLobbyCodeDoc)
            .filter((code) => code.active === false);
          emit();
        },
        handleError("Admin-Lobby-Codes"),
      ),
      onSnapshot(
        configRef,
        (snapshot) => {
          const data = snapshot.data() as AppConfigDoc | undefined;
          if (data) {
            configDraft = {
              dailyQuestionCount: data.dailyQuestionCount,
              dailyRevealPolicy: data.dailyRevealPolicy,
              liveDefaultQuestionDurationSec: data.liveDefaultQuestionDurationSec,
              liveDefaultRevealDurationSec: data.liveDefaultRevealDurationSec,
              onboardingEnabled: data.onboardingEnabled,
            };
          }
          emit();
        },
        handleError("Admin-Konfiguration"),
      ),
    ];

    return () => {
      unsubscribeActiveLiveParticipants?.();
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [authState, isMockMode]);

  return state;
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

function getOldestAgeHours(values: unknown[]) {
  const ages = values
    .map((value) => toMillis(value))
    .filter((value): value is number => value !== null)
    .map((millis) => (Date.now() - millis) / (1000 * 60 * 60));

  if (ages.length === 0) {
    return null;
  }

  return Math.max(...ages);
}
