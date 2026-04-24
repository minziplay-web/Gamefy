"use client";

import Link from "next/link";

import { DailyHistoryList } from "@/components/profile/daily-history-list";
import { MemberRail } from "@/components/profile/member-rail";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStatGrid } from "@/components/profile/profile-stat-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import type { ProfileViewState } from "@/lib/types/frontend";

export function ProfileScreen({ state }: { state: ProfileViewState }) {
  const { logout } = useAuth();

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Profil" title="Profil" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Profil" title="Profil" />
        <EmptyState
          title="Profil nicht gefunden"
          description="Dieses Mitglied existiert nicht mehr."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ProfileHeader user={state.user} isSelf={state.isSelf} />
      <ProfileStatGrid stats={state.stats} />

      {state.isSelf ? (
        <section className="space-y-3">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
            Meine letzten Dailys
          </h2>
          <DailyHistoryList entries={state.dailyHistory} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-sand-500">
          Freunde in der Gruppe
        </h2>
        <MemberRail members={state.members} activeUserId={state.user.userId} />
      </section>

      {state.isSelf ? (
        <div className="space-y-3 pt-2">
          {state.user.role === "admin" ? (
            <Link href="/admin" className="block">
              <Button variant="secondary" className="w-full">
                Admin oeffnen
              </Button>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => logout()}
            className="mx-auto block min-h-10 text-sm font-medium text-sand-500 underline underline-offset-2 hover:text-sand-800"
          >
            Abmelden
          </button>
        </div>
      ) : null}
    </div>
  );
}
