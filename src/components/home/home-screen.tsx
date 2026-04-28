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
    accent: "bg-amber-50",
    iconTint: "bg-amber-100/80",
    iconSrc: "/home-icons/daily.svg",
  },
  {
    href: "/resolved",
    title: "Recap",
    eyebrow: "Heute",
    accent: "bg-rose-50",
    iconTint: "bg-rose-100/80",
    iconSrc: "/home-icons/resolved.svg",
  },
  {
    href: "/profile",
    title: "Profil",
    eyebrow: "Ich",
    accent: "bg-violet-50",
    iconTint: "bg-violet-100/80",
    iconSrc: "/home-icons/profile.svg",
  },
  {
    href: "/past-dailies",
    title: "Archiv",
    eyebrow: "Archiv",
    accent: "bg-sky-50",
    iconTint: "bg-sky-100/80",
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
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
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
        subtitle="Wähle deinen Bereich wie in einer App."
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
                className={`group relative aspect-square overflow-hidden rounded-[28px] border border-sand-200 ${tile.accent} p-4 shadow-card-flat transition hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-card-raised`}
              >
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className={`flex size-[97%] items-center justify-center rounded-tl-[44px] rounded-tr-[44px] rounded-br-[44px] rounded-bl-[26px] ${tile.iconTint}`}
                  >
                    <Image
                      src={tile.iconSrc}
                      alt=""
                      aria-hidden
                      width={160}
                      height={160}
                      className="h-[50%] w-[50%] object-contain opacity-95"
                    />
                  </div>
                </div>
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold tabular-nums text-sand-700 backdrop-blur-sm">
                      {meta}
                    </div>
                  </div>

                  <div className="relative z-10 mt-auto space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sand-500">
                      {tile.eyebrow}
                    </p>
                    <h2 className="text-[22px] font-semibold leading-[1.05] tracking-tight text-sand-900">
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
