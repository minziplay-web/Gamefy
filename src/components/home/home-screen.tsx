"use client";

import Image from "next/image";
import Link from "next/link";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import type { HomeActivityItem, HomeViewState } from "@/lib/types/frontend";

const HOME_TILES = [
  {
    href: "/daily",
    title: "Fragen",
    eyebrow: "Beantworten",
    baseColor: "var(--color-daily-soft)",
    topColor: "var(--color-daily-primary)",
    iconSrc: "/home-icons/daily.svg",
  },
  {
    href: "/resolved",
    title: "Recap",
    eyebrow: "Heute",
    baseColor: "var(--color-recap-soft)",
    topColor: "var(--color-recap-primary)",
    iconSrc: "/home-icons/resolved.svg",
  },
  {
    href: "/profile",
    title: "Profil",
    eyebrow: "Ich",
    baseColor: "var(--color-profile-soft)",
    topColor: "var(--color-profile-primary)",
    iconSrc: "/home-icons/profile.svg",
  },
  {
    href: "/past-dailies",
    title: "Archiv",
    eyebrow: "Archiv",
    baseColor: "var(--color-archive-soft)",
    topColor: "var(--color-archive-primary)",
    iconSrc: "/home-icons/past.svg",
  },
] as const;

const HOME_ACTIVITY_PLACEHOLDER: HomeActivityItem[] = [
  {
    id: "mock-activity-anna-answer",
    actorDisplayName: "Anna",
    action: "answered_question",
    timeLabel: "11:32",
    createdAtMs: 3,
  },
  {
    id: "mock-activity-marcel-meme",
    actorDisplayName: "Marcel",
    action: "created_meme",
    timeLabel: "10:31",
    createdAtMs: 2,
  },
  {
    id: "mock-activity-johann-answer",
    actorDisplayName: "Johann",
    action: "answered_question",
    timeLabel: "09:48",
    createdAtMs: 1,
  },
];

export function HomeScreen({ state }: { state: HomeViewState }) {
  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <div className="space-y-2 px-1 pb-3 pt-4">
          <div className="h-3 w-32 animate-pulse rounded-full bg-sand-100" />
          <div className="h-9 w-48 animate-pulse rounded-2xl bg-sand-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Heute" title="Startseite" />
        <p className="rounded-2xl border border-danger-text/18 bg-danger-soft px-4 py-3 text-sm font-medium text-danger-text shadow-card-flat">
          {state.message}
        </p>
      </div>
    );
  }

  const dailyProgress = state.dailyTeaser
    ? `${state.dailyTeaser.answeredByMe}/${state.dailyTeaser.totalQuestions}`
    : "Kein Run";
  const resolvedCount = state.dailyRecap?.length ?? 0;
  const pastCount = state.pastDailies?.length ?? 0;

  return (
    <div className="space-y-3">
      <header className="space-y-2 px-1 pb-1 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-500">
          {state.greeting.localDateLabel}
        </p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-[clamp(1.8rem,7vw,3rem)] font-semibold leading-[1.1] tracking-tight text-sand-900">
            Hi {state.greeting.displayName}
          </h1>
          <StreakPill value={state.greeting.streakCurrent} />
        </div>
      </header>

      <HomeActivityTicker items={state.recentActivity ?? []} />

      <div className="grid grid-cols-2 gap-3">
        {HOME_TILES.map((tile) => {
          const meta =
            tile.href === "/daily"
              ? dailyProgress
              : tile.href === "/resolved"
                ? `${resolvedCount} heute`
                : tile.href === "/past-dailies"
                  ? `${pastCount} Tage`
                  : state.customQuestionStatus
                    ? `${state.customQuestionStatus.availableTrophies} 🏆`
                    : "Profil";

          return (
            <Link key={tile.href} href={tile.href} className="block">
              <article
                className="group relative aspect-square overflow-hidden rounded-[24px] border p-0 shadow-card-flat transition hover:-translate-y-0.5 hover:shadow-card-raised min-[380px]:rounded-[28px]"
                style={{
                  borderColor: `color-mix(in srgb, ${tile.topColor} 34%, transparent)`,
                  backgroundColor: tile.baseColor,
                  backgroundImage: `radial-gradient(135% 78% at 50% 107%, ${tile.baseColor} 45%, transparent 46%), linear-gradient(180deg, ${tile.topColor} 0%, ${tile.topColor} 37%, transparent 37%)`,
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[36%] flex items-center justify-center">
                  <Image
                    src={tile.iconSrc}
                    alt=""
                    aria-hidden
                    width={160}
                    height={160}
                    className="h-[52%] max-h-[6.5rem] w-[52%] max-w-[6.5rem] object-contain opacity-90 transition group-hover:scale-[1.03]"
                  />
                </div>
                <div className="relative z-10 flex h-full flex-col p-2.5 min-[380px]:p-4">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/88 min-[380px]:text-[9px]">
                        {tile.eyebrow}
                      </p>
                      <div className="max-w-[5.4rem] rounded-full bg-white/86 px-2 py-1 text-[8px] font-semibold tabular-nums leading-none text-sand-900 min-[380px]:max-w-[6.5rem] min-[380px]:text-[10px]">
                        {meta}
                      </div>
                    </div>
                    <h2 className="text-[16px] font-semibold leading-none tracking-tight text-white min-[380px]:text-[20px]">
                      {tile.title}
                    </h2>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function HomeActivityTicker({ items }: { items: HomeActivityItem[] }) {
  const displayItems = items.length > 0 ? items : HOME_ACTIVITY_PLACEHOLDER;
  const sortedItems = [...displayItems].sort(
    (left, right) => right.createdAtMs - left.createdAtMs,
  );
  const railItems = [...sortedItems, ...sortedItems];
  const animationDuration = `${Math.max(20, sortedItems.length * 6.25)}s`;

  return (
    <div className="overflow-hidden rounded-full bg-linear-to-r from-brand-wash via-white to-recap-soft/70 py-1.5 ring-1 ring-brand-primary/10">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-linear-to-r from-[#f7f9ff] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-linear-to-l from-[#fbf0fa] to-transparent" />
        <div className="anim-home-activity-track flex min-w-max gap-2 px-2" style={{ animationDuration }}>
          {railItems.map((item, index) => (
            <ActivityPill key={`${item.id}:${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityPill({
  item,
  dimmed,
}: {
  item: HomeActivityItem;
  dimmed?: boolean;
}) {
  const actionText =
    item.action === "created_meme"
      ? "hat ein Meme erstellt"
      : "hat eine Frage beantwortet";

  return (
    <div
      className={`flex h-9 w-max shrink-0 items-center gap-2 rounded-full px-3.5 text-sand-900 ${
        dimmed
          ? "bg-white text-sand-500"
          : "bg-white ring-1 ring-brand-primary/10"
      }`}
    >
      <span className="size-2.5 shrink-0 rounded-full bg-linear-to-br from-[#4A5699] via-[#C45FA0] to-[#E5594F]" />
      <p className="whitespace-nowrap text-[12px] font-semibold leading-none">
        <span className="font-bold text-sand-950">{item.actorDisplayName}</span>{" "}
        {actionText}
        <span className="ml-1 font-bold text-brand-primary">
          {item.timeLabel}
        </span>
      </p>
    </div>
  );
}

function StreakPill({ value }: { value: number }) {
  if (value <= 0) {
    return (
      <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-sand-100 px-3 text-xs font-semibold text-sand-600">
        Startklar
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-sand-900 px-3 text-xs font-semibold text-cream">
      <span aria-hidden>🔥</span>
      {value} {value === 1 ? "Tag" : "Tage"}
    </span>
  );
}
