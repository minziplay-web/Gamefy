import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DailyTeaser } from "@/lib/types/frontend";

export function DailyCallout({ teaser }: { teaser: DailyTeaser | null }) {
  if (!teaser) {
    return (
      <Card className="space-y-3">
        <Badge tone="neutral">Daily</Badge>
        <h2 className="text-xl font-semibold text-sand-900">Heute keine Daily</h2>
        <p className="text-sm leading-relaxed text-sand-700">
          Sobald ein Admin heute eine Daily erzeugt, landet sie hier.
        </p>
      </Card>
    );
  }

  if (teaser.isUnplayable) {
    return (
      <Card className="space-y-3">
        <Badge tone="warning">
          <span aria-hidden>⚠️</span>
          Daily
        </Badge>
        <h2 className="text-xl font-semibold text-sand-900">
          Daily nicht spielbar
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          Der heutige Run hat keine spielbaren Fragen. Ein Admin muss den Run
          ersetzen.
        </p>
      </Card>
    );
  }

  if (teaser.status === "scheduled") {
    return (
      <Card className="space-y-3">
        <Badge tone="neutral">Daily geplant</Badge>
        <h2 className="text-xl font-semibold text-sand-900">
          Daily startet gleich
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          Der Run ist geplant, aber noch nicht aktiv. Sobald er freigeschaltet ist,
          kannst du loslegen.
        </p>
      </Card>
    );
  }

  if (teaser.status === "closed") {
    return (
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge tone="neutral">Daily beendet</Badge>
            <h2 className="text-xl font-semibold text-sand-900">
              Die heutige Daily ist durch
            </h2>
          </div>
          <ProgressPill answered={teaser.answeredByMe} total={teaser.totalQuestions} />
        </div>
        {teaser.hasIncompleteItems ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Einige Fragen wurden aus dem Run gefiltert.
          </p>
        ) : null}
        <Link href="/daily" className="block">
          <Button className="w-full" variant="secondary">
            Ergebnisse ansehen
          </Button>
        </Link>
      </Card>
    );
  }

  const playable = teaser.totalQuestions;
  const remaining = Math.max(0, playable - teaser.answeredByMe);
  const allAnswered = playable > 0 && remaining === 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="coral">Daily</Badge>
          <h2 className="text-xl font-semibold leading-tight text-sand-900">
            {allAnswered
              ? "Alle Fragen beantwortet"
              : remaining === 1
                ? "Noch 1 Frage offen"
                : `${remaining} Fragen offen`}
          </h2>
        </div>
        <ProgressPill answered={teaser.answeredByMe} total={playable} />
      </div>
      <ProgressBar value={teaser.answeredByMe} total={playable} />
      {teaser.hasIncompleteItems ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Einige Fragen wurden aus dem Run gefiltert.
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-sand-700">
        {teaser.revealPolicy === "after_answer"
          ? "Ergebnisse erscheinen sofort nach deiner Antwort."
          : "Ergebnisse erscheinen erst nach Tagesende."}
      </p>
      <Link href="/daily" className="block">
        <Button className="w-full">
          {allAnswered ? "Ergebnisse ansehen" : "Daily weitermachen"}
        </Button>
      </Link>
    </Card>
  );
}

function ProgressPill({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  return (
    <div className="shrink-0 rounded-2xl bg-sand-100 px-3 py-2 text-right text-[11px] font-semibold leading-tight text-sand-700">
      <span className="block text-base text-sand-900">
        {answered}
        <span className="text-sand-400">/{total}</span>
      </span>
      <span className="tracking-wide">beantwortet</span>
    </div>
  );
}
