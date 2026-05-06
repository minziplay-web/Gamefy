import type { RevealOption } from "@/components/story";
import type {
  Duel1v1Result,
  Duel2v2Result,
  EitherOrResult,
  MemberLite,
  MultiChoiceResult,
  QuestionResult,
  SingleChoiceResult,
} from "@/lib/types/frontend";

/**
 * Helpers für /past-dailies/[dateKey]/* Routes.
 *
 * - extractAnswerers: distinct voter avatars für die Tagesübersicht-Liste.
 * - resultToRevealOptions: konvertiert chart-fähige Result-Typen
 *   (single/multi/either/duel) in RevealOption[] für RevealBarChart.
 *
 * Liegt absichtlich in lib/mapping (kein "use client"), damit es überall
 * importierbar bleibt und nicht versehentlich Client-Bundles aufbläst.
 */

// ----------------------------------------------------------------------------
// Distinct answerers (avatar-stack in Tagesübersicht)
// ----------------------------------------------------------------------------

export function extractAnswerers(result: QuestionResult): MemberLite[] {
  const seen = new Set<string>();
  const out: MemberLite[] = [];
  const push = (member: MemberLite | undefined | null) => {
    if (!member) return;
    if (seen.has(member.userId)) return;
    seen.add(member.userId);
    out.push(member);
  };

  switch (result.questionType) {
    case "single_choice":
    case "multi_choice":
      for (const row of result.voterRows ?? []) push(row.voter);
      break;
    case "duel_1v1":
    case "duel_2v2":
      for (const row of result.voterRows ?? []) push(row.voter);
      break;
    case "either_or":
      for (const row of result.voterRows ?? []) push(row.voter);
      break;
    case "open_text":
    case "meme_caption":
      for (const entry of result.entries) push(entry.author);
      break;
  }

  return out;
}

// ----------------------------------------------------------------------------
// QuestionResult → RevealOption[] (für RevealBarChart)
//
// Funktioniert nur für vote-basierte Result-Typen. open_text & meme_caption
// haben keinen Bar-Chart und werden separat im Body-Slot gerendert.
// ----------------------------------------------------------------------------

export type ChartableResult =
  | SingleChoiceResult
  | MultiChoiceResult
  | Duel1v1Result
  | Duel2v2Result
  | EitherOrResult;

export function resultToRevealOptions(result: ChartableResult): {
  options: RevealOption[];
  totalVoters: number;
} {
  switch (result.questionType) {
    case "single_choice": {
      const voters = groupVotersByCandidateId(
        (result.voterRows ?? []).map((row) => ({
          voter: row.voter,
          targetId: row.target.userId,
        })),
      );
      return {
        options: result.counts.map((row) => ({
          key: row.candidate.userId,
          label: row.candidate.displayName,
          votes: row.votes,
          member: row.candidate,
          voters: voters.get(row.candidate.userId) ?? [],
        })),
        totalVoters: result.totalVotes,
      };
    }

    case "multi_choice": {
      const voters = groupVotersByCandidateId(
        (result.voterRows ?? []).map((row) => ({
          voter: row.voter,
          targetId: row.target.userId,
        })),
      );
      return {
        options: result.counts.map((row) => ({
          key: row.candidate.userId,
          label: row.candidate.displayName,
          votes: row.votes,
          member: row.candidate,
          voters: voters.get(row.candidate.userId) ?? [],
        })),
        totalVoters: result.totalVoters,
      };
    }

    case "duel_1v1": {
      const leftVoters = (result.voterRows ?? [])
        .filter((row) => row.side === "left")
        .map((row) => row.voter);
      const rightVoters = (result.voterRows ?? [])
        .filter((row) => row.side === "right")
        .map((row) => row.voter);
      return {
        options: [
          {
            key: "left",
            label: result.left.member.displayName,
            votes: result.left.votes,
            member: result.left.member,
            voters: leftVoters,
          },
          {
            key: "right",
            label: result.right.member.displayName,
            votes: result.right.votes,
            member: result.right.member,
            voters: rightVoters,
          },
        ],
        totalVoters: result.left.votes + result.right.votes,
      };
    }

    case "duel_2v2": {
      const aVoters = (result.voterRows ?? [])
        .filter((row) => row.team === "teamA")
        .map((row) => row.voter);
      const bVoters = (result.voterRows ?? [])
        .filter((row) => row.team === "teamB")
        .map((row) => row.voter);
      const teamLabel = (members: readonly MemberLite[]) =>
        members.map((m) => m.displayName).join(" & ");
      return {
        options: [
          {
            key: "teamA",
            label: teamLabel(result.teamA.members),
            votes: result.teamA.votes,
            voters: aVoters,
          },
          {
            key: "teamB",
            label: teamLabel(result.teamB.members),
            votes: result.teamB.votes,
            voters: bVoters,
          },
        ],
        totalVoters: result.teamA.votes + result.teamB.votes,
      };
    }

    case "either_or": {
      const grouped = new Map<number, MemberLite[]>();
      for (const row of result.voterRows ?? []) {
        const list = grouped.get(row.optionIndex) ?? [];
        list.push(row.voter);
        grouped.set(row.optionIndex, list);
      }
      const totalVoters = result.options.reduce(
        (sum, opt) => sum + opt.votes,
        0,
      );
      return {
        options: result.options.map((opt, idx) => ({
          key: `opt-${idx}`,
          label: opt.label,
          votes: opt.votes,
          voters: grouped.get(idx) ?? [],
        })),
        totalVoters,
      };
    }
  }
}

function groupVotersByCandidateId(
  rows: Array<{ voter: MemberLite; targetId: string }>,
): Map<string, MemberLite[]> {
  const out = new Map<string, MemberLite[]>();
  for (const row of rows) {
    const list = out.get(row.targetId) ?? [];
    list.push(row.voter);
    out.set(row.targetId, list);
  }
  return out;
}

export function isChartableResult(
  result: QuestionResult,
): result is ChartableResult {
  return (
    result.questionType === "single_choice" ||
    result.questionType === "multi_choice" ||
    result.questionType === "duel_1v1" ||
    result.questionType === "duel_2v2" ||
    result.questionType === "either_or"
  );
}
