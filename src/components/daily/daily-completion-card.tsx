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
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-coral text-3xl text-white shadow-card-flat">
        <span aria-hidden>{allAnswered ? "✓" : "…"}</span>
      </div>
      <div className="space-y-2">
        {allAnswered ? (
          <p className="mx-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Alles gespeichert
          </p>
        ) : null}
        <h2 className="text-xl font-semibold leading-tight text-sand-900">
          {allAnswered
            ? "Daily erfolgreich abgeschlossen"
            : missing === 1
              ? "Eine Frage fehlt dir noch"
              : `Noch ${missing} Fragen offen`}
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          {allAnswered
            ? revealPolicy === "after_answer"
              ? "Alle Antworten wurden abgeschickt und sicher gespeichert. Du kannst jetzt entspannt zurück zur Startseite."
              : "Alle Antworten wurden abgeschickt und sicher gespeichert. Die Ergebnisse erscheinen nach Tagesende."
            : "Du kannst jederzeit zurück und die offenen Fragen beantworten."}
        </p>
      </div>
      <div className="rounded-2xl bg-sand-50 px-4 py-4">
        <p className="text-lg font-semibold tabular-nums text-sand-900">
          {answered} / {total}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-sand-500">
          Antworten gespeichert
        </p>
      </div>
      <Link href="/" className="block">
        <Button className="w-full" variant={allAnswered ? "primary" : "secondary"}>
          Zurück zum Home
        </Button>
      </Link>
    </Card>
  );
}
