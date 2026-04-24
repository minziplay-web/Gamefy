import { berlinDateKey, compareDateKeys, shiftDateKey } from "@/lib/mapping/date";
import { resolveDailyRunStatus } from "@/lib/mapping/daily-run";
import type { DateKey } from "@/lib/types/frontend";
import type {
  DailyAnonymousAggregateDoc,
  DailyAnswerDoc,
  DailyRunItemDoc,
  DailyRunDoc,
  LiveAnonymousAggregateDoc,
  LiveAnswerDoc,
  LiveSessionDoc,
} from "@/lib/types/firestore";

export interface DailyStreakStats {
  current: number;
  best: number;
}

export interface DuelStats {
  wins: number;
  losses: number;
}

export interface PublicVoteStats<CategoryKey extends string = string> {
  total: number;
  byCategory: Partial<Record<CategoryKey, number>>;
}

export function computeDailyStreakStats(
  answeredDateKeys: Iterable<DateKey>,
  now: Date = new Date(),
): DailyStreakStats {
  const sorted = Array.from(new Set(answeredDateKeys)).sort(compareDateKeys);

  if (sorted.length === 0) {
    return { current: 0, best: 0 };
  }

  let best = 1;
  let running = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] === shiftDateKey(sorted[index - 1], 1)) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 1;
    }
  }

  const today = berlinDateKey(now);
  const yesterday = shiftDateKey(today, -1);
  const latest = sorted[sorted.length - 1];

  if (latest !== today && latest !== yesterday) {
    return { current: 0, best };
  }

  let current = 1;
  let cursor = latest;

  for (let index = sorted.length - 2; index >= 0; index -= 1) {
    if (sorted[index] === shiftDateKey(cursor, -1)) {
      current += 1;
      cursor = sorted[index];
      continue;
    }

    break;
  }

  return { current, best };
}

export function computeDuelStats(params: {
  userId: string;
  dailyRuns: DailyRunDoc[];
  dailyAnswers: DailyAnswerDoc[];
  dailyAnonymousAggregates: DailyAnonymousAggregateDoc[];
  liveSessions: Array<LiveSessionDoc & { id: string }>;
  liveAnswers: LiveAnswerDoc[];
  liveAnonymousAggregates: LiveAnonymousAggregateDoc[];
}): DuelStats {
  const {
    userId,
    dailyRuns,
    dailyAnswers,
    dailyAnonymousAggregates,
    liveSessions,
    liveAnswers,
    liveAnonymousAggregates,
  } = params;

  let wins = 0;
  let losses = 0;

  const dailyAnswersByKey = new Map<string, DailyAnswerDoc[]>();
  for (const answer of dailyAnswers) {
    const key = `${answer.dateKey}_${answer.questionId}`;
    const list = dailyAnswersByKey.get(key) ?? [];
    list.push(answer);
    dailyAnswersByKey.set(key, list);
  }

  const dailyAggregatesByKey = new Map<string, DailyAnonymousAggregateDoc>(
    dailyAnonymousAggregates.map((aggregate) => [
      `${aggregate.dateKey}_${aggregate.questionId}`,
      aggregate,
    ]),
  );

  for (const run of dailyRuns) {
    if (resolveDailyRunStatus(run) !== "closed") {
      continue;
    }

    for (const item of run.items ?? []) {
      const side = getUserDuelSide(userId, item.type, item.pairing);
      if (!side) {
        continue;
      }

      const key = `${run.dateKey}_${item.questionId}`;
      const outcome = getDuelOutcome({
        type: item.type,
        side,
        aggregateCounts: dailyAggregatesByKey.get(key)?.counts,
        publicAnswers: dailyAnswersByKey.get(key),
      });

      if (outcome === "win") {
        wins += 1;
      } else if (outcome === "loss") {
        losses += 1;
      }
    }
  }

  const liveAnswersByKey = new Map<string, LiveAnswerDoc[]>();
  for (const answer of liveAnswers) {
    const key = `${answer.sessionId}_${answer.questionIndex}`;
    const list = liveAnswersByKey.get(key) ?? [];
    list.push(answer);
    liveAnswersByKey.set(key, list);
  }

  const liveAggregatesByKey = new Map<string, LiveAnonymousAggregateDoc>(
    liveAnonymousAggregates.map((aggregate) => [
      `${aggregate.sessionId}_${aggregate.questionIndex}`,
      aggregate,
    ]),
  );

  for (const session of liveSessions) {
    if (session.status !== "finished") {
      continue;
    }

    for (const [rawIndex, item] of (session.items ?? []).entries()) {
      const side = getUserDuelSide(userId, item.type, item.pairing);
      if (!side) {
        continue;
      }

      const key = `${session.id}_${rawIndex}`;
      const outcome = getDuelOutcome({
        type: item.type,
        side,
        aggregateCounts: liveAggregatesByKey.get(key)?.counts,
        publicAnswers: liveAnswersByKey.get(key),
      });

      if (outcome === "win") {
        wins += 1;
      } else if (outcome === "loss") {
        losses += 1;
      }
    }
  }

  return { wins, losses };
}

export function computePublicVotesReceivedStats<CategoryKey extends string>(params: {
  userId: string;
  dailyAnswers: Array<Pick<DailyAnswerDoc, "selectedUserId" | "questionId">>;
  liveAnswers: Array<Pick<LiveAnswerDoc, "selectedUserId" | "questionId">>;
  questionCategories: Map<string, CategoryKey>;
}): PublicVoteStats<CategoryKey> {
  const { userId, dailyAnswers, liveAnswers, questionCategories } = params;
  const byCategory: Partial<Record<CategoryKey, number>> = {};
  let total = 0;

  for (const answer of [...dailyAnswers, ...liveAnswers]) {
    if (answer.selectedUserId !== userId) {
      continue;
    }

    total += 1;
    const category = questionCategories.get(answer.questionId);
    if (category) {
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }
  }

  return { total, byCategory };
}

function getUserDuelSide(
  userId: string,
  type: DailyAnswerDoc["questionType"],
  pairing?: DailyRunItemDoc["pairing"],
) {
  if (type === "duel_1v1") {
    if (pairing?.memberIds?.[0] === userId) {
      return "left" as const;
    }
    if (pairing?.memberIds?.[1] === userId) {
      return "right" as const;
    }
    return null;
  }

  if (type === "duel_2v2") {
    if (pairing?.teamA?.includes(userId)) {
      return "teamA" as const;
    }
    if (pairing?.teamB?.includes(userId)) {
      return "teamB" as const;
    }
    return null;
  }

  return null;
}

function getDuelOutcome(params: {
  type: DailyAnswerDoc["questionType"];
  side: "left" | "right" | "teamA" | "teamB";
  aggregateCounts?: Record<string, number>;
  publicAnswers?: Array<Pick<DailyAnswerDoc, "selectedSide" | "selectedTeam">>;
}) {
  const { type, side, aggregateCounts, publicAnswers = [] } = params;

  if (type === "duel_1v1") {
    const leftVotes =
      aggregateCounts?.left ??
      publicAnswers.filter((answer) => answer.selectedSide === "left").length;
    const rightVotes =
      aggregateCounts?.right ??
      publicAnswers.filter((answer) => answer.selectedSide === "right").length;

    return resolveSideOutcome({
      mine: side === "left" ? leftVotes : rightVotes,
      other: side === "left" ? rightVotes : leftVotes,
    });
  }

  if (type === "duel_2v2") {
    const teamAVotes =
      aggregateCounts?.teamA ??
      publicAnswers.filter((answer) => answer.selectedTeam === "teamA").length;
    const teamBVotes =
      aggregateCounts?.teamB ??
      publicAnswers.filter((answer) => answer.selectedTeam === "teamB").length;

    return resolveSideOutcome({
      mine: side === "teamA" ? teamAVotes : teamBVotes,
      other: side === "teamA" ? teamBVotes : teamAVotes,
    });
  }

  return null;
}

function resolveSideOutcome(params: { mine: number; other: number }) {
  const { mine, other } = params;
  const totalVotes = mine + other;

  if (totalVotes === 0 || mine === other) {
    return null;
  }

  return mine > other ? "win" : "loss";
}
