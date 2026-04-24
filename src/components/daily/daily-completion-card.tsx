import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DailyQuestionCardState, RevealPolicy } from "@/lib/types/frontend";

export function DailyCompletionCard({
  cards,
  revealPolicy,
}: {
  cards: DailyQuestionCardState[];
  revealPolicy: RevealPolicy;
}) {
  const total = cards.length;
  const answered = cards.filter(
    (c) => c.phase === "submitted_waiting_reveal" || c.phase === "revealed",
  ).length;
  const missing = total - answered;
  const allAnswered = missing === 0 && total > 0;

  return (
    <Card className="space-y-5 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-coral-soft text-2xl">
        <span aria-hidden>{allAnswered ? "🎉" : "👋"}</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold leading-tight text-sand-900">
          {allAnswered
            ? "Fertig für heute!"
            : missing === 1
              ? "Eine Frage fehlt dir noch"
              : `Noch ${missing} Fragen offen`}
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          {allAnswered
            ? revealPolicy === "after_answer"
              ? "Du hast alle Fragen beantwortet. Morgen gibt es neue."
              : "Alle Antworten gespeichert. Ergebnisse erscheinen nach Tagesende."
            : "Du kannst jederzeit zurück und die offenen Fragen beantworten."}
        </p>
      </div>
      <p className="rounded-2xl bg-sand-50 px-4 py-3 text-sm font-semibold tabular-nums text-sand-800">
        {answered} von {total} beantwortet
      </p>
      <Link href="/" className="block">
        <Button className="w-full" variant="secondary">
          Zurück zum Home
        </Button>
      </Link>
    </Card>
  );
}
