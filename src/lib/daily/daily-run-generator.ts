import { berlinDateKey } from "@/lib/mapping/date";
import { assertValidDailyRunPayload } from "@/lib/mapping/payload-guards";
import type {
  AdminDailyCategoryPlan,
  Category,
  DateKey,
  QuestionType,
  RevealPolicy,
} from "@/lib/types/frontend";
import type { DailyRunDoc, QuestionDoc } from "@/lib/types/firestore";

export const MAX_DAILY_CATEGORY_COUNT = 12;
export const MAX_DAILY_RUN_QUESTIONS = 20;

export const DEFAULT_DAILY_CATEGORIES: Category[] = [
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
];

export function canUseQuestionInDaily(type: QuestionType, memberCount: number) {
  if (type === "duel_1v1") {
    return memberCount >= 2;
  }

  if (type === "duel_2v2") {
    return memberCount >= 4;
  }

  return true;
}

export function shuffle<T>(input: T[]): T[] {
  const copy = [...input];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function buildDailyRunPayload(params: {
  runId?: string;
  dateKey: DateKey;
  runNumber?: number;
  createdBy: string;
  questionCount: number;
  revealPolicy: RevealPolicy;
  categoryPlan?: AdminDailyCategoryPlan;
  customQuestions?: Array<{ questionId: string } & QuestionDoc>;
  questions: Array<{ questionId: string } & QuestionDoc>;
  userIds: string[];
  previousCreatedAt?: unknown;
  updatedAt: unknown;
}) {
  const {
    dateKey,
    runId,
    runNumber,
    createdBy,
    questionCount,
    revealPolicy,
    categoryPlan,
    customQuestions = [],
    questions,
    userIds,
    previousCreatedAt,
    updatedAt,
  } = params;

  const includedCategories =
    categoryPlan?.includedCategories?.length
      ? categoryPlan.includedCategories
      : DEFAULT_DAILY_CATEGORIES;
  const forcedCategories = categoryPlan?.forcedCategories ?? [];

  if (includedCategories.length === 0 && customQuestions.length === 0) {
    throw new Error("Wähle mindestens eine Kategorie für das Daily aus.");
  }

  const questionsByCategory = new Map<Category, Array<{ questionId: string } & QuestionDoc>>();
  for (const question of questions) {
    if (!includedCategories.includes(question.category)) {
      continue;
    }
    const group = questionsByCategory.get(question.category) ?? [];
    group.push(question);
    questionsByCategory.set(question.category, group);
  }

  if (questionsByCategory.size === 0 && customQuestions.length === 0) {
    throw new Error("Für die gewählten Kategorien gibt es keine aktiven Fragen.");
  }

  const missingForcedCategories = forcedCategories.filter((category) => !questionsByCategory.has(category));

  if (missingForcedCategories.length > 0) {
    throw new Error(
      `Diese Pflicht-Kategorien haben gerade keine aktiven Fragen: ${missingForcedCategories.join(", ")}.`,
    );
  }

  const selectedQuestions =
    questionsByCategory.size === 0
      ? []
      : selectPoolQuestions({
          questionCount: Math.max(0, Math.min(questionCount, MAX_DAILY_RUN_QUESTIONS - customQuestions.length)),
          questionsByCategory,
          forcedCategories,
        });

  const items = [
    ...customQuestions
      .slice(0, MAX_DAILY_RUN_QUESTIONS)
      .map((question) => buildDailyRunItem(question, userIds)),
    ...selectedQuestions.map((question) => buildDailyRunItem(question, userIds)),
  ].slice(0, MAX_DAILY_RUN_QUESTIONS);

  const payload = {
    ...(runId ? { runId } : {}),
    dateKey,
    ...(runNumber ? { runNumber } : {}),
    timezone: "Europe/Berlin" as const,
    status: dateKey === berlinDateKey() ? ("active" as const) : ("scheduled" as const),
    questionCount: items.length,
    revealPolicy,
    questionIds: items.map((item) => item.questionId),
    items,
    createdBy,
    createdAt: previousCreatedAt ?? updatedAt,
    updatedAt,
  } satisfies DailyRunDoc;

  assertValidDailyRunPayload(payload);

  return payload;
}

function selectPoolQuestions(params: {
  questionCount: number;
  questionsByCategory: Map<Category, Array<{ questionId: string } & QuestionDoc>>;
  forcedCategories: Category[];
}) {
  const { questionCount, questionsByCategory, forcedCategories } = params;

  const selectedCategoryCount = Math.min(
    questionCount,
    MAX_DAILY_CATEGORY_COUNT,
    questionsByCategory.size,
  );

  if (forcedCategories.length > selectedCategoryCount) {
    throw new Error("Du hast mehr Pflicht-Kategorien gewählt als heute Fragen gezogen werden.");
  }

  const remainingCategories = shuffle(
    Array.from(questionsByCategory.keys()).filter(
      (category) => !forcedCategories.includes(category),
    ),
  );
  const chosenCategories = [
    ...forcedCategories,
    ...remainingCategories.slice(0, selectedCategoryCount - forcedCategories.length),
  ];

  return chosenCategories.map((category) => {
    const categoryQuestions = questionsByCategory.get(category);
    if (!categoryQuestions || categoryQuestions.length === 0) {
      throw new Error(`Für ${category} wurde keine aktive Frage gefunden.`);
    }

    return shuffle(categoryQuestions)[0];
  });
}

export function buildDailyRunItem(
  question: { questionId: string } & QuestionDoc,
  userIds: string[],
) {
  const pairing = buildPairing(question.type, userIds);
  const questionSnapshot = {
    text: question.text,
    category: question.category,
    ...(question.options ? { options: question.options } : {}),
    ...(question.imagePath ? { imagePath: question.imagePath } : {}),
  };

  return pairing
    ? {
        questionId: question.questionId,
        type: question.type,
        questionSnapshot,
        pairing,
      }
    : {
        questionId: question.questionId,
        type: question.type,
        questionSnapshot,
      };
}

function buildPairing(type: QuestionType, userIds: string[]) {
  const shuffled = shuffle(userIds);

  if (type === "duel_1v1") {
    if (shuffled.length < 2) {
      return undefined;
    }

    return {
      memberIds: [shuffled[0], shuffled[1]] as [string, string],
    };
  }

  if (type === "duel_2v2") {
    if (shuffled.length < 4) {
      return undefined;
    }

    return {
      teamA: [shuffled[0], shuffled[1]] as [string, string],
      teamB: [shuffled[2], shuffled[3]] as [string, string],
    };
  }

  return undefined;
}
