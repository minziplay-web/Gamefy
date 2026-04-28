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
    <Card className="space-y-5 border-daily-primary/55 bg-white text-center shadow-[0_18px_45px_rgba(243,154,43,0.12)]">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-linear-to-br from-daily-primary to-daily-accent text-3xl text-white shadow-[0_18px_40px_rgba(229,89,79,0.28)]">
        <span aria-hidden>{allAnswered ? "✓" : "…"}</span>
      </div>
      <div className="space-y-2">
        {allAnswered ? (
          <p className="mx-auto inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-success-text">
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
        {!allAnswered ? (
          <p className="text-sm leading-relaxed text-sand-700">
            Du kannst jederzeit zurück und die offenen Fragen beantworten.
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-daily-primary/35">
        <p className="text-lg font-semibold tabular-nums text-sand-900">
          {answered} / {total}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-sand-500">
          Antworten gespeichert
        </p>
      </div>
      <Link href="/" className="block">
        <Button
          className="w-full"
          variant={allAnswered ? "daily" : "secondary"}
        >
          Zurück zum Home
        </Button>
      </Link>
    </Card>
  );
}
