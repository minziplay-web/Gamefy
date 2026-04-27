import { DailyCallout } from "@/components/home/daily-callout";
import { DailyRecap } from "@/components/home/daily-recap";
import { PastDailies } from "@/components/home/past-dailies";
import { LiveCallout } from "@/components/home/live-callout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { LIVE_MODE_ENABLED } from "@/lib/config/features";
import type { DailyRecapItem, HomeViewState } from "@/lib/types/frontend";

export function HomeScreen({
  state,
  onVoteMemeCaption,
}: {
  state: HomeViewState;
  onVoteMemeCaption?: (
    item: DailyRecapItem,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
}) {
  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <div className="space-y-2 px-1 pb-3 pt-4">
          <div className="h-3 w-32 animate-pulse rounded-full bg-sand-100" />
          <div className="h-9 w-48 animate-pulse rounded-2xl bg-sand-100" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Heute" title="Startseite" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={state.greeting.localDateLabel}
        title={`Hi ${state.greeting.displayName}`}
        subtitle="Heute wird's ehrlich, lustig und vielleicht ein kleines bisschen gefährlich."
        action={<StreakPill value={state.greeting.streakCurrent} />}
      />

      <DailyCallout teaser={state.dailyTeaser} />
      {state.dailyRecap && state.dailyRecap.length > 0 ? (
        <DailyRecap
          items={state.dailyRecap}
          onVoteMemeCaption={onVoteMemeCaption}
        />
      ) : null}
      {state.pastDailies && state.pastDailies.length > 0 ? (
        <PastDailies
          entries={state.pastDailies}
          onVoteMemeCaption={onVoteMemeCaption}
        />
      ) : null}
      {LIVE_MODE_ENABLED ? (
        <LiveCallout
          session={state.activeLiveSession}
          canHostLive={state.canHostLive}
        />
      ) : null}
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
