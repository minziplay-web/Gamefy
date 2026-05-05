"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { STORY_COLORS } from "@/components/story/constants";
import type { MemberLite } from "@/lib/types/frontend";

/**
 * RevealBarChart — universeller horizontaler Bar-Chart für Vote-Reveals.
 *
 * Pro Option ein Block mit:
 *   - Header-Row: Avatar (falls Person) + Label + Prozent (Mono, Tab-Akzentfarbe)
 *   - Horizontaler Balken (filled fraction = pct)
 *   - Voter-Pills DIREKT unter dem Balken (User-Decision 2026-05-06: nicht
 *     separate FÜR-X-Sektion)
 *
 * Optionen: aus single_choice / multi_choice (Personen),
 * either_or (Optionstexte), duel_1v1/2v2 (Seiten/Teams).
 */
export type RevealOption = {
  key: string;
  label: string;
  votes: number;
  /** Optional Avatar-Daten falls Option = Person (single_choice / duels) */
  member?: MemberLite;
  /** Mitglieder die dafür gestimmt haben — als Avatar-Pills gezeigt */
  voters: MemberLite[];
};

export function RevealBarChart({
  options,
  totalVoters,
  primaryColor = STORY_COLORS.daily,
}: {
  options: RevealOption[];
  totalVoters: number;
  primaryColor?: string;
}) {
  if (options.length === 0 || totalVoters === 0) {
    return (
      <p className="text-[13px] italic" style={{ color: STORY_COLORS.ink50 }}>
        Noch keine Stimmen.
      </p>
    );
  }

  // Sort by votes desc, ties by label
  const sorted = [...options].sort(
    (a, b) => b.votes - a.votes || a.label.localeCompare(b.label),
  );

  return (
    <div className="flex flex-col gap-5">
      {sorted.map((opt, idx) => {
        const pct = (opt.votes / totalVoters) * 100;
        const isLeader = idx === 0 && opt.votes > 0;
        const barColor = isLeader ? primaryColor : STORY_COLORS.ink50;
        const labelColor = isLeader ? STORY_COLORS.ink : STORY_COLORS.ink70;
        const pctColor = isLeader ? primaryColor : STORY_COLORS.ink50;

        return (
          <div key={opt.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="flex items-center gap-2">
                {opt.member ? <AvatarCircle member={opt.member} size="xs" className="size-6 text-[10px]" /> : null}
                <span
                  className="text-[15px]"
                  style={{
                    color: labelColor,
                    fontWeight: isLeader ? 600 : 500,
                  }}
                >
                  {opt.label}
                </span>
              </span>
              <span
                className="text-[13px] tabular-nums"
                style={{
                  color: pctColor,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
              >
                {Math.round(pct)}%
              </span>
            </div>
            <div
              className="relative h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: STORY_COLORS.hairSoft }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            {opt.voters.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {opt.voters.map((voter) => (
                  <span
                    key={voter.userId}
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
                    style={{ backgroundColor: STORY_COLORS.hairSoft }}
                  >
                    <AvatarCircle
                      member={voter}
                      size="xs"
                      className="size-4 text-[8px]"
                    />
                    <span
                      className="text-[12px]"
                      style={{ color: STORY_COLORS.ink, fontWeight: 500 }}
                    >
                      {voter.displayName}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
