"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  // Anna — 5x answered_question (latest 11:32)
  { id: "mock-anna-answer-1", actorDisplayName: "Anna", action: "answered_question", timeLabel: "10:40", createdAtMs: 75 },
  { id: "mock-anna-answer-2", actorDisplayName: "Anna", action: "answered_question", timeLabel: "10:55", createdAtMs: 80 },
  { id: "mock-anna-answer-3", actorDisplayName: "Anna", action: "answered_question", timeLabel: "11:10", createdAtMs: 88 },
  { id: "mock-anna-answer-4", actorDisplayName: "Anna", action: "answered_question", timeLabel: "11:25", createdAtMs: 95 },
  { id: "mock-anna-answer-5", actorDisplayName: "Anna", action: "answered_question", timeLabel: "11:32", createdAtMs: 100 },
  // Marcel — 1x created_meme
  { id: "mock-marcel-meme-1", actorDisplayName: "Marcel", action: "created_meme", timeLabel: "10:31", createdAtMs: 70 },
  // Lisa — 4x answered_question (latest 10:15)
  { id: "mock-lisa-answer-1", actorDisplayName: "Lisa", action: "answered_question", timeLabel: "09:30", createdAtMs: 50 },
  { id: "mock-lisa-answer-2", actorDisplayName: "Lisa", action: "answered_question", timeLabel: "09:45", createdAtMs: 55 },
  { id: "mock-lisa-answer-3", actorDisplayName: "Lisa", action: "answered_question", timeLabel: "10:00", createdAtMs: 60 },
  { id: "mock-lisa-answer-4", actorDisplayName: "Lisa", action: "answered_question", timeLabel: "10:15", createdAtMs: 65 },
  // Tom — 2x created_meme (latest 09:58)
  { id: "mock-tom-meme-1", actorDisplayName: "Tom", action: "created_meme", timeLabel: "09:40", createdAtMs: 53 },
  { id: "mock-tom-meme-2", actorDisplayName: "Tom", action: "created_meme", timeLabel: "09:58", createdAtMs: 58 },
  // Johann — 1x answered_question
  { id: "mock-johann-answer-1", actorDisplayName: "Johann", action: "answered_question", timeLabel: "09:48", createdAtMs: 56 },
  // Sara — 3x answered_question (latest 09:22)
  { id: "mock-sara-answer-1", actorDisplayName: "Sara", action: "answered_question", timeLabel: "09:00", createdAtMs: 40 },
  { id: "mock-sara-answer-2", actorDisplayName: "Sara", action: "answered_question", timeLabel: "09:11", createdAtMs: 45 },
  { id: "mock-sara-answer-3", actorDisplayName: "Sara", action: "answered_question", timeLabel: "09:22", createdAtMs: 47 },
];

export function HomeScreen({ state }: { state: HomeViewState }) {
  const trophyNoticeKey =
    state.status === "ready" && state.trophyEarnedNotice
      ? `${state.trophyEarnedNotice.dateKey}:${state.trophyEarnedNotice.trophyCount}:${state.trophyEarnedNotice.availableTrophies}`
      : null;
  const [dismissedTrophyNoticeKey, setDismissedTrophyNoticeKey] = useState<string | null>(null);

  useEffect(() => {
    if (trophyNoticeKey && dismissedTrophyNoticeKey && trophyNoticeKey !== dismissedTrophyNoticeKey) {
      queueMicrotask(() => setDismissedTrophyNoticeKey(null));
    }
  }, [dismissedTrophyNoticeKey, trophyNoticeKey]);

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
  const trophyNotice = state.trophyEarnedNotice;

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

      {trophyNotice && trophyNoticeKey !== dismissedTrophyNoticeKey ? (
        <div className="anim-trophy-notice rounded-2xl border border-profile-primary/18 bg-profile-soft px-3 py-2 shadow-card-flat">
          <div className="flex items-center gap-2.5">
            <Link href="/daily" className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="anim-trophy-icon inline-flex size-7 shrink-0 items-center justify-center rounded-xl bg-white text-sm text-profile-text shadow-card-flat ring-1 ring-profile-primary/14">
                🏆
              </span>
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-xs font-bold leading-tight text-profile-text">
                Trophy erhalten · eigene Frage erstellen
              </span>
            </Link>
            <button
              type="button"
              aria-label="Trophy-Hinweis ausblenden"
              onClick={() => setDismissedTrophyNoticeKey(trophyNoticeKey)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-profile-text shadow-card-flat ring-1 ring-profile-primary/14 transition hover:bg-profile-wash"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

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

type ActivityGroup = {
  actorDisplayName: string;
  action: HomeActivityItem["action"];
  count: number;
  latestTimeLabel: string;
  latestCreatedAtMs: number;
};

function groupActivity(items: HomeActivityItem[]): ActivityGroup[] {
  const grouped = new Map<string, ActivityGroup>();
  for (const item of items) {
    const key = `${item.actorDisplayName}|${item.action}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      if (item.createdAtMs > existing.latestCreatedAtMs) {
        existing.latestCreatedAtMs = item.createdAtMs;
        existing.latestTimeLabel = item.timeLabel;
      }
    } else {
      grouped.set(key, {
        actorDisplayName: item.actorDisplayName,
        action: item.action,
        count: 1,
        latestTimeLabel: item.timeLabel,
        latestCreatedAtMs: item.createdAtMs,
      });
    }
  }
  return [...grouped.values()].sort(
    (left, right) => right.latestCreatedAtMs - left.latestCreatedAtMs,
  );
}

function formatActivityAction(
  action: HomeActivityItem["action"],
  count: number,
) {
  if (action === "created_meme") {
    return count === 1 ? "1 Meme erstellt" : `${count} Memes erstellt`;
  }
  return count === 1 ? "1 Frage beantwortet" : `${count} Fragen beantwortet`;
}

function HomeActivityTicker({ items }: { items: HomeActivityItem[] }) {
  const displayItems = items.length > 0 ? items : HOME_ACTIVITY_PLACEHOLDER;
  const groups = useMemo(() => groupActivity(displayItems), [displayItems]);
  const [expanded, setExpanded] = useState(false);

  if (groups.length === 0) return null;
  const latest = groups[0];
  const headerKey = expanded ? "header-live" : "header-latest";

  return (
    <section className="rounded-[22px] border border-brand-primary/12 bg-white px-3 py-2.5 shadow-card-flat">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? "Live-Feed einklappen" : "Live-Feed aufklappen"}
        className="flex w-full items-center gap-2"
      >
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-brand-primary" />
        <div
          key={headerKey}
          className="anim-live-header flex min-w-0 flex-1 items-center gap-2"
        >
          {expanded ? (
            <p className="flex-1 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
              Live
            </p>
          ) : (
            <>
              <p className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold leading-tight text-sand-800">
                <span className="font-bold text-sand-950">{latest.actorDisplayName}</span>
                <span className="text-sand-600"> · {formatActivityAction(latest.action, latest.count)}</span>
              </p>
              <time className="shrink-0 text-[11px] font-bold tabular-nums text-brand-primary">
                {latest.latestTimeLabel}
              </time>
            </>
          )}
        </div>
        <span
          aria-hidden
          className={`shrink-0 text-[10px] font-semibold text-brand-primary transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      <div
        aria-hidden={!expanded}
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          expanded ? "mt-2 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="max-h-[120px] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              {groups.map((group, index) => (
                <div
                  key={`${group.actorDisplayName}:${group.action}`}
                  className={expanded ? "anim-live-row" : ""}
                  style={
                    expanded
                      ? { animationDelay: `${index * 35}ms` }
                      : undefined
                  }
                >
                  <ActivityRow group={group} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActivityRow({ group }: { group: ActivityGroup }) {
  const actionText = formatActivityAction(group.action, group.count);
  const icon = group.action === "created_meme" ? "M" : "F";

  return (
    <div className="flex min-h-9 items-center gap-2 rounded-2xl bg-brand-wash/55 px-2.5 py-1.5 ring-1 ring-brand-primary/8">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-brand-primary shadow-card-flat ring-1 ring-brand-primary/12">
        {icon}
      </span>
      <p className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight text-sand-800">
        <span className="font-bold text-sand-950">{group.actorDisplayName}</span>
        <span className="text-sand-600"> · {actionText}</span>
      </p>
      <time className="shrink-0 text-[11px] font-bold tabular-nums text-brand-primary">
        {group.latestTimeLabel}
      </time>
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
