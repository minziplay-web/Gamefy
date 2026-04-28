"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdminMemberRow } from "@/lib/types/frontend";

export function AdminMemberList({
  members,
  currentUserId,
  removeStatus = "idle",
  removeMessage,
  onRemove,
  onGrantTrophy,
}: {
  members: AdminMemberRow[];
  currentUserId?: string;
  removeStatus?: "idle" | "running" | "success" | "error";
  removeMessage?: string;
  onRemove?: (member: AdminMemberRow) => void;
  onGrantTrophy?: (member: AdminMemberRow) => void;
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
      <div className="rounded-2xl border border-sand-200/80 bg-white p-4">
        <p className="text-sm font-medium text-sand-700">
          Hier kannst du Mitglieder aus der App entfernen. Der Account bleibt bei Firebase
          bestehen, ist aber in Gamefy nicht mehr aktiv. Bonus-Trophäen kannst du hier
          direkt vergeben.
        </p>
      </div>

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

          return (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-sand-200/80 bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <AvatarCircle
                  member={{
                    userId: member.userId,
                    displayName: member.displayName,
                    photoURL: member.photoURL,
                  }}
                  size="sm"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-sand-900">
                      {member.displayName}
                    </p>
                    <Badge tone={isAdmin ? "dark" : "neutral"} size="sm">
                      {isAdmin ? "Admin" : "Mitglied"}
                    </Badge>
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
                  <p className="truncate text-sm text-sand-600">{member.email}</p>
                  <p className="text-xs font-medium text-sand-500">
                    Bonus-Trophäen: {member.bonusTrophyCount}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-award-text hover:bg-award-soft hover:text-award-text"
                  disabled={!onGrantTrophy || removeStatus === "running" || !member.onboardingCompleted}
                  onClick={() => onGrantTrophy?.(member)}
                >
                  🏆 +1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger-text hover:bg-danger-soft hover:text-archive-strong"
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
