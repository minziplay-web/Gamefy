"use client";

import { HomeRevealFeed } from "@/components/home/home-reveal-feed";
import { STORY_COLORS } from "@/components/story";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import type { HomeViewState } from "@/lib/types/frontend";

/**
 * HomeScreen — Stage 2 Redesign.
 *
 * `/` zeigt heutigen Daily-Run als Story-Format-Reveal-Feed (siehe
 * `HomeRevealFeed`). Wenn alle Fragen beantwortet sind: jede Frage ein
 * Reveal-Slide. Wenn nicht: gleiche Slides, unbeantwortete sind locked
 * (blured) + sticky CTA verlinkt auf /daily.
 *
 * Loading/Error-States bleiben erhalten — die Page-Logik (Auth, Onboarding,
 * etc.) wird weiterhin von `useHomeViewState` und der App-Shell gehandhabt.
 */
export function HomeScreen({ state }: { state: HomeViewState }) {
  if (state.status === "loading") {
    return (
      <div className="space-y-4 pt-4">
        <div className="space-y-2 px-1">
          <div className="h-3 w-32 animate-pulse rounded-full bg-sand-100" />
          <div className="h-9 w-48 animate-pulse rounded-2xl bg-sand-100" />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4 pt-4">
        <ScreenHeader eyebrow="Heute" title="Startseite" />
        <p
          className="rounded-2xl px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: "rgba(229, 89, 79, 0.08)",
            color: STORY_COLORS.archiv,
          }}
        >
          {state.message}
        </p>
      </div>
    );
  }

  return <HomeRevealFeed state={state} />;
}
