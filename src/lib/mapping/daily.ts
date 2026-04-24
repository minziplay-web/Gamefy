import type { DateKey, RevealPolicy } from "@/lib/types/frontend";
import { isAfterBerlinDayEnd } from "@/lib/mapping/date";

export function shouldReveal(params: {
  revealPolicy: RevealPolicy;
  runStatus: "scheduled" | "active" | "closed";
  dateKey: DateKey;
  hasOwnAnswer: boolean;
  now?: Date;
}): boolean {
  const { revealPolicy, runStatus, dateKey, hasOwnAnswer, now = new Date() } = params;

  if (runStatus === "closed") {
    return true;
  }

  if (revealPolicy === "after_answer") {
    return hasOwnAnswer;
  }

  return isAfterBerlinDayEnd(dateKey, now);
}
