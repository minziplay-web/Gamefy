import type { CustomDailyQuestionDraft, DateKey } from "@/lib/types/frontend";
import type { QuestionDoc } from "@/lib/types/firestore";

export const CUSTOM_DAILY_QUESTION_TYPES = [
  "open_text",
  "single_choice",
  "multi_choice",
  "either_or",
] as const satisfies ReadonlyArray<CustomDailyQuestionDraft["type"]>;

export function isCustomDailyQuestionType(
  value: unknown,
): value is CustomDailyQuestionDraft["type"] {
  return (
    typeof value === "string"
    && (CUSTOM_DAILY_QUESTION_TYPES as readonly string[]).includes(value)
  );
}

export function getCustomQuestionTargetDateKey(params: {
  todayDateKey: DateKey;
  hasTodayRun: boolean;
}) {
  return params.todayDateKey;
}

export function isUserTrophyQuestion(question: QuestionDoc) {
  return question.source === "user_trophy";
}

export function shouldHideUserTrophyQuestionForUser(
  question: QuestionDoc,
  userId?: string,
) {
  return isUserTrophyQuestion(question) && question.ownerUserId === userId;
}

export function isPendingUserTrophyQuestion(
  question: QuestionDoc,
  targetDateKey?: DateKey,
) {
  if (!isUserTrophyQuestion(question)) {
    return false;
  }

  if (targetDateKey && question.targetDateKey !== targetDateKey) {
    return false;
  }

  return question.consumedInDailyDateKey == null;
}
