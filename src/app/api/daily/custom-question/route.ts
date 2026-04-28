import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import {
  buildDailyRunItem,
  MAX_DAILY_RUN_QUESTIONS,
} from "@/lib/daily/daily-run-generator";
import {
  getCustomQuestionTargetDateKey,
  isCustomDailyQuestionType,
  isPendingUserTrophyQuestion,
} from "@/lib/daily/custom-daily-questions";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin-server";
import { berlinDateKey } from "@/lib/mapping/date";
import {
  computeAvailableTrophyCount,
  computeDailyMemeTrophyCount,
} from "@/lib/mapping/stats";
import type { QuestionDoc, UserDoc } from "@/lib/types/firestore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const auth = getFirebaseAdminAuth();
    const db = getFirebaseAdminDb();
    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const userSnapshot = await db.collection("users").doc(userId).get();
    if (!userSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const user = userSnapshot.data() as UserDoc;
    if (!user.isActive) {
      return NextResponse.json({ ok: false, error: "inactive" }, { status: 403 });
    }

    const rawBody = (await request.json()) as Record<string, unknown>;
    const type = rawBody.type;
    const text = typeof rawBody.text === "string" ? rawBody.text.trim() : "";
    const optionA = typeof rawBody.optionA === "string" ? rawBody.optionA.trim() : "";
    const optionB = typeof rawBody.optionB === "string" ? rawBody.optionB.trim() : "";

    if (!isCustomDailyQuestionType(type)) {
      return NextResponse.json({ ok: false, error: "invalid_type" }, { status: 400 });
    }

    if (text.length < 8) {
      return NextResponse.json(
        { ok: false, error: "question_too_short" },
        { status: 400 },
      );
    }

    if (type === "either_or" && (!optionA || !optionB)) {
      return NextResponse.json(
        { ok: false, error: "missing_options" },
        { status: 400 },
      );
    }

    const [runSnapshot, runsSnapshot, answersSnapshot, votesSnapshot, questionsSnapshot] =
      await Promise.all([
        db.collection("dailyRuns").doc(berlinDateKey()).get(),
        db.collection("dailyRuns").orderBy("dateKey", "desc").get(),
        db.collection("dailyAnswers").get(),
        db.collection("dailyMemeVotes").get(),
        db.collection("questions").get(),
      ]);

    const todayDateKey = berlinDateKey();
    const targetDateKey = getCustomQuestionTargetDateKey({
      todayDateKey,
      hasTodayRun: runSnapshot.exists,
    });

    const dailyRuns = runsSnapshot.docs.map((doc) => doc.data()) as Array<
      Parameters<typeof computeDailyMemeTrophyCount>[0]["dailyRuns"][number]
    >;
    const dailyAnswers = answersSnapshot.docs.map((doc) => doc.data()) as Parameters<
      typeof computeDailyMemeTrophyCount
    >[0]["dailyAnswers"];
    const dailyMemeVotes = votesSnapshot.docs.map((doc) => doc.data()) as Parameters<
      typeof computeDailyMemeTrophyCount
    >[0]["dailyMemeVotes"];
    const ownedCustomQuestions = questionsSnapshot.docs
      .map((doc) => ({ questionId: doc.id, ...(doc.data() as QuestionDoc) }))
      .filter((question) => question.source === "user_trophy" && question.ownerUserId === userId);

    const earnedTrophies = computeDailyMemeTrophyCount({
      userId,
      dailyRuns,
      dailyAnswers,
      dailyMemeVotes,
    });
    const bonusTrophies = user.bonusTrophyCount ?? 0;
    const availableTrophies = computeAvailableTrophyCount({
      earnedTrophies,
      spentCustomQuestions: ownedCustomQuestions.length,
      bonusTrophies,
    });

    if (availableTrophies < 1) {
      return NextResponse.json(
        { ok: false, error: "no_trophies_left" },
        { status: 400 },
      );
    }

    const existingQuestionForToday = ownedCustomQuestions.find(
      (question) =>
        question.targetDateKey === targetDateKey
        || question.consumedInDailyDateKey === targetDateKey,
    );
    if (existingQuestionForToday) {
      return NextResponse.json(
        { ok: false, error: "already_created_for_target_daily" },
        { status: 400 },
      );
    }

    const pendingQuestion = ownedCustomQuestions.find((question) =>
      isPendingUserTrophyQuestion(question, targetDateKey),
    );
    if (pendingQuestion) {
      return NextResponse.json(
        { ok: false, error: "already_created_for_target_daily" },
        { status: 400 },
      );
    }

    const questionId = `trophy_${targetDateKey}_${userId}`;
    const payload: QuestionDoc = {
      text,
      category: "custom",
      type,
      targetMode: "daily",
      active: true,
      dailyLocked: false,
      dailyLockedDateKey: null,
      ...(type === "either_or" ? { options: [optionA, optionB] } : {}),
      source: "user_trophy",
      ownerUserId: userId,
      targetDateKey,
      consumedInDailyDateKey: null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    };
    const questionRef = db.collection("questions").doc(questionId);
    const runRef = db.collection("dailyRuns").doc(targetDateKey);
    const nextItem = buildDailyRunItem(
      {
        questionId,
        ...payload,
      },
      [],
    );

    await db.runTransaction(async (transaction) => {
      const [questionDoc, runDoc] = await Promise.all([
        transaction.get(questionRef),
        transaction.get(runRef),
      ]);

      if (questionDoc.exists) {
        throw new Error("already_created_for_target_daily");
      }

      transaction.create(questionRef, payload);

      if (runDoc.exists) {
        const runData = runDoc.data() as { questionCount?: number } | undefined;
        if ((runData?.questionCount ?? 0) >= MAX_DAILY_RUN_QUESTIONS) {
          throw new Error("daily_full");
        }

        transaction.set(
          runRef,
          {
            questionCount: FieldValue.increment(1),
            questionIds: FieldValue.arrayUnion(questionId),
            items: FieldValue.arrayUnion(nextItem),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        transaction.set(
          questionRef,
          {
            consumedInDailyDateKey: targetDateKey,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    });

    return NextResponse.json({
      ok: true,
      questionId,
      targetDateKey,
      availableTrophiesAfterCreate: availableTrophies - 1,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "daily_full") {
      return NextResponse.json(
        { ok: false, error: "daily_full" },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Eigene Trophy-Frage konnte nicht gespeichert werden.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
