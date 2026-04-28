"use client";

import Link from "next/link";

import { AvatarCircle } from "@/components/ui/avatar";
import type { MemberLite, UserId } from "@/lib/types/frontend";

export function MemberRail({
  members,
  activeUserId,
}: {
  members: MemberLite[];
  activeUserId: UserId;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <ul className="flex items-stretch gap-2 px-1">
        {members.map((m) => {
          const active = m.userId === activeUserId;
          return (
            <li key={m.userId} className="shrink-0">
              <Link
                href={
                  m.userId === activeUserId ? "/profile" : `/profile/${m.userId}`
                }
                className={`relative flex min-h-21 w-20 flex-col items-center gap-2 rounded-2xl border px-2 py-3 shadow-card-flat transition ${
                  active
                    ? "border-profile-primary/45 bg-profile-soft"
                    : "border-profile-primary/14 bg-white hover:border-profile-primary/30 hover:bg-profile-wash"
                }`}
              >
                <AvatarCircle member={m} size="md" />
                <span className="line-clamp-1 text-xs font-medium text-sand-800">
                  {m.displayName}
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand-primary"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

