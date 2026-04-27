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
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import {
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
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

const DEFAULT_DAILY_CATEGORIES = [
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
] as const;

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

    if (
      !questionsRef ||
      !runsRef ||
      !configRef ||
      !usersRef ||
      !todayRunRef ||
      !dailyAnswersRef ||
      !dailyPrivateAnswersRef ||
      !dailyAggregatesRef ||
      !dailyFirstAnswersRef
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
      onboardingEnabled: true,
      dailyIncludedCategories: [...DEFAULT_DAILY_CATEGORIES],
      dailyForcedCategories: [],
    };
    let questions = new Map<string, QuestionDoc>();
    let activeUsers = new Map<string, UserDoc>();
    let todayRun: DailyRunDoc | null = null;
    let todayPublicAnswerCount = 0;
    let todayPrivateAnswers: DailyPrivateAnswerDoc[] = [];
    let todayAnonymousAggregates: DailyAnonymousAggregateDoc[] = [];
    let todayFirstAnswerLockCount = 0;

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
        members: [...activeUsers.entries()]
          .map(([userId, user]) => ({
            userId,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: user.role,
            onboardingCompleted: user.onboardingCompleted,
            joinedAtIso: toIsoString(user.createdAt),
          }))
          .sort((left, right) => left.displayName.localeCompare(right.displayName, "de")),
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
              dailyLocked: data.dailyLocked === true,
              dailyLockedDateKey: data.dailyLockedDateKey ?? null,
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
        handleError("Admin-Heutige öffentliche Antworten"),
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
        configRef,
        (snapshot) => {
          const data = snapshot.data() as AppConfigDoc | undefined;
          if (data) {
            configDraft = {
              dailyQuestionCount: data.dailyQuestionCount,
              dailyRevealPolicy: data.dailyRevealPolicy,
              onboardingEnabled: data.onboardingEnabled,
              dailyIncludedCategories:
                data.dailyIncludedCategories?.length
                  ? data.dailyIncludedCategories
                  : [...DEFAULT_DAILY_CATEGORIES],
              dailyForcedCategories:
                data.dailyForcedCategories?.filter((category) =>
                  (data.dailyIncludedCategories?.length
                    ? data.dailyIncludedCategories
                    : [...DEFAULT_DAILY_CATEGORIES]).includes(category),
                ) ?? [],
            };
          }
          emit();
        },
        handleError("Admin-Konfiguration"),
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
