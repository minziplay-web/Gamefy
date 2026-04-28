import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/mapping/categories";
import { LIVE_MODE_ENABLED } from "@/lib/config/features";
import type { Category, ProfileStats } from "@/lib/types/frontend";

interface StatCard {
  label: string;
  value: string;
  helper: string;
  hasData: boolean;
  accent?: "streak" | "duels" | "votes" | "trophy";
}

export function ProfileStatGrid({ stats }: { stats: ProfileStats }) {
  const items = buildStatCards(stats);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`space-y-1 rounded-2xl border p-4 transition ${
            item.hasData
              ? "border-white/60 bg-white/85 shadow-card-flat"
              : "border-dashed border-sand-200 bg-white/50"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sand-500">
            {item.label}
          </p>
          <p
            className={`text-2xl font-semibold tabular-nums slashed-zero ${
              item.hasData ? "text-sand-900" : "text-sand-400"
            }`}
          >
            {item.value}
          </p>
          <p
            className={`text-[11px] leading-tight ${
              item.hasData ? "text-sand-500" : "text-sand-400"
            }`}
          >
            {item.helper}
          </p>
        </div>
      ))}
    </div>
  );
}

function buildStatCards(stats: ProfileStats): StatCard[] {
  const hasAnyDaily = stats.daily.answeredCount > 0;
  const hasAnyLive = stats.live.roundsPlayed > 0;
  const topCategory = pickTopCategory(stats.categoryActivity);
  const hasCategoryActivity = topCategory !== null;
  const hasPublicVotes = stats.publicVotesReceived.total > 0;
  const hasMemeTrophies = stats.daily.memeTrophyCount > 0;
  const topRelationship = stats.specialRelationships[0];

  return [
    {
      label: "Daily-Streak",
      value: hasAnyDaily ? `${stats.daily.streakCurrent}` : "—",
      helper: hasAnyDaily
        ? stats.daily.streakBest > 0
          ? `Best: ${stats.daily.streakBest}`
          : "Noch keine Streak gelaufen"
        : "Noch keine Daily beantwortet",
      hasData: hasAnyDaily,
      accent: "streak",
    },
    {
      label: "Dailys beantwortet",
      value: stats.daily.completedCount > 0 ? `${stats.daily.completedCount}` : "—",
      helper: hasAnyDaily
        ? stats.daily.firstAnswerCount > 0
          ? `${stats.daily.firstAnswerCount}× zuerst`
          : "Noch nie zuerst"
        : "Noch keine Daily beantwortet",
      hasData: stats.daily.completedCount > 0,
    },
    {
      label: "Meme-Trophäen",
      value: hasMemeTrophies ? `${stats.daily.memeTrophyCount}` : "—",
      helper: hasMemeTrophies
        ? `${stats.daily.availableTrophyCount} frei für eigene Fragen`
        : "Noch kein Tages-Meme gewonnen",
      hasData: hasMemeTrophies,
      accent: "trophy",
    },
    ...(LIVE_MODE_ENABLED
      ? [
          {
            label: "Live-Runden",
            value: hasAnyLive ? `${stats.live.roundsPlayed}` : "—",
            helper: hasAnyLive
              ? stats.live.roundsHosted > 0
                ? `${stats.live.roundsHosted}× gehostet`
                : "Noch nie gehostet"
              : "Noch keine Live-Runde",
            hasData: hasAnyLive,
          } satisfies StatCard,
        ]
      : []),
    {
      label: "Votes erhalten",
      value: hasPublicVotes ? `${stats.publicVotesReceived.total}` : "—",
      helper: hasPublicVotes
        ? "So oft wurdest du gewählt"
        : "Noch keine Votes",
      hasData: hasPublicVotes,
      accent: "votes",
    },
    {
      label: "Besondere Beziehung",
      value: topRelationship ? topRelationship.member.displayName : "—",
      helper: topRelationship
        ? `${topRelationship.votes}× am häufigsten gewählt`
        : "Noch keine Personen-Votes",
      hasData: Boolean(topRelationship),
    },
    {
      label: "Top-Kategorie",
      value:
        hasCategoryActivity && topCategory
          ? `${CATEGORY_EMOJI[topCategory]} ${CATEGORY_LABELS[topCategory]}`
          : "—",
      helper:
        hasCategoryActivity && topCategory
          ? `${stats.categoryActivity[topCategory] ?? 0} Aktionen`
          : "Noch keine Daten",
      hasData: hasCategoryActivity,
    },
  ];
}

function pickTopCategory(
  activity: Partial<Record<Category, number>>,
): Category | null {
  let winner: Category | null = null;
  let winnerCount = 0;
  for (const [cat, count] of Object.entries(activity) as Array<
    [Category, number]
  >) {
    if (count > winnerCount) {
      winner = cat;
      winnerCount = count;
    }
  }
  return winner;
}

