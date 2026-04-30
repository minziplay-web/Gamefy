"use client";

import Link from "next/link";

import { AvatarCircle } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DEFAULT_PROFILE_PHOTO_URL } from "@/lib/constants/avatar";
import type { AdminMemberRow } from "@/lib/types/frontend";

export function AdminMemberList({
  members,
  currentUserId,
  removeStatus = "idle",
  removeMessage,
  onRemove,
  onGrantTrophy,
  onResetProfilePhoto,
}: {
  members: AdminMemberRow[];
  currentUserId?: string;
  removeStatus?: "idle" | "running" | "success" | "error";
  removeMessage?: string;
  onRemove?: (member: AdminMemberRow) => void;
  onGrantTrophy?: (member: AdminMemberRow) => void;
  onResetProfilePhoto?: (member: AdminMemberRow) => void;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        title="Keine aktiven Mitglieder"
        description="Sobald jemand der App beitritt, taucht die Person hier auf."
      />
    );
  }

  return (
    <div className="space-y-3">
      {removeMessage ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            removeStatus === "error"
              ? "bg-danger-soft text-danger-text"
              : removeStatus === "success"
                ? "bg-success-soft text-success-text"
                : "bg-sand-50 text-sand-700"
          }`}
        >
          {removeMessage}
        </p>
      ) : null}

      <ul className="space-y-2">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const isAdmin = member.role === "admin";
          const hasDefaultPhoto =
            !member.photoURL || member.photoURL === DEFAULT_PROFILE_PHOTO_URL;

          return (
            <li
              key={member.userId}
              className="rounded-2xl border border-sand-200/80 bg-white p-3 shadow-card-flat"
            >
              <div className="flex min-w-0 gap-3">
                <div className="shrink-0 pt-0.5">
                  <AvatarCircle
                    member={{
                      userId: member.userId,
                      displayName: member.displayName,
                      photoURL: member.photoURL,
                    }}
                    size="sm"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-bold text-sand-900">
                        {member.displayName}
                      </p>
                      <Badge tone={isAdmin ? "dark" : "neutral"} size="sm">
                        {isAdmin ? "Admin" : "Mitglied"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-sand-500">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-award-soft px-2 py-0.5 text-[11px] font-bold text-award-text">
                      {member.bonusTrophyCount} Trophy
                    </span>
                    {!member.onboardingCompleted ? (
                      <Badge tone="warning" size="sm">
                        Onboarding offen
                      </Badge>
                    ) : null}
                    {isSelf ? (
                      <Badge tone="accent" size="sm">
                        Du
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 min-[430px]:grid-cols-4">
                <Link
                  href={isSelf ? "/profile" : `/profile/${member.userId}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-profile-soft px-3 py-2 text-[12px] font-bold text-profile-text transition hover:bg-profile-wash hover:text-profile-strong"
                >
                  Profil
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-xl text-[12px] text-profile-text hover:bg-profile-soft hover:text-profile-strong"
                  disabled={
                    !onResetProfilePhoto ||
                    removeStatus === "running" ||
                    hasDefaultPhoto
                  }
                  onClick={() => onResetProfilePhoto?.(member)}
                >
                  Bild
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-xl text-[12px] text-award-text hover:bg-award-soft hover:text-award-text"
                  disabled={!onGrantTrophy || removeStatus === "running" || !member.onboardingCompleted}
                  onClick={() => onGrantTrophy?.(member)}
                >
                  🏆 +1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-xl text-[12px] text-danger-text hover:bg-danger-soft hover:text-archive-strong"
                  disabled={!onRemove || removeStatus === "running" || isSelf || isAdmin}
                  onClick={() => onRemove?.(member)}
                >
                  Entfernen
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
