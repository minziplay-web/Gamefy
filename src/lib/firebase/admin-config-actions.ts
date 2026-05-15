"use client";

import { serverTimestamp, setDoc } from "firebase/firestore";

import { DEFAULT_DAILY_CATEGORIES } from "@/lib/daily/daily-run-generator";
import { appConfigDoc } from "@/lib/firebase/collections";
import type { AdminConfigDraft } from "@/lib/types/frontend";

export async function saveAdminConfig(draft: AdminConfigDraft) {
  const target = appConfigDoc();

  if (!target) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await setDoc(
    target,
    {
      timezone: "Europe/Berlin",
      dailyQuestionCount: Math.min(draft.dailyQuestionCount, 12),
      dailyRevealPolicy: draft.dailyRevealPolicy,
      onboardingEnabled: draft.onboardingEnabled,
      dailyAutoCreateEnabled: draft.dailyAutoCreateEnabled,
      dailyIncludedCategories:
        draft.dailyIncludedCategories.length > 0
          ? draft.dailyIncludedCategories
          : DEFAULT_DAILY_CATEGORIES,
      dailyForcedCategories: draft.dailyForcedCategories.filter((category) =>
        draft.dailyIncludedCategories.includes(category),
      ),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
