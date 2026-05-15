"use client";

import Link from "next/link";

import {
  ADMIN_ACCENT,
  DangerButton,
  MonoMetaLabel,
  StatusBanner,
  SubtleButton,
  WARNING,
} from "@/components/admin/admin-ui";
import { AvatarCircle } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { DEFAULT_PROFILE_PHOTO_URL } from "@/lib/constants/avatar";
import type { AdminMemberRow } from "@/lib/types/frontend";

const AWARD_ACCENT = "#F0D043";

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
        icon="👥"
        title="Keine aktiven Mitglieder"
        description="Sobald jemand der App beitritt, taucht die Person hier auf."
      />
    );
  }

  return (
    <div className="space-y-3">
      {removeMessage ? (
        <StatusBanner status={removeStatus} message={removeMessage} />
      ) : null}

      <ul className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isSelf={member.userId === currentUserId}
            running={removeStatus === "running"}
            onRemove={onRemove}
            onGrantTrophy={onGrantTrophy}
            onResetProfilePhoto={onResetProfilePhoto}
          />
        ))}
      </ul>
    </div>
  );
}

function MemberRow({
  member,
  isSelf,
  running,
  onRemove,
  onGrantTrophy,
  onResetProfilePhoto,
}: {
  member: AdminMemberRow;
  isSelf: boolean;
  running: boolean;
  onRemove?: (member: AdminMemberRow) => void;
  onGrantTrophy?: (member: AdminMemberRow) => void;
  onResetProfilePhoto?: (member: AdminMemberRow) => void;
}) {
  const isAdmin = member.role === "admin";
  const hasDefaultPhoto =
    !member.photoURL || member.photoURL === DEFAULT_PROFILE_PHOTO_URL;
  const onboardingOpen = !member.onboardingCompleted;
  const profileHref = isSelf ? "/profile" : `/profile/${member.userId}`;

  return (
    <li className="rounded-2xl bg-[#1A1A1A] p-4 ring-1 ring-[#1F1F1F]">
      <div className="flex min-w-0 gap-3">
        <div className="shrink-0">
          <AvatarCircle
            member={{
              userId: member.userId,
              displayName: member.displayName,
              photoURL: member.photoURL,
            }}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#FAFAFA]">
              {member.displayName}
            </p>
            {isAdmin ? <RolePill /> : null}
            {isSelf ? <SelfPill /> : null}
          </div>
          <p className="truncate text-[11px] text-[#A8A8A8]">{member.email}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
            <MonoMetaLabel color={AWARD_ACCENT}>
              🏆 {member.bonusTrophyCount}
            </MonoMetaLabel>
            {onboardingOpen ? (
              <MonoMetaLabel color={WARNING}>Onboarding offen</MonoMetaLabel>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 min-[430px]:grid-cols-4">
        <Link
          href={profileHref}
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#0E0E0E] px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FAFAFA] ring-1 ring-[#1F1F1F] transition hover:bg-[#1A1A1A]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Profil
        </Link>
        <SubtleButton
          onClick={
            onResetProfilePhoto ? () => onResetProfilePhoto(member) : undefined
          }
          disabled={!onResetProfilePhoto || running || hasDefaultPhoto}
        >
          Bild
        </SubtleButton>
        <SubtleButton
          onClick={onGrantTrophy ? () => onGrantTrophy(member) : undefined}
          disabled={!onGrantTrophy || running || !member.onboardingCompleted}
          accent={AWARD_ACCENT}
        >
          🏆 +1
        </SubtleButton>
        <DangerButton
          onClick={onRemove ? () => onRemove(member) : undefined}
          disabled={!onRemove || running || isSelf || isAdmin}
        >
          Entfernen
        </DangerButton>
      </div>
    </li>
  );
}

function RolePill() {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]"
      style={{
        backgroundColor: `${ADMIN_ACCENT}26`,
        color: ADMIN_ACCENT,
        fontFamily: "var(--font-mono)",
      }}
    >
      Admin
    </span>
  );
}

function SelfPill() {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]"
      style={{
        backgroundColor: "#0E0E0E",
        color: "#A8A8A8",
        fontFamily: "var(--font-mono)",
        boxShadow: "inset 0 0 0 1px #1F1F1F",
      }}
    >
      Du
    </span>
  );
}
