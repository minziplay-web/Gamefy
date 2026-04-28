import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/mapping/categories";
import { LIVE_MODE_ENABLED } from "@/lib/config/features";
import type { Category, ProfileStats } from "@/lib/types/frontend";

interface StatCard {
  label: string;
  value: string;
  helper: string;
  hasData: boolean;
  icon: string;
  accent?: "streak" | "duels" | "votes" | "trophy";
  compactValue?: boolean;
}

export function ProfileStatGrid({ stats }: { stats: ProfileStats }) {
  const items = buildStatCards(stats);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-[1.25rem] p-[1px] ${
            item.hasData
              ? accentShellClasses[item.accent ?? "default"]
              : "bg-linear-to-br from-sand-200/90 to-sand-100/80"
          }`}
        >
          <div
            className={`flex min-h-[7.7rem] flex-col rounded-[1.18rem] border p-3 transition sm:p-4 ${
              item.hasData
                ? "border-white/80 bg-white shadow-card-flat"
                : "border-dashed border-sand-200 bg-profile-wash"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sand-500 min-[380px]:text-[10px]">
                {item.label}
              </p>
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-base ${
                  item.hasData
                    ? iconAccentClasses[item.accent ?? "default"]
                    : "bg-white text-sand-400 ring-1 ring-sand-200"
                }`}
              >
                {item.icon}
              </span>
            </div>
            <p
              className={`mt-1.5 font-semibold tabular-nums slashed-zero ${
                item.compactValue
                  ? "line-clamp-2 break-words text-[clamp(0.98rem,4vw,1.16rem)] leading-tight"
                  : "text-[clamp(1.35rem,5.5vw,1.75rem)] leading-none"
              } ${
                item.hasData ? "text-sand-900" : "text-sand-400"
              }`}
            >
              {item.value}
            </p>
            <p
              className={`mt-auto pt-2 text-[10.5px] leading-snug ${
                item.hasData ? "text-sand-500" : "text-sand-400"
              }`}
            >
              {item.helper}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const accentShellClasses = {
  default: "bg-linear-to-br from-brand-primary/35 via-profile-soft to-white",
  streak: "bg-linear-to-br from-profile-primary/45 via-profile-soft to-white",
  votes: "bg-linear-to-br from-brand-primary/32 via-profile-wash to-white",
  trophy: "bg-linear-to-br from-award-primary via-award-soft to-white",
  duels: "bg-linear-to-br from-profile-strong/28 via-profile-soft to-white",
} as const;

const iconAccentClasses = {
  default: "bg-profile-soft text-profile-text ring-1 ring-profile-primary/18",
  streak: "bg-profile-soft text-profile-text ring-1 ring-profile-primary/18",
  votes: "bg-profile-soft text-profile-text ring-1 ring-profile-primary/18",
  trophy: "bg-award-soft text-award-text ring-1 ring-award-primary/35",
  duels: "bg-profile-soft text-profile-text ring-1 ring-profile-primary/18",
} as const;

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
          ? `Best ${stats.daily.streakBest}`
          : "Streak läuft"
        : "Noch offen",
      hasData: hasAnyDaily,
      icon: "🔥",
      accent: "streak",
    },
    {
      label: "Dailys beantwortet",
      value: stats.daily.completedCount > 0 ? `${stats.daily.completedCount}` : "—",
      helper: hasAnyDaily
        ? stats.daily.firstAnswerCount > 0
          ? `${stats.daily.firstAnswerCount}× zuerst`
          : "Kein First"
        : "Noch offen",
      hasData: stats.daily.completedCount > 0,
      icon: "✓",
    },
    {
      label: "Meme-Trophäen",
      value: hasMemeTrophies ? `${stats.daily.memeTrophyCount}` : "—",
      helper: hasMemeTrophies
        ? `${stats.daily.availableTrophyCount} verfügbar`
        : "Noch keine",
      hasData: hasMemeTrophies,
      icon: "🏆",
      accent: "trophy",
    },
    ...(LIVE_MODE_ENABLED
      ? [
          {
            label: "Live-Runden",
            value: hasAnyLive ? `${stats.live.roundsPlayed}` : "—",
            helper: hasAnyLive
              ? stats.live.roundsHosted > 0
                ? `${stats.live.roundsHosted}× Host`
                : "Kein Host"
              : "Noch offen",
            hasData: hasAnyLive,
            icon: "●",
          } satisfies StatCard,
        ]
      : []),
    {
      label: "Votes erhalten",
      value: hasPublicVotes ? `${stats.publicVotesReceived.total}` : "—",
      helper: hasPublicVotes
        ? "Gewählt"
        : "Noch keine Votes",
      hasData: hasPublicVotes,
      icon: "❤",
      accent: "votes",
    },
    {
      label: "Besondere Beziehung",
      value: topRelationship ? topRelationship.member.displayName : "—",
      helper: topRelationship
        ? `${topRelationship.votes}× gewählt`
        : "Noch keine",
      hasData: Boolean(topRelationship),
      icon: "↔",
      accent: "duels",
      compactValue: true,
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
          : "Noch keine",
      hasData: hasCategoryActivity,
      icon: hasCategoryActivity && topCategory ? CATEGORY_EMOJI[topCategory] : "◇",
      compactValue: true,
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

