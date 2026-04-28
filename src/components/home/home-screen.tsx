"use client";

import Image from "next/image";
import Link from "next/link";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import type { HomeViewState } from "@/lib/types/frontend";

const HOME_TILES = [
  {
    href: "/daily",
    title: "Daily",
    eyebrow: "Heute",
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
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={state.greeting.localDateLabel}
        title={`Hi ${state.greeting.displayName}`}
        subtitle="Deine Bereiche, schnell erreichbar."
        action={<StreakPill value={state.greeting.streakCurrent} />}
      />

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
                className="group relative aspect-square overflow-hidden rounded-[28px] border p-0 shadow-card-flat transition hover:-translate-y-0.5 hover:shadow-card-raised"
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
                <div className="relative z-10 flex h-full flex-col p-3 min-[380px]:p-4">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/88 min-[380px]:text-[9px]">
                        {tile.eyebrow}
                      </p>
                      <div className="max-w-[5.9rem] rounded-full bg-white/86 px-2 py-1 text-[9px] font-semibold tabular-nums leading-none text-sand-900 min-[380px]:max-w-[6.5rem] min-[380px]:text-[10px]">
                        {meta}
                      </div>
                    </div>
                    <h2 className="text-[17px] font-semibold leading-none tracking-tight text-white min-[380px]:text-[20px]">
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

function StreakPill({ value }: { value: number }) {
  if (value <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold text-sand-600">
        Startklar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-900 px-3 py-1.5 text-xs font-semibold text-cream">
      <span aria-hidden>🔥</span>
      {value} {value === 1 ? "Tag" : "Tage"}
    </span>
  );
}
